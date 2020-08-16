import WebSocket, {MessageEvent} from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { PositionState, SymbolTraderData } from '../models/symbol-trader-data';
import axios, { AxiosError, AxiosResponse } from 'axios';
import {ExchangeInfoSymbol} from "@crypto-tracker/common-types";

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
    // await this.tradeData.getExchangeInfo();
    // this.tradeData.exchangeInfo = {
    //   pk: 'exchangeInfo#SANDBTC',
    //   sk: 'exchangeInfo#BTC',
    //   entity: 'exchangeInfo',
    //   symbol: 'SANDBTC',
    //   status: 'TRADING',
    //   baseAsset: 'SAND',
    //   baseAssetPrecision: 8,
    //   quoteAsset: 'BTC',
    //   quotePrecision: 8,
    //   quoteAssetPrecision: 8,
    //   orderTypes: [
    //     'LIMIT',
    //     'LIMIT_MAKER',
    //     'MARKET',
    //     'STOP_LOSS_LIMIT',
    //     'TAKE_PROFIT_LIMIT'
    //   ],
    //   icebergAllowed: true,
    //   ocoAllowed: true,
    //   isSpotTradingAllowed: true,
    //   isMarginTradingAllowed: false,
    //   filters: [
    //     {
    //       maxPrice: '1000.00000000',
    //       filterType: 'PRICE_FILTER',
    //       minPrice: '0.00000001',
    //       tickSize: '0.00000001'
    //     },
    //     {
    //       avgPriceMins: 5,
    //       multiplierDown: '0.2',
    //       multiplierUp: '5',
    //       filterType: 'PERCENT_PRICE'
    //     },
    //     {
    //       stepSize: '1.00000000',
    //       filterType: 'LOT_SIZE',
    //       maxQty: '90000000.00000000',
    //       minQty: '1.00000000'
    //     },
    //     {
    //       avgPriceMins: 5,
    //       filterType: 'MIN_NOTIONAL',
    //       applyToMarket: true,
    //       minNotional: '0.00010000'
    //     },
    //     { filterType: 'ICEBERG_PARTS', limit: 10 },
    //     {
    //       stepSize: '0.00000000',
    //       filterType: 'MARKET_LOT_SIZE',
    //       maxQty: '18995670.44513889',
    //       minQty: '0.00000000'
    //     },
    //     { filterType: 'MAX_NUM_ORDERS', maxNumOrders: 200 },
    //     { filterType: 'MAX_NUM_ALGO_ORDERS', maxNumAlgoOrders: 5 }
    //   ],
    //   permissions: [ 'SPOT' ],
    //   times: {
    //     createdAt: '2020-08-16T17:51:18.431Z',
    //     updatedAt: '2020-08-16T17:51:18.431Z'
    //   }
    // } as ExchangeInfoSymbol;
    
    await this.tradeData.getExchangeInfo();
    
    this.tradeData.logBuy(
      {
        "transaction": {
          "pk": "transaction#54558dc0-5fd6-4ef8-933f-227e408056b4",
          "sk": "createdAt#2020-08-16T18:55:37.708Z",
          "sk2": "buy#createdAt#2020-08-16T18:55:37.708Z",
          "sk3": "buy#completed#createdAt#2020-08-16T18:55:37.708Z",
          "entity": "transaction",
          "request": {
            "symbol": "SANDBTC",
            "side": "BUY",
            "quoteOrderQty": 0.0001,
            "type": "MARKET",
            "timestamp": 1597604137351,
            "recvWindow": 10000
          },
          "response": {
            "symbol": "SANDBTC",
            "orderId": 920707,
            "orderListId": -1,
            "clientOrderId": "h12urqPnjbrnFoSMojIGO2",
            "transactTime": 1597604137586,
            "price": "0.00000000",
            "origQty": "19.00000000",
            "executedQty": "19.00000000",
            "cummulativeQuoteQty": "0.00009538",
            "status": "FILLED",
            "timeInForce": "GTC",
            "type": "MARKET",
            "side": "BUY",
            "fills": [
              {
                "price": "0.00000502",
                "qty": "19.00000000",
                "commission": "0.00003580",
                "commissionAsset": "BNB",
                "tradeId": 246058
              }
            ]
          },
          "symbol": "SANDBTC",
          "base": "SAND",
          "quote": "BTC",
          "completed": true,
          "times": {
            "createdAt": "2020-08-16T18:55:37.708Z"
          }
        },
        "success": true
      }
    );
    
    this.tradeData.updatePrice(0.00000480);

    console.log(this.tradeData.getSellQuantity())

    console.log(this.tradeData)

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
      }
    }
  }
  
  private static updateState(state: BotState) {
    this.state = state;
  }
  
  static async buyCurrency(quantity: number) {
    return await new Promise((resolve: any, reject: any): void => {
      const postData = {
        symbol: this.tradeData.symbol,
        base: this.tradeData.base,
        quote: this.tradeData.quote,
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
  }
  
  static async sellCurrency() {
    return await new Promise((resolve: any, reject: any): void => {
      const postData = {
        symbol: this.tradeData.symbol,
        base: this.tradeData.base,
        quote: this.tradeData.quote,
        quantity: this.tradeData.getSellQuantity(),
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
  }
}