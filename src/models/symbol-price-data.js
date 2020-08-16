"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        this.pricePercentageChanges = {
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
            this.pricePercentageChanges = {
                now: 0,
                tenSeconds: this.calculatePercentageChange(price, this.prices.tenSeconds),
                twentySeconds: this.calculatePercentageChange(price, this.prices.twentySeconds),
                thirtySeconds: this.calculatePercentageChange(price, this.prices.thirtySeconds),
                fortySeconds: this.calculatePercentageChange(price, this.prices.fortySeconds),
                fiftySeconds: this.calculatePercentageChange(price, this.prices.fiftySeconds),
                sixtySeconds: this.calculatePercentageChange(price, this.prices.sixtySeconds)
            };
        };
        this.calculatePercentageChange = (currentPrice, previousPrice) => {
            if (!previousPrice)
                return 0;
            return ((currentPrice - previousPrice) / previousPrice) * 100;
        };
        this.symbol = symbol;
        this.prices.now = price;
    }
}
exports.SymbolPriceData = SymbolPriceData;
