import {BinanceApi} from '../api/binance-api';
import {v4 as uuid} from 'uuid';
import {KlineFunctions} from "../services/kline-functions";
import {KlineDataPoint} from "../interfaces/interfaces";
import WebSocket, {MessageEvent} from "isomorphic-ws";
import {BinanceWS} from "../settings";
import {SymbolTraderData} from "../models/symbol-trader-data";
import {LongTradeBotState, SymbolType} from "@crypto-tracker/common-types";
import {Logger} from "../logger/logger";
import {CryptoApi} from "../api/crypto-api";
import {BotState} from "./trader-bot";

export class LongTradeBot {

  public state: LongTradeBotState = LongTradeBotState.GATHERING_DATA;
  private ws: WebSocket;
  private readonly symbol: string;
  private readonly quote: string;
  private readonly base: string;
  private readonly lowerCaseSymbol: string;
  private readonly botId: string;
  private readonly quoteQty: number;
  private klineData: KlineDataPoint[] = [];
  private klineMergeResolved: boolean = false; // Is Kline data from HTTP merged with WS data
  private tradeData!: SymbolTraderData;
  private interval?: NodeJS.Timeout;
  private currentPrice: number = 0;
  private averageKlineHeight: number = 0;
  private averageKlineShadowHeight: number = 0;
  private averageKlineCandleHeight: number = 0;

  constructor(symbol: string, base: string, quote: string, quoteQty: number) {
    this.symbol = symbol;
    this.base = base;
    this.quote = quote;
    this.quoteQty = quoteQty;
    this.lowerCaseSymbol = symbol.toLowerCase();
    this.botId = `LongTradeBot_${uuid()}`;
    this.ws = new WebSocket(BinanceWS);
    this.createTradeData();
  }

  public async start() {
    this.setupSocket();
    await this.fetchKlineData();
    await this.tradeData.getExchangeInfo();
    this.updateState(LongTradeBotState.WAIT);
    // this.workoutKlineData();
    this.calculateKlineHeights();
  }

  private setupSocket() {
    const data = {
      method: 'SUBSCRIBE',
      params: [ 
        `${this.lowerCaseSymbol}@kline_1m`,
        `${this.lowerCaseSymbol}@bookTicker`
      ],
      id: 1
    }

    this.ws.onopen = () => {
      // Logger.info('Connected to Binance WebSocket');
      // Logger.info('Starting up.. Gathering Data for 60 seconds');

      this.ws.send(JSON.stringify(data));

      // this.interval = setInterval(async () => {
      //   this.updatePrices();
      //   this.checks++;
      //
      //   if (!this.inStartup) {
      //     await this.evaluateChanges();
      //   } else {
      //     if (this.checks >= 6) this.inStartup = false;
      //     Logger.info(`Starting up.. Gathering Data for ${60 - (this.checks * 10)} seconds`);
      //   }
      // }, 10000);

      this.interval = setInterval(async () => {
        await this.evaluate();
        this.updatePrice();
      }, 1000);

    };

    this.ws.onclose = () => {
      // Logger.info(`Connection to Binance Disconnected`);
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      const data = JSON.parse(msg.data as string);
      if (data.result === null) return;
      // console.log(data)
      this.sortSocketData(data);
      // this.prices[data.s] = data.a;
    };
  }
  
  private sortSocketData(data: any) {
    this.tradeData.updatePrice(data.s);
    if (data.e === 'kline') this.sortKlineData(data);
    else this.sortPriceData(data);
  }
  
  private sortKlineData(data: any) {
    if (!data || !data.k) return console.log('No Kline Data');
    
    const k: any = data.k;
    
    const klinePoint: KlineDataPoint = {
      openTime: k.t,
      open: k.o,
      high: k.h,
      low: k.l,
      close: k.c,
      volume: k.v,
      closeTime: k.T,
      quoteAssetVolume: k.q,
      numberOfTrades: k.n,
      takerBuyBaseAssetVolume: k.V,
      takerBuyQuoteAssetVolume: k.Q
    };
    
    if (!this.klineMergeResolved) {
      if (this.klineData[this.klineData.length - 1].closeTime === klinePoint.closeTime) {
        this.klineData[this.klineData.length - 1] = klinePoint;
      } else {
        this.klineMergeResolved = true;
        this.storeClosedKlinePoint(klinePoint)
      }
    } 

    this.storeClosedKlinePoint(klinePoint)
  }
  
  private sortPriceData(data: any) {
    this.currentPrice = data.a;
  }

  private updatePrice() {
    this.tradeData.updatePrice(this.currentPrice);
  }
  
  private storeClosedKlinePoint(point: KlineDataPoint) {
    if (point.closeTime === this.klineData[this.klineData.length - 1].closeTime) {
      this.klineData[this.klineData.length - 1] = point;
    } else {
      this.klineData.splice(0, 1);
      this.klineData.push(point);
    }
  }
  
