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
class TraderBot {
    static watchPriceChanges(symbol) {
        console.log('Trader Bot opening connection to Binance');
        this.ws = new isomorphic_ws_1.default(settings_1.BinanceWS);
        this.tradeData = new symbol_trader_data_1.SymbolTraderData(symbol);
        const data = {
            method: 'SUBSCRIBE',
            params: [`${this.tradeData.lowercaseSymbol}@bookTicker`],
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
        this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.result === null)
                return;
            this.currentPrice = data.a;
        };
    }
    static stop() {
        console.log('Trader Bot closing connection to Binance');
        this.ws.close();
    }
    static updatePrice() {
        this.tradeData.updatePrice(this.currentPrice);
    }
    static async buyCurrency(symbol, base, quote, quantity) {
        const response = await new Promise((resolve, reject) => {
            const postData = {
                symbol,
                base,
                quote,
                quantity,
                isTest: true
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
                isTest: true
            };
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
