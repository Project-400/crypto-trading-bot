import { ExchangeInfoSymbol, PositionState, TradingBotState } from '@crypto-tracker/common-types';
import { CrudServiceApi } from '../../external-api/crud-service-api';
import { Logger } from '../../config/logger/logger';
import PriceListener from './price-listener';
import { BotTradeData } from '../../models/bot-trade-data';

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
	private currentPrice: number = 0;
	public exchangeInfo: ExchangeInfoSymbol;						// The Binance details related to this trading pair - Limits, rounding, etc.

	public getBotId = (): string => this.botId;
	public getBotState = (): TradingBotState => this.botState;

	public constructor(botId: string, base: string, quote: string, tradingPairSymbol: string, quoteQty: number, repeatedlyTrade: boolean, exchangeInfo: ExchangeInfoSymbol) {
		// TODO: Exchange info and other external calls to be passed in before starting
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

	public Start = (): void => {
		this.SetState(TradingBotState.STARTING);
		this.priceListener.ConnectAndListen();
		this.BeginCheckingUpdates();
	}

	public Stop = (): void => {
		if (this.updateChecker) clearInterval(this.updateChecker);
		this.priceListener.StopListening();
	}

	public Pause = (): void => {
		this.SetState(TradingBotState.PAUSED);
	}

	private BeginCheckingUpdates = (): void => {
		this.updateChecker = setInterval(async (): Promise<void> => {
			if (this.priceListener.Price() !== 0) {
				if (this.botState === TradingBotState.STARTING) this.SetState(TradingBotState.WAITING);
				await this.makeDecision();
			}

			if (this.priceListener.Price() !== 0) console.log(`CURRENT PRICE IS ${this.priceListener.Price()}`);
			else console.log('PRICE is still 0');
		}, 1000);
	}

	private SetState = (state: TradingBotState): void => {
		this.botState = state;
	}

	private saveTradeData = async (): Promise<void> => {
		// if (this.saved) return;
		// this.saved = true;
		return CrudServiceApi.post('/bots/trade/save', {
			tradeData: this.tradeData
		});
	}

	private makeDecision = async (): Promise<void> => {
		// console.log('-------------------------------');
		// console.log(`Symbol: ${this.tradeData.symbol}`);
		// // console.log(`Type: ${this.symbolType}`);
		// console.log(`Price is: ${this.tradeData.currentPrice}`);
		// console.log(`Price diff: ${this.tradeData.percentageDifference}%`);
		// console.log(`Price drop diff: ${this.tradeData.percentageDroppedFromHigh}%`);
		// console.log(`The bot is: ${this.state}`);
		// console.log(`Trade position state: ${this.tradeData.state}`);
		console.log(`Bot is ${this.botState}`);
		// Logger.info(`${this.tradeData.symbol} ($${this.tradeData.currentPrice} -- Percentage change: ${this.tradeData.percentageDifference}%`);

		if (this.botState === TradingBotState.WAITING) {
			this.tradeData = new BotTradeData(this.tradingPairSymbol, this.base, this.quote, this.exchangeInfo);

			console.log(`BUY CURRENCY: ${this.tradingPairSymbol}`);
			const buy: any = await this.BuyCurrency(this.quoteQty);
			this.SetState(TradingBotState.TRADING);

			if (buy.success && buy.transaction) {
				this.tradeData.SortBuyData(buy.transaction);
				this.currentPrice = this.tradeData.currentPrice; // TODO: Is this needed?
			}
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
			this.tradeData.Finish();

			console.log(this.tradeData);
			// await this.saveTradeData();

			this.Stop();
		}
	}

	private BuyCurrency = async (quantity: number): Promise<void> =>  { // TODO: Buy through CRUD service - Log data there
		Logger.info(`Buying ${this.base} with ${quantity} ${this.quote}`);

		return CrudServiceApi.post('/transactions/buy', {
			symbol: this.tradingPairSymbol,
			base: this.base,
			quote: this.quote,
			quantity,
			isTest: false
		});
	}

	private SellCurrency = async (): Promise<void> => { // TODO: Buy through CRUD service - Log data there
		if (!this.tradeData) return console.error('The Trade Date object for this bot does not exist');

		Logger.info(`Selling ${this.tradeData.GetSellQuantity()} ${this.tradeData.base}`);

		return CrudServiceApi.post('/transactions/sell', {
			symbol: this.tradingPairSymbol,
			base: this.base,
			quote: this.quote,
			quantity: this.tradeData.GetSellQuantity(),
			isTest: false
		});
	}

}
