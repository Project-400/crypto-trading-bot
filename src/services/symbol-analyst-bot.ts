import { SymbolPriceData } from '../models/symbol-price-data';

class SymbolAnalystBot {
  
  public symbol: SymbolPriceData;
  public performanceType: SymbolPerformanceType;
  public decision: Decision = Decision.GATHERING_DATA;
  
  constructor(symbol: SymbolPriceData, type: SymbolPerformanceType) {
    this.symbol = symbol;
    this.performanceType = type;
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
