import WebSocket from 'isomorphic-ws';
import { BinanceWS } from "../settings";

export class Socket {

  static ws;

  static start() {
    console.log('Opening Connection to Binance WebSocket')
    Socket.ws = new WebSocket(BinanceWS);

    const data = {
      method: 'SUBSCRIBE',
      params: [ '!bookTicker' ],
      id: 1
    }

    Socket.ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      this.ws.send(JSON.stringify(data));
    };

    Socket.ws.onclose = () => {
      console.log('Connection to Binance Disconnected');
    };

    Socket.ws.onmessage = (msg) => {
      console.log(msg.data);
    };
  }
  
  static stop() {
    console.log('Closing Connection to Binance WebSocket')

    Socket.ws.close();
  }
  
}
