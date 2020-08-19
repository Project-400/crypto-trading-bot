import WebSocket, {MessageEvent} from 'isomorphic-ws';
import {BinanceWS} from '../settings';
import {SymbolPriceData} from '../models/symbol-price-data';
import {BotState, TraderBot} from './trader-bot';
import {CryptoApi} from '../api/crypto-api';
import {SymbolType} from "@crypto-tracker/common-types";
import {Decision, SymbolAnalystBot, SymbolPerformanceType} from "./symbol-analyst-bot";
import {WebsocketProducer} from "../websocket/websocket";
import {Logger} from "../logger/logger";

export class MarketBot {

  static ws: WebSocket;
  static prices: { [s: string]: number } = { };
  static symbols: { [s: string]: SymbolPriceData } = { };
  static batches: number = 0;
  static interval: NodeJS.Timeout;
  static inStartup: boolean = true;
  static checks: number = 0;
  static deployedTraderBots: TraderBot[] = [];
  static deployedAnalystBots: SymbolAnalystBot[] = [];
  static limitedQuote: string = 'USDT';
  static hasClimber: boolean = false;
  static hasLeaper: boolean = false;
  static hasHighestGainer: boolean = false;
  static isWorking: boolean = false;

  static start() {
    this.isWorking = true;

    Logger.info('Opening Connection to Binance WebSocket');
    this.ws = new WebSocket(BinanceWS);
    
    const data = {
      method: 'SUBSCRIBE',
      params: [ '!bookTicker' ],
      id: 1
    }

    this.ws.onopen = () => {
      Logger.info('Connected to Binance WebSocket');
      Logger.info('Starting up.. Gathering Data for 60 seconds');

      this.ws.send(JSON.stringify(data));
      
      this.interval = setInterval(async () => {
        this.updatePrices();
        this.checks++;
        
        if (!this.inStartup) {
          await this.evaluateChanges();
        } else {
          if (this.checks >= 6) this.inStartup = false;
          Logger.info(`Starting up.. Gathering Data for ${60 - (this.checks * 10)} seconds`);
        }
      }, 10000);
    };

    this.ws.onclose = () => {
      Logger.info(`Connection to Binance Disconnected`);
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      const data = JSON.parse(msg.data as string);
      if (data.result === null) return;
      this.prices[data.s] = data.a;
    };
  }
  
