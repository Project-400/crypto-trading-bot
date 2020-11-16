import {
	ExchangeInfoSymbol,
	TransactionFill
} from '@crypto-tracker/common-types';
import Calculations from '../utils/calculations';
import { CommissionTotals } from '../interfaces/interfaces';

/*
*
* This is an object to contain all of the data related to a specific bot trade session.
*
* */

export class BotTradeData { // New version of SymbolTraderData

	public symbol: string;												// The trading pair symbol, eg. BTCUSDT
	public base: string;												// The base currency (The currency being bought), eg. BTC
	public quote: string;												// The quote currency (The currency being used to spend / trade for the base), eg. USDT
	public baseQty: number = 0;											// The amount of base currency currently being traded
	public quoteQty: number = 0;										// The amount of quote currency being used to trade with (Limit set by bot)
	public profit: number = 0;											// The current / final amount of profit made (measured in the quote currency)
	public startPrice: number = 0;										// The price of the base (measured in quote) for the initial trade
	public currentPrice: number = 0;									// The current price of the base (measured in quote)
	public highestPriceReached: number = 0;								// The highest price of the base (measured in quote) reached during trading
	public lowestPriceReached: number = 0;								// The lowest price of the base (measured in quote) reached during trading
	public priceDifference: number = 0;									// The difference in price of the base from the start to the current
	public percentageDifference: number = 0;							// The percentage difference in price of the base from the start to the current
	public percentageDroppedFromHigh: number = 0;						// The percentage difference in price of the base from the highest price to the current
	public fills: TransactionFill[] = [];								// A list of fills (sub-transactions that make up the total transaction) taken by Binance
	public commissions: CommissionTotals = { };							// A map of commissions totals taken by Binance
	public baseMinQty: number = 0;										// The minimum amount TODO: Should this be the quote instead of base?
	public baseStepSize: number = 0;									// The minimum step size TODO: Same as above
	public startTime: number;											// The time the trading began (For calculations)
	public quotePrecision: number = 0;									// The time the trading began (For calculations)
	public times: {														// Times actions occurred (For DB records)
		createdAt?: string;													// Trade data object created
		buyAt?: string;														// Buy action started
		sellAt?: string;													// Sell action started
		buyTransactionAt?: string;											// Time Binance performed buy transaction
		sellTransactionAt?: string;											// Time Binance performed sell transaction
		finishedAt?: string;												// Trade data finished
	} = { };
	public buyTransactionType?: string;									// Buy Transaction type, eg. MARKET
public sellTransactionType?: string;									// Sell Transaction type, eg. MARKET

	// public baseInitialQty: number = 0; // to do
	// public quoteQtySpent: number = 0; // to do

	public constructor(
		symbol: string,
		base: string,
		quote: string,
		exchangeInfo: ExchangeInfoSymbol
	) {
		this.symbol = symbol;
		this.base = base;
		this.quote = quote;
		this.times.createdAt = new Date().toISOString();
		this.startTime = new Date().getTime();
		this.SortExchangeInfo(exchangeInfo);
	}

	public UpdatePrice = (price: number): void => {
		if (this.currentPrice) return this.CalculatePriceChanges(price);
		// return this.calculatePriceChanges(price);
		this.SetInitialPrices(price);
	}

	public SortBuyData = (transaction: any): void => {			// TODO: Refactor? Pass in details needed only
		if (transaction.fills) {
			this.fills.push(...transaction.fills);
			this.SortCommissions(this.fills);
			this.CalculateAverageBuyPrice(this.fills);

			this.baseQty += Number(transaction.executedQty);
			this.quoteQty -= Number(transaction.cummulativeQuoteQty);
			this.buyTransactionType = transaction.type;
			this.times.buyTransactionAt = new Date(transaction.transactTime).toISOString();
		}
	}

	public SortSellData = (transaction: any): void => {			// TODO: Refactor? Pass in details needed only
		if (transaction.response && transaction.response.fills) {
			// const commission: { total: number; isQuote: boolean; isBase: boolean } = this.SortCommissions(transaction.response.fills);
			this.SortCommissions(transaction.response.fills);
			this.baseQty -= transaction.response.executedQty;
			// this.quoteQty += transaction.response.cummulativeQuoteQty - (commission.isQuote ? commission.total : 0);
		}
	}

	public GetSellQuantity = (): string => {
		let qty: number = 0;

		if (this.baseStepSize) {
			const trim: number = this.baseQty % this.baseStepSize;
			qty = this.baseQty - trim;
		} else {
			qty = this.baseQty;
		}

		// qty = this.baseQty - (this.baseQty / 800);

		return qty.toFixed(this.quotePrecision);
	}

	public Finish = (): void => {
		this.times.finishedAt = new Date().toISOString();
	}

	private SetInitialPrices = (price: number): void => {
		// this.startPrice = price;
		this.currentPrice = price;
		this.highestPriceReached = price;
		this.lowestPriceReached = price;
	}

	private CalculatePriceChanges = (newPrice: number): void => {
		this.priceDifference = Calculations.PriceDifference(this.currentPrice, newPrice);
		this.UpdatePrices(newPrice);
		this.percentageDifference = Calculations.PricePercentageDifference(this.startPrice, newPrice);
		this.percentageDroppedFromHigh = Calculations.PricePercentageDifference(this.highestPriceReached, newPrice);
	}

	private UpdatePrices = (newPrice: number): void => {
		if (newPrice > this.highestPriceReached) this.highestPriceReached = newPrice;
		else if (newPrice < this.lowestPriceReached) this.lowestPriceReached = newPrice;
		this.currentPrice = newPrice;
	}

	private SortCommissions = (fills: TransactionFill[]): void => {
		fills.map((c: TransactionFill): void => {
			if (this.commissions[c.commissionAsset]) this.commissions[c.commissionAsset] += Number(c.commission);
			else this.commissions[c.commissionAsset] = Number(c.commission);
			if (c.commissionAsset === this.base) this.baseQty -= Number(c.commission);
			if (c.commissionAsset === this.quote) this.quoteQty += Number(c.commission);
		});
		// return { total, isQuote, isBase };
	}

	private CalculateAverageBuyPrice = (fills: TransactionFill[]): void => { // TODO: Check this functionality
		let total: number = 0;
		fills.map((c: any): void => total += c.price);
		if (total) {
			const avgPrice: number = total / fills.length;
			this.startPrice = avgPrice;
			this.currentPrice = avgPrice;
		}
	}

	// public getExchangeInfo = async (): Promise<void> => {
	// 	const response: any = await CryptoApi.get(`/exchange-info/single/${this.symbol}/${this.quote}`);
	// 	if (response.success) this.exchangeInfo = response.info;
	//
	// 	if (!this.exchangeInfo) console.error(`No exchange info for ${this.symbol}`);
	//
	// 	this.getLotSize();
	// }

	private SortExchangeInfo = (exchangeInfo: ExchangeInfoSymbol): void => {
		this.SetTradeLotSize(exchangeInfo);
	}

	private SetTradeLotSize = (exchangeInfo: ExchangeInfoSymbol): void => {
		const lotSizeFilter: any = exchangeInfo.filters.find((f: any): boolean => f.filterType === 'LOT_SIZE');
		if (lotSizeFilter) {
			console.log(`${this.symbol} has a step size limit of ${lotSizeFilter.stepSize}`);
			this.baseMinQty = lotSizeFilter.minQty;
			this.baseStepSize = lotSizeFilter.stepSize;
		}
	}
}
