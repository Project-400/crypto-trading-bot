"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.BinanceWS = process.env.BINANCE_WS;
exports.BinanceAPI = process.env.BINANCE_API;
exports.CryptoApiUrl = process.env.CRYPTO_API_URL_DEV;
