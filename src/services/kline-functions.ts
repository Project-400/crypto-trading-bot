import { KlineDataPoint } from '../interfaces/interfaces';

export class KlineFunctions {

	public static hasSignificantTopShadow(point: KlineDataPoint): boolean { // Not ideal, maybe signify that price is dropping / about to drop
		const isGreen: boolean = this.isGreenPoint(point);
		const topShadow: number = point.high - (isGreen ? point.close : point.open);
		const shadowGrowth: number = point.high - point.low;
		return topShadow > (shadowGrowth / 2);
	}

	public static isGreenPoint(point: KlineDataPoint) {
		return point.open < point.close;
	}

	public static isRedPoint(point: KlineDataPoint) {
		return point.open > point.close;
	}

	public static isGrowing(point: KlineDataPoint) { // The total shadow is less than half of the total shadow
		const actualGrowth: number = point.open - point.close;
		const shadowGrowth: number = point.high - point.low;
		const diff: number = shadowGrowth - actualGrowth;
		return diff < (shadowGrowth / 2);
	}

	public static droppedBy(lastPoint: KlineDataPoint, currentPoint: KlineDataPoint, percentage: number) {
		const diff: number = lastPoint.close - currentPoint.close;

		return diff > (lastPoint.close / 100) * percentage;
	}

	public static increasedBy(lastPoint: KlineDataPoint, currentPoint: KlineDataPoint, percentage: number) {
		const diff: number = currentPoint.close - lastPoint.close;

		return diff > (lastPoint.close / 100) * percentage;
	}

	public static climbDistanceBetween(previousPoint: KlineDataPoint, currentPoint: KlineDataPoint, percentage: number) {
		const distance: number = currentPoint.close - previousPoint.open;

		return distance > (previousPoint.close / 100) * percentage;
	}

	public static dropDistanceBetween(previousPoint: KlineDataPoint, currentPoint: KlineDataPoint, percentage: number) {
		const distance: number = previousPoint.open - currentPoint.close;

		return distance > (previousPoint.close / 100) * percentage;
	}

	// public static isBiggerThan(previousPoint: KlineDataPoint, currentPoint: KlineDataPoint) {
	//   const isGreen = currentPoint.
	//   return currentPoint.;
	// }
	//
}
