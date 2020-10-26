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

	private static ws: WebSocket;
	private static prices: { [s: string]: number } = { };
	private static symbols: { [s: string]: SymbolPriceData } = { };
	private static batches: number = 0;
	private static interval: NodeJS.Timeout;
	private static inStartup: boolean = true;
	private static checks: number = 0;
	private static deployedTraderBots: TraderBot[] = [];
	private static deployedAnalystBots: SymbolAnalystBot[] = [];
	private static limitedQuote: string = 'USDT';
	private static hasClimber: boolean = false;
	private static hasLeaper: boolean = false;
	private static hasHighestGainer: boolean = false;
	private static isWorking: boolean = false;
	private static allowedQuotes: string[];
	private static ignorePairs: string[];

	public static start(allowedQuotes: string[], ignorePairs: string[]) {
		MarketBot.isWorking = true;
		MarketBot.allowedQuotes = allowedQuotes;
		MarketBot.ignorePairs = ignorePairs;

		Logger.info('Opening Connection to Binance WebSocket');
		MarketBot.ws = new WebSocket(BinanceWS);

		const data = {
			method: 'SUBSCRIBE',
			params: [ '!bookTicker' ],
			id: 1
		};

		MarketBot.ws.onopen = () => {
			Logger.info('Connected to Binance WebSocket');
			Logger.info('Starting up.. Gathering Data for 60 seconds');

			MarketBot.ws.send(JSON.stringify(data));

			MarketBot.interval = setInterval(async () => {
				MarketBot.updatePrices();
				MarketBot.checks += 1;

				if (!MarketBot.inStartup) {
					await MarketBot.evaluateChanges();
				} else {
					if (MarketBot.checks >= 6) MarketBot.inStartup = false;
					Logger.info(`Starting up.. Gathering Data for ${60 - (MarketBot.checks * 10)} seconds`);
				}
			}, 10000);
		};

		MarketBot.ws.onclose = () => {
			Logger.info(`Connection to Binance Disconnected`);
		};

		MarketBot.ws.onmessage = (msg: MessageEvent) => {
			const data = JSON.parse(msg.data as string);
			if (data.result === null) return;
			MarketBot.prices[data.s] = data.a;
		};
	}

	public static stop() {
		MarketBot.isWorking = false;

		Logger.info(`Closing Connection to Binance WebSocket`);

		clearInterval(MarketBot.interval);
		MarketBot.ws.close();
	}

	private static updatePrices() {
		Object.keys(MarketBot.prices).map((symbol: string) => {
			const price: number = MarketBot.prices[symbol];
			const existingSymbol: SymbolPriceData = MarketBot.symbols[symbol];
			if (existingSymbol) existingSymbol.updatePrice(price);
			else MarketBot.symbols[symbol] = new SymbolPriceData(symbol, price);
		});
	}

	private static async evaluateChanges(): Promise<void> {
		const filteredSymbols: SymbolPriceData[] = MarketBot.filterOutPairs();
		const performers: PerformersData = MarketBot.findPerformingPairs(filteredSymbols);

		const climber: SymbolPriceData | undefined = performers.climber;
		const leaper: SymbolPriceData | undefined = performers.leaper;
		const highestGainer: SymbolPriceData | undefined = performers.highestGainer;
		const highestGain: number = performers.highestGain;

		// let avgGainer: SymbolPriceData | undefined;
		// let highestAvg: number = 0;

		if (highestGainer && highestGain >= 4 && MarketBot.deployedTraderBots.length <= 2) await MarketBot.setupHighestClimber(highestGainer);
		if (leaper && leaper.pricePercentageChanges.tenSeconds > 0) await MarketBot.setupLeaper(leaper);
		if (climber) await MarketBot.setupClimber(climber);

		MarketBot.removeFinishedTraderBots();
	}

	private static async setupHighestClimber(highestGainer: SymbolPriceData) {
		MarketBot.hasHighestGainer = true;

		Logger.info(`Preparing to trade ${highestGainer?.symbol} (Highest Gainer)`);
		const pairData = await MarketBot.getSymbolPairData(highestGainer?.symbol);
		let bot: TraderBot;
		if (pairData) {
			bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 30, SymbolType.HIGHEST_GAINER);
			await bot.startTrading();
			MarketBot.deployedTraderBots.push(bot);
		} else {
			console.log('No Pair Data for Highest Gainer - SKIPPING');
		}
	}

	private static async setupLeaper(leaper: SymbolPriceData) {
		let analystBot: SymbolAnalystBot | null = new SymbolAnalystBot(leaper, SymbolPerformanceType.LEAPER);
		await analystBot.start();

		if (analystBot.decision === SymbolAnalystBotDecision.BUY &&
			MarketBot.deployedTraderBots.length <= 2 &&
			!MarketBot.alreadyAssigned(leaper?.symbol)
		) {
			MarketBot.hasLeaper = true;

			Logger.info(`Preparing to trade ${leaper?.symbol} (Leaper)`);
			const pairData = await MarketBot.getSymbolPairData(leaper?.symbol);
			let bot: TraderBot;
			if (pairData) {
				bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.LEAPER);
				await bot.startTrading();
				MarketBot.deployedTraderBots.push(bot);
			} else {
				console.log('No Pair Data for Leaper - SKIPPING');
			}
		} else if (analystBot.decision === SymbolAnalystBotDecision.ABANDON) {
			analystBot = null;
		}
	}

	private static async setupClimber(climber: SymbolPriceData) {
		let analystBot: SymbolAnalystBot | null = new SymbolAnalystBot(climber, SymbolPerformanceType.CLIMBER);
		await analystBot.start();

		if (analystBot.decision === SymbolAnalystBotDecision.BUY &&
			MarketBot.deployedTraderBots.length <= 2 &&
			!MarketBot.alreadyAssigned(climber?.symbol)) {
			MarketBot.hasClimber = true;

			Logger.info(`Preparing to trade ${climber?.symbol} (Climber)`);
			const pairData = await MarketBot.getSymbolPairData(climber?.symbol);
			let bot: TraderBot;
			if (pairData) {
				bot = new TraderBot(pairData.symbol, pairData.base, pairData.quote, 12, SymbolType.CLIMBER);
				await bot.startTrading();
				MarketBot.deployedTraderBots.push(bot);
			} else {
				console.log('No Pair Data for Climber - SKIPPING');
			}
		} else if (analystBot.decision === SymbolAnalystBotDecision.ABANDON) {
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

		if (MarketBot.deployedTraderBots.length <= 3) symbols.map((symbol: SymbolPriceData) => {
			if (!MarketBot.hasClimber) climber = MarketAlgorithms.findBestClimber(symbol, climber);
			if (!MarketBot.hasLeaper) leaper = MarketAlgorithms.findHighestRecentLeaper(symbol, leaper);
			//
			if (!MarketBot.hasHighestGainer) {
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

	private static removeFinishedTraderBots() {
		MarketBot.deployedTraderBots = MarketBot.deployedTraderBots.filter((bot: TraderBot) => {
			if (bot.state === BotState.FINISHED) {
				if (bot.symbolType === SymbolType.LEAPER) MarketBot.hasLeaper = false;
				if (bot.symbolType === SymbolType.CLIMBER) MarketBot.hasClimber = false;
				if (bot.symbolType === SymbolType.HIGHEST_GAINER) MarketBot.hasHighestGainer = false;
			}

			return bot.state !== BotState.FINISHED;
		});
	}

	private static alreadyAssigned(symbol: string) {
		return !!MarketBot.deployedTraderBots.find((bot: TraderBot) => bot.symbol === symbol);
	}

	private static async getSymbolPairData(symbol: string) {
		const response: any = await CryptoApi.get(`/exchange-pairs/single/${symbol}/${MarketBot.limitedQuote}`);
		if (response && response.success && response.info) return response.info;
		else return false;
	}

	private static filterOutPairs(): SymbolPriceData[] {
		const allSymbols: SymbolPriceData[] = Object.values(MarketBot.symbols);

		return allSymbols.filter((s: SymbolPriceData) =>
			!MarketBot.isLeveraged(s.symbol) &&
				!MarketBot.isTinyCurrency(s.symbol, s.prices.now - s.prices.sixtySeconds) &&
				!MarketBot.isIgnoredPair(s.symbol) &&
				MarketBot.isAllowedQuote(s.symbol));
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
		return !!MarketBot.allowedQuotes.find((q: string) => q === symbol);
	}

	private static isIgnoredPair(symbol: string): boolean {
		return !!MarketBot.ignorePairs.find((p: string) => p === symbol);
	}

}

interface PerformersData {
	climber?: SymbolPriceData,
	leaper?: SymbolPriceData,
	highestGainer?: SymbolPriceData,
	highestGain: number
}
