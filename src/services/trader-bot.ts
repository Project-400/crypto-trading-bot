import WebSocket, {MessageEvent} from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { SymbolTraderData } from '../models/symbol-trader-data';
import { PositionState } from '@crypto-tracker/common-types';
import { CryptoApi } from '../api/crypto-api';

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
  static interval: NodeJS.Timeout;

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

      this.interval = setInterval(async () => {
        this.updatePrice();
        await this.makeDecision();
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

    clearInterval(this.interval);
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
      const qty: number = 0.0003;
      
      const buy: any = await this.buyCurrency(qty);
      
      this.updateState(BotState.TRADING);
      
      if (buy.success && buy.transaction) {
        this.tradeData.logBuy(buy);
        this.currentPrice = this.tradeData.currentPrice;
      }
    }

    if (this.state === BotState.TRADING && this.tradeData.state === PositionState.SELL) {
      console.log('SELL SELL SELL')
      const sell: any = await this.sellCurrency();

      this.updateState(BotState.PAUSED);

      if (sell.success && sell.transaction) {
        this.tradeData.logSell(sell);

        console.log(this.tradeData.quoteQty)
        console.log(this.tradeData.baseQty)
        console.log(this.tradeData.baseQty)
        console.log(this.tradeData.commissions)
        
        this.updateState(BotState.FINISHED); // TEMPORARY
      }
    }

    if (this.state === BotState.FINISHED) {
      this.tradeData.finish();
      await this.saveTradeData();
      
      this.stop();
    }
  }

  private static updateState(state: BotState) {
    this.state = state;
  }

  private static async saveTradeData() {
    return await CryptoApi.post('/bots/trade/save', {
      tradeData: this.tradeData
    });
  }
  
  private static async buyCurrency(quantity: number) {
    return await CryptoApi.post('/transactions/buy', {
      symbol: this.tradeData.symbol,
      base: this.tradeData.base,
      quote: this.tradeData.quote,
      quantity,
      isTest: false
    });
  }

  private static async sellCurrency() {
    return await CryptoApi.post('/transactions/sell', {
      symbol: this.tradeData.symbol,
      base: this.tradeData.base,
      quote: this.tradeData.quote,
      quantity: this.tradeData.getSellQuantity(),
      isTest: false
    });
  }
}
