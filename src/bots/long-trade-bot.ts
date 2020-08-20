import { BinanceApi } from '../api/binance-api';
import { v4 as uuid } from 'uuid';
import {KlineFunctions} from "../services/kline-functions";
import {KlineDataPoint} from "../interfaces/interfaces";

export class LongTradeBot {

  public state: LongTradeBotState = LongTradeBotState.GATHERING_DATA;
  private readonly symbol: string;
  private readonly botId: string;
  private klineData: KlineDataPoint[] = [];

  constructor(symbol: string) {
    this.symbol = symbol;
    this.botId = `LongTradeBot_${uuid()}`;
  }

  public async start() {
    await this.fetchKlineData();
    // this.evaluate();
    this.workoutKlineData();
  }

  private async fetchKlineData() {
    const klineData: number[][] = await BinanceApi.getKlineData(this.symbol, '1m', 120);
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

  private updateState(state: LongTradeBotState) {
    this.state = state;
  }

  private evaluate() {
    this.updateState(LongTradeBotState.EVALUATING);

    console.log(`Analyst Bot: Analysing ${this.symbol}`);

    if (this.isClimbing()) {
      this.state = LongTradeBotState.BUY;
      console.log(`Decision: BUY ${this.symbol}`);
    } else {
      this.state = LongTradeBotState.ABANDON;
      console.log(`Decision: ABANDON ${this.symbol}`);
    }
  }

  private isClimbing() {
    const length: number = this.klineData.length;
    const minuteOne: KlineDataPoint = this.klineData[length - 1];
    const minuteTwo: KlineDataPoint = this.klineData[length - 2];
    const minuteThree: KlineDataPoint = this.klineData[length - 3];
    return (
      KlineFunctions.isGreenMinute(minuteTwo) && !KlineFunctions.hasSignificantTopShadow(minuteTwo) &&
      KlineFunctions.isGreenMinute(minuteOne) && !KlineFunctions.hasSignificantTopShadow(minuteOne)
    );
  }
  
  private workoutKlineData() {
    let totalPrice: number = 0;
    let averagePrice: number = 0;
    let lowestPrice: number = 0;
    let highestPrice: number = 0;
    
    this.klineData.map((k: KlineDataPoint) => {
      totalPrice += Number(k.close);
      if ((lowestPrice && k.close < lowestPrice) || !lowestPrice) lowestPrice = k.close;
      if ((highestPrice && k.close > highestPrice) || !highestPrice) highestPrice = k.close;
    });
    
    averagePrice = totalPrice / this.klineData.length;

    console.log(totalPrice);
    console.log(this.klineData.length);
    console.log(lowestPrice);
    console.log(averagePrice);
    console.log(highestPrice);
  }
  
}

export enum LongTradeBotState {
  GATHERING_DATA = 'GATHERING_DATA',
  EVALUATING = 'EVALUATING',
  WAIT = 'WAIT', // Sold currency, waiting to buy
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD', // Holding currency
  ABANDON = 'ABANDON'
}
