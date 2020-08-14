"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = void 0;
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const settings_1 = require("../settings");
class Socket {
    static start() {
        console.log('Opening Connection to Binance WebSocket');
        Socket.ws = new isomorphic_ws_1.default(settings_1.BinanceWS);
        let price = 0;
        const data = {
            method: 'SUBSCRIBE',
            params: ['algobtc@bookTicker'],
            id: 1
        };
        Socket.ws.onopen = () => {
            console.log('Connected to Binance WebSocket');
            this.ws.send(JSON.stringify(data));
        };
        Socket.ws.onclose = () => {
            console.log('Connection to Binance Disconnected');
        };
        Socket.ws.onmessage = (msg) => {
            const updatedPrice = JSON.parse(msg.data)['a'];
            // if (updatedPrice > price) console.log("\x1b[41m", updatedPrice);
            // if (updatedPrice < price) console.log("\x1b[42m", updatedPrice);
            // else console.log(updatedPrice);
            // price = updatedPrice;
            console.log(updatedPrice);
        };
    }
    static stop() {
        console.log('Closing Connection to Binance WebSocket');
        Socket.ws.close();
    }
}
exports.Socket = Socket;
