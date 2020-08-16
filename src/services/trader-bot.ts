import WebSocket, {MessageEvent} from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { PositionState, SymbolTraderData } from '../models/symbol-trader-data';
import axios, { AxiosError, AxiosResponse } from 'axios';

enum BotState {
  WAITING = 'WAITING',
  TRADING = 'TRADING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export class TraderBot {

  static ws: WebSocket;
  static currentPrice: number = 0;
  static tradeData: SymbolTraderData;
  static state: BotState = BotState.WAITING;

  static async watchPriceChanges(symbol: string, base: string, quote: string) {
    console.log('Trader Bot opening connection to Binance')
    this.ws = new WebSocket(BinanceWS);

    this.tradeData = new SymbolTraderData(symbol, base, quote);
    await this.tradeData.getExchangeInfo();

    const data = {
      method: 'SUBSCRIBE',
      params: [`${this.tradeData.lowercaseSymbol}@bookTicker`],
      id: 1
    };
    
    this.ws.onopen = () => {
      console.log('Trader Bot connected to Binance');

      this.ws.send(JSON.stringify(data));

      const interval = setInterval(async () => {
        this.updatePrice();
        // await this.makeDecision();
      }, 2000);
    };

    this.ws.onclose = () => {
      console.log('Trader Bot disconnected from Binance');
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      const data = JSON.parse(msg.data as string);
      if (data.result === null) return;
      this.currentPrice = data.a;
    };

    return { trading: true };
  }

  static stop() {
    console.log('Trader Bot closing connection to Binance')

    this.ws.close();
  }

  private static updatePrice() {
    this.tradeData.updatePrice(this.currentPrice);
  }

  private static async makeDecision() {
    console.log('-------------------------------')
    console.log(`Price is: ${this.tradeData.currentPrice}`)
    console.log(`Price diff: ${this.tradeData.percentageDifference}%`)
    console.log(`The bot is: ${this.state}`)
    console.log(`Trade position state: ${this.tradeData.state}`)
    
    if (this.state === BotState.WAITING) {
      const qty: number = 0.0002;
      
      const buy: any = await this.buyCurrency(
        this.tradeData.symbol,
        this.tradeData.base,
        this.tradeData.quote,
        qty
      );
      
      this.updateState(BotState.TRADING);
      
      if (buy.success && buy.transaction) {
        this.tradeData.logBuy(buy);
        this.currentPrice = this.tradeData.currentPrice;
      }
    }

    if (this.state === BotState.TRADING && this.tradeData.state === PositionState.SELL) {
      console.log('SELL SELL SELL')
      const sell: any = await this.sellCurrency(
        this.tradeData.symbol,
        this.tradeData.base,
        this.tradeData.quote,
        this.tradeData.baseQty
      );

      this.updateState(BotState.PAUSED);

      if (sell.success && sell.transaction) {
        this.tradeData.logSell(sell);

        console.log(this.tradeData.quoteQty)
        console.log(this.tradeData.baseQty)
        console.log(this.tradeData.baseQty)
        console.log(this.tradeData.commissions)
      }
    }
  }
  
  private static updateState(state: BotState) {
    this.state = state;
  }
  
  static async buyCurrency(symbol: string, base: string, quote: string, quantity: number) {
    const response: string = await new Promise((resolve: any, reject: any): void => {
      const postData = {
        symbol,
        base,
        quote,
        quantity,
        isTest: false
      };

      axios.post('http://localhost:3001/transactions/buy', postData)
        .then((res: AxiosResponse) => {
          if (res.status === 200) resolve(res.data);
          else reject(res);
        })
        .catch((error: AxiosError) => {
          console.error(error);
          reject(error);
        });
    });
    
    return response;
  }
  
  static async sellCurrency(symbol: string, base: string, quote: string, quantity: number) {
    const response: any = await new Promise((resolve: any, reject: any): void => {
      const postData = {
        symbol,
        base,
        quote,
        quantity,
        isTest: false
      };

      console.log('SELLING: ')
      console.log(postData)

      axios.post('http://localhost:3001/transactions/sell', postData)
        .then((res: AxiosResponse) => {
          if (res.status === 200) resolve(res.data);
          else reject(res);
        })
        .catch((error: AxiosError) => {
          console.error(error);
          reject(error);
        });
    });
    
    return response;
  }
}
