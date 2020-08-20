import { KlineDataPoint } from '../bots/long-trade-bot';

export class KlineFunctions {

  public static hasSignificantTopShadow(point: KlineDataPoint): boolean { // Not ideal, maybe signify that price is dropping / about to drop
    const isGreen: boolean = this.isGreenMinute(point);
    const topShadow: number = point.high - (isGreen ? point.close : point.open);
    const shadowGrowth: number = point.high - point.low;
    return topShadow > (shadowGrowth / 2);
  }

  public static isGreenMinute(point: KlineDataPoint) {
    return point.open < point.close;
  }

  public static isRedMinute(point: KlineDataPoint) {
    return point.open > point.close;
  }

  public static isGrowing(point: KlineDataPoint) { // The total shadow is less than half of the total shadow
    const actualGrowth: number = point.open - point.close;
    const shadowGrowth: number = point.high - point.low;
    const diff: number = shadowGrowth - actualGrowth;
    return diff < (shadowGrowth / 2);
  }


}