  static stop() {
    this.isWorking = false;
    
    Logger.info(`Closing Connection to Binance WebSocket`);
    
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
        !this.isBTCUSDT(s.symbol) &&
        this.isMainQuote(s.symbol)
    });
    
    let climber: SymbolPriceData | undefined;
    let leaper: SymbolPriceData | undefined;
    let highestGainer: SymbolPriceData | undefined;
    // let avgGainer: SymbolPriceData | undefined;
    let highestGain: number = 0;
    // let highestAvg: number = 0;

    if (this.deployedTraderBots.length <= 3) filteredSymbols.map((symbol: SymbolPriceData) => {
      if (!this.hasClimber) climber = this.findBestClimber(symbol, climber);
      if (!this.hasLeaper) leaper = this.findHighestRecentLeaper(symbol, leaper);
      //
      if (!this.hasHighestGainer) {
        const highestGainData: { symbol: SymbolPriceData, highestGain: number } = this.findHighestGainer(symbol, highestGain);
        highestGain = highestGainData.highestGain;
        highestGainer = highestGainData.symbol;
      }
      //
      // const avgGainData = this.findHighestAverageGainer(symbol, highestAvg);
      // highestAvg = avgGainData.highestAvg;
      // avgGainer = avgGainData.symbol;
    });

    console.log(`Currently trading with ${this.deployedTraderBots.length} bots / symbols`)

    if (highestGainer && highestGain >= 4 && this.deployedTraderBots.length <= 2) {
      this.hasHighestGainer = true;

      Logger.info(`Preparing to trade ${highestGainer?.symbol} (Highest Gainer)`);
      const pairData = await this.getSymbolPairData(highestGainer?.symbol);
      let bot: TraderBot;
      if (pairData) {
        bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 30, SymbolType.HIGHEST_GAINER);
        await bot.startTrading();
        this.deployedTraderBots.push(bot);
      } else {
        console.log('No Pair Data for Highest Gainer - SKIPPING')
      }

      console.log(`************* HIGHEST GAINER **************`);
      console.log(`----------- ${highestGainer?.symbol} ---------------`);
    }

    if (leaper && leaper.pricePercentageChanges.tenSeconds > 0) {
      console.log(`************* LEAPER TEST **************`);
      console.log(leaper.pricePercentageChanges.now);

      const analystBot: SymbolAnalystBot = new SymbolAnalystBot(leaper, SymbolPerformanceType.LEAPER);
      await analystBot.start();
      
      if (analystBot.decision === Decision.BUY && this.deployedTraderBots.length <= 2 && !this.alreadyAssigned(leaper?.symbol)) {
        this.hasLeaper = true;

        Logger.info(`Preparing to trade ${leaper?.symbol} (Leaper)`);
        const pairData = await this.getSymbolPairData(leaper?.symbol);
        let bot: TraderBot;
        if (pairData) {
          bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.LEAPER);
          await bot.startTrading();
          this.deployedTraderBots.push(bot);
        } else {
          console.log('No Pair Data for Leaper - SKIPPING');
        }

        console.log(`************* LEAPER **************`);
        console.log(`----------- ${leaper?.symbol} ---------------`);
      } else if (analystBot.decision === Decision.ABANDON) {
        // Ignore
      }
    }
    
    if (climber) {
      console.log(`************* CLIMBER TEST **************`);
      console.log(climber.pricePercentageChanges);

      const analystBot: SymbolAnalystBot = new SymbolAnalystBot(climber, SymbolPerformanceType.CLIMBER);
      await analystBot.start();
      
      if (analystBot.decision === Decision.BUY && this.deployedTraderBots.length <= 2 && !this.alreadyAssigned(climber?.symbol)) {
        this.hasClimber = true;

        Logger.info(`Preparing to trade ${climber?.symbol} (Climber)`);
        const pairData = await this.getSymbolPairData(climber?.symbol);
        let bot: TraderBot;
        if (pairData) {
          bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.CLIMBER);
          await bot.startTrading();
          this.deployedTraderBots.push(bot);
        } else {
          console.log('No Pair Data for Climber - SKIPPING');
        }

        console.log(`************* CLIMBER **************`);
        console.log(`----------- ${climber?.symbol} ---------------`);
      } else if (analystBot.decision === Decision.ABANDON) {
        // Ignore
      }
    }

    if (this.deployedTraderBots.length && this.deployedTraderBots[2] && this.deployedTraderBots[2].state === BotState.FINISHED) {
      if (this.deployedTraderBots[2].symbolType === SymbolType.LEAPER) this.hasLeaper = false;
      if (this.deployedTraderBots[2].symbolType === SymbolType.CLIMBER) this.hasClimber = false;
      if (this.deployedTraderBots[2].symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;
      // delete this.deployedTraderBots[2];
      this.deployedTraderBots.splice(2, 1);
      // this.deployedTraderBots = []; // TEMP
    }

    if (this.deployedTraderBots.length && this.deployedTraderBots[1] && this.deployedTraderBots[1].state === BotState.FINISHED) {
      if (this.deployedTraderBots[1].symbolType === SymbolType.LEAPER) this.hasLeaper = false;
      if (this.deployedTraderBots[1].symbolType === SymbolType.CLIMBER) this.hasClimber = false;
      if (this.deployedTraderBots[1].symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;
      this.deployedTraderBots.splice(1, 1);
      // this.deployedTraderBots = []; // TEMP
    }

    if (this.deployedTraderBots.length && this.deployedTraderBots[0] && this.deployedTraderBots[0].state === BotState.FINISHED) {
      if (this.deployedTraderBots[0].symbolType === SymbolType.LEAPER) this.hasLeaper = false;
      if (this.deployedTraderBots[0].symbolType === SymbolType.CLIMBER) this.hasClimber = false;
      if (this.deployedTraderBots[0].symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;

      this.deployedTraderBots.splice(0, 1);
      // this.deployedTraderBots = []; // TEMP
    }
  }
  
  private static alreadyAssigned(symbol: string) {
    return !!this.deployedTraderBots.find((bot: TraderBot) => bot.symbol === symbol);
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
      symbol.prices.fiftySeconds >= symbol.prices.sixtySeconds &&
      symbol.pricePercentageChanges.tenSeconds >= 0 &&
      symbol.pricePercentageChanges.twentySeconds >= 0 &&
      symbol.pricePercentageChanges.thirtySeconds >= 0 &&
      symbol.pricePercentageChanges.fortySeconds >= 0 &&
      symbol.pricePercentageChanges.fiftySeconds >= 0 &&
      symbol.pricePercentageChanges.sixtySeconds >= 0
    ) ? symbol : current;
  }
  
  private static findHighestRecentLeaper(symbol: SymbolPriceData, current?: SymbolPriceData): SymbolPriceData {
    if (!current) return symbol;
    
    return (symbol.pricePercentageChanges.tenSeconds > current.pricePercentageChanges.tenSeconds) ? symbol : current;
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

  private static isBTCUSDT(symbol: string): boolean {
    // return symbol.endsWith('BTC') || symbol.endsWith('ETH') || symbol.endsWith('USDT');
    return symbol === 'BTCUSDT' || symbol === 'BCHUSDT'; // Temp
  }

}
