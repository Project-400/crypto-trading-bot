"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
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
