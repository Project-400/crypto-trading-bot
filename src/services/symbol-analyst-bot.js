"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const binance_api_1 = require("../api/binance-api");
class SymbolAnalystBot {
    constructor(symbol, type) {
        this.decision = Decision.GATHERING_DATA;
        this.klineData = [];
        this.symbol = symbol;
        this.performanceType = type;
        this.fetchKlineData().then(this.evaluate);
    }
    async fetchKlineData() {
        const klineData = await binance_api_1.BinanceApi.getKlineData(this.symbol.symbol);
        this.klineData = klineData.map((point) => ({
            openTime: point[0],
            open: point[1],
            high: point[2],
            low: point[3],
            close: point[4],
            volume: point[5],
            closeTime: point[6],
            quoteAssetVolume: point[7],
            numberOfTrades: point[8],
            takerBuyBaseAssetVolume: point[9],
            takerBuyQuoteAssetVolume: point[10]
        }));
    }
    evaluate() {
        this.updateDecision(Decision.EVALUATING);
        // To Do
    }
    updateDecision(decision) {
        this.decision = decision;
    }
}
var SymbolPerformanceType;
(function (SymbolPerformanceType) {
    SymbolPerformanceType["HIGHEST_GAINER"] = "HIGHEST_GAINER";
    SymbolPerformanceType["AVERAGE_GAINER"] = "AVERAGE_GAINER";
    SymbolPerformanceType["LEAPER"] = "LEAPER";
    SymbolPerformanceType["CLIMBER"] = "CLIMBER";
})(SymbolPerformanceType = exports.SymbolPerformanceType || (exports.SymbolPerformanceType = {}));
var Decision;
(function (Decision) {
    Decision["GATHERING_DATA"] = "GATHERING_DATA";
    Decision["EVALUATING"] = "EVALUATING";
    Decision["WAIT"] = "WAIT";
    Decision["BUY"] = "BUY";
    Decision["ABANDON"] = "ABANDON";
})(Decision = exports.Decision || (exports.Decision = {}));
