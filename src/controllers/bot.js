"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.trade = exports.stopBot = exports.startBot = void 0;
const market_bot_1 = require("../services/market-bot");
const trader_bot_1 = require("../services/trader-bot");
const websocket_1 = require("../websocket/websocket");
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
