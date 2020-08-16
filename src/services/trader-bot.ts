import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { SymbolTraderData } from '../models/symbol-trader-data';
import axios, { AxiosError, AxiosResponse } from 'axios';

export class TraderBot {

  static ws: WebSocket;
  static currentPrice: number;
  static tradeData: SymbolTraderData;

  static watchPriceChanges(symbol: string) {
    console.log('Trader Bot opening connection to Binance')
    this.ws = new WebSocket(BinanceWS);
    
    this.tradeData = new SymbolTraderData(symbol);
    
    const data = {
      method: 'SUBSCRIBE',
      params: [ `${this.tradeData.lowercaseSymbol}@bookTicker` ],
      id: 1
    };

    this.ws.onopen = () => {
      console.log('Trader Bot connected to Binance');

      const interval = setInterval(() => {
        this.updatePrice();
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
  }

  static stop() {
    console.log('Trader Bot closing connection to Binance')

    this.ws.close();
  }

  private static updatePrice() {
    this.tradeData.updatePrice(this.currentPrice);
  }
  
  static async buyCurrency(symbol: string, base: string, quote: string, quantity: number) {
    const response: string = await new Promise((resolve: any, reject: any): void => {
      const postData = {
        symbol,
        base,
        quote,
        quantity,
        isTest: true
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
    const response: string = await new Promise((resolve: any, reject: any): void => {
      const postData = {
        symbol,
        base,
        quote,
        quantity,
        isTest: true
      };

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
