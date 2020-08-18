"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const settings_1 = require("../settings");
const symbol_price_data_1 = require("../models/symbol-price-data");
class MarketBot {
    static start() {
        console.log('Opening Connection to Binance WebSocket');
        this.ws = new isomorphic_ws_1.default(settings_1.BinanceWS);
        // this.symbols['ASTBTC'] = new SymbolPriceData('ASTBTC', 0);
        const data = {
            method: 'SUBSCRIBE',
            params: ['!bookTicker'],
            id: 1
        };
        this.ws.onopen = () => {
            console.log('Connected to Binance WebSocket');
            console.log(`Starting up.. Gathering Data for 60 seconds.`);
            this.ws.send(JSON.stringify(data));
            this.interval = setInterval(() => {
                this.updatePrices();
                this.checks++;
                if (!this.inStartup) {
                    this.evaluateChanges();
                }
                else {
                    if (this.checks >= 6)
                        this.inStartup = false;
                    console.log(`Starting up.. Gathering Data for ${60 - (this.checks * 10)} seconds.`);
                }
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
        clearInterval(this.interval);
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
    static evaluateChanges() {
        const allSymbols = Object.values(this.symbols);
        const filteredSymbols = allSymbols.filter((s) => {
            return !this.isLeveraged(s.symbol) &&
                !this.isTinyCurrency(s.symbol, s.prices.now - s.prices.sixtySeconds) &&
                this.isMainQuote(s.symbol);
        });
        console.log('------------------------------');
        console.log('BEST PERFORMERS');
        const climber = this.findBestClimber(filteredSymbols);
        const highestGainer = this.findHighestGainer(filteredSymbols);
        const avgGainer = this.findHighestAverageGainer(filteredSymbols);
        const leaper = this.findHighestRecentLeaper(filteredSymbols);
        if (climber) {
            console.log(`************* CLIMBER **************`);
            console.log(`----------- ${climber?.symbol} ---------------`);
            console.log(`----------- +${climber?.pricePercentageChanges.sixtySeconds}% ---------------`);
        }
        else {
            console.log(`----------- NO CLIMBER ---------------`);
        }
        if (highestGainer) {
            console.log(`************* HIGHEST GAINER **************`);
            console.log(`----------- ${highestGainer?.symbol} ---------------`);
            console.log(`----------- +${Math.max(...Object.values(highestGainer.pricePercentageChanges))}% ---------------`);
        }
        else {
            console.log(`----------- NO HIGHEST GAINER ---------------`);
        }
        if (avgGainer) {
            console.log(`************* AVERAGE GAINER **************`);
            console.log(`----------- ${avgGainer?.symbol} ---------------`);
            console.log(`----------- +${(avgGainer.pricePercentageChanges.now +
                avgGainer.pricePercentageChanges.tenSeconds +
                avgGainer.pricePercentageChanges.twentySeconds +
                avgGainer.pricePercentageChanges.thirtySeconds +
                avgGainer.pricePercentageChanges.fortySeconds +
                avgGainer.pricePercentageChanges.sixtySeconds) / 6}% ---------------`);
        }
        else {
            console.log(`----------- NO AVERAGE GAINER ---------------`);
        }
        if (leaper) {
            console.log(`************* LEAPER **************`);
            console.log(`----------- ${leaper?.symbol} ---------------`);
            console.log(`----------- +${leaper.pricePercentageChanges.now}% ---------------`);
        }
        else {
            console.log(`----------- NO LEAPER ---------------`);
        }
    }
    static findBestClimber(symbols) {
        let best = null;
        symbols.map((symbol) => {
            if (!best)
                return best = symbol;
            if (symbol.pricePercentageChanges.sixtySeconds > best.pricePercentageChanges.sixtySeconds &&
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
    static findHighestGainer(symbols) {
        let best = null;
        let highestGain = 0;
        symbols.map((symbol) => {
            if (!best)
                return best = symbol;
            if (symbol.pricePercentageChanges.now > highestGain ||
                symbol.pricePercentageChanges.tenSeconds > highestGain ||
                symbol.pricePercentageChanges.twentySeconds > highestGain ||
                symbol.pricePercentageChanges.thirtySeconds > highestGain ||
                symbol.pricePercentageChanges.fortySeconds > highestGain ||
                symbol.pricePercentageChanges.sixtySeconds > highestGain) {
                best = symbol;
                highestGain = Math.max(...Object.values(symbol.pricePercentageChanges));
            }
        });
        return best;
    }
    static findHighestAverageGainer(symbols) {
        let best = null;
        let highestAvg = 0;
        symbols.map((symbol) => {
            if (!best)
                return best = symbol;
            const avg = (symbol.pricePercentageChanges.now +
                symbol.pricePercentageChanges.tenSeconds +
                symbol.pricePercentageChanges.twentySeconds +
                symbol.pricePercentageChanges.thirtySeconds +
                symbol.pricePercentageChanges.fortySeconds +
                symbol.pricePercentageChanges.sixtySeconds) / 6;
            if (avg > highestAvg) {
                best = symbol;
                highestAvg = avg;
            }
        });
        return best;
    }
    static findHighestRecentLeaper(symbols) {
        let best = null;
        symbols.map((symbol) => {
            if (!best)
                return best = symbol;
            if (symbol.pricePercentageChanges.now > best.pricePercentageChanges.now) {
                best = symbol;
            }
        });
        return best;
    }
    static isLeveraged(symbol) {
        return symbol.includes('UP') || symbol.includes('DOWN');
    }
    static isTinyCurrency(symbol, priceChange) {
        if (symbol.endsWith('BTC') && priceChange < 0.00000005)
            return true;
        if (symbol.endsWith('ETH') && priceChange < 0.0000015)
            return true;
        if (symbol.endsWith('USDT') && priceChange < 0.0006)
            return true;
        return false;
    }
    static isMainQuote(symbol) {
        return symbol.endsWith('BTC') || symbol.endsWith('ETH') || symbol.endsWith('USDT');
    }
}
exports.MarketBot = MarketBot;
MarketBot.prices = {};
MarketBot.symbols = {};
MarketBot.batches = 0;
MarketBot.inStartup = true;
MarketBot.checks = 0;
