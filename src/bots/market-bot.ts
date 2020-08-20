import WebSocket, {MessageEvent} from 'isomorphic-ws';
import {BinanceWS} from '../settings';
import {SymbolPriceData} from '../models/symbol-price-data';
import {BotState, TraderBot} from './trader-bot';
import {CryptoApi} from '../api/crypto-api';
import {SymbolType} from '@crypto-tracker/common-types';
import {Decision, SymbolAnalystBot, SymbolPerformanceType} from './symbol-analyst-bot';
import {Logger} from '../logger/logger';
import {MarketAlgorithms} from '../services/market-algorithms';

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
  static allowedQuotes: string[];
  static ignorePairs: string[];
  
  static start(allowedQuotes: string[], ignorePairs: string[]) {
    this.isWorking = true;
    this.allowedQuotes = allowedQuotes;
    this.ignorePairs = ignorePairs;

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
    const filteredSymbols: SymbolPriceData[] = this.filterOutPairs();
    const performers: PerformersData = this.findPerformingPairs(filteredSymbols);

    let climber: SymbolPriceData | undefined = performers.climber;
    let leaper: SymbolPriceData | undefined = performers.leaper;
    let highestGainer: SymbolPriceData | undefined = performers.highestGainer;
    let highestGain: number = performers.highestGain;

    // let avgGainer: SymbolPriceData | undefined;
    // let highestAvg: number = 0;
    
    if (highestGainer && highestGain >= 4 && this.deployedTraderBots.length <= 2) await this.setupHighestClimber(highestGainer);
    if (leaper && leaper.pricePercentageChanges.tenSeconds > 0) await this.setupLeaper(leaper);
    if (climber) await this.setupClimber(climber);

    this.removeFinishedTraderBots();
  }
  
  private static async setupHighestClimber(highestGainer: SymbolPriceData) {
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
  }
  
  private static async setupLeaper(leaper: SymbolPriceData) {
    let analystBot: SymbolAnalystBot | null = new SymbolAnalystBot(leaper, SymbolPerformanceType.LEAPER);
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
    } else if (analystBot.decision === Decision.ABANDON) {
      analystBot = null;
    }
  }
  
  private static async setupClimber(climber: SymbolPriceData) {
    let analystBot: SymbolAnalystBot | null = new SymbolAnalystBot(climber, SymbolPerformanceType.CLIMBER);
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
    } else if (analystBot.decision === Decision.ABANDON) {
      analystBot = null;
    }
  }
  
  private static findPerformingPairs(symbols: SymbolPriceData[]): PerformersData {
    let climber: SymbolPriceData | undefined;
    let leaper: SymbolPriceData | undefined;
    let highestGainer: SymbolPriceData | undefined;
    // let avgGainer: SymbolPriceData | undefined;
    let highestGain: number = 0;
    // let highestAvg: number = 0;

    if (this.deployedTraderBots.length <= 3) symbols.map((symbol: SymbolPriceData) => {
      if (!this.hasClimber) climber = MarketAlgorithms.findBestClimber(symbol, climber);
      if (!this.hasLeaper) leaper = MarketAlgorithms.findHighestRecentLeaper(symbol, leaper);
      //
      if (!this.hasHighestGainer) {
        const highestGainData: { symbol: SymbolPriceData, highestGain: number } = MarketAlgorithms.findHighestGainer(symbol, highestGain);
        highestGain = highestGainData.highestGain;
        highestGainer = highestGainData.symbol;
      }
      //
      // const avgGainData = this.findHighestAverageGainer(symbol, highestAvg);
      // highestAvg = avgGainData.highestAvg;
      // avgGainer = avgGainData.symbol;
    });
    
    return {
      climber,
      leaper,
      highestGainer,
      highestGain
    };
  }
  
  private static removeFinishedTraderBots() {
    this.deployedTraderBots = this.deployedTraderBots.filter((bot: TraderBot) => {
      if (bot.state === BotState.FINISHED) {
        if (bot.symbolType === SymbolType.LEAPER) this.hasLeaper = false;
        if (bot.symbolType === SymbolType.CLIMBER) this.hasClimber = false;
        if (bot.symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;
      }
      
      return bot.state !== BotState.FINISHED;
    });
  }
  
  private static alreadyAssigned(symbol: string) {
    return !!this.deployedTraderBots.find((bot: TraderBot) => bot.symbol === symbol);
  }
  
  private static async getSymbolPairData(symbol: string) {
    const response: any = await CryptoApi.get(`/exchange-pairs/single/${symbol}/${this.limitedQuote}`);
    if (response && response.success && response.info) return response.info;
    else return false;
  }
  
  private static filterOutPairs(): SymbolPriceData[] {
    const allSymbols: SymbolPriceData[] = Object.values(this.symbols);
    
    return allSymbols.filter((s: SymbolPriceData) => {
      return !this.isLeveraged(s.symbol) &&
        !this.isTinyCurrency(s.symbol, s.prices.now - s.prices.sixtySeconds) &&
        !this.isIgnoredPair(s.symbol) &&
        this.isAllowedQuote(s.symbol)
    });
  }
  
  private static isTinyCurrency(symbol: string, priceChange: number): boolean { // USDT only temporarily
    if (symbol.endsWith('USDT') && priceChange < 0.0006) return true;
    if (symbol.endsWith('BTC') && priceChange < 0.00000005) return true;
    if (symbol.endsWith('ETH') && priceChange < 0.0000015) return true;
    return false;
  }

  private static isLeveraged(symbol: string): boolean {
    return symbol.includes('UP') || symbol.includes('DOWN');
  }

  private static isAllowedQuote(symbol: string): boolean {
    return !!this.allowedQuotes.find((q: string) => q === symbol);
  }

  private static isIgnoredPair(symbol: string): boolean {
    return !!this.ignorePairs.find((p: string) => p === symbol);
  }

}

interface PerformersData { 
  climber?: SymbolPriceData, 
  leaper?: SymbolPriceData, 
  highestGainer?: SymbolPriceData, 
  highestGain: number 
}
