import { BotTradeData } from '../../../models/bot-trade-data';
import { FakeExchangeInfo_COMP } from '../../../test-data/exchange-info.data';
import {
	ExchangeInfoFilter,
	ExchangeInfoFilterType,
	ExchangeInfoSymbol,
} from '@crypto-tracker/common-types';
import CommonExpectations from '../../common';

describe('Bot Trade Data: Setup', (): void => {

	const FAKE_BOT_ID: string = 'FAKE_BOT_ID';

	test('It should populate initial values when Trade Data is created', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const priceChangeInterval: number = 1000;

		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo_COMP };
		const lotSizeFilter: ExchangeInfoFilter = exchangeInfo.filters
			.find((f: ExchangeInfoFilter): boolean => f.filterType === ExchangeInfoFilterType.LOT_SIZE) ||
			{
				stepSize: '0.00100000',
				filterType: ExchangeInfoFilterType.LOT_SIZE,
				maxQty: '10000000.00000000',
				minQty: '0.00100000'
			};

		const tradeData: BotTradeData = new BotTradeData(FAKE_BOT_ID, symbol, base, quote, priceChangeInterval, exchangeInfo);

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
		expect(tradeData.priceDifference).toBe('0');
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
		expect(tradeData.preTradePriceChangeCount).toBe(0);
		expect(tradeData.priceChangeCount).toBe(0);
		expect(tradeData.priceChangeInterval).toBe(1000);
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
		expect(tradeData.times.lastPriceUpdateAt).toBeFalsy();

		CommonExpectations.ExpectTimesToBeBeforeNow(tradeData.times);
	});

});
