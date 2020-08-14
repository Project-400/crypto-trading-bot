"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopBot = exports.startBot = void 0;
const websocket_1 = require("../websocket");
exports.startBot = (req, res) => {
    websocket_1.Socket.start();
    res.status(200).json({ message: 'Started Bot' });
};
exports.stopBot = (req, res) => {
    websocket_1.Socket.stop();
    res.status(200).json({ message: 'Stopped Bot' });
};
