"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const market_bot_1 = require("../services/market-bot");
const trader_bot_1 = require("../services/trader-bot");
const websocket_1 = require("../websocket/websocket");
const symbol_analyst_bot_1 = require("../services/symbol-analyst-bot");
const symbol_price_data_1 = require("../models/symbol-price-data");
exports.startBot = (req, res) => {
    market_bot_1.MarketBot.start();
    res.status(200).json({ message: 'Started Bot' });
};
exports.stopBot = (req, res) => {
    market_bot_1.MarketBot.stop();
    res.status(200).json({ message: 'Stopped Bot' });
};
exports.trade = async (req, res) => {
    const response = await trader_bot_1.TraderBot.watchPriceChanges('FETBTC', 'FET', 'BTC');
    res.status(200).json({ response });
};
exports.test = async (req, res) => {
    setTimeout(() => {
        websocket_1.WebsocketProducer.sendMessage('HELLO THERE');
    }, 5000);
    res.status(200).json({ msg: 'Sending socket message in 5 seconds' });
};
exports.analystBot = async (req, res) => {
    const bot = new symbol_analyst_bot_1.SymbolAnalystBot(new symbol_price_data_1.SymbolPriceData('FETUSDT', 0.18135), symbol_analyst_bot_1.SymbolPerformanceType.LEAPER);
    bot.start();
    res.status(200).json({ bot });
};
