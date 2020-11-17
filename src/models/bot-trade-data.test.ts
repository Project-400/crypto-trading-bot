import { BotTradeData } from './bot-trade-data';
import { FakeExchangeInfo } from '../test-data/exchange-info.data';
import {
	BinanceTransactionType,
	ExchangeCurrencyTransactionFull,
	ExchangeInfoFilter,
	ExchangeInfoFilterType,
	ExchangeInfoSymbol, TransactionFill
} from '@crypto-tracker/common-types';
import { FakeBuyTransaction_BNB_Commission, FakeBuyTransaction_COMP_Commission } from '../test-data/transactions.data';
import { FillPriceCalculations } from '../interfaces/interfaces';

describe('Test Bot Trade Data', (): void => {

	test('It should populate initial values when Trade Data is created', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo };
		const lotSizeFilter: ExchangeInfoFilter = exchangeInfo.filters
			.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE) ||
			{
				stepSize: '0.00100000',
				filterType: ExchangeInfoFilterType.LOT_SIZE,
				maxQty: '10000000.00000000',
				minQty: '0.00100000'
			};

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, exchangeInfo);

		// Expectations

		expect(tradeData).toBeTruthy();
		expect(tradeData.symbol).toBe(symbol);
		expect(tradeData.base).toBe(base);
		expect(tradeData.quote).toBe(quote);
		expect(tradeData.startedTrading).toBeFalsy();
		expect(tradeData.finishedTrading).toBeFalsy();
		expect(tradeData.baseQty).toBe(0);
		expect(tradeData.quoteQty).toBe(0);
		expect(tradeData.profit).toBe(0);
		expect(tradeData.startPrice).toBe(0);
		expect(tradeData.currentPrice).toBe(0);
		expect(tradeData.highestPriceReached).toBe(0);
		expect(tradeData.lowestPriceReached).toBe(0);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(0);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(0);
		expect(tradeData.highestBuyPrice).toBe(0);
		expect(tradeData.lowestBuyPrice).toBe(0);
		expect(tradeData.averageBuyPrice).toBe(0);
		expect(tradeData.highestSellPrice).toBe(0);
		expect(tradeData.lowestSellPrice).toBe(0);
		expect(tradeData.averageSellPrice).toBe(0);
		expect(tradeData.priceDifference).toBe(0);
		expect(tradeData.percentageDifference).toBe(0);
		expect(tradeData.percentageDroppedFromHigh).toBe(0);
		expect(tradeData.buyFills).toMatchObject([]);
		expect(tradeData.buyFills.length).toBe(0);
		expect(tradeData.sellFills).toMatchObject([]);
		expect(tradeData.sellFills.length).toBe(0);
		expect(tradeData.commissions).toMatchObject({ });
		expect(tradeData.baseMinQty).toBe(Number(lotSizeFilter.minQty));
		expect(tradeData.baseStepSize).toBe(Number(lotSizeFilter.stepSize));
		expect(tradeData.startTime).toBeLessThanOrEqual(new Date().getTime());
		expect(tradeData.quoteAssetPrecision).toBe(exchangeInfo.quoteAssetPrecision);
		expect(tradeData.baseAssetPrecision).toBe(exchangeInfo.baseAssetPrecision);
		expect(tradeData.buyTransactionType).toBeUndefined();
		expect(tradeData.sellTransactionType).toBeUndefined();
		expect(tradeData.sellQty).toBeUndefined();
		expect(tradeData.times.createdAt).toBeTruthy();
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBeFalsy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBeFalsy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
	});

	test('It should populate and calculate buy data when currency is bought (Single BNB Commission)', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo };
		const transaction: ExchangeCurrencyTransactionFull = { ...FakeBuyTransaction_BNB_Commission };
		const lotSizeFilter: ExchangeInfoFilter = exchangeInfo.filters
			.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE) ||
			{
				stepSize: '0.00100000',
				filterType: ExchangeInfoFilterType.LOT_SIZE,
				maxQty: '10000000.00000000',
				minQty: '0.00100000'
			};

		const commission: number = Number(transaction.fills[0].commission);
		const baseQty: number = Number(transaction.executedQty);
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty);
		const averagePrice: number = 0.007928;

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, exchangeInfo);
		tradeData.SortBuyData(transaction);

		// Expectations

		expect(tradeData).toBeTruthy();
		expect(tradeData.symbol).toBe(symbol);
		expect(tradeData.base).toBe(base);
		expect(tradeData.quote).toBe(quote);
		expect(tradeData.startedTrading).toBeTruthy();
		expect(tradeData.finishedTrading).toBeFalsy();
		expect(tradeData.baseQty).toBe(baseQty);
		expect(tradeData.quoteQty).toBe(quoteQty);
		expect(tradeData.profit).toBe(0);
		expect(tradeData.startPrice).toBe(averagePrice);
		expect(tradeData.currentPrice).toBe(averagePrice);
		expect(tradeData.highestPriceReached).toBe(averagePrice);
		expect(tradeData.lowestPriceReached).toBe(averagePrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averagePrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averagePrice);
		expect(tradeData.highestBuyPrice).toBe(averagePrice);
		expect(tradeData.lowestBuyPrice).toBe(averagePrice);
		expect(tradeData.averageBuyPrice).toBe(averagePrice);
		expect(tradeData.highestSellPrice).toBe(0);
		expect(tradeData.lowestSellPrice).toBe(0);
		expect(tradeData.averageSellPrice).toBe(0);
		expect(tradeData.priceDifference).toBe(0);
		expect(tradeData.percentageDifference).toBe(0);
		expect(tradeData.percentageDroppedFromHigh).toBe(0);
		expect(tradeData.buyFills).toMatchObject(transaction.fills);
		expect(tradeData.buyFills.length).toBe(1);
		expect(tradeData.sellFills).toMatchObject([]);
		expect(tradeData.sellFills.length).toBe(0);
		expect(tradeData.commissions).toMatchObject({
			BNB: commission
		});
		expect(tradeData.commissions.BNB).toBe(commission);
		expect(tradeData.baseMinQty).toBe(Number(lotSizeFilter.minQty));
		expect(tradeData.baseStepSize).toBe(Number(lotSizeFilter.stepSize));
		expect(tradeData.startTime).toBeLessThanOrEqual(new Date().getTime());
		expect(tradeData.quoteAssetPrecision).toBe(exchangeInfo.quoteAssetPrecision);
		expect(tradeData.baseAssetPrecision).toBe(exchangeInfo.baseAssetPrecision);
		expect(tradeData.buyTransactionType).toBe(BinanceTransactionType.MARKET);
		expect(tradeData.sellTransactionType).toBeUndefined();
		expect(tradeData.sellQty).toBeUndefined();
		expect(tradeData.times.createdAt).toBeTruthy();
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBeTruthy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBeTruthy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.lowestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt).toBeTruthy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBeTruthy();
	});

	test('It should populate and calculate buy data when currency is bought (Single COMP Commission)', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo };
		const transaction: ExchangeCurrencyTransactionFull = { ...FakeBuyTransaction_COMP_Commission };
		const lotSizeFilter: ExchangeInfoFilter = exchangeInfo.filters
			.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE) ||
			{
				stepSize: '0.00100000',
				filterType: ExchangeInfoFilterType.LOT_SIZE,
				maxQty: '10000000.00000000',
				minQty: '0.00100000'
			};

		const commission: number = Number(transaction.fills[0].commission);
		const baseQty: number = Number(transaction.executedQty) - commission; // 0.013986
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty);
		const averagePrice: number = 0.007486;

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, exchangeInfo);
		tradeData.SortBuyData(transaction);

		// Expectations

		expect(tradeData).toBeTruthy();
		expect(tradeData.symbol).toBe(symbol);
		expect(tradeData.base).toBe(base);
		expect(tradeData.quote).toBe(quote);
		expect(tradeData.startedTrading).toBeTruthy();
		expect(tradeData.finishedTrading).toBeFalsy();
		expect(tradeData.baseQty).toBe(baseQty);
		expect(tradeData.quoteQty).toBe(quoteQty);
		expect(tradeData.profit).toBe(0);
		expect(tradeData.startPrice).toBe(averagePrice);
		expect(tradeData.currentPrice).toBe(averagePrice);
		expect(tradeData.highestPriceReached).toBe(averagePrice);
		expect(tradeData.lowestPriceReached).toBe(averagePrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averagePrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averagePrice);
		expect(tradeData.highestBuyPrice).toBe(averagePrice);
		expect(tradeData.lowestBuyPrice).toBe(averagePrice);
		expect(tradeData.averageBuyPrice).toBe(averagePrice);
		expect(tradeData.highestSellPrice).toBe(0);
		expect(tradeData.lowestSellPrice).toBe(0);
		expect(tradeData.averageSellPrice).toBe(0);
		expect(tradeData.priceDifference).toBe(0);
		expect(tradeData.percentageDifference).toBe(0);
		expect(tradeData.percentageDroppedFromHigh).toBe(0);
		expect(tradeData.buyFills).toMatchObject(transaction.fills);
		expect(tradeData.buyFills.length).toBe(1);
		expect(tradeData.sellFills).toMatchObject([]);
		expect(tradeData.sellFills.length).toBe(0);
		expect(tradeData.commissions).toMatchObject({
			COMP: commission
		});
		expect(tradeData.commissions.COMP).toBe(commission);
		expect(tradeData.baseMinQty).toBe(Number(lotSizeFilter.minQty));
		expect(tradeData.baseStepSize).toBe(Number(lotSizeFilter.stepSize));
		expect(tradeData.startTime).toBeLessThanOrEqual(new Date().getTime());
		expect(tradeData.quoteAssetPrecision).toBe(exchangeInfo.quoteAssetPrecision);
		expect(tradeData.baseAssetPrecision).toBe(exchangeInfo.baseAssetPrecision);
		expect(tradeData.buyTransactionType).toBe(BinanceTransactionType.MARKET);
		expect(tradeData.sellTransactionType).toBeUndefined();
		expect(tradeData.sellQty).toBeUndefined();
		expect(tradeData.times.createdAt).toBeTruthy();
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBeTruthy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBeTruthy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.lowestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt).toBeTruthy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBeTruthy();
	});

});
