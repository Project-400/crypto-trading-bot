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
    
    // this.symbols['ASTBTC'] = new SymbolPriceData('ASTBTC', 0);
    
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
          this.evaluateChanges();
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
  
  private static evaluateChanges(): void {
    const allSymbols: SymbolPriceData[] = Object.values(this.symbols);
    const filteredSymbols: SymbolPriceData[] = allSymbols.filter((s: SymbolPriceData) => {
      return !this.isLeveraged(s.symbol) && 
        !this.isTinyCurrency(s.symbol, s.prices.now - s.prices.sixtySeconds) &&
        this.isMainQuote(s.symbol)
    });

    console.log('------------------------------');
    console.log('BEST PERFORMERS');

    const climber: SymbolPriceData | null = this.findBestClimber(filteredSymbols);
    const highestGainer: SymbolPriceData | null = this.findHighestGainer(filteredSymbols);
    const avgGainer: SymbolPriceData | null = this.findHighestAverageGainer(filteredSymbols);
    const leaper: SymbolPriceData | null = this.findHighestRecentLeaper(filteredSymbols);
    
    if (climber) {
      console.log(`************* CLIMBER **************`);
      console.log(`----------- ${climber?.symbol} ---------------`);
      console.log(`----------- +${climber?.pricePercentageChanges.sixtySeconds}% ---------------`);
    } else {
      console.log(`----------- NO CLIMBER ---------------`);
    }
    
    if (highestGainer) {
      console.log(`************* HIGHEST GAINER **************`);
      console.log(`----------- ${highestGainer?.symbol} ---------------`);
      console.log(`----------- +${Math.max(...Object.values(highestGainer.pricePercentageChanges))}% ---------------`);
    } else {
      console.log(`----------- NO HIGHEST GAINER ---------------`);
    }
    
    if (avgGainer) {
      console.log(`************* AVERAGE GAINER **************`);
      console.log(`----------- ${avgGainer?.symbol} ---------------`);
      console.log(`----------- +${(
        avgGainer.pricePercentageChanges.now +
        avgGainer.pricePercentageChanges.tenSeconds +
        avgGainer.pricePercentageChanges.twentySeconds +
        avgGainer.pricePercentageChanges.thirtySeconds +
        avgGainer.pricePercentageChanges.fortySeconds +
        avgGainer.pricePercentageChanges.sixtySeconds
      ) / 6}% ---------------`);
    } else {
      console.log(`----------- NO AVERAGE GAINER ---------------`);
    }

    if (leaper) {
      console.log(`************* LEAPER **************`);
      console.log(`----------- ${leaper?.symbol} ---------------`);
      console.log(`----------- +${leaper.pricePercentageChanges.now}% ---------------`);
    } else {
      console.log(`----------- NO LEAPER ---------------`);
    }

  }
  
  private static findBestClimber(symbols: SymbolPriceData[]): SymbolPriceData | null {
    let best: SymbolPriceData | null = null;

    symbols.map((symbol: SymbolPriceData) => {
      if (!best) return best = symbol;
      
      if (
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
  
  private static findHighestGainer(symbols: SymbolPriceData[]): SymbolPriceData | null {
    let best: SymbolPriceData | null = null;
    let highestGain: number = 0;

    symbols.map((symbol: SymbolPriceData) => {
      if (!best) return best = symbol;
      
      if (
        symbol.pricePercentageChanges.now > highestGain ||
        symbol.pricePercentageChanges.tenSeconds > highestGain ||
        symbol.pricePercentageChanges.twentySeconds > highestGain ||
        symbol.pricePercentageChanges.thirtySeconds > highestGain ||
        symbol.pricePercentageChanges.fortySeconds > highestGain ||
        symbol.pricePercentageChanges.sixtySeconds > highestGain
      ) {
        best = symbol;
        highestGain = Math.max(...Object.values(symbol.pricePercentageChanges));
      }
    });
    
    return best;
  }
  
  private static findHighestAverageGainer(symbols: SymbolPriceData[]): SymbolPriceData | null {
    let best: SymbolPriceData | null = null;
    let highestAvg: number = 0;

    symbols.map((symbol: SymbolPriceData) => {
      if (!best) return best = symbol;
      
      const avg: number = (
        symbol.pricePercentageChanges.now + 
        symbol.pricePercentageChanges.tenSeconds + 
        symbol.pricePercentageChanges.twentySeconds + 
        symbol.pricePercentageChanges.thirtySeconds + 
        symbol.pricePercentageChanges.fortySeconds + 
        symbol.pricePercentageChanges.sixtySeconds 
      ) / 6;
      
      if (avg > highestAvg) {
        best = symbol;
        highestAvg = avg;
      }
    });
    
    return best;
  }
  
  private static findHighestRecentLeaper(symbols: SymbolPriceData[]): SymbolPriceData | null {
    let best: SymbolPriceData | null = null;

    symbols.map((symbol: SymbolPriceData) => {
      if (!best) return best = symbol;
      
      if (symbol.pricePercentageChanges.now > best.pricePercentageChanges.now) {
        best = symbol;
      }
    });
    
    return best;
  }
  
  private static isLeveraged(symbol: string): boolean {
    return symbol.includes('UP') || symbol.includes('DOWN');
  }
  
  private static isTinyCurrency(symbol: string, priceChange: number): boolean {
    if (symbol.endsWith('BTC') && priceChange < 0.00000005) return true;
    if (symbol.endsWith('ETH') && priceChange < 0.0000015) return true;
    if (symbol.endsWith('USDT') && priceChange < 0.0006) return true;
    return false;
  }

  private static isMainQuote(symbol: string): boolean {
    return symbol.endsWith('BTC') || symbol.endsWith('ETH') || symbol.endsWith('USDT');
  }

}
