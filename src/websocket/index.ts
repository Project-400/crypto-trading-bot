import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { SymbolPriceData } from '../models/symbol-price-data';

export class Socket {

  static ws: WebSocket;
  static prices: { [s: string]: number } = { };
  static symbols: { [s: string]: SymbolPriceData } = { };
  static batches: number = 0;

  static start() {
    console.log('Opening Connection to Binance WebSocket')
    this.ws = new WebSocket(BinanceWS);
    
    this.symbols['BTCUSDT'] = new SymbolPriceData('BTCUSDT', 0);
    
    const data = {
      method: 'SUBSCRIBE',
      params: [ '!bookTicker' ],
      id: 1
    }

    this.ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      
      this.ws.send(JSON.stringify(data));
      
      const interval = setInterval(() => {
        // console.log(Socket.prices);
        
        this.updatePrices();
        this.batches++;

        console.log('Updated Prices');

        if (this.batches === 7) {
          this.ws.close();

          Object.keys(this.symbols).map((s: string) => {
            const symbol: SymbolPriceData = this.symbols[s];
            console.log(symbol);
          });

          console.log(this.symbols['BTCUSDT']);

          console.log(Object.keys(this.symbols).length)

          clearInterval(interval);
        }
      }, 10000);
    };

    this.ws.onclose = () => {
      console.log('Connection to Binance Disconnected');
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      // console.log(msg.data);
      const data = JSON.parse(msg.data as string);
      
      if (data.result === null) return;
      
      // if (data.s.startsWith('A')) {
      this.prices[data.s] = data.a;
      // }
      // const updatedPrice = JSON.parse(msg.data as string)['a'];
      // if (updatedPrice > price) console.log("\x1b[41m", updatedPrice);
      // if (updatedPrice < price) console.log("\x1b[42m", updatedPrice);
      // else console.log(updatedPrice);
      // price = updatedPrice;
      // console.log(updatedPrice)
    };
  }
  
  static stop() {
    console.log('Closing Connection to Binance WebSocket')

    this.ws.close();
  }
  
  private static updatePrices() {
    console.log(this.prices);
    Object.keys(this.prices).map((symbol: string) => {
      const price: number = this.prices[symbol];
      const existingSymbol: SymbolPriceData = this.symbols[symbol];
      if (existingSymbol) existingSymbol.updatePrice(price);
      else this.symbols[symbol] = new SymbolPriceData(symbol, price);
    });
  }
  
}
