import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { SymbolPriceData } from '../models/symbol-price-data';

export class MarketBot {

  static ws: WebSocket;
  static prices: { [s: string]: number } = { };
  static symbols: { [s: string]: SymbolPriceData } = { };
  static batches: number = 0;
  static interval: NodeJS.Timeout;
  static inStartup: boolean = true;
  static checks: number = 0;

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
      console.log(`Starting up.. Gathering Data for 60 seconds.`)

      this.ws.send(JSON.stringify(data));
      
      this.interval = setInterval(() => {
        this.updatePrices();
        this.checks++;
        
        if (!this.inStartup) {
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
        } else {
          if (this.checks >= 6) this.inStartup = false;
          console.log(`Starting up.. Gathering Data for ${60 - (this.checks * 10)} seconds.`)
        }
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

    clearInterval(this.interval);
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
        !this.isLeveraged(symbol.symbol) &&
        this.isMainQuote(symbol.symbol) &&
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
  
  private static isLeveraged(symbol: string): boolean {
    return symbol.includes('UP') || symbol.includes('DOWN');
  }
  
  private static isMainQuote(symbol: string): boolean {
    return symbol.endsWith('BTC') || symbol.endsWith('ETH') || symbol.endsWith('USDT');
  }
  
}
