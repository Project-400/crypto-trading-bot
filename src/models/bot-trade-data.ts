import {
	ExchangeInfoSymbol,
	TransactionFillCommission
} from '@crypto-tracker/common-types';
import Calculations from '../utils/calculations';

/*
*
* This is an object to contain all of the data related to a specific bot trade session.
*
* */

export class BotTradeData { // New version of SymbolTraderData

	public symbol: string;											// The trading pair symbol, eg. BTCUSDT
	public base: string;											// The base currency (The currency being bought), eg. BTC
	public quote: string;											// The quote currency (The currency being used to spend / trade for the base), eg. USDT
	public baseQty: number = 0;										// The amount of base currency currently being traded
	public quoteQty: number = 0;									// The amount of quote currency being used to trade with (Limit set by bot)
	public profit: number = 0;										// The current / final amount of profit made (measured in the quote currency)
	public startPrice: number = 0;									// The price of the base (measured in quote) for the initial trade
	public currentPrice: number = 0;								// The current price of the base (measured in quote)
	public highestPriceReached: number = 0;							// The highest price of the base (measured in quote) reached during trading
	public lowestPriceReached: number = 0;							// The lowest price of the base (measured in quote) reached during trading
	public priceDifference: number = 0;								// The difference in price of the base from the start to the current
	public percentageDifference: number = 0;						// The percentage difference in price of the base from the start to the current
	public percentageDroppedFromHigh: number = 0;					// The percentage difference in price of the base from the highest price to the current
	public commissions: TransactionFillCommission[] = [];			// A list of commissions taken by Binance
	public exchangeInfo: ExchangeInfoSymbol;						// The Binance details related to this trading pair - Limits, rounding, etc.
	public baseMinQty: number = 0;									// The minimum amount TODO: Should this be the quote instead of base?
	public baseStepSize: number = 0;								// The minimum step size TODO: Same as above
	public startTime: number;										// The time the trading began (For calculations)
	public times: { createdAt: string; finishedAt: string } = {		// Times actions occurred (For DB records)
		createdAt: '',
		finishedAt: ''
	};

	// public baseInitialQty: number = 0; // to do
	// public quoteQtySpent: number = 0; // to do

	public constructor(
		symbol: string,
		base: string,
		quote: string,
		// startPrice: number,				// TODO: This needs to be calculated based on average from buy
		exchangeInfo: ExchangeInfoSymbol
	) {
		this.symbol = symbol;
		this.base = base;
		this.quote = quote;
		this.times.createdAt = new Date().toISOString();
		this.startTime = new Date().getTime();
		this.exchangeInfo = exchangeInfo;
		this.SetTradeLotSize();
		// this.SetInitialPrices(startPrice);
	}

	public UpdatePrice = (price: number): void => {
		if (this.currentPrice) return this.CalculatePriceChanges(price);
		// return this.calculatePriceChanges(price);
		this.SetInitialPrices(price);
	}

	public SortBuyData = (transaction: any): void => {			// TODO: Refactor? Pass in details needed only
		if (transaction.response && transaction.response.fills) {
			const commission: { total: number; isQuote: boolean; isBase: boolean } = this.LogCommissions(transaction.response.fills);
			this.CalculateBuyPrice(transaction.response.fills);
			this.baseQty += transaction.response.executedQty - (commission.isBase ? commission.total : 0);
			this.quoteQty -= transaction.response.cummulativeQuoteQty;
		}
	}

	public SortSellData = (transaction: any): void => {			// TODO: Refactor? Pass in details needed only
		if (transaction.response && transaction.response.fills) {
			const commission: { total: number; isQuote: boolean; isBase: boolean } = this.LogCommissions(transaction.response.fills);
			this.baseQty -= transaction.response.executedQty;
			this.quoteQty += transaction.response.cummulativeQuoteQty - (commission.isQuote ? commission.total : 0);
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

		return qty.toFixed(this.exchangeInfo?.quotePrecision);
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

	private LogCommissions = (fills: TransactionFillCommission[]): { total: number; isQuote: boolean; isBase: boolean } => {
		this.commissions.push(...fills);
		let total: number = 0;
		let isQuote: boolean = false;
		let isBase: boolean = false;
		fills.map((c: TransactionFillCommission): void => { // TODO: Check this functionality - Different asset types. Same for buy and sell?
			console.log(c);
			isQuote = c.commissionAsset === this.quote; // To be changed - May have multiple commissions
			isBase = c.commissionAsset === this.base;
			total += c.commission;
		});
		return { total, isQuote, isBase };
	}

	private CalculateBuyPrice = (fills: any[]): void => { // TODO: Check this functionality
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

	private SetTradeLotSize = (): void => {
		const lotSizeFilter: any = this.exchangeInfo.filters.find((f: any): boolean => f.filterType === 'LOT_SIZE');
		if (lotSizeFilter) {
			console.log(`${this.symbol} has a step size limit of ${lotSizeFilter.stepSize}`);
			this.baseMinQty = lotSizeFilter.minQty;
			this.baseStepSize = lotSizeFilter.stepSize;
		}
	}

}
