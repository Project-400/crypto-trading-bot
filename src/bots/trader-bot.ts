import WebSocket, {MessageEvent} from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { SymbolTraderData } from '../models/symbol-trader-data';
import { PositionState, SymbolType } from '@crypto-tracker/common-types';
import { CryptoApi } from '../api/crypto-api';
import { Logger } from '../logger/logger';

export enum BotState {
  WAITING = 'WAITING',
  TRADING = 'TRADING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export class TraderBot {

  public state: BotState = BotState.WAITING;
  private readonly ws: WebSocket;
  private currentPrice: number = 0;
  private readonly tradeData: SymbolTraderData;
  private interval: NodeJS.Timeout | undefined;
  private readonly quoteQty: number = 0;
  public symbolType: SymbolType = SymbolType.NONE;
  public saved: boolean = false;
  public symbol: string;

  constructor(symbol: string, base: string, quote: string, quoteQty: number, symbolType: SymbolType) {
    console.log('Trader Bot opening connection to Binance')
    this.ws = new WebSocket(BinanceWS);
    this.tradeData = new SymbolTraderData(symbol, base, quote, symbolType);
    this.quoteQty = quoteQty;
    this.symbolType = symbolType;
    this.symbol = symbol;
  }
  
  async startTrading() {
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
    
    setTimeout(() => {
      setInterval(() => {
        if (this.tradeData.priceDifference < 1.5) {
          this.tradeData.state = PositionState.TIMEOUT_SELL;
        }
      }, 60000);
    }, 60000 * 15);

    return { trading: true };
  }

  public stopTrading() {
    console.log('Trader Bot closing connection to Binance')

    if (this.interval) clearInterval(this.interval);
    this.ws.close();
  }

  private updatePrice() {
    this.tradeData.updatePrice(this.currentPrice);
  }

  private async makeDecision() {
    console.log('-------------------------------')
    console.log(`Symbol: ${this.tradeData.symbol}`)
    console.log(`Type: ${this.symbolType}`)
    console.log(`Price is: ${this.tradeData.currentPrice}`)
    console.log(`Price diff: ${this.tradeData.percentageDifference}%`)
    console.log(`Price drop diff: ${this.tradeData.percentageDroppedFromHigh}%`)
    console.log(`The bot is: ${this.state}`)
    console.log(`Trade position state: ${this.tradeData.state}`)
    
    Logger.info(`${this.tradeData.symbol} ($${this.tradeData.currentPrice} -- Percentage change: ${this.tradeData.percentageDifference}%`);
    
    if (this.state === BotState.WAITING) {
      const buy: any = await this.buyCurrency(this.quoteQty);
      
      this.updateState(BotState.TRADING);
      
      if (buy.success && buy.transaction) {
        this.tradeData.logBuy(buy);
        this.currentPrice = this.tradeData.currentPrice;
      }
    }

    if (this.state === BotState.TRADING && (this.tradeData.state === PositionState.SELL || this.tradeData.state === PositionState.TIMEOUT_SELL)) {
      const sell: any = await this.sellCurrency();

      this.updateState(BotState.PAUSED);

      if (sell.success && sell.transaction) {
        this.tradeData.logSell(sell);
        
        this.updateState(BotState.FINISHED); // TEMPORARY
      }
    }

    if (this.state === BotState.FINISHED) {
      this.tradeData.finish();
      await this.saveTradeData();
      
      this.stopTrading();
    }
  }

  private updateState(state: BotState) {
    this.state = state;
  }

  private async saveTradeData() {
    if (this.saved) return;
    this.saved = true;
    return await CryptoApi.post('/bots/trade/save', {
      tradeData: this.tradeData
    });
  }
  
  private async buyCurrency(quantity: number) {
    Logger.info(`Buying ${this.tradeData.base} with ${quantity} ${this.tradeData.quote}`);

    return await CryptoApi.post('/transactions/buy', {
      symbol: this.tradeData.symbol,
      base: this.tradeData.base,
      quote: this.tradeData.quote,
      quantity,
      isTest: false
    });
  }

  private async sellCurrency() {
    Logger.info(`Selling ${this.tradeData.getSellQuantity()} ${this.tradeData.base}`);
    
    return await CryptoApi.post('/transactions/sell', {
      symbol: this.tradeData.symbol,
      base: this.tradeData.base,
      quote: this.tradeData.quote,
      quantity: this.tradeData.getSellQuantity(),
      isTest: false
    });
  }
}
