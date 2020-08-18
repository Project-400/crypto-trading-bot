"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const settings_1 = require("../settings");
const symbol_trader_data_1 = require("../models/symbol-trader-data");
const common_types_1 = require("@crypto-tracker/common-types");
const crypto_api_1 = require("../api/crypto-api");
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
    static updateState(state) {
        this.state = state;
    }
    static async saveTradeData() {
        return await crypto_api_1.CryptoApi.post('/bots/trade/save', {
            tradeData: this.tradeData
        });
    }
    static async buyCurrency(quantity) {
        return await crypto_api_1.CryptoApi.post('/transactions/buy', {
            symbol: this.tradeData.symbol,
            base: this.tradeData.base,
            quote: this.tradeData.quote,
            quantity,
            isTest: false
        });
    }
    static async sellCurrency() {
        return await crypto_api_1.CryptoApi.post('/transactions/sell', {
            symbol: this.tradeData.symbol,
            base: this.tradeData.base,
            quote: this.tradeData.quote,
            quantity: this.tradeData.getSellQuantity(),
            isTest: false
        });
    }
}
exports.TraderBot = TraderBot;
TraderBot.currentPrice = 0;
TraderBot.state = BotState.WAITING;
