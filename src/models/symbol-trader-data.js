"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SymbolTraderData {
    constructor(symbol) {
        this.prices = [];
        this.updatePrice = (price) => {
            this.prices.push(price);
        };
        this.symbol = symbol;
        this.lowercaseSymbol = symbol.toLowerCase();
    }
}
exports.SymbolTraderData = SymbolTraderData;
