import { KlineFunctions } from './kline-functions';
import { KlineDataPoint } from '../interfaces/interfaces';

describe('Test Kline Functions', (): void => {

	test('It should return true if a Kline Data Point has dropped by a percentage (droppedBy)', (): void => {
		const lastPoint: KlineDataPoint = extendDataPoint({ close: 10 });
		const currentPoint: KlineDataPoint = extendDataPoint({ close: 9 });
		const percentageChange: number = 10;
		const result: boolean = KlineFunctions.droppedBy(lastPoint, currentPoint, percentageChange);

		expect(result).toBeTruthy();
	});

	test('It should return false if a Kline Data Point has not dropped by a percentage (droppedBy)', (): void => {
		const lastPoint: KlineDataPoint = extendDataPoint({ close: 10 });
		const currentPoint: KlineDataPoint = extendDataPoint({ close: 9 });
		const percentageChange: number = 11;
		const result: boolean = KlineFunctions.droppedBy(lastPoint, currentPoint, percentageChange);

		expect(result).toBeFalsy();
	});

	test('It should return false if a Kline Data Point has not dropped by a percentage 2 (droppedBy)', (): void => {
		const lastPoint: KlineDataPoint = extendDataPoint({ close: 10 });
		const currentPoint: KlineDataPoint = extendDataPoint({ close: 11 });
		const percentageChange: number = 1;
		const result: boolean = KlineFunctions.droppedBy(lastPoint, currentPoint, percentageChange);

		expect(result).toBeFalsy();
	});

	test('It should return true if a Kline Data Point has increased by a percentage (increasedBy)', (): void => {
		const lastPoint: KlineDataPoint = extendDataPoint({ close: 10 });
		const currentPoint: KlineDataPoint = extendDataPoint({ close: 11 });
		const percentageChange: number = 10;
		const result: boolean = KlineFunctions.increasedBy(lastPoint, currentPoint, percentageChange);

		expect(result).toBeTruthy();
	});

	test('It should return false if a Kline Data Point has not increased by a percentage (increasedBy)', (): void => {
		const lastPoint: KlineDataPoint = extendDataPoint({ close: 10 });
		const currentPoint: KlineDataPoint = extendDataPoint({ close: 11 });
		const percentageChange: number = 11;
		const result: any = KlineFunctions.increasedBy(lastPoint, currentPoint, percentageChange);

		expect(result).toBeFalsy();
	});

});

// tslint:disable-next-line:typedef
const extendDataPoint = (overwriteData: Partial<KlineDataPoint>): KlineDataPoint => ({
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
		takerBuyQuoteAssetVolume: 0,
		...overwriteData
	});
