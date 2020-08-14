import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BinanceWS } from '../settings';

export class Socket {

  static ws: WebSocket;

  static start() {
    console.log('Opening Connection to Binance WebSocket')
    Socket.ws = new WebSocket(BinanceWS);
    
    let price: number = 0;

    const data = {
      method: 'SUBSCRIBE',
      params: [ 'algobtc@bookTicker' ],
      id: 1
    }

    Socket.ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      
      this.ws.send(JSON.stringify(data));
    };

    Socket.ws.onclose = () => {
      console.log('Connection to Binance Disconnected');
    };

    Socket.ws.onmessage = (msg: MessageEvent) => {
      const updatedPrice = JSON.parse(msg.data as string)['a'];
      // if (updatedPrice > price) console.log("\x1b[41m", updatedPrice);
      // if (updatedPrice < price) console.log("\x1b[42m", updatedPrice);
      // else console.log(updatedPrice);
      // price = updatedPrice;
      console.log(updatedPrice)
    };
  }
  
  static stop() {
    console.log('Closing Connection to Binance WebSocket')

    Socket.ws.close();
  }
  
}
