"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketProducer = void 0;
const http_1 = __importDefault(require("http"));
const WebSocket = __importStar(require("ws"));
class WebsocketProducer {
    static setup(app) {
        WebsocketProducer.server = http_1.default.createServer(app);
        WebsocketProducer.wss = new WebSocket.Server({ server: WebsocketProducer.server });
        WebsocketProducer.wss.on('connection', (ws) => {
            WebsocketProducer.webS = ws;
            ws.on('message', (message) => {
                console.log('received: %s', message);
                ws.send(`Hello, you sent -> ${message}`);
            });
            ws.send('Hi there, I am a WebSocket server');
        });
        WebsocketProducer.wss.on('close', (ws) => {
            console.log('Connection closed');
        });
        WebsocketProducer.server.listen(process.env.PORT || 8999, () => {
            // @ts-ignore
            if (WebsocketProducer.server.address() && WebsocketProducer.server.address().port)
                console.log(`Server started on port ${WebsocketProducer.server.address().port} :)`);
            else
                console.log('Server not started');
        });
    }
    static sendMessage(msg) {
        WebsocketProducer.webS.send(msg);
    }
}
exports.WebsocketProducer = WebsocketProducer;
