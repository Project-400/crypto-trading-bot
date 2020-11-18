import { BotTradeData } from '../../../models/bot-trade-data';
import { FakeExchangeInfo } from '../../../test-data/exchange-info.data';
import {
	BinanceTransactionType,
	ExchangeCurrencyTransactionFull,
	ExchangeInfoFilter,
	ExchangeInfoFilterType,
	ExchangeInfoSymbol,
	IBotTradeData
} from '@crypto-tracker/common-types';
import { FakeBuyTransaction_BNB_Commission, } from '../../../test-data/transactions.data';
import CommonExpectations from '../../common';

describe('Bot Trade Data: Price Changes', (): void => {

	test('It should update price data when Symbol price changes after Buy trade (Single Price Increase)', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const priceChangeInterval: number = 1000;

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

		const commission: number = Number(transaction.fills[0].commission); // 0.00004442
		const baseQty: number = Number(transaction.executedQty); // 0.013
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty); // -0.00010306
		const averageStartPrice: number = Number(transaction.fills[0].price); // 0.007928;

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, priceChangeInterval, exchangeInfo);
		tradeData.SortBuyData(transaction);

		// Ensure test data doesn't change
		expect(commission).toBe(0.00004442);
		expect(baseQty).toBe(0.013);
		expect(quoteQty).toBe(-0.00010306);
		expect(averageStartPrice).toBe(0.007928);

		expect(tradeData).toBeTruthy();
		expect(tradeData.symbol).toBe(symbol);
		expect(tradeData.base).toBe(base);
		expect(tradeData.quote).toBe(quote);
		expect(tradeData.startedTrading).toBeTruthy();
		expect(tradeData.finishedTrading).toBeFalsy();
		expect(tradeData.baseQty).toBe(baseQty);
		expect(tradeData.quoteQty).toBe(quoteQty);
		expect(tradeData.profit).toBe(0);
		expect(tradeData.startPrice).toBe(averageStartPrice);
		expect(tradeData.currentPrice).toBe(averageStartPrice);
		expect(tradeData.highestPriceReached).toBe(averageStartPrice);
		expect(tradeData.lowestPriceReached).toBe(averageStartPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averageStartPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averageStartPrice);
		expect(tradeData.highestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.averageBuyPrice).toBe(averageStartPrice);
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
		expect(tradeData.preTradePriceChangeCount).toBe(0);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
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
		expect(tradeData.times.lastPriceUpdateAt).toBeFalsy();

		const tradeDataClone: IBotTradeData = JSON.parse(JSON.stringify(tradeData)); // Clone current state of trade data

		// Mock price update from Binance
		const updatedPrice: number = 0.008;
		const priceDifference: number = Number((updatedPrice - averageStartPrice).toFixed(exchangeInfo.baseAssetPrecision)); // 0.000072
		const percentageDifference: number = 0.9082;
		tradeData.UpdatePrice(updatedPrice);

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
		expect(tradeData.startPrice).toBe(averageStartPrice);
		expect(tradeData.currentPrice).toBe(updatedPrice);
		expect(tradeData.highestPriceReached).toBe(updatedPrice);
		expect(tradeData.lowestPriceReached).toBe(averageStartPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(updatedPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averageStartPrice);
		expect(tradeData.highestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.averageBuyPrice).toBe(averageStartPrice);
		expect(tradeData.highestSellPrice).toBe(0);
		expect(tradeData.lowestSellPrice).toBe(0);
		expect(tradeData.averageSellPrice).toBe(0);
		expect(tradeData.priceDifference).toBe(priceDifference);
		expect(tradeData.percentageDifference).toBe(percentageDifference);
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
		expect(tradeData.preTradePriceChangeCount).toBe(0);
		expect(tradeData.priceChangeCount).toBe(1);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBe(tradeDataClone.times.createdAt);
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBe(tradeDataClone.times.buyAt);
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBe(tradeDataClone.times.buyTransactionAt);
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt === tradeDataClone.times.highestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedAt).toBe(tradeDataClone.times.lowestPriceReachedAt);
		expect(tradeData.times.highestPriceReachedDuringTradeAt === tradeDataClone.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBe(tradeDataClone.times.lowestPriceReachedDuringTradeAt);
		expect(tradeData.times.lastPriceUpdateAt).toBeTruthy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);
	});

	test('It should update price data when Symbol price changes after Buy trade (Single Price Decrease)', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const priceChangeInterval: number = 1000;

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

		const commission: number = Number(transaction.fills[0].commission); // 0.00004442
		const baseQty: number = Number(transaction.executedQty); // 0.013
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty); // -0.00010306
		const averageStartPrice: number = Number(transaction.fills[0].price); // 0.007928;

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, priceChangeInterval, exchangeInfo);
		tradeData.SortBuyData(transaction);

		// Ensure test data doesn't change
		expect(commission).toBe(0.00004442);
		expect(baseQty).toBe(0.013);
		expect(quoteQty).toBe(-0.00010306);
		expect(averageStartPrice).toBe(0.007928);

		expect(tradeData).toBeTruthy();
		expect(tradeData.symbol).toBe(symbol);
		expect(tradeData.base).toBe(base);
		expect(tradeData.quote).toBe(quote);
		expect(tradeData.startedTrading).toBeTruthy();
		expect(tradeData.finishedTrading).toBeFalsy();
		expect(tradeData.baseQty).toBe(baseQty);
		expect(tradeData.quoteQty).toBe(quoteQty);
		expect(tradeData.profit).toBe(0);
		expect(tradeData.startPrice).toBe(averageStartPrice);
		expect(tradeData.currentPrice).toBe(averageStartPrice);
		expect(tradeData.highestPriceReached).toBe(averageStartPrice);
		expect(tradeData.lowestPriceReached).toBe(averageStartPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averageStartPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averageStartPrice);
		expect(tradeData.highestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.averageBuyPrice).toBe(averageStartPrice);
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
		expect(tradeData.preTradePriceChangeCount).toBe(0);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
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
		expect(tradeData.times.lastPriceUpdateAt).toBeFalsy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);

		const tradeDataClone: IBotTradeData = JSON.parse(JSON.stringify(tradeData)); // Clone current state of trade data

		// Mock price update from Binance
		const updatedPrice: number = 0.00775;
		const priceDifference: number = Number((updatedPrice - averageStartPrice).toFixed(exchangeInfo.baseAssetPrecision)); // 0.000072
		const percentageDifference: number = -2.2452;
		tradeData.UpdatePrice(updatedPrice);

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
		expect(tradeData.startPrice).toBe(averageStartPrice);
		expect(tradeData.currentPrice).toBe(updatedPrice);
		expect(tradeData.highestPriceReached).toBe(averageStartPrice);
		expect(tradeData.lowestPriceReached).toBe(updatedPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averageStartPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(updatedPrice);
		expect(tradeData.highestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageStartPrice);
		expect(tradeData.averageBuyPrice).toBe(averageStartPrice);
		expect(tradeData.highestSellPrice).toBe(0);
		expect(tradeData.lowestSellPrice).toBe(0);
		expect(tradeData.averageSellPrice).toBe(0);
		expect(tradeData.priceDifference).toBe(priceDifference);
		expect(tradeData.percentageDifference).toBe(percentageDifference);
		expect(tradeData.percentageDroppedFromHigh).toBe(percentageDifference);
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
		expect(tradeData.preTradePriceChangeCount).toBe(0);
		expect(tradeData.priceChangeCount).toBe(1);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBe(tradeDataClone.times.createdAt);
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBe(tradeDataClone.times.buyAt);
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBe(tradeDataClone.times.buyTransactionAt);
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBe(tradeDataClone.times.highestPriceReachedAt);
		expect(tradeData.times.lowestPriceReachedAt === tradeDataClone.times.lowestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt).toBe(tradeDataClone.times.highestPriceReachedDuringTradeAt);
		expect(tradeData.times.lowestPriceReachedDuringTradeAt === tradeDataClone.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBeTruthy();
		expect(tradeData.times.lastPriceUpdateAt === tradeDataClone.times.lastPriceUpdateAt).toBeFalsy();
		expect(tradeData.times.lastPriceUpdateAt).toBeTruthy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);
	});

	test('It should update price data when Symbol price changes before Buy Trade (Price Decrease in Buy)', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const priceChangeInterval: number = 1000;

		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo };
		const lotSizeFilter: ExchangeInfoFilter = exchangeInfo.filters
				.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE) ||
			{
				stepSize: '0.00100000',
				filterType: ExchangeInfoFilterType.LOT_SIZE,
				maxQty: '10000000.00000000',
				minQty: '0.00100000'
			};

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, priceChangeInterval, exchangeInfo);

		// Mock price update from Binance
		const originalPreBuyPrice: number = 0.008;
		tradeData.UpdatePrice(originalPreBuyPrice);

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
		expect(tradeData.currentPrice).toBe(originalPreBuyPrice);
		expect(tradeData.highestPriceReached).toBe(originalPreBuyPrice);
		expect(tradeData.lowestPriceReached).toBe(originalPreBuyPrice);
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
		expect(tradeData.commissions.BNB).toBeUndefined();
		expect(tradeData.baseMinQty).toBe(Number(lotSizeFilter.minQty));
		expect(tradeData.baseStepSize).toBe(Number(lotSizeFilter.stepSize));
		expect(tradeData.startTime).toBeLessThanOrEqual(new Date().getTime());
		expect(tradeData.quoteAssetPrecision).toBe(exchangeInfo.quoteAssetPrecision);
		expect(tradeData.baseAssetPrecision).toBe(exchangeInfo.baseAssetPrecision);
		expect(tradeData.buyTransactionType).toBeUndefined();
		expect(tradeData.sellTransactionType).toBeUndefined();
		expect(tradeData.sellQty).toBeUndefined();
		expect(tradeData.preTradePriceChangeCount).toBe(1);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBeTruthy();
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBeFalsy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBeFalsy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.lowestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lastPriceUpdateAt).toBeTruthy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);

		const transaction: ExchangeCurrencyTransactionFull = { ...FakeBuyTransaction_BNB_Commission };

		const commission: number = Number(transaction.fills[0].commission); // 0.00004442
		const baseQty: number = Number(transaction.executedQty); // 0.013
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty); // -0.00010306
		const averageBuyPrice: number = Number(transaction.fills[0].price); // 0.007928;

		// Ensure test data doesn't change
		expect(commission).toBe(0.00004442);
		expect(baseQty).toBe(0.013);
		expect(quoteQty).toBe(-0.00010306);
		expect(averageBuyPrice).toBe(0.007928);

		const tradeDataClone: IBotTradeData = JSON.parse(JSON.stringify(tradeData)); // Clone current state of trade data

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
		expect(tradeData.startPrice).toBe(averageBuyPrice);
		expect(tradeData.currentPrice).toBe(averageBuyPrice);
		expect(tradeData.highestPriceReached).toBe(originalPreBuyPrice);
		expect(tradeData.lowestPriceReached).toBe(averageBuyPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averageBuyPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averageBuyPrice);
		expect(tradeData.highestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.averageBuyPrice).toBe(averageBuyPrice);
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
		expect(tradeData.preTradePriceChangeCount).toBe(1);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBe(tradeDataClone.times.createdAt);
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt === tradeDataClone.times.buyAt).toBeFalsy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt === tradeDataClone.times.buyTransactionAt).toBeFalsy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBe(tradeDataClone.times.highestPriceReachedAt);
		expect(tradeData.times.lowestPriceReachedAt === tradeDataClone.times.lowestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt === tradeDataClone.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt === tradeDataClone.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lastPriceUpdateAt).toBe(tradeDataClone.times.lastPriceUpdateAt);

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);
	});

	test('It should update price data when Symbol price changes before Buy Trade (Price Increase in Buy)', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const priceChangeInterval: number = 1000;

		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo };
		const lotSizeFilter: ExchangeInfoFilter = exchangeInfo.filters
				.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE) ||
			{
				stepSize: '0.00100000',
				filterType: ExchangeInfoFilterType.LOT_SIZE,
				maxQty: '10000000.00000000',
				minQty: '0.00100000'
			};

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, priceChangeInterval, exchangeInfo);

		// Mock price update from Binance
		const originalPreBuyPrice: number = 0.00775;
		tradeData.UpdatePrice(originalPreBuyPrice);

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
		expect(tradeData.currentPrice).toBe(originalPreBuyPrice);
		expect(tradeData.highestPriceReached).toBe(originalPreBuyPrice);
		expect(tradeData.lowestPriceReached).toBe(originalPreBuyPrice);
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
		expect(tradeData.commissions.BNB).toBeUndefined();
		expect(tradeData.baseMinQty).toBe(Number(lotSizeFilter.minQty));
		expect(tradeData.baseStepSize).toBe(Number(lotSizeFilter.stepSize));
		expect(tradeData.startTime).toBeLessThanOrEqual(new Date().getTime());
		expect(tradeData.quoteAssetPrecision).toBe(exchangeInfo.quoteAssetPrecision);
		expect(tradeData.baseAssetPrecision).toBe(exchangeInfo.baseAssetPrecision);
		expect(tradeData.buyTransactionType).toBeUndefined();
		expect(tradeData.sellTransactionType).toBeUndefined();
		expect(tradeData.sellQty).toBeUndefined();
		expect(tradeData.preTradePriceChangeCount).toBe(1);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBeTruthy();
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBeFalsy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBeFalsy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.lowestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lastPriceUpdateAt).toBeTruthy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);

		const transaction: ExchangeCurrencyTransactionFull = { ...FakeBuyTransaction_BNB_Commission };

		const commission: number = Number(transaction.fills[0].commission); // 0.00004442
		const baseQty: number = Number(transaction.executedQty); // 0.013
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty); // -0.00010306
		const averageBuyPrice: number = Number(transaction.fills[0].price); // 0.007928;

		// Ensure test data doesn't change
		expect(commission).toBe(0.00004442);
		expect(baseQty).toBe(0.013);
		expect(quoteQty).toBe(-0.00010306);
		expect(averageBuyPrice).toBe(0.007928);

		const tradeDataClone: IBotTradeData = JSON.parse(JSON.stringify(tradeData)); // Clone current state of trade data

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
		expect(tradeData.startPrice).toBe(averageBuyPrice);
		expect(tradeData.currentPrice).toBe(averageBuyPrice);
		expect(tradeData.highestPriceReached).toBe(averageBuyPrice);
		expect(tradeData.lowestPriceReached).toBe(originalPreBuyPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averageBuyPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averageBuyPrice);
		expect(tradeData.highestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.averageBuyPrice).toBe(averageBuyPrice);
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
		expect(tradeData.preTradePriceChangeCount).toBe(1);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBe(tradeDataClone.times.createdAt);
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt === tradeDataClone.times.buyAt).toBeFalsy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt === tradeDataClone.times.buyTransactionAt).toBeFalsy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt === tradeDataClone.times.highestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedAt).toBe(tradeDataClone.times.lowestPriceReachedAt);
		expect(tradeData.times.highestPriceReachedDuringTradeAt === tradeDataClone.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt === tradeDataClone.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lastPriceUpdateAt).toBe(tradeDataClone.times.lastPriceUpdateAt);

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);
	});

	test('It should update price data when Symbol price changes before and after Buy Trade', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const priceChangeInterval: number = 1000;

		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo };
		const lotSizeFilter: ExchangeInfoFilter = exchangeInfo.filters
				.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE) ||
			{
				stepSize: '0.00100000',
				filterType: ExchangeInfoFilterType.LOT_SIZE,
				maxQty: '10000000.00000000',
				minQty: '0.00100000'
			};

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, priceChangeInterval, exchangeInfo);

		// Mock price update from Binance
		const originalPreBuyPrice: number = 0.00775;
		tradeData.UpdatePrice(originalPreBuyPrice);

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
		expect(tradeData.currentPrice).toBe(originalPreBuyPrice);
		expect(tradeData.highestPriceReached).toBe(originalPreBuyPrice);
		expect(tradeData.lowestPriceReached).toBe(originalPreBuyPrice);
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
		expect(tradeData.commissions.BNB).toBeUndefined();
		expect(tradeData.baseMinQty).toBe(Number(lotSizeFilter.minQty));
		expect(tradeData.baseStepSize).toBe(Number(lotSizeFilter.stepSize));
		expect(tradeData.startTime).toBeLessThanOrEqual(new Date().getTime());
		expect(tradeData.quoteAssetPrecision).toBe(exchangeInfo.quoteAssetPrecision);
		expect(tradeData.baseAssetPrecision).toBe(exchangeInfo.baseAssetPrecision);
		expect(tradeData.buyTransactionType).toBeUndefined();
		expect(tradeData.sellTransactionType).toBeUndefined();
		expect(tradeData.sellQty).toBeUndefined();
		expect(tradeData.preTradePriceChangeCount).toBe(1);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBeTruthy();
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBeFalsy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBeFalsy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.lowestPriceReachedAt).toBeTruthy();
		expect(tradeData.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lastPriceUpdateAt).toBeTruthy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);

		const transaction: ExchangeCurrencyTransactionFull = { ...FakeBuyTransaction_BNB_Commission };

		const commission: number = Number(transaction.fills[0].commission); // 0.00004442
		const baseQty: number = Number(transaction.executedQty); // 0.013
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty); // -0.00010306
		const averageBuyPrice: number = Number(transaction.fills[0].price); // 0.007928;

		// Ensure test data doesn't change
		expect(commission).toBe(0.00004442);
		expect(baseQty).toBe(0.013);
		expect(quoteQty).toBe(-0.00010306);
		expect(averageBuyPrice).toBe(0.007928);

		const tradeDataClone: IBotTradeData = JSON.parse(JSON.stringify(tradeData)); // Clone current state of trade data

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
		expect(tradeData.startPrice).toBe(averageBuyPrice);
		expect(tradeData.currentPrice).toBe(averageBuyPrice);
		expect(tradeData.highestPriceReached).toBe(averageBuyPrice);
		expect(tradeData.lowestPriceReached).toBe(originalPreBuyPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(averageBuyPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averageBuyPrice);
		expect(tradeData.highestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.averageBuyPrice).toBe(averageBuyPrice);
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
		expect(tradeData.preTradePriceChangeCount).toBe(1);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBe(tradeDataClone.times.createdAt);
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt === tradeDataClone.times.buyAt).toBeFalsy();
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt === tradeDataClone.times.buyTransactionAt).toBeFalsy();
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt === tradeDataClone.times.highestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedAt).toBe(tradeDataClone.times.lowestPriceReachedAt);
		expect(tradeData.times.highestPriceReachedDuringTradeAt === tradeDataClone.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt === tradeDataClone.times.lowestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lastPriceUpdateAt).toBe(tradeDataClone.times.lastPriceUpdateAt);

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);

		const tradeDataClone2: IBotTradeData = JSON.parse(JSON.stringify(tradeData)); // Clone current state of trade data
		const updatedPrice: number = 0.0082;
		const priceDifference: number = Number((updatedPrice - averageBuyPrice).toFixed(exchangeInfo.baseAssetPrecision)); // 0.000272
		const percentageDifference: number = 3.4309;
		tradeData.UpdatePrice(updatedPrice); // Mock price update from Binance

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
		expect(tradeData.startPrice).toBe(averageBuyPrice);
		expect(tradeData.currentPrice).toBe(updatedPrice);
		expect(tradeData.highestPriceReached).toBe(updatedPrice);
		expect(tradeData.lowestPriceReached).toBe(originalPreBuyPrice);
		expect(tradeData.highestPriceReachedDuringTrade).toBe(updatedPrice);
		expect(tradeData.lowestPriceReachedDuringTrade).toBe(averageBuyPrice);
		expect(tradeData.highestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.lowestBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.averageBuyPrice).toBe(averageBuyPrice);
		expect(tradeData.highestSellPrice).toBe(0);
		expect(tradeData.lowestSellPrice).toBe(0);
		expect(tradeData.averageSellPrice).toBe(0);
		expect(tradeData.priceDifference).toBe(priceDifference);
		expect(tradeData.percentageDifference).toBe(percentageDifference);
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
		expect(tradeData.preTradePriceChangeCount).toBe(1);
		expect(tradeData.priceChangeCount).toBe(1);
		expect(tradeData.priceChangeInterval).toBe(1000);
		expect(tradeData.times.createdAt).toBe(tradeDataClone2.times.createdAt);
		expect(tradeData.times.finishedAt).toBeFalsy();
		expect(tradeData.times.buyAt).toBe(tradeDataClone2.times.buyAt);
		expect(tradeData.times.sellAt).toBeFalsy();
		expect(tradeData.times.buyTransactionAt).toBe(tradeDataClone2.times.buyTransactionAt);
		expect(tradeData.times.sellTransactionAt).toBeFalsy();
		expect(tradeData.times.highestPriceReachedAt === tradeDataClone2.times.highestPriceReachedAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedAt).toBe(tradeDataClone2.times.lowestPriceReachedAt);
		expect(tradeData.times.highestPriceReachedDuringTradeAt === tradeDataClone2.times.highestPriceReachedDuringTradeAt).toBeFalsy();
		expect(tradeData.times.lowestPriceReachedDuringTradeAt).toBe(tradeDataClone2.times.lowestPriceReachedDuringTradeAt);
		expect(tradeData.times.lastPriceUpdateAt === tradeDataClone2.times.lastPriceUpdateAt).toBeFalsy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);
	});

});
