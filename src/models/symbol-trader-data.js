"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTraderData = void 0;
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
