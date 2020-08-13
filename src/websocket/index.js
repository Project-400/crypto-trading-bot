import WebSocket from 'isomorphic-ws';
import {BinanceWS} from "../settings";

export class Socket {
  
  static start() {
    console.log('Opening Connection to Binance WebSocket')

    const data = {
      method: 'SUBSCRIBE',
      params: [ '!bookTicker' ],
      id: 1
    }

    const ws = new WebSocket(BinanceWS);

    ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      ws.send(JSON.stringify(data));
    };

    ws.onclose = () => {
      console.log('disconnected');
    };

    ws.onmessage = (msg) => {
      console.log(msg.data);
    };
  }
  
}
