import {BinanceApi} from '../api/binance-api';
import {v4 as uuid} from 'uuid';
import {KlineFunctions} from "../services/kline-functions";
import {KlineDataPoint} from "../interfaces/interfaces";
import WebSocket, {MessageEvent} from "isomorphic-ws";
import {BinanceWS} from "../settings";
import {SymbolTraderData} from "../models/symbol-trader-data";
import {LongTradeBotState, SymbolType} from "@crypto-tracker/common-types";

export class LongTradeBot {

  public state: LongTradeBotState = LongTradeBotState.GATHERING_DATA;
  private ws: WebSocket;
  private readonly symbol: string;
  private readonly lowerCaseSymbol: string;
  private readonly botId: string;
  private previousKlineData: KlineDataPoint[] = []; // Data from before bot start (HTTP)
  // private currentKlineData: KlineDataPoint[] = []; // Data since bot start (WS)
  private klineMergeResolved: boolean = false; // Is Kline data from HTTP merged with WS data
  private tradeData: SymbolTraderData;
  private interval?: NodeJS.Timeout;
  private currentKlineDataPoint?: KlineDataPoint;
  private currentPrice: number = 0;

  constructor(symbol: string, base: string, quote: string, quoteQty: number) {
    this.symbol = symbol;
    this.lowerCaseSymbol = symbol.toLowerCase();
    this.botId = `LongTradeBot_${uuid()}`;
    this.tradeData = new SymbolTraderData(symbol, base, quote, SymbolType.LONG_TRADE);
    this.ws = new WebSocket(BinanceWS);
  }

  public async start() {
    this.setupSocket();
    await this.fetchKlineData();
    await this.tradeData.getExchangeInfo();
    // this.workoutKlineData();
    
    // this.interval = setInterval(() => {
    //   this.evaluate();
    // }, 2000);
    //
    // this.interval = setInterval(() => {
    //   this.evaluate();
    // }, 2000);
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
    
    if (this.previousKlineData.length === 5) console.log(this.previousKlineData);
    
    if (!this.klineMergeResolved) {
      if (this.previousKlineData[this.previousKlineData.length - 1].closeTime === klinePoint.closeTime) {
        this.previousKlineData[this.previousKlineData.length - 1] = klinePoint;
      } else {
        this.klineMergeResolved = true;
        this.storeClosedKlinePoint(klinePoint)
      }
    } else {
      if (k.x) this.storeClosedKlinePoint(klinePoint); // Kline is closed
    }

    this.currentKlineDataPoint = klinePoint;
  }
  
  private sortPriceData(data: any) {
    this.currentPrice = data.a;
  }
  
  private storeClosedKlinePoint(point: KlineDataPoint) {
    this.previousKlineData.splice(0, 1);
    this.previousKlineData.push(point);
  }
  
  private async fetchKlineData() {
    this.updateState(LongTradeBotState.GATHERING_DATA);
    
    const klineData: number[][] = await BinanceApi.getKlineData(this.symbol, '1m', 120);
    this.previousKlineData = klineData.map((point: number[]) => ({
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
    this.updateState(LongTradeBotState.WAIT);

    console.log(`--------------------`);
    console.log(`Analyst Bot: Analysing ${this.symbol}`);

    if (this.state === LongTradeBotState.WAIT && this.isClimbing()) {
      this.updateState(LongTradeBotState.BUY);
      console.log(`Decision: BUY ${this.symbol}`);
      // this.buyCurrency();
    } else if (this.state === LongTradeBotState.HOLD && this.isDropping()) {
      this.updateState(LongTradeBotState.SELL);
      console.log(`Decision: SELL ${this.symbol}`);
      // this.sellCurrency();
    } else {
      console.log(`Decision: Still ${this.state} for ${this.symbol}`);
    }
  }

  private isClimbing() {
    const length: number = this.previousKlineData.length;
    const minuteOne: KlineDataPoint = this.previousKlineData[length - 1];
    const minuteTwo: KlineDataPoint = this.previousKlineData[length - 2];
    const minuteThree: KlineDataPoint = this.previousKlineData[length - 3];
    // const onePercent = minuteThree.high / 100;
    // const diff: number = minuteOne.high - minuteThree.high;
    return (
      KlineFunctions.isGreenMinute(minuteTwo) &&
      KlineFunctions.isGreenMinute(minuteOne)
      // diff >= onePercent
    );
  }

  private isDropping() {
    const length: number = this.previousKlineData.length;
    const minuteOne: KlineDataPoint = this.previousKlineData[length - 1];
    const minuteTwo: KlineDataPoint = this.previousKlineData[length - 2];
    const minuteThree: KlineDataPoint = this.previousKlineData[length - 3];
    return (
      KlineFunctions.isRedMinute(minuteTwo) &&
      KlineFunctions.isRedMinute(minuteOne)
    );
  }
  
  private workoutKlineData() {
    let totalPrice: number = 0;
    let averagePrice: number = 0;
    let lowestPrice: number = 0;
    let highestPrice: number = 0;
    
    this.previousKlineData.map((k: KlineDataPoint) => {
      totalPrice += Number(k.close);
      if ((lowestPrice && k.close < lowestPrice) || !lowestPrice) lowestPrice = k.close;
      if ((highestPrice && k.close > highestPrice) || !highestPrice) highestPrice = k.close;
    });
    
    averagePrice = totalPrice / this.previousKlineData.length;

    console.log(totalPrice);
    console.log(this.previousKlineData.length);
    console.log(lowestPrice);
    console.log(averagePrice);
    console.log(highestPrice);
  }
  
}
