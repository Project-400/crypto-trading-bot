"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellCurrency = exports.stopBot = exports.startBot = void 0;
const market_bot_1 = require("../services/market-bot");
const trader_bot_1 = require("../services/trader-bot");
exports.startBot = (req, res) => {
    market_bot_1.MarketBot.start();
    res.status(200).json({ message: 'Started Bot' });
};
exports.stopBot = (req, res) => {
    market_bot_1.MarketBot.stop();
    res.status(200).json({ message: 'Stopped Bot' });
};
exports.sellCurrency = async (req, res) => {
    const response = await trader_bot_1.TraderBot.sellCurrency('ASTBTC', 'AST', 'BTC', 0.0001);
    res.status(200).json({ response });
};
