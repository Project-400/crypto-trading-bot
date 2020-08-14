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
    
    this.symbols['ASTBTC'] = new SymbolPriceData('ASTBTC', 0);
    
    const data = {
      method: 'SUBSCRIBE',
      params: [ '!bookTicker' ],
      id: 1
    }

    this.ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      
      this.ws.send(JSON.stringify(data));
      
      const interval = setInterval(() => {
        this.updatePrices();
        // this.batches++;

        // console.log('Updated Prices');

        // if (this.batches === 7) {
          // this.ws.close();

          // Object.keys(this.symbols).map((s: string) => {
          //   const symbol: SymbolPriceData = this.symbols[s];
          //   console.log(symbol);
          // });

          // console.log(this.symbols['ASTBTC']);
          // console.log(Object.keys(this.symbols).length);
        console.log('------------------------------');
        console.log('BEST PERFORMER');
        
        const best = this.findBestPerformer();

        console.log(best)
        console.log('*******************');
        
        if (best) {
          console.log(`----------- ${best?.symbol} ---------------`);
          console.log(`----------- +${best?.pricePercentageChanges.sixtySeconds}% ---------------`);
        } else {
          console.log(`----------- NONE ---------------`);
        }
        
        // clearInterval(interval);
        // }
      }, 10000);
    };

    this.ws.onclose = () => {
      console.log('Connection to Binance Disconnected');
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      const data = JSON.parse(msg.data as string);
      if (data.result === null) return;
      this.prices[data.s] = data.a;
    };
  }
  
  static stop() {
    console.log('Closing Connection to Binance WebSocket')

    this.ws.close();
  }
  
  private static updatePrices() {
    Object.keys(this.prices).map((symbol: string) => {
      const price: number = this.prices[symbol];
      const existingSymbol: SymbolPriceData = this.symbols[symbol];
      if (existingSymbol) existingSymbol.updatePrice(price);
      else this.symbols[symbol] = new SymbolPriceData(symbol, price);
    });
  }
  
  private static findBestPerformer(): SymbolPriceData | null {
    let best: SymbolPriceData | null = null;

    Object.keys(this.symbols).map((s: string) => {
      const symbol: SymbolPriceData = this.symbols[s];
      if (!best) return best = symbol;
      
      if (
        symbol.prices.now - symbol.prices.sixtySeconds > 0.00000005 &&
        symbol.pricePercentageChanges.sixtySeconds > best.pricePercentageChanges.sixtySeconds &&
        symbol.prices.now >= symbol.prices.tenSeconds &&
        symbol.prices.tenSeconds >= symbol.prices.twentySeconds &&
        symbol.prices.twentySeconds >= symbol.prices.thirtySeconds &&
        symbol.prices.thirtySeconds >= symbol.prices.fortySeconds &&
        symbol.prices.fortySeconds >= symbol.prices.fiftySeconds &&
        symbol.prices.fiftySeconds >= symbol.prices.sixtySeconds
      ) best = symbol;
    });
    
    return best;
  }
  
}
