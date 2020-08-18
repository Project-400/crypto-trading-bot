import { SymbolPriceData } from '../models/symbol-price-data';
import { BinanceApi } from '../api/binance-api';

class SymbolAnalystBot {
  
  private symbol: SymbolPriceData;
  private performanceType: SymbolPerformanceType;
  private decision: Decision = Decision.GATHERING_DATA;
  private klineData: KlineDataPoint[] = [];
  
  constructor(symbol: SymbolPriceData, type: SymbolPerformanceType) {
    this.symbol = symbol;
    this.performanceType = type;

    this.fetchKlineData().then(this.evaluate);
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
    }))
  }
  
  private evaluate() {
    this.updateDecision(Decision.EVALUATING);
    
    // To Do
  }
  
  private updateDecision(decision: Decision) {
    this.decision = decision;
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
