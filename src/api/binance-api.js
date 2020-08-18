"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = require("../settings");
const http_1 = require("./http");
class BinanceApi {
    static async getKlineData(symbol) {
        return await http_1.HTTP.get(`${settings_1.BinanceAPI}/api/v3/klines?symbol=${symbol}&interval=1m`);
    }
}
exports.BinanceApi = BinanceApi;
