import {
	ExchangeCurrencyTransactionFull,
	ExchangeInfoFilter,
	ExchangeInfoFilterType,
	ExchangeInfoSymbol,
	TransactionFill
} from '@crypto-tracker/common-types';
import Calculations from '../utils/calculations';
import { CommissionTotals, FillPriceCalculations } from '../interfaces/interfaces';

/*
*
* This is an object to contain all of the trade data related to a specific bot trade session.
* Includes prices, percentages, times, quantities, commissions, etc.
*
* */

export class BotTradeData { // New version of SymbolTraderData

	public symbol: string;										// Trading pair symbol, eg. BTCUSDT
	public base: string;										// Base currency (The currency being bought), eg. BTC
	public quote: string;										// Quote currency (The currency being used to spend / trade for the base), eg. USDT
	public startedTrading: boolean = false;						// Flag to indicate if trading has started (base currency has been bought)
	public finishedTrading: boolean = false;					// Flag to indicate if trading has ended (base currency has been bought)
	public baseQty: number = 0;									// Amount of base currency currently being traded
	public quoteQty: number = 0;								// Amount of quote currency being used to trade with (Limit set by bot)
	public profit: number = 0;									// Current / final amount of profit made (measured in the quote currency)
	public startPrice: number = 0;								// Price of the base (measured in quote) for the initial trade
	public currentPrice: number = 0;							// Current price of the base (measured in quote)
	public highestPriceReached: number = 0;						// Highest price of the base (measured in quote) reached during trading
	public lowestPriceReached: number = 0;						// Lowest price of the base (measured in quote) reached during trading
	public highestPriceReachedDuringTrade: number = 0;			// Highest price of the base (measured in quote) reached during trading
	public lowestPriceReachedDuringTrade: number = 0;			// Lowest price of the base (measured in quote) reached during trading
	public highestBuyPrice: number = 0;							// Highest price paid for buying the base currency
	public lowestBuyPrice: number = 0;							// Lowest price paid for buying the base currency
	public averageBuyPrice: number = 0;							// Average price paid for buying the base currency
	public highestSellPrice: number = 0;						// Highest price received for selling the base currency
	public lowestSellPrice: number = 0;							// Lowest price received for selling the base currency
	public averageSellPrice: number = 0;						// Average price received for selling the base currency
	public priceDifference: number = 0;							// Difference in price of the base from the start to the current
	public percentageDifference: number = 0;					// Percentage difference in price of the base from the start to the current
	public percentageDroppedFromHigh: number = 0;				// Percentage difference in price of the base from the highest price to the current
	public buyFills: TransactionFill[] = [];					// A list of buy fills (sub-transactions that make up the total transaction) by Binance
	public sellFills: TransactionFill[] = [];					// A list of sell fills (sub-transactions that make up the total transaction) by Binance
	public commissions: CommissionTotals = { };					// A map of commissions totals taken by Binance
	public baseMinQty: number = 0;								// Minimum amount of the base that can be purchased
	public baseStepSize: number = 0;							// Minimum step size (rounding value) of the base that can be purchased
	public startTime: number;									// Time the trading began (For calculations)
	public quotePrecision: number = 0;							// Time the trading began (For calculations)
	public times: {												// Times actions occurred (For DB records)
		createdAt?: string;											// Time trade data object created
		finishedAt?: string;										// Time trade data finished
		buyAt?: string;												// Time buy action started
		sellAt?: string;											// Time sell action started
		buyTransactionAt?: string;									// Time Binance performed buy transaction
		sellTransactionAt?: string;									// Time Binance performed sell transaction
		highestPriceReachedAt?: string;								// Time highest price reached during trade data lifetime
		lowestPriceReachedAt?: string;								// Time lowest price reached during trade data lifetime
		highestPriceReachedDuringTradeAt?: string;					// Time highest price reached during trade
		lowestPriceReachedDuringTradeAt?: string;					// Time lowest price reached during trade
	} = { };
	public buyTransactionType?: string;							// Buy Transaction type, eg. MARKET
	public sellTransactionType?: string;						// Sell Transaction type, eg. MARKET
	public sellQty?: string;									// Quantity of the base being sold

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
		this.currentPrice = price;
	}

	public SortBuyData = (transaction: ExchangeCurrencyTransactionFull): void => {
		if (transaction.fills) {
			this.buyFills.push(...transaction.fills);
			this.SortCommissions(this.buyFills);
			this.CalculateBuyPrices(this.buyFills);

			this.baseQty += Number(transaction.executedQty);
			this.quoteQty -= Number(transaction.cummulativeQuoteQty);
			this.buyTransactionType = transaction.type;
			this.times.buyTransactionAt = new Date(transaction.transactTime).toISOString();
		}
		this.startedTrading = true;
	}

	public SortSellData = (transaction: ExchangeCurrencyTransactionFull): void => {
		if (transaction.fills) {
			this.sellFills.push(...transaction.fills);
			this.SortCommissions(this.sellFills);
			this.CalculateSellPrices(this.sellFills);

			this.baseQty -= Number(transaction.executedQty);
			this.quoteQty += Number(transaction.cummulativeQuoteQty);
			this.sellTransactionType = transaction.type;
			this.times.sellTransactionAt = new Date(transaction.transactTime).toISOString();
		}

		this.finishedTrading = true;
	}

	public GetSellQuantity = (): string => {
		let qty: number;

		if (this.baseStepSize) {
			const trim: number = this.baseQty % this.baseStepSize;
			qty = this.baseQty - trim;
		} else {
			qty = this.baseQty;
		}

		this.sellQty = qty.toFixed(this.quotePrecision);

		return this.sellQty;
	}

	public Finish = (): void => {
		this.times.finishedAt = new Date().toISOString();
	}

	private CalculatePriceChanges = (price: number): void => {
		if (this.startedTrading) {
			this.percentageDifference = Calculations.PricePercentageDifference(this.startPrice, price);
			this.percentageDroppedFromHigh = Calculations.PricePercentageDifference(this.highestPriceReached, price);
		}
		this.priceDifference = Calculations.PriceDifference(this.currentPrice, price);
		this.UpdateHighPrices(price);
		this.UpdateLowPrices(price);
		this.currentPrice = price;
	}

	private UpdateHighPrices = (price: number): void => {
		if (price > this.highestPriceReached) this.highestPriceReached = price;
		if (this.startedTrading && price > this.highestPriceReachedDuringTrade) this.highestPriceReachedDuringTrade = price;
	}

	private UpdateLowPrices = (price: number): void => {
		if (price > this.lowestPriceReached) this.lowestPriceReached = price;
		if (this.startedTrading && price > this.lowestPriceReachedDuringTrade) this.lowestPriceReachedDuringTrade = price;
	}

	private SortCommissions = (fills: TransactionFill[]): void => {
		fills.map((c: TransactionFill): void => {
			if (this.commissions[c.commissionAsset]) this.commissions[c.commissionAsset] += Number(c.commission);
			else this.commissions[c.commissionAsset] = Number(c.commission);
			if (c.commissionAsset === this.base) this.baseQty -= Number(c.commission);
			if (c.commissionAsset === this.quote) this.quoteQty += Number(c.commission);
		});
	}

	private CalculateBuyPrices = (fills: TransactionFill[]): void => {
		const fillPrices: FillPriceCalculations = this.CalculateFillPrices(fills);
		this.highestBuyPrice = fillPrices.highest;
		this.lowestBuyPrice = fillPrices.lowest;
		this.averageBuyPrice = fillPrices.average;
		this.startPrice = fillPrices.average;
		this.currentPrice = fillPrices.average;
		this.UpdateHighPrices(fillPrices.highest);
		this.UpdateLowPrices(fillPrices.lowest);
	}

	private CalculateSellPrices = (fills: TransactionFill[]): void => {
		const fillPrices: FillPriceCalculations = this.CalculateFillPrices(fills);
		this.highestSellPrice = fillPrices.highest;
		this.lowestSellPrice = fillPrices.lowest;
		this.averageSellPrice = fillPrices.average;
	}

	private CalculateFillPrices = (fills: TransactionFill[]): FillPriceCalculations => {
		let total: number = 0;
		let highest: number = 0;
		let lowest: number = 0;
		let average: number = 0;
		fills.map((c: TransactionFill): void => {
			const price: number = Number(c.price);
			total += price;
			highest = price > highest ? price : highest;
			lowest = price < lowest ? price : lowest;
		});
		if (total) average = total / fills.length;

		return { highest, lowest, average };
	}

	private SortExchangeInfo = (exchangeInfo: ExchangeInfoSymbol): void => {
		this.SetTradeLotSize(exchangeInfo);
	}

	private SetTradeLotSize = (exchangeInfo: ExchangeInfoSymbol): void => {
		const lotSizeFilter: ExchangeInfoFilter | undefined = exchangeInfo.filters
			.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE);

		if (lotSizeFilter) {
			this.baseMinQty = Number(lotSizeFilter.minQty);
			this.baseStepSize = Number(lotSizeFilter.stepSize);
		}
	}
}
