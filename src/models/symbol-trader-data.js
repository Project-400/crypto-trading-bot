"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionState = exports.SymbolTraderData = void 0;
class SymbolTraderData {
    constructor(symbol, base, quote) {
        this.prices = [];
        this.baseQty = 0;
        this.quoteQty = 0;
        // public quoteQtyUsed: number = 0;
        // public quoteQtyReceived: number = 0;
        this.profit = 0;
        this.startPrice = 0;
        this.currentPrice = 0;
        this.priceDifference = 0;
        this.percentageDifference = 0;
        this.commissions = [];
        this.state = PositionState.BUY;
        this.updatePrice = (price) => {
            // this.prices.push(price);
            if (this.currentPrice)
                this.calculatePriceChanges(price);
            else
                this.currentPrice = price;
            if (this.percentageDifference < -0.4)
                this.state = PositionState.SELL;
            else if (this.percentageDifference > 1)
                this.state = PositionState.SELL;
            else
                this.state = PositionState.HOLD;
        };
        this.calculatePriceChanges = (newPrice) => {
            this.priceDifference = this.currentPrice - newPrice;
            const tempNewPrice = newPrice * 1000;
            const tempStartPrice = this.startPrice * 1000;
            const tempPriceDifference = tempNewPrice - tempStartPrice;
            this.currentPrice = newPrice;
            if (tempNewPrice !== tempStartPrice)
                this.percentageDifference = (tempPriceDifference / tempStartPrice) * 100;
            else
                this.percentageDifference = 0;
        };
        this.logBuy = (buy) => {
            const transaction = buy.transaction;
            if (transaction.response && transaction.response.fills) {
                const commission = this.logCommissions(transaction.response.fills);
                this.logPrice(transaction.response.fills);
                this.baseQty += transaction.response.executedQty - commission;
                this.quoteQty -= transaction.response.cummulativeQuoteQty;
                this.state = PositionState.HOLD;
            }
        };
        this.logSell = (sell) => {
            const transaction = sell.transaction;
            if (transaction.response && transaction.response.fills) {
                const commission = this.logCommissions(transaction.response.fills);
                this.baseQty -= transaction.response.executedQty;
                this.quoteQty += transaction.response.cummulativeQuoteQty - commission;
                this.state = PositionState.SOLD;
            }
        };
        this.logCommissions = (fills) => {
            this.commissions.push(...fills);
            let total = 0;
            fills.map((c) => total += c.commission);
            return total;
        };
        this.logPrice = (fills) => {
            // let total: number = 0;
            // fills.map((c: any) => total += c.price);
            const avgPrice = fills[0].price;
            this.startPrice = avgPrice;
            this.currentPrice = avgPrice;
        };
        this.symbol = symbol;
        this.base = base;
        this.quote = quote;
        this.lowercaseSymbol = symbol.toLowerCase();
    }
}
exports.SymbolTraderData = SymbolTraderData;
var PositionState;
(function (PositionState) {
    PositionState["BUY"] = "BUY";
    PositionState["HOLD"] = "HOLD";
    PositionState["SELL"] = "SELL";
    PositionState["SOLD"] = "SOLD";
})(PositionState = exports.PositionState || (exports.PositionState = {}));
