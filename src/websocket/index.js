"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = void 0;
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const settings_1 = require("../settings");
const symbol_price_data_1 = require("../models/symbol-price-data");
class Socket {
    static start() {
        console.log('Opening Connection to Binance WebSocket');
        this.ws = new isomorphic_ws_1.default(settings_1.BinanceWS);
        this.symbols['ASTBTC'] = new symbol_price_data_1.SymbolPriceData('ASTBTC', 0);
        const data = {
            method: 'SUBSCRIBE',
            params: ['!bookTicker'],
            id: 1
        };
        this.ws.onopen = () => {
            console.log('Connected to Binance WebSocket');
            this.ws.send(JSON.stringify(data));
            const interval = setInterval(() => {
                this.updatePrices();
                // this.batches++;
                // console.log('Updated Prices');
                // if (this.batches === 7) {
                // this.ws.close();
                // Object.keys(this.symbols).map((s: string) => {
                //   const symbol: SymbolPriceData = this.symbols[s];
                //   console.log(symbol);
                // });
                // console.log(this.symbols['ASTBTC']);
                // console.log(Object.keys(this.symbols).length);
                console.log('------------------------------');
                console.log('BEST PERFORMER');
                const best = this.findBestPerformer();
                console.log(best);
                console.log('*******************');
                if (best) {
                    console.log(`----------- ${best?.symbol} ---------------`);
                    console.log(`----------- +${best?.pricePercentageChanges.sixtySeconds}% ---------------`);
                }
                else {
                    console.log(`----------- NONE ---------------`);
                }
                // clearInterval(interval);
                // }
            }, 10000);
        };
        this.ws.onclose = () => {
            console.log('Connection to Binance Disconnected');
        };
        this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.result === null)
                return;
            this.prices[data.s] = data.a;
        };
    }
    static stop() {
        console.log('Closing Connection to Binance WebSocket');
        this.ws.close();
    }
    static updatePrices() {
        Object.keys(this.prices).map((symbol) => {
            const price = this.prices[symbol];
            const existingSymbol = this.symbols[symbol];
            if (existingSymbol)
                existingSymbol.updatePrice(price);
            else
                this.symbols[symbol] = new symbol_price_data_1.SymbolPriceData(symbol, price);
        });
    }
    static findBestPerformer() {
        let best = null;
        Object.keys(this.symbols).map((s) => {
            const symbol = this.symbols[s];
            if (!best)
                return best = symbol;
            if (symbol.prices.now - symbol.prices.sixtySeconds > 0.00000005 &&
                symbol.pricePercentageChanges.sixtySeconds > best.pricePercentageChanges.sixtySeconds &&
                symbol.prices.now >= symbol.prices.tenSeconds &&
                symbol.prices.tenSeconds >= symbol.prices.twentySeconds &&
                symbol.prices.twentySeconds >= symbol.prices.thirtySeconds &&
                symbol.prices.thirtySeconds >= symbol.prices.fortySeconds &&
                symbol.prices.fortySeconds >= symbol.prices.fiftySeconds &&
                symbol.prices.fiftySeconds >= symbol.prices.sixtySeconds)
                best = symbol;
        });
        return best;
    }
}
exports.Socket = Socket;
Socket.prices = {};
Socket.symbols = {};
Socket.batches = 0;
