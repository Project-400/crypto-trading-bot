import {
	CommissionTotals,
	ExchangeCurrencyTransactionFull,
	ExchangeInfoFilter,
	ExchangeInfoFilterType,
	ExchangeInfoSymbol,
	IBotTradeData,
	TransactionFill
} from '@crypto-tracker/common-types';
import Calculations from '../utils/calculations';
import { FillPriceCalculations } from '../interfaces/interfaces';
import { v4 as uuid } from 'uuid';

/*
*
* This is an object to contain all of the trade data related to a specific bot trade session.
* Includes prices, percentages, times, quantities, commissions, etc.
*
* */

export class BotTradeData implements IBotTradeData { // New version of SymbolTraderData

	public tradeDataId: string;									// The unique ID for this instance of trade data
	public botId: string;										// The unique Bot ID
	public symbol: string;										// Trading pair symbol, eg. BTCUSDT
	public base: string;										// Base currency (The currency being bought), eg. BTC
	public quote: string;										// Quote currency (The currency being used to spend / trade for the base), eg. USDT
	public startedTrading: boolean = false;						// Flag to indicate if trading has started (base currency has been bought)
	public finishedTrading: boolean = false;					// Flag to indicate if trading has ended (base currency has been bought)
	public buyDataSet: boolean = false;							// Flag to indicate if buy has occurred and data is set
	public sellDataSet: boolean = false;						// Flag to indicate if sell has occurred and data is set
	public baseQty: number = 0;									// Amount of base currency currently being traded
	public staticBaseQty: number = 0;			 // TEMP						// Amount of base currency currently being traded
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
	// tslint:disable-next-line:ban-ts-ignore
	// @ts-ignore
	public priceDifference: string = '0';						// Difference in price of the base from the start to the current
	public percentageDifference: number = 0;					// Percentage difference in price of the base from the start to the current
	public percentageDroppedFromHigh: number = 0;				// Percentage difference in price of the base from the highest price to the current
	public buyFills: TransactionFill[] = [];					// A list of buy fills (sub-transactions that make up the total transaction) by Binance
	public sellFills: TransactionFill[] = [];					// A list of sell fills (sub-transactions that make up the total transaction) by Binance
	public commissions: CommissionTotals = { };					// A map of commissions totals taken by Binance
	public baseMinQty: number = 0;								// Minimum amount of the base that can be purchased
	public baseStepSize: number = 0;							// Minimum step size (rounding value) of the base that can be purchased
	public startTime: number;									// Time the trading began (For calculations)
	public quoteAssetPrecision: number = 0;						// Rounding precision for quote currency
	public baseAssetPrecision: number = 0;						// Rounding precision for base currency
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
		lastPriceUpdateAt?: string;									// Time the price last updated during trade
	} = { };
	public buyTransactionType?: string;							// Buy Transaction type, eg. MARKET
	public sellTransactionType?: string;						// Sell Transaction type, eg. MARKET
	public sellQty?: string;									// Quantity of the base being sold
	public preTradePriceChangeCount: number = 0;				// The amount of times the price updated before the trade
	public priceChangeCount: number = 0;						// The amount of times the price updated during the trade
	public priceChangeInterval!: number;						// The interval gap between expected price updates

	public constructor(
		botId: string,
		symbol: string,
		base: string,
		quote: string,
		priceChangeInterval: number,
		exchangeInfo: ExchangeInfoSymbol
	) {
		this.tradeDataId = uuid();
		this.botId = botId;
		this.symbol = symbol;
		this.base = base;
		this.quote = quote;
		this.times.createdAt = new Date().toISOString();
		this.startTime = new Date().getTime();
		this.priceChangeInterval = priceChangeInterval;
		this.SortExchangeInfo(exchangeInfo);
	}

	public UpdatePrice = (price: number): void => {
		if (this.finishedTrading) return; // Prevent any data changes

		const time: string = new Date().toISOString();
		this.CalculatePriceChanges(price, time);
	}

	public SortBuyData = (transaction: ExchangeCurrencyTransactionFull): void => {
		if (this.startedTrading) return; // Prevent any data changes

		this.startedTrading = true;
		const time: string = new Date().toISOString();
		this.times.buyAt = time;
		this.times.buyAt = time;

		if (transaction.fills) {
			this.buyFills.push(...transaction.fills);
			this.SortCommissions(this.buyFills);
			this.CalculateBuyPrices(this.buyFills, time);

			this.baseQty += Number(transaction.executedQty);
			this.staticBaseQty += Number(transaction.executedQty);
			this.quoteQty -= Number(transaction.cummulativeQuoteQty);
			this.buyTransactionType = transaction.type;
			this.times.buyTransactionAt = new Date(transaction.transactTime).toISOString();
		}
	}

	public SortSellData = (transaction: ExchangeCurrencyTransactionFull): void => {
		if (this.finishedTrading) return; // Prevent any data changes

		this.finishedTrading = true;
		this.times.sellAt = new Date().toISOString();

		if (transaction.fills) {
			this.sellFills.push(...transaction.fills);
			this.SortCommissions(this.sellFills);
			this.CalculateSellPrices(this.sellFills);

			this.baseQty -= Number(transaction.executedQty);
			this.quoteQty += Number(transaction.cummulativeQuoteQty);
			this.sellTransactionType = transaction.type;
			this.times.sellTransactionAt = new Date(transaction.transactTime).toISOString();
		}
	}

	public GetSellQuantity = (): string => {
		if (this.finishedTrading) return ''; // Prevent any data changes

		let qty: number;

		if (this.baseStepSize) {
			const trim: number = this.baseQty % this.baseStepSize;
			qty = this.baseQty - trim;
		} else {
			qty = this.baseQty;
		}

		this.sellQty = qty.toFixed(this.quoteAssetPrecision);

		return this.sellQty;
	}

	public Finish = (): void => {
		if (this.times.finishedAt) return; // Prevent any data changes

		this.times.finishedAt = new Date().toISOString();
	}

	private CalculatePriceChanges = (price: number, time: string): void => {
		if (this.startedTrading) {
			this.percentageDifference = Calculations.PricePercentageDifference(this.startPrice, price);
			this.percentageDroppedFromHigh = price < this.highestPriceReachedDuringTrade ?
				Calculations.PricePercentageDifference(this.highestPriceReached, price) :
				0;

			this.priceChangeCount += 1;
			this.times.lastPriceUpdateAt = time;
		} else {
			this.preTradePriceChangeCount += 1;
			this.times.lastPriceUpdateAt = time;
		}

		if (this.startPrice) this.priceDifference = Calculations.PriceDifference(this.startPrice, price, this.baseAssetPrecision);
		this.UpdateHighPrices(price, time);
		this.UpdateLowPrices(price, time);
		this.currentPrice = price;
	}

	private UpdateHighPrices = (price: number, time: string): void => {
		if (!this.highestPriceReached || price > this.highestPriceReached) {
			this.highestPriceReached = price;
			this.times.highestPriceReachedAt = time;
		}
		if (this.startedTrading && (!this.highestPriceReachedDuringTrade || price > this.highestPriceReachedDuringTrade)) {
			this.highestPriceReachedDuringTrade = price;
			this.times.highestPriceReachedDuringTradeAt = time;
		}
	}

	private UpdateLowPrices = (price: number, time: string): void => {
		if (!this.lowestPriceReached || price < this.lowestPriceReached) {
			this.lowestPriceReached = price;
			this.times.lowestPriceReachedAt = time;
		}
		if (this.startedTrading && (!this.lowestPriceReachedDuringTrade || price < this.lowestPriceReachedDuringTrade)) {
			this.lowestPriceReachedDuringTrade = price;
			this.times.lowestPriceReachedDuringTradeAt = time;
		}
	}

	private SortCommissions = (fills: TransactionFill[]): void => {
		fills.map((c: TransactionFill): void => {
			if (this.commissions[c.commissionAsset]) this.commissions[c.commissionAsset] += Number(c.commission);
			else this.commissions[c.commissionAsset] = Number(c.commission);
			if (c.commissionAsset === this.base) this.baseQty -= Number(c.commission);
			if (c.commissionAsset === this.quote) this.quoteQty += Number(c.commission);
		});
	}

	private CalculateBuyPrices = (fills: TransactionFill[], time: string): void => {
		const fillPrices: FillPriceCalculations = this.CalculateFillPrices(fills);
		this.highestBuyPrice = fillPrices.highest;
		this.lowestBuyPrice = fillPrices.lowest;
		this.averageBuyPrice = fillPrices.average;
		this.startPrice = fillPrices.average;
		this.currentPrice = fillPrices.average;
		this.UpdateHighPrices(fillPrices.highest, time);
		this.UpdateLowPrices(fillPrices.lowest, time);
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
			highest = !highest || price > highest ? price : highest;
			lowest = !lowest || price < lowest ? price : lowest;
		});

		if (total) average = Number((total / fills.length).toFixed(this.baseAssetPrecision));

		return { highest, lowest, average };
	}

	private SortExchangeInfo = (exchangeInfo: ExchangeInfoSymbol): void => {
		this.SetTradeLotSize(exchangeInfo);
		this.quoteAssetPrecision = exchangeInfo.quoteAssetPrecision;
		this.baseAssetPrecision = exchangeInfo.baseAssetPrecision;
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
