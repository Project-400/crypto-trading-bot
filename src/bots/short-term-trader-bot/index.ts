import { PositionState, TradingBotState } from '@crypto-tracker/common-types';
import WebSocket from 'isomorphic-ws';
import { SymbolTraderData } from '../../models/symbol-trader-data';
import { CryptoApi } from '../../external-api/crypto-api';
import { Logger } from '../../config/logger/logger';
import PriceListener from './price-listener';

/*
*
* Short Term Trader Bot
*
* This bot has one purpose - To trade with a single cryptocurrency pair, eg. USDTBTC.
* At first, the bot will monitor the current price of the currency until it deems it is safe to buy.
* The bot will continue to monitor the price changes and make a decision whether to continue
* holding the currency or to sell if it has dropped by a particular amount.
*
* */

export default class ShortTermTraderBot {

	private state: TradingBotState = TradingBotState.WAITING;
	private isWorking: boolean = false;							// Flag for when bot is currently trading or not
	private readonly botId: string;								// Unique Id generated when the Bot entity is created in the CRUD service
	private readonly tradingPairSymbol: string;					// The symbol the bot should trade with, eg. USDTBTC
	private readonly quoteQty: number;							// The limit of how much of the quote currency the bot can use, eg. 10 USDT
	// private readonly interval: NodeJS.Timeout | undefined;		// A SetTimeout that will trigger updates
	// private readonly binanceWsConnection!: WebSocket;			// Websocket Connection to Binance
	private readonly repeatedlyTrade!: boolean;					// Flat to indicate whether to continuously buy and sell (true) or shutdown after first sell (false)
	private readonly tradeData: SymbolTraderData;
	private readonly priceListener: PriceListener;
	private currentPrice: number = 0;

	public getBotId = (): string => this.botId;
	public getIsWorking = (): boolean => this.isWorking;

	public constructor(botId: string, base: string, quote: string, tradingPairSymbol: string, quoteQty: number, repeatedlyTrade: boolean) {
		this.botId = botId;
		this.tradingPairSymbol = tradingPairSymbol;
		this.quoteQty = quoteQty;
		this.repeatedlyTrade = repeatedlyTrade;
		this.tradeData = new SymbolTraderData(tradingPairSymbol, base, quote);
		this.priceListener = new PriceListener(this.tradingPairSymbol);
	}

	public Start = (): void => {
		this.isWorking = true;
		this.priceListener.ConnectAndListen();
	}

	public Stop = (): void => {
		this.isWorking = false;
		// if (this.interval) clearInterval(this.interval);
		this.priceListener.StopListening();
	}

	public Pause = (): void => {
		this.isWorking = false;
	}

	private updateState = (state: TradingBotState): void => {
		this.state = state;
	}

	private saveTradeData = async (): Promise<void> => {
		// if (this.saved) return;
		// this.saved = true;
		return CryptoApi.post('/bots/trade/save', {
			tradeData: this.tradeData
		});
	}

	private makeDecision = async (): Promise<void> => {
		console.log('-------------------------------');
		console.log(`Symbol: ${this.tradeData.symbol}`);
		// console.log(`Type: ${this.symbolType}`);
		console.log(`Price is: ${this.tradeData.currentPrice}`);
		console.log(`Price diff: ${this.tradeData.percentageDifference}%`);
		console.log(`Price drop diff: ${this.tradeData.percentageDroppedFromHigh}%`);
		console.log(`The bot is: ${this.state}`);
		console.log(`Trade position state: ${this.tradeData.state}`);

		Logger.info(`${this.tradeData.symbol} ($${this.tradeData.currentPrice} -- Percentage change: ${this.tradeData.percentageDifference}%`);

		if (this.state === TradingBotState.WAITING) {
			const buy: any = await this.BuyCurrency(this.quoteQty);

			this.updateState(TradingBotState.TRADING);

			if (buy.success && buy.transaction) {
				this.tradeData.logBuy(buy);
				this.currentPrice = this.tradeData.currentPrice;
			}
		}

		if (
			this.state === TradingBotState.TRADING &&
			(
				this.tradeData.state === PositionState.SELL ||
				this.tradeData.state === PositionState.TIMEOUT_SELL
			)
		) {
			const sell: any = await this.SellCurrency();

			this.updateState(TradingBotState.PAUSED);

			if (sell.success && sell.transaction) {
				this.tradeData.logSell(sell);

				this.updateState(TradingBotState.FINISHED); // TEMPORARY
			}
		}

		if (this.state === TradingBotState.FINISHED) {
			this.tradeData.finish();
			await this.saveTradeData();

			this.Stop();
		}
	}

	private BuyCurrency = async (quantity: number): Promise<void> =>  {
		Logger.info(`Buying ${this.tradeData.base} with ${quantity} ${this.tradeData.quote}`);

		return CryptoApi.post('/transactions/buy', {
			symbol: this.tradeData.symbol,
			base: this.tradeData.base,
			quote: this.tradeData.quote,
			quantity,
			isTest: false
		});
	}

	private SellCurrency = async (): Promise<void> => {
		Logger.info(`Selling ${this.tradeData.getSellQuantity()} ${this.tradeData.base}`);

		return CryptoApi.post('/transactions/sell', {
			symbol: this.tradeData.symbol,
			base: this.tradeData.base,
			quote: this.tradeData.quote,
			quantity: this.tradeData.getSellQuantity(),
			isTest: false
		});
	}

}
