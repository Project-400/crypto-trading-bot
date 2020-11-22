import { BotTradeData } from '../../../models/bot-trade-data';
import { FakeExchangeInfo_GTO } from '../../../test-data/exchange-info.data';
import {
	ExchangeCurrencyTransactionFull,
	ExchangeInfoSymbol,
} from '@crypto-tracker/common-types';
import { FakeBuyTransaction_GTO_BNB_Commission } from '../../../test-data/transactions.data';

describe('Bot Trade Data: Sell Quantity', (): void => {

	test('It should calculate the sell quantity when BNB commission was used for buy transaction', (): void => {
		const symbol: string = 'COMPBTC';
		const base: string = 'COMP';
		const quote: string = 'BTC';
		const priceChangeInterval: number = 1000;

		const exchangeInfo: ExchangeInfoSymbol = { ...FakeExchangeInfo_GTO };
		const transaction: ExchangeCurrencyTransactionFull = { ...FakeBuyTransaction_GTO_BNB_Commission };

		const commission: number = Number(transaction.fills[0].commission); // 0.00005037
		const baseQty: number = Number(transaction.executedQty); // 268.00000000
		const quoteQty: number = -Number(transaction.cummulativeQuoteQty); // -0.00010988
		const averageStartPrice: number = Number(transaction.fills[0].price); // 0.00000041;

		const tradeData: BotTradeData = new BotTradeData(symbol, base, quote, priceChangeInterval, exchangeInfo);
		tradeData.SortBuyData(transaction);

		// Ensure test data doesn't change
		expect(commission).toBe(0.00005037);
		expect(baseQty).toBe(268);
		expect(quoteQty).toBe(-0.00010988);
		expect(averageStartPrice).toBe(0.00000041);

		// Mock price update from Binance
		const updatedPrice: number = 0.00000043;
		tradeData.UpdatePrice(updatedPrice);

		const sellQty: string = tradeData.GetSellQuantity();

		console.log(0.00000043);

		expect(sellQty).toBe('268.00000000');
	});

});
