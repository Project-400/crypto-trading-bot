"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraderBot = void 0;
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const settings_1 = require("../settings");
const symbol_trader_data_1 = require("../models/symbol-trader-data");
const axios_1 = __importDefault(require("axios"));
const common_types_1 = require("@crypto-tracker/common-types");
var BotState;
(function (BotState) {
    BotState["WAITING"] = "WAITING";
    BotState["TRADING"] = "TRADING";
    BotState["PAUSED"] = "PAUSED";
    BotState["FINISHED"] = "FINISHED";
})(BotState || (BotState = {}));
class TraderBot {
    static async watchPriceChanges(symbol, base, quote) {
        console.log('Trader Bot opening connection to Binance');
        this.ws = new isomorphic_ws_1.default(settings_1.BinanceWS);
        this.tradeData = new symbol_trader_data_1.SymbolTraderData(symbol, base, quote);
        await this.tradeData.getExchangeInfo();
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
        //
        // // await this.tradeData.getExchangeInfo();
        //
        // this.tradeData.logBuy(
        //   {
        //     "transaction": {
        //       "pk": "transaction#54558dc0-5fd6-4ef8-933f-227e408056b4",
        //       "sk": "createdAt#2020-08-16T18:55:37.708Z",
        //       "sk2": "buy#createdAt#2020-08-16T18:55:37.708Z",
        //       "sk3": "buy#completed#createdAt#2020-08-16T18:55:37.708Z",
        //       "entity": "transaction",
        //       "request": {
        //         "symbol": "SANDBTC",
        //         "side": "BUY",
        //         "quoteOrderQty": 0.0001,
        //         "type": "MARKET",
        //         "timestamp": 1597604137351,
        //         "recvWindow": 10000
        //       },
        //       "response": {
        //         "symbol": "SANDBTC",
        //         "orderId": 920707,
        //         "orderListId": -1,
        //         "clientOrderId": "h12urqPnjbrnFoSMojIGO2",
        //         "transactTime": 1597604137586,
        //         "price": "0.00000000",
        //         "origQty": "19.00000000",
        //         "executedQty": "19.00000000",
        //         "cummulativeQuoteQty": "0.00009538",
        //         "status": "FILLED",
        //         "timeInForce": "GTC",
        //         "type": "MARKET",
        //         "side": "BUY",
        //         "fills": [
        //           {
        //             "price": "0.00000502",
        //             "qty": "19.00000000",
        //             "commission": "0.00003580",
        //             "commissionAsset": "BNB",
        //             "tradeId": 246058
        //           }
        //         ]
        //       },
        //       "symbol": "SANDBTC",
        //       "base": "SAND",
        //       "quote": "BTC",
        //       "completed": true,
        //       "times": {
        //         "createdAt": "2020-08-16T18:55:37.708Z"
        //       }
        //     },
        //     "success": true
        //   }
        // );
        //
        // this.tradeData.updatePrice(0.00000480);
        // this.tradeData.updatePrice(0.00000478);
        // this.tradeData.finish();
        //
        // await this.saveTradeData();
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
        this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.result === null)
                return;
            this.currentPrice = data.a;
        };
        return { trading: true };
    }
    static stop() {
        console.log('Trader Bot closing connection to Binance');
        clearInterval(this.interval);
        this.ws.close();
    }
    static updatePrice() {
        this.tradeData.updatePrice(this.currentPrice);
    }
    static async makeDecision() {
        console.log('-------------------------------');
        console.log(`Price is: ${this.tradeData.currentPrice}`);
        console.log(`Price diff: ${this.tradeData.percentageDifference}%`);
        console.log(`The bot is: ${this.state}`);
        console.log(`Trade position state: ${this.tradeData.state}`);
        if (this.state === BotState.WAITING) {
            const qty = 0.0003;
            const buy = await this.buyCurrency(qty);
            this.updateState(BotState.TRADING);
            if (buy.success && buy.transaction) {
                this.tradeData.logBuy(buy);
                this.currentPrice = this.tradeData.currentPrice;
            }
        }
        if (this.state === BotState.TRADING && this.tradeData.state === common_types_1.PositionState.SELL) {
            console.log('SELL SELL SELL');
            const sell = await this.sellCurrency();
            this.updateState(BotState.PAUSED);
            if (sell.success && sell.transaction) {
                this.tradeData.logSell(sell);
                console.log(this.tradeData.quoteQty);
                console.log(this.tradeData.baseQty);
                console.log(this.tradeData.baseQty);
                console.log(this.tradeData.commissions);
                this.updateState(BotState.FINISHED); // TEMPORARY
            }
        }
        if (this.state === BotState.FINISHED) {
            this.tradeData.finish();
            await this.saveTradeData();
            this.stop();
        }
    }
    static async saveTradeData() {
        const response = await new Promise((resolve, reject) => {
            axios_1.default.post('https://w0sizekdyd.execute-api.eu-west-1.amazonaws.com/dev/bots/trade/save', { tradeData: this.tradeData })
                .then((res) => {
                if (res.status === 200)
                    resolve(res.data);
                else
                    reject(res);
            })
                .catch((error) => {
                console.error(error);
                reject(error);
            });
        });
        console.log(response);
    }
    static updateState(state) {
        this.state = state;
    }
    static async buyCurrency(quantity) {
        return await new Promise((resolve, reject) => {
            const postData = {
                symbol: this.tradeData.symbol,
                base: this.tradeData.base,
                quote: this.tradeData.quote,
                quantity,
                isTest: false
            };
            axios_1.default.post('https://w0sizekdyd.execute-api.eu-west-1.amazonaws.com/dev/transactions/buy', postData)
                .then((res) => {
                if (res.status === 200)
                    resolve(res.data);
                else
                    reject(res);
            })
                .catch((error) => {
                console.error(error);
                reject(error);
            });
        });
    }
    static async sellCurrency() {
        return await new Promise((resolve, reject) => {
            const postData = {
                symbol: this.tradeData.symbol,
                base: this.tradeData.base,
                quote: this.tradeData.quote,
                quantity: this.tradeData.getSellQuantity(),
                isTest: false
            };
            console.log('SELLING: ');
            console.log(postData);
            axios_1.default.post('https://w0sizekdyd.execute-api.eu-west-1.amazonaws.com/dev/transactions/sell', postData)
                .then((res) => {
                if (res.status === 200)
                    resolve(res.data);
                else
                    reject(res);
            })
                .catch((error) => {
                console.error(error);
                reject(error);
            });
        });
    }
}
exports.TraderBot = TraderBot;
TraderBot.currentPrice = 0;
TraderBot.state = BotState.WAITING;
