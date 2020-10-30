// import supertest from 'supertest';

import { KlineFunctions } from './kline-functions';
import { KlineDataPoint } from '../interfaces/interfaces';

describe('Test Kline Functions', (): void => {
	test('It should return true is a value has dropped by a percentage', (done: jest.DoneCallback): void => {
		const lastPoint: KlineDataPoint = {
			openTime: 0,
			open: 0,
			high: 0,
			low: 0,
			close: 10,
			volume: 0,
			closeTime: 0,
			quoteAssetVolume: 0,
			numberOfTrades: 0,
			takerBuyBaseAssetVolume: 0,
			takerBuyQuoteAssetVolume: 0
		};
		const currentPoint: KlineDataPoint = {
			openTime: 0,
			open: 0,
			high: 0,
			low: 0,
			close: 9,
			volume: 0,
			closeTime: 0,
			quoteAssetVolume: 0,
			numberOfTrades: 0,
			takerBuyBaseAssetVolume: 0,
			takerBuyQuoteAssetVolume: 0
		};
		const percentageChange: number = 1;
		const result: boolean = KlineFunctions.droppedBy(lastPoint, currentPoint, percentageChange);

		expect(result).toBeTruthy();
		done();
	});
});
