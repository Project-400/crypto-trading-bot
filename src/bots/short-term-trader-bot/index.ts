import { ExchangeInfoSymbol, TradingBotState } from '@crypto-tracker/common-types';
import { Logger } from '../../config/logger/logger';
import PriceListener from './price-listener';
import { BotTradeData } from '../../models/bot-trade-data';
import CrudServiceTransactions from '../../external-api/crud-service/services/transactions';
import CrudServiceBots from '../../external-api/crud-service/services/bots';
import { WebsocketProducer } from '../../config/websocket/producer';

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

	private botState: TradingBotState = TradingBotState.WAITING;
	private readonly botId: string;								// Unique Id generated when the Bot entity is created in the CRUD service
	private readonly tradingPairSymbol: string;					// The symbol the bot should trade with, eg. USDTBTC
	public readonly base: string;											// The base currency (The currency being bought), eg. BTC
	public readonly quote: string;											// The quote currency (The currency being used to spend / trade for the base), eg. USDT
	private readonly quoteQty: number;							// The limit of how much of the quote currency the bot can use, eg. 10 USDT
	private updateChecker: NodeJS.Timeout | undefined;		// A SetTimeout that will trigger updates
	private readonly repeatedlyTrade!: boolean;					// Flat to indicate whether to continuously buy and sell (true) or shutdown after first sell (false)
	private tradeData?: BotTradeData;
	private readonly priceListener: PriceListener;
	public currentPrice: number = 0;
	private readonly exchangeInfo: ExchangeInfoSymbol;						// The Binance details related to this trading pair - Limits, rounding, etc.
	public priceChangeInterval: number = 1000;						// The interval gap between expected price updates
	private subscribedClients: string[] = [];
	private lastPublishedPrice: number = 0;

	public getBotId = (): string => this.botId;
	public getBotState = (): TradingBotState => this.botState;

	public constructor(botId: string, base: string, quote: string, tradingPairSymbol: string, quoteQty: number, repeatedlyTrade: boolean, exchangeInfo: ExchangeInfoSymbol) {
		this.botId = botId;
		this.tradingPairSymbol = tradingPairSymbol;
		this.base = base;
		this.quote = quote;
		this.quoteQty = quoteQty;
		this.repeatedlyTrade = repeatedlyTrade;
		this.priceListener = new PriceListener(this.tradingPairSymbol);
		this.exchangeInfo = exchangeInfo;
		this.SetState(TradingBotState.WAITING);
	}

	public Start = async (): Promise<BotTradeData | undefined> => {
		this.SetState(TradingBotState.STARTING);
		this.priceListener.ConnectAndListen();
		this.BeginCheckingUpdates();
		// await this.BuyCurrency(0.00011);
		return this.tradeData;
	}

	public Stop = async (): Promise<void> => {
		// if (this.updateChecker) clearInterval(this.updateChecker);
		// this.priceListener.StopListening();
		await this.SellCurrency();
	}

	public Pause = (): void => {
		this.SetState(TradingBotState.PAUSED);
	}

	private BeginCheckingUpdates = (): void => {
		this.updateChecker = setInterval(async (): Promise<void> => {
			const currentPrice: number = this.priceListener.Price();

			if (currentPrice !== 0) {
				if (this.botState === TradingBotState.STARTING) this.SetState(TradingBotState.WAITING);
				// await this.makeDecision();
			}

			if (currentPrice !== 0) console.log(`CURRENT PRICE IS ${this.priceListener.Price()}`);
			else console.log('PRICE is still 0');

			if (this.lastPublishedPrice !== currentPrice) {
				WebsocketProducer.sendMultiple(JSON.stringify({ price: currentPrice }), this.subscribedClients);
				this.lastPublishedPrice = currentPrice;
			}
		}, 1000);
	}

	private SetState = (state: TradingBotState): void => {
		this.botState = state;
	}

	private saveTradeData = async (): Promise<void> => {
		// if (this.saved) return;
		// this.saved = true;
		if (!this.tradeData) return;
		return CrudServiceBots.SaveBotTradeData(this.tradeData);
	}

	private makeDecision = async (): Promise<void> => {
		console.log(`Bot is ${this.botState}`);
		// Logger.info(`${this.tradeData.symbol} ($${this.tradeData.currentPrice} -- Percentage change: ${this.tradeData.percentageDifference}%`);

		if (this.botState === TradingBotState.WAITING) {
			this.tradeData = new BotTradeData(this.tradingPairSymbol, this.base, this.quote, this.priceChangeInterval, this.exchangeInfo);

			console.log(`BUY CURRENCY: ${this.tradingPairSymbol}`);
			const buy: any = await this.BuyCurrency(this.quoteQty);
			this.SetState(TradingBotState.TRADING);

			// if (buy.success && buy.transaction) {
			// 	this.tradeData.SortBuyData(buy.transaction);
			// 	this.currentPrice = this.tradeData.currentPrice; // TODO: Is this needed?
			// }
		}

		if (
			this.botState === TradingBotState.TRADING// &&
			// (
			// 	// this.tradeData.state === PositionState.SELL ||
			// 	// this.tradeData.state === PositionState.TIMEOUT_SELL
			// )
		) {

			const sell: any = await this.SellCurrency();
			this.SetState(TradingBotState.PAUSED);

			console.log(`SELL CURRENCY: ${this.tradingPairSymbol}`);

			if (sell.success && sell.transaction) {
				this.tradeData?.SortSellData(sell.transaction);
				this.SetState(TradingBotState.FINISHED); // TEMPORARY
			}
		}

		if (this.botState === TradingBotState.FINISHED) {
			this.tradeData?.Finish();

			console.log(this.tradeData);
			// await this.saveTradeData();

			this.Stop();
		}
	}

	private BuyCurrency = async (quantity: number): Promise<void> =>  {
		Logger.info(`Buying ${this.base} with ${quantity} ${this.quote}`);

		if (!quantity) return Logger.error(`Unable to buy ${this.base} - Invalid buy quantity: ${quantity}`);

		this.tradeData = new BotTradeData(this.tradingPairSymbol, this.base, this.quote, this.priceChangeInterval, this.exchangeInfo);
		const buy: any = await CrudServiceTransactions.BuyCurrency(this.tradingPairSymbol, this.base, this.quote, quantity.toString());

		if (buy.success && buy.transaction && this.tradeData) {
			this.tradeData.SortBuyData(buy.transaction.response);
			this.currentPrice = this.tradeData.currentPrice; // TODO: Is this needed?
		} else {
			console.log('FAILED TO BUY');
		}

		// this.tradeData.SortBuyData(this.testTransactions[3]);
	}

	private SellCurrency = async (): Promise<void> => {
		if (!this.tradeData) return Logger.error('The Trade Data object for this bot does not exist');

		const sellQty: string = this.tradeData.GetSellQuantity();

		if (!sellQty) return Logger.error(`Unable to sell ${this.base} - Invalid sell quantity: ${sellQty}`);
		Logger.info(`Selling ${sellQty} ${this.tradeData.base}`);

		const sell: any = await CrudServiceTransactions.SellCurrency(this.tradingPairSymbol, this.base, this.quote, this.tradeData.GetSellQuantity());
		console.log('SOLD');

		console.log(sell);
	}

	public subscribeClient = (socketClientId: string): void => {
		this.subscribedClients.push(socketClientId);
	}

	public unsubscribeClient = (socketClientId: string): void => {
		this.subscribedClients.splice(this.subscribedClients.indexOf(socketClientId), 1);
	}

}
