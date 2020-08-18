import WebSocket, {MessageEvent} from 'isomorphic-ws';
import {BinanceWS} from '../settings';
import {SymbolPriceData} from '../models/symbol-price-data';
import {BotState, SymbolType, TraderBot} from './trader-bot';
import {CryptoApi} from '../api/crypto-api';

export class MarketBot {

  static ws: WebSocket;
  static prices: { [s: string]: number } = { };
  static symbols: { [s: string]: SymbolPriceData } = { };
  static batches: number = 0;
  static interval: NodeJS.Timeout;
  static inStartup: boolean = true;
  static checks: number = 0;
  static deployedTraderBots: TraderBot[] = [];
  static limitedQuote: string = 'USDT';
  static hasClimber: boolean = false;
  static hasLeaper: boolean = false;
  static hasHighestGainer: boolean = false;

  static start() {
    console.log('Opening Connection to Binance WebSocket')
    this.ws = new WebSocket(BinanceWS);
    
    const data = {
      method: 'SUBSCRIBE',
      params: [ '!bookTicker' ],
      id: 1
    }

    this.ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      console.log(`Starting up.. Gathering Data for 60 seconds.`)

      this.ws.send(JSON.stringify(data));
      
      this.interval = setInterval(async () => {
        this.updatePrices();
        this.checks++;
        
        if (!this.inStartup) {
          await this.evaluateChanges();
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
  
  private static async evaluateChanges(): Promise<void> {
    const allSymbols: SymbolPriceData[] = Object.values(this.symbols);
    const filteredSymbols: SymbolPriceData[] = allSymbols.filter((s: SymbolPriceData) => {
      return !this.isLeveraged(s.symbol) &&
        !this.isTinyCurrency(s.symbol, s.prices.now - s.prices.sixtySeconds) &&
        this.isMainQuote(s.symbol)
    });

    console.log('------------------------------');
    console.log('BEST PERFORMERS');

    // const climber: SymbolPriceData | null = this.findBestClimber(filteredSymbols);
    // const highestGainer: SymbolPriceData | null = this.findHighestGainer(filteredSymbols);
    // const avgGainer: SymbolPriceData | null = this.findHighestAverageGainer(filteredSymbols);
    // const leaper: SymbolPriceData | null = this.findHighestRecentLeaper(filteredSymbols);

    let climber: SymbolPriceData | undefined;
    let leaper: SymbolPriceData | undefined;
    let highestGainer: SymbolPriceData | undefined;
    let avgGainer: SymbolPriceData | undefined;
    let highestGain: number = 0;
    let highestAvg: number = 0;

    if (this.deployedTraderBots.length <= 3) filteredSymbols.map((symbol: SymbolPriceData) => {
      climber = this.findBestClimber(symbol, climber);
      leaper = this.findHighestRecentLeaper(symbol, leaper);
      //
      const highestGainData: { symbol: SymbolPriceData, highestGain: number } = this.findHighestGainer(symbol, highestGain);
      highestGain = highestGainData.highestGain;
      highestGainer = highestGainData.symbol;
      //
      // const avgGainData = this.findHighestAverageGainer(symbol, highestAvg);
      // highestAvg = avgGainData.highestAvg;
      // avgGainer = avgGainData.symbol;
    });
    
    if (climber) {
      console.log(`************* CLIMBER **************`);
      console.log(`----------- ${climber?.symbol} ---------------`);
      // console.log(`----------- +${climber?.pricePercentageChanges.sixtySeconds}% ---------------`);
    }
    //
    // if (highestGainer) {
    //   console.log(`************* HIGHEST GAINER **************`);
    //   console.log(`----------- ${highestGainer?.symbol} ---------------`);
    //   console.log(`----------- +${Math.max(...Object.values(highestGainer.pricePercentageChanges))}% ---------------`);
    // } else {
    //   console.log(`----------- NO HIGHEST GAINER ---------------`);
    // }
    //
    // if (avgGainer) {
    //   console.log(`************* AVERAGE GAINER **************`);
    //   console.log(`----------- ${avgGainer?.symbol} ---------------`);
    //   console.log(`----------- +${(
    //     avgGainer.pricePercentageChanges.now +
    //     avgGainer.pricePercentageChanges.tenSeconds +
    //     avgGainer.pricePercentageChanges.twentySeconds +
    //     avgGainer.pricePercentageChanges.thirtySeconds +
    //     avgGainer.pricePercentageChanges.fortySeconds +
    //     avgGainer.pricePercentageChanges.sixtySeconds
    //   ) / 6}% ---------------`);
    // } else {
    //   console.log(`----------- NO AVERAGE GAINER ---------------`);
    // }

    if (leaper) {
      console.log(`************* LEAPER **************`);
      console.log(`----------- ${leaper?.symbol} ---------------`);
      // console.log(`----------- +${leaper.pricePercentageChanges.now}% ---------------`);
    }

    console.log(`Currently trading with ${this.deployedTraderBots.length} bots / symbols`)

    if (this.deployedTraderBots.length && this.deployedTraderBots[2] && this.deployedTraderBots[2].state === BotState.FINISHED) {
      if (this.deployedTraderBots[2].symbolType === SymbolType.LEAPER) this.hasLeaper = false;
      if (this.deployedTraderBots[2].symbolType === SymbolType.CLIMBER) this.hasClimber = false;
      if (this.deployedTraderBots[2].symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;
      delete this.deployedTraderBots[2];
      // this.deployedTraderBots = []; // TEMP
    }

    if (this.deployedTraderBots.length && this.deployedTraderBots[1] && this.deployedTraderBots[1].state === BotState.FINISHED) {
      if (this.deployedTraderBots[1].symbolType === SymbolType.LEAPER) this.hasLeaper = false;
      if (this.deployedTraderBots[1].symbolType === SymbolType.CLIMBER) this.hasClimber = false;
      if (this.deployedTraderBots[1].symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;
      delete this.deployedTraderBots[1];
      // this.deployedTraderBots = []; // TEMP
    }

    if (this.deployedTraderBots.length && this.deployedTraderBots[0] && this.deployedTraderBots[0].state === BotState.FINISHED) {
      if (this.deployedTraderBots[0].symbolType === SymbolType.LEAPER) this.hasLeaper = false;
      if (this.deployedTraderBots[0].symbolType === SymbolType.CLIMBER) this.hasClimber = false;
      if (this.deployedTraderBots[0].symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;

      delete this.deployedTraderBots[0];
      // this.deployedTraderBots = []; // TEMP
    }
    
    if (climber?.symbol === leaper?.symbol) leaper = undefined; // TEMP - Figure out if symbols are repeated
    
    if (highestGainer && highestGain >= 8 && this.deployedTraderBots.length <= 2) {
      console.log(`PREPPING TO TRADE ${highestGainer?.symbol}`);
      const pairData = await this.getSymbolPairData(highestGainer?.symbol);
      let bot: TraderBot;
      if (pairData) {
        bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.HIGHEST_GAINER);
        await bot.startTrading();
        this.deployedTraderBots.push(bot);
      } else {
        console.log('No Pair Data 3 - SKIPPING')
      }
    }

    if (leaper && this.deployedTraderBots.length <= 2) {
      console.log(`PREPPING TO TRADE ${leaper?.symbol}`);
      const pairData = await this.getSymbolPairData(leaper?.symbol);
      let bot: TraderBot;
      if (pairData) {
        bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.LEAPER);
        await bot.startTrading();
        this.deployedTraderBots.push(bot);
      } else {
        console.log('No Pair Data 1 - SKIPPING')
      }
    }

    if (climber && this.deployedTraderBots.length <= 2) {
      this.hasClimber = true;

      console.log(`PREPPING TO TRADE ${climber?.symbol}`);
      const pairData = await this.getSymbolPairData(climber?.symbol);
      let bot: TraderBot;
      if (pairData) {
        bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.CLIMBER);
        await bot.startTrading();
        this.deployedTraderBots.push(bot);
      } else {
        console.log('No Pair Data 2 - SKIPPING')
      }
    }
  }
  
  private static async getSymbolPairData(symbol: string) {
    const response: any = await CryptoApi.get(`/exchange-pairs/single/${symbol}/${this.limitedQuote}`);
    if (response && response.success && response.info) return response.info;
    else return false;
  }
  
  private static findBestClimber(symbol: SymbolPriceData, current?: SymbolPriceData): SymbolPriceData {
    if (!current) return symbol;

    return (
      symbol.pricePercentageChanges.sixtySeconds > current.pricePercentageChanges.sixtySeconds &&
      symbol.prices.now >= symbol.prices.tenSeconds &&
      symbol.prices.tenSeconds >= symbol.prices.twentySeconds &&
      symbol.prices.twentySeconds >= symbol.prices.thirtySeconds &&
      symbol.prices.thirtySeconds >= symbol.prices.fortySeconds &&
      symbol.prices.fortySeconds >= symbol.prices.fiftySeconds &&
      symbol.prices.fiftySeconds >= symbol.prices.sixtySeconds
    ) ? symbol : current;
  }
  
  private static findHighestRecentLeaper(symbol: SymbolPriceData, current?: SymbolPriceData): SymbolPriceData {
    if (!current) return symbol;

    return (symbol.pricePercentageChanges.now > current.pricePercentageChanges.now) ? symbol : current;
  }

  private static findHighestGainer(symbol: SymbolPriceData, highestGain: number): { symbol: SymbolPriceData, highestGain: number } {
    if (!highestGain) return {
      symbol,
      highestGain: Math.max(...Object.values(symbol.pricePercentageChanges))
    };

    if (
      symbol.pricePercentageChanges.now > highestGain ||
      symbol.pricePercentageChanges.tenSeconds > highestGain ||
      symbol.pricePercentageChanges.twentySeconds > highestGain ||
      symbol.pricePercentageChanges.thirtySeconds > highestGain ||
      symbol.pricePercentageChanges.fortySeconds > highestGain ||
      symbol.pricePercentageChanges.sixtySeconds > highestGain
    ) return {
      symbol,
      highestGain: Math.max(...Object.values(symbol.pricePercentageChanges))
    };
    
    return {
      symbol,
      highestGain
    };
  }
  
  private static findHighestAverageGainer(symbol: SymbolPriceData, highestAvg: number): { symbol: SymbolPriceData, highestAvg: number } {
    const avg = (
      symbol.pricePercentageChanges.now +
      symbol.pricePercentageChanges.tenSeconds +
      symbol.pricePercentageChanges.twentySeconds +
      symbol.pricePercentageChanges.thirtySeconds +
      symbol.pricePercentageChanges.fortySeconds +
      symbol.pricePercentageChanges.sixtySeconds
    ) / 6;

    if (!highestAvg) return {
        symbol,
        highestAvg: avg
     };
      
    if (avg > highestAvg) return {
      symbol,
      highestAvg: avg
    };
    
    return {
      symbol,
      highestAvg
    };
  }
  
  private static isLeveraged(symbol: string): boolean {
    return symbol.includes('UP') || symbol.includes('DOWN');
  }
  
  private static isTinyCurrency(symbol: string, priceChange: number): boolean { // USDT only temporarily
    // if (symbol.endsWith('BTC') && priceChange < 0.00000005) return true;
    // if (symbol.endsWith('ETH') && priceChange < 0.0000015) return true;
    if (symbol.endsWith('USDT') && priceChange < 0.0006) return true;
    return false;
  }

  private static isMainQuote(symbol: string): boolean {
    // return symbol.endsWith('BTC') || symbol.endsWith('ETH') || symbol.endsWith('USDT');
    return symbol.endsWith('USDT'); // Temp
  }

}
