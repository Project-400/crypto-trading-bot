"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTraderData = void 0;
const common_types_1 = require("@crypto-tracker/common-types");
const crypto_api_1 = require("../api/crypto-api");
class SymbolTraderData {
    constructor(symbol, base, quote) {
        this.baseQty = 0;
        this.quoteQty = 0;
        this.profit = 0;
        this.startPrice = 0;
        this.currentPrice = 0;
        this.priceDifference = 0;
        this.percentageDifference = 0;
        this.commissions = [];
        this.state = common_types_1.PositionState.BUY;
        this.baseMinQty = 0;
        this.baseStepSize = 0;
        this.times = {
            createdAt: '',
            finishedAt: ''
        };
        this.updatePrice = (price) => {
            if (this.currentPrice)
                this.calculatePriceChanges(price);
            else
                this.currentPrice = price;
            if (this.percentageDifference < -1)
                this.state = common_types_1.PositionState.SELL;
            else if (this.percentageDifference > 2)
                this.state = common_types_1.PositionState.SELL;
            else
                this.state = common_types_1.PositionState.HOLD;
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
                this.state = common_types_1.PositionState.HOLD;
            }
        };
        this.logSell = (sell) => {
            const transaction = sell.transaction;
            if (transaction.response && transaction.response.fills) {
                const commission = this.logCommissions(transaction.response.fills);
                this.baseQty -= transaction.response.executedQty;
                this.quoteQty += transaction.response.cummulativeQuoteQty - commission;
                this.state = common_types_1.PositionState.SOLD;
            }
        };
        this.logCommissions = (fills) => {
            this.commissions.push(...fills);
            let total = 0;
            fills.map((c) => total += c.commission);
            return total;
        };
        this.logPrice = (fills) => {
            let total = 0;
            fills.map((c) => total += c.price);
            const avgPrice = total / fills.length;
            this.startPrice = avgPrice;
            this.currentPrice = avgPrice;
        };
        this.getExchangeInfo = async () => {
            const response = await crypto_api_1.CryptoApi.get(`/exchange-info/single/${this.symbol}/${this.quote}`);
            if (response.success)
                this.exchangeInfo = response.info;
            console.log(this.exchangeInfo);
            if (!this.exchangeInfo)
                console.error(`No exchange info for ${this.symbol}`);
            const lotSizeFilter = this.exchangeInfo?.filters.find((f) => f.filterType === 'LOT_SIZE');
            if (lotSizeFilter) {
                console.log(`${this.symbol} has a step size limit of ${lotSizeFilter.stepSize}`);
                this.baseMinQty = lotSizeFilter.minQty;
                this.baseStepSize = lotSizeFilter.stepSize;
            }
        };
        this.getSellQuantity = () => {
            if (this.baseStepSize) {
                const trim = this.baseQty % this.baseStepSize;
                return this.baseQty - trim;
            }
            return this.baseQty;
        };
        this.finish = () => {
            this.times.finishedAt = new Date().toISOString();
        };
        this.symbol = symbol;
        this.base = base;
        this.quote = quote;
        this.lowercaseSymbol = symbol.toLowerCase();
        this.times.createdAt = new Date().toISOString();
    }
}
exports.SymbolTraderData = SymbolTraderData;
