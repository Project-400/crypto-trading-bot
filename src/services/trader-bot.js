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
            const qty = 0.0002;
            const buy = await this.buyCurrency(this.tradeData.symbol, this.tradeData.base, this.tradeData.quote, qty);
            this.updateState(BotState.TRADING);
            if (buy.success && buy.transaction) {
                this.tradeData.logBuy(buy);
                this.currentPrice = this.tradeData.currentPrice;
            }
        }
        if (this.state === BotState.TRADING && this.tradeData.state === symbol_trader_data_1.PositionState.SELL) {
            console.log('SELL SELL SELL');
            const sell = await this.sellCurrency(this.tradeData.symbol, this.tradeData.base, this.tradeData.quote, this.tradeData.baseQty);
            this.updateState(BotState.PAUSED);
            if (sell.success && sell.transaction) {
                this.tradeData.logSell(sell);
                console.log(this.tradeData.quoteQty);
                console.log(this.tradeData.baseQty);
                console.log(this.tradeData.baseQty);
                console.log(this.tradeData.commissions);
            }
        }
    }
    static updateState(state) {
        this.state = state;
    }
    static async buyCurrency(symbol, base, quote, quantity) {
        const response = await new Promise((resolve, reject) => {
            const postData = {
                symbol,
                base,
                quote,
                quantity,
                isTest: false
            };
            axios_1.default.post('http://localhost:3001/transactions/buy', postData)
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
        return response;
    }
    static async sellCurrency(symbol, base, quote, quantity) {
        const response = await new Promise((resolve, reject) => {
            const postData = {
                symbol,
                base,
                quote,
                quantity,
                isTest: false
            };
            console.log('SELLING: ');
            console.log(postData);
            axios_1.default.post('http://localhost:3001/transactions/sell', postData)
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
        return response;
    }
}
exports.TraderBot = TraderBot;
TraderBot.currentPrice = 0;
TraderBot.state = BotState.WAITING;
