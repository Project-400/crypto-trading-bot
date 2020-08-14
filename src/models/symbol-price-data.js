"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolPriceData = void 0;
class SymbolPriceData {
    constructor(symbol, price) {
        this.prices = {
            now: 0,
            tenSeconds: 0,
            twentySeconds: 0,
            thirtySeconds: 0,
            fortySeconds: 0,
            fiftySeconds: 0,
            sixtySeconds: 0
        };
        this.updatePrice = (price) => {
            const currentPrices = this.prices;
            this.prices = {
                now: price,
                tenSeconds: currentPrices.now,
                twentySeconds: currentPrices.tenSeconds,
                thirtySeconds: currentPrices.twentySeconds,
                fortySeconds: currentPrices.thirtySeconds,
                fiftySeconds: currentPrices.fortySeconds,
                sixtySeconds: currentPrices.fiftySeconds
            };
        };
        this.symbol = symbol;
        this.prices.now = price;
    }
}
exports.SymbolPriceData = SymbolPriceData;
