import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BinanceWS } from '../settings';
import { SymbolPriceData } from '../models/symbol-price-data';
import { BotState, TraderBot } from './trader-bot';
import { CryptoApi } from '../api/crypto-api';
import { SymbolType } from '@crypto-tracker/common-types';
import { SymbolAnalystBotDecision, SymbolAnalystBot, SymbolPerformanceType } from './symbol-analyst-bot';
import { Logger } from '../logger/logger';
import { MarketAlgorithms } from '../services/market-algorithms';

export class MarketBot {

	private botId: string;
	private ws!: WebSocket;
	private prices: { [s: string]: number } = { };
	private symbols: { [s: string]: SymbolPriceData } = { };
	private batches: number = 0;
	private interval!: NodeJS.Timeout;
	private inStartup: boolean = true;
	private checks: number = 0;
	private deployedTraderBots: TraderBot[] = [];
	private deployedAnalystBots: SymbolAnalystBot[] = [];
	private limitedQuote: string = 'USDT';
	private hasClimber: boolean = false;
	private hasLeaper: boolean = false;
	private hasHighestGainer: boolean = false;
	private allowedQuotes: string[];
	private ignorePairs: string[];
	public isWorking: boolean = false;

	public constructor(botId: string, allowedQuotes: string[], ignorePairs: string[]) {
		this.botId = botId;
		this.allowedQuotes = allowedQuotes;
		this.ignorePairs = ignorePairs;
	}

	public start = (): void => {
	// public static start(allowedQuotes: string[], ignorePairs: string[]) {
		this.isWorking = true;
		// MarketBot.allowedQuotes = allowedQuotes;
		// MarketBot.ignorePairs = ignorePairs;

		Logger.info('Opening Connection to Binance WebSocket');
		this.ws = new WebSocket(BinanceWS);

		const data: any = {
			method: 'SUBSCRIBE',
			params: [ '!bookTicker' ],
			id: 1
		};

		this.ws.onopen = (): void => {
			Logger.info('Connected to Binance WebSocket');
			Logger.info('Starting up.. Gathering Data for 60 seconds');

			this.ws.send(JSON.stringify(data));

			this.interval = setInterval(async (): Promise<void> => {
				this.updatePrices();
				this.checks += 1;

				if (!this.inStartup) {
					await this.evaluateChanges();
				} else {
					if (this.checks >= 6) this.inStartup = false;
					Logger.info(`Starting up.. Gathering Data for ${60 - (this.checks * 10)} seconds`);
				}
			}, 10000);
		};

		this.ws.onclose = (): void => {
			Logger.info(`Connection to Binance Disconnected`);
		};

		this.ws.onmessage = (msg: MessageEvent): void => {
			const msgData: any = JSON.parse(msg.data as string);
			if (msgData.result === null) return;
			this.prices[msgData.s] = msgData.a;
		};
	}

	public stop = (): void => {
		this.isWorking = false;

		// Logger.info(`Closing Connection to Binance WebSocket`);

		// clearInterval(this.interval);
		// this.ws.close();
	}

	public getBotId = (): string => this.botId;

	private updatePrices = (): void => {
		Object.keys(this.prices).map((symbol: string): void => {
			const price: number = this.prices[symbol];
			const existingSymbol: SymbolPriceData = this.symbols[symbol];
			if (existingSymbol) existingSymbol.updatePrice(price);
			else this.symbols[symbol] = new SymbolPriceData(symbol, price);
		});
	}

	private async evaluateChanges(): Promise<void> {
		const filteredSymbols: SymbolPriceData[] = this.filterOutPairs();
		const performers: PerformersData = this.findPerformingPairs(filteredSymbols);

		const climber: SymbolPriceData | undefined = performers.climber;
		const leaper: SymbolPriceData | undefined = performers.leaper;
		const highestGainer: SymbolPriceData | undefined = performers.highestGainer;
		const highestGain: number = performers.highestGain;

		// let avgGainer: SymbolPriceData | undefined;
		// let highestAvg: number = 0;

		if (highestGainer && highestGain >= 4 && this.deployedTraderBots.length <= 2) await this.setupHighestClimber(highestGainer);
		if (leaper && leaper.pricePercentageChanges.tenSeconds > 0) await this.setupLeaper(leaper);
		if (climber) await this.setupClimber(climber);

		this.removeFinishedTraderBots();
	}

