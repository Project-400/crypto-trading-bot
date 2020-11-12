import { Logger } from '../../config/logger/logger';
import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BINANCE_WS } from '../../environment';
import { TradingPairPriceData } from '../../models/symbol-price-data';
import { SymbolPairFiltering } from './symbol-pair-failtering';

interface AllSymbolPrices {
	[symbol: string]: number;
}

interface AllSymbolData {
	[symbol: string]: TradingPairPriceData;
}

interface PerformersData {
	climber?: TradingPairPriceData;
	leaper?: TradingPairPriceData;
	highestGainer?: TradingPairPriceData;
	highestGain: number;
}

export default class MarketListener {

	private binanceWsConnection!: WebSocket;				// Websocket Connection to Binance
	private updateChecker!: NodeJS.Timeout; 				// A SetTimeout that will trigger updates
	private allSymbolPrices: AllSymbolPrices = { };			// An object containing all of the current prices
	private allSymbolData: AllSymbolData = { };				// An object containing all of the current symbol price data & changes
	private inStartup: boolean = true;
	private updateCheckCount: number = 0;
	private allowedQuotes: string[] = []; 					// Currencies the bot is allowed to use to trade with, eg. USDT
	private ignorePairs: string[] = [];						// Symbol pairs to ignore and not trade with, eg. USDTBTC

	public ConnectAndListen = (): void => {
		Logger.info('Opening Connection to Binance WebSocket');
		this.binanceWsConnection = new WebSocket(BINANCE_WS);

		const data: any = {
			method: 'SUBSCRIBE',
			params: [ '!bookTicker' ],
			id: 1
		};

		this.binanceWsConnection.onopen = (): void => {
			Logger.info('Connected to Binance WebSocket');
			Logger.info('Starting up.. Gathering Data for 60 seconds');

			this.binanceWsConnection.send(JSON.stringify(data));

			this.updateChecker = setInterval(async (): Promise<void> => {
				this.updatePrices();
				this.updateCheckCount += 1;

				if (!this.inStartup) {
					await this.evaluateChanges();
				} else {
					if (this.updateCheckCount >= 6) this.inStartup = false;
					Logger.info(`Starting up.. Gathering Data for ${60 - (this.updateCheckCount * 10)} seconds`);
				}
			}, 10000);
		};

		this.binanceWsConnection.onclose = (): void => {
			Logger.info(`Connection to Binance Disconnected`);
		};

		this.binanceWsConnection.onmessage = (msg: MessageEvent): void => {
			const msgData: any = JSON.parse(msg.data as string);
			if (msgData.result === null) return;
			this.allSymbolPrices[msgData.s] = msgData.a;
		};
	}

	private updatePrices = (): void => {
		Object.keys(this.allSymbolPrices).map((symbol: string): void => {
			const price: number = this.allSymbolPrices[symbol];
			const existingSymbol: TradingPairPriceData = this.allSymbolData[symbol];
			if (existingSymbol) existingSymbol.updatePrice(price);
			else this.allSymbolData[symbol] = new TradingPairPriceData(symbol, price);
		});
	}

	private evaluateChanges(): void {
		const allSymbols: TradingPairPriceData[] = Object.values(this.allSymbolData);
		const filteredSymbols: TradingPairPriceData[] = SymbolPairFiltering.FilterUnwantedPairs(allSymbols, this.allowedQuotes, this.ignorePairs);

		// const performers: PerformersData = this.findPerformingPairs(filteredSymbols);

		// const climber: TradingPairPriceData | undefined = performers.climber;
		// const leaper: TradingPairPriceData | undefined = performers.leaper;
		// const highestGainer: TradingPairPriceData | undefined = performers.highestGainer;
		// const highestGain: number = performers.highestGain;

		// let avgGainer: SymbolPriceData | undefined;
		// let highestAvg: number = 0;

		// if (highestGainer && highestGain >= 4 && this.deployedTraderBots.length <= 2) await this.setupHighestClimber(highestGainer);
		// if (leaper && leaper.pricePercentageChanges.tenSeconds > 0) await this.setupLeaper(leaper);
		// if (climber) await this.setupClimber(climber);
		//
		// this.removeFinishedTraderBots();
	}
}