  private async fetchKlineData() {
    this.updateState(LongTradeBotState.GATHERING_DATA);
    
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

  private async evaluate() {
    console.log(`--------------------`);
    console.log(`Analyst Bot: Analysing ${this.symbol} (${new Date().toISOString()})`);

    if (this.state === LongTradeBotState.WAIT && this.isClimbing()) {
      this.updateState(LongTradeBotState.BUY);
      console.log(`Decision: BUY ${this.symbol}`);
      const buy: any = await this.buyCurrency();
      
      if (buy.success && buy.transaction) {
        this.tradeData.logBuy(buy);
      } else {
        console.log('NO TRANSACTION INFO 1')
      }
    } else if (this.state === LongTradeBotState.HOLD && this.isDropping()) {
      this.updateState(LongTradeBotState.SELL);
      console.log(`Decision: SELL ${this.symbol}`);
      const sell: any = await this.sellCurrency();
      this.createTradeData();
      
      if (sell.success && sell.transaction) {
        this.tradeData.logSell(sell);
      } else {
        console.log('NO TRANSACTION INFO 2')
      }
    } else {
      console.log(`Decision: Still ${this.state} for ${this.symbol}`);
    }
  }
  
  private async buyCurrency() {
    this.updateState(LongTradeBotState.HOLD);

    return await CryptoApi.post('/transactions/buy', {
      symbol: this.tradeData.symbol,
      base: this.tradeData.base,
      quote: this.tradeData.quote,
      quantity: 10,
      isTest: false
    });
  }
  
  private async sellCurrency() {
    this.updateState(LongTradeBotState.WAIT);

    return await CryptoApi.post('/transactions/sell', {
      symbol: this.tradeData.symbol,
      base: this.tradeData.base,
      quote: this.tradeData.quote,
      quantity: this.tradeData.getSellQuantity(),
      isTest: false
    });
  }
  
  private createTradeData() {
    this.tradeData = new SymbolTraderData(this.symbol, this.base, this.quote, SymbolType.LONG_TRADE);
  }

  private isClimbing() {
    const length: number = this.klineData.length;
    const minuteOne: KlineDataPoint = this.klineData[length - 1];
    const minuteTwo: KlineDataPoint = this.klineData[length - 2];
    const minuteThree: KlineDataPoint = this.klineData[length - 3];
    return (
      // (
      //   KlineFunctions.isGreenPoint(minuteThree) &&
      //   KlineFunctions.isGreenPoint(minuteTwo) &&
      //   KlineFunctions.isGreenPoint(minuteOne) &&
      //   KlineFunctions.climbDistanceBetween(minuteThree, minuteOne, 0.5)
      // ) || 
      // (
      //   KlineFunctions.isGreenPoint(minuteTwo) &&
      //   KlineFunctions.increasedBy(minuteTwo, minuteOne, 0.5)
      // ) ||
      // (
      //   KlineFunctions.isGreenPoint(minuteOne) &&
      //   KlineFunctions.increasedBy(minuteTwo, minuteOne, 1)
      // ) ||
      (
        KlineFunctions.isGreenPoint(minuteOne) &&
        KlineFunctions.increasedBy(minuteTwo, minuteOne, 0.1)
      )
    );
  }

  private isDropping() {
    const length: number = this.klineData.length;
    const minuteOne: KlineDataPoint = this.klineData[length - 1];
    const minuteTwo: KlineDataPoint = this.klineData[length - 2];
    const minuteThree: KlineDataPoint = this.klineData[length - 3];
    return (
      // (
      //   KlineFunctions.isRedPoint(minuteThree) &&
      //   KlineFunctions.isRedPoint(minuteTwo) &&
      //   KlineFunctions.isRedPoint(minuteOne) &&
      //   KlineFunctions.dropDistanceBetween(minuteThree, minuteOne, 0.5)
      // ) ||
      // (
      //   KlineFunctions.isRedPoint(minuteTwo) && 
      //   KlineFunctions.droppedBy(minuteTwo, minuteOne, 0.5)
      // ) ||
      // (
      //   KlineFunctions.isRedPoint(minuteOne) && 
      //   KlineFunctions.droppedBy(minuteTwo, minuteOne, 1)
      // ) ||
      // (
      //   KlineFunctions.isRedPoint(minuteOne) && 
      //   KlineFunctions.droppedBy(minuteTwo, minuteOne, 1)
      // ) ||
      (
        KlineFunctions.isRedPoint(minuteOne) &&
        KlineFunctions.droppedBy(minuteTwo, minuteOne, 0.1)
      )
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
  
  private calculateKlineHeights() {
    let klineTotal: number = 0;
    let candleTotal: number = 0;
    let shadowTotal: number = 0;
    
    this.klineData.map((p: KlineDataPoint) => {
      klineTotal += p.high - p.low;
      candleTotal += p.close > p.open ? p.close - p.open : p.open - p.close;
      shadowTotal += p.close > p.open ? (p.high - p.close) + (p.open - p.low) : (p.high - p.open) + (p.close - p.low);
    });
    
    this.averageKlineHeight = klineTotal / this.klineData.length;
    this.averageKlineCandleHeight = candleTotal / this.klineData.length;
    this.averageKlineShadowHeight = shadowTotal / this.klineData.length;
  }
  
  private findTrends() {
    // const trends = {
    //   up: [],
    //   down: [],
    //   flat: []
    // };
    const trends = {
      up: 0,
      down: 0,
      flat: 0
    };
    
    let runCount: number = 0;
    
    let run: TrendRun = {
      start: new Date(),
      end: new Date(),
      points: [],
      direction: TrendDirection.FLAT
    };
    
    // this.klineData.map((point: KlineDataPoint) => {
    //   if (KlineFunctions.isGreenPoint(point))
    // });
    
    for (let i = 0; i < this.klineData.length; i++) {
      const klinePoint: KlineDataPoint = this.klineData[i];
      let point: RunPoint;
      // if (KlineFunctions.isGreenPoint(klinePoint)) 
      // if (i === 0) 
    }
  }
  
}

interface TrendRun {
  start: Date,
  end: Date,
  points: RunPoint[],
  direction: TrendDirection
}

interface RunPoint {
  direction: TrendDirection
}

enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  FLAT = 'FLAT'
}