	private setupHighestClimber = async (highestGainer: SymbolPriceData): Promise<void> => {
		this.hasHighestGainer = true;

		Logger.info(`Preparing to trade ${highestGainer?.symbol} (Highest Gainer)`);
		const pairData: any = await this.getSymbolPairData(highestGainer?.symbol);
		let bot: TraderBot;
		if (pairData) {
			bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 30, SymbolType.HIGHEST_GAINER);
			await bot.startTrading();
			this.deployedTraderBots.push(bot);
		} else {
			console.log('No Pair Data for Highest Gainer - SKIPPING');
		}
	}

	private setupLeaper = async (leaper: SymbolPriceData): Promise<void> => {
		let analystBot: SymbolAnalystBot | null = new SymbolAnalystBot(leaper, SymbolPerformanceType.LEAPER);
		await analystBot.start();

		if (analystBot.decision === SymbolAnalystBotDecision.BUY &&
			this.deployedTraderBots.length <= 2 &&
			!this.alreadyAssigned(leaper?.symbol)
		) {
			this.hasLeaper = true;

			Logger.info(`Preparing to trade ${leaper?.symbol} (Leaper)`);
			const pairData: any = await this.getSymbolPairData(leaper?.symbol);
			let bot: TraderBot;
			if (pairData) {
				bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.LEAPER);
				await bot.startTrading();
				this.deployedTraderBots.push(bot);
			} else {
				console.log('No Pair Data for Leaper - SKIPPING');
			}
		} else if (analystBot.decision === SymbolAnalystBotDecision.ABANDON) {
			analystBot = null;
		}
	}

	private setupClimber = async (climber: SymbolPriceData): Promise<void> =>  {
		let analystBot: SymbolAnalystBot | null = new SymbolAnalystBot(climber, SymbolPerformanceType.CLIMBER);
		await analystBot.start();

		if (analystBot.decision === SymbolAnalystBotDecision.BUY &&
			this.deployedTraderBots.length <= 2 &&
			!this.alreadyAssigned(climber?.symbol)) {
			this.hasClimber = true;

			Logger.info(`Preparing to trade ${climber?.symbol} (Climber)`);
			const pairData: any = await this.getSymbolPairData(climber?.symbol);
			let bot: TraderBot;
			if (pairData) {
				bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.CLIMBER);
				await bot.startTrading();
				this.deployedTraderBots.push(bot);
			} else {
				console.log('No Pair Data for Climber - SKIPPING');
			}
		} else if (analystBot.decision === SymbolAnalystBotDecision.ABANDON) {
			analystBot = null;
		}
	}

	private findPerformingPairs(symbols: SymbolPriceData[]): PerformersData {
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
				const highestGainData: { symbol: SymbolPriceData; highestGain: number } = MarketAlgorithms.findHighestGainer(symbol, highestGain);
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

	private removeFinishedTraderBots = (): void =>  {
		this.deployedTraderBots = this.deployedTraderBots.filter((bot: TraderBot) => {
			if (bot.state === BotState.FINISHED) {
				if (bot.symbolType === SymbolType.LEAPER) this.hasLeaper = false;
				if (bot.symbolType === SymbolType.CLIMBER) this.hasClimber = false;
				if (bot.symbolType === SymbolType.HIGHEST_GAINER) this.hasHighestGainer = false;
			}

			return bot.state !== BotState.FINISHED;
		});
	}

	private alreadyAssigned = (symbol: string): boolean => !!this.deployedTraderBots.find((bot: TraderBot): boolean => bot.symbol === symbol);

	private getSymbolPairData = async (symbol: string): Promise<boolean> => {
		const response: any = await CryptoApi.get(`/exchange-pairs/single/${symbol}/${this.limitedQuote}`);
		if (response && response.success && response.info) return response.info;
		return false;
	}

	private filterOutPairs(): SymbolPriceData[] {
		const allSymbols: SymbolPriceData[] = Object.values(this.symbols);

		return allSymbols.filter((s: SymbolPriceData): boolean =>
			!this.isLeveraged(s.symbol) &&
				!this.isTinyCurrency(s.symbol, s.prices.now - s.prices.sixtySeconds) &&
				!this.isIgnoredPair(s.symbol) &&
			this.isAllowedQuote(s.symbol));
	}

	private isTinyCurrency = (symbol: string, priceChange: number): boolean => { // USDT only temporarily
		if (symbol.endsWith('USDT') && priceChange < 0.0006) return true;
		if (symbol.endsWith('BTC') && priceChange < 0.00000005) return true;
		if (symbol.endsWith('ETH') && priceChange < 0.0000015) return true;
		return false;
	}

	private isLeveraged = (symbol: string): boolean => symbol.includes('UP') || symbol.includes('DOWN');

	private isAllowedQuote = (symbol: string): boolean => !!this.allowedQuotes.find((q: string): boolean => q === symbol);

	private isIgnoredPair = (symbol: string): boolean => !!this.ignorePairs.find((p: string): boolean => p === symbol);

}

interface PerformersData {
	climber?: SymbolPriceData,
	leaper?: SymbolPriceData,
	highestGainer?: SymbolPriceData,
	highestGain: number
}
