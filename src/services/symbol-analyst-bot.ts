import { SymbolPriceData } from '../models/symbol-price-data';
import { BinanceApi } from '../api/binance-api';
import { v4 as uuid } from 'uuid';

export class SymbolAnalystBot {

  public decision: Decision = Decision.GATHERING_DATA;
  private symbol: SymbolPriceData;
  private performanceType: SymbolPerformanceType;
  private klineData: KlineDataPoint[] = [];
  private botId: string;
  
  constructor(symbol: SymbolPriceData, type: SymbolPerformanceType) {
    this.symbol = symbol;
    this.performanceType = type;
    this.botId = `SystemAnalystBot_${uuid()}`;
  }
  
  public async start() {
    await this.fetchKlineData();
    this.evaluate();
  }
  
  private async fetchKlineData() {
    const klineData: number[][] = await BinanceApi.getKlineData(this.symbol.symbol);
    this.klineData = klineData.map((point: number[]) => ({
      openTime: point[0],
      open: point[1],
      high: point[2],
      low: point[3],
      close: point[4],
      volume: point[5],
      closeTime: point[6],
      quoteAssetVolume: point[7],
      numberOfTrades: point[8],
      takerBuyBaseAssetVolume: point[9],
      takerBuyQuoteAssetVolume: point[10]
    }));
  }
  
  private updateDecision(decision: Decision) {
    this.decision = decision;
  }

  private evaluate() {
    this.updateDecision(Decision.EVALUATING);

    console.log(`Analyst Bot: Analysing ${this.symbol.symbol}`);

    if (this.isClimbing()) {
      this.decision = Decision.BUY;
      console.log(`Decision: BUY ${this.symbol.symbol}`);
    } else {
      this.decision = Decision.ABANDON;
      console.log(`Decision: ABANDON ${this.symbol.symbol}`);
    }
  }
  
  private isClimbing() {
    const length: number = this.klineData.length;
    const minuteOne: KlineDataPoint = this.klineData[length - 1];
    const minuteTwo: KlineDataPoint = this.klineData[length - 2];
    const minuteThree: KlineDataPoint = this.klineData[length - 3];
    return (
      this.isGreenMinute(minuteTwo) && this.hasSignificantTopShadow(minuteTwo) &&
      this.isGreenMinute(minuteOne) && this.hasSignificantTopShadow(minuteOne)
    );
  }
  
  private hasSignificantTopShadow(point: KlineDataPoint): boolean { // Not ideal, maybe signify that price is dropping / about to drop
    const isGreen: boolean = this.isGreenMinute(point);
    const topShadow: number = point.high - (isGreen ? point.close : point.open);
    const shadowGrowth: number = point.high - point.low;
    return topShadow > (shadowGrowth / 3);
  }
  
  private isGreenMinute(point: KlineDataPoint) {
    return point.open < point.close;
  }
  
  private isRedMinute(point: KlineDataPoint) {
    return point.open > point.close;
  }
  
  private isGrowing(point: KlineDataPoint) { // The total shadow is less than half of the total shadow
    const actualGrowth: number = point.open - point.close;
    const shadowGrowth: number = point.high - point.low;
    const diff: number = shadowGrowth - actualGrowth;
    return diff < (shadowGrowth / 2);
  }
  
}

export enum SymbolPerformanceType {
  HIGHEST_GAINER = 'HIGHEST_GAINER',
  AVERAGE_GAINER = 'AVERAGE_GAINER',
  LEAPER = 'LEAPER',
  CLIMBER = 'CLIMBER'
}

export enum Decision {
  GATHERING_DATA = 'GATHERING_DATA',
  EVALUATING = 'EVALUATING',
  WAIT = 'WAIT',
  BUY = 'BUY',
  ABANDON = 'ABANDON'
}

export interface KlineDataPoint {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteAssetVolume: number;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
}
