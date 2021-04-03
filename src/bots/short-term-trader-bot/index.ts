import { ExchangeCurrencyTransactionFull, ExchangeInfoSymbol, TradingBotState } from '@crypto-tracker/common-types';
import { Logger } from '../../config/logger/logger';
import { BotTradeData } from '../../models/bot-trade-data';
import CrudServiceTransactions, { TransactionResponseDto } from '../../external-api/crud-service/services/transactions';
import CrudServiceBots from '../../external-api/crud-service/services/bots';
import { WebsocketProducer } from '../../config/websocket/producer';
import { FakeBuyTransaction_CELO, FakeSellTransaction_CELO } from '../../test-data/transactions.data';
import { RedisActions } from '../../redis/redis';
import { ENV } from '../../environment';
import { MultiPriceListener } from '../../services/multi-price-listener';

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

	private readonly botId: string;									// Unique Id generated when the Bot entity is created in the CRUD service
	private readonly tradingPairSymbol: string;						// The symbol the bot should trade with, eg. USDTBTC
	private readonly base: string;									// The base currency (The currency being bought), eg. BTC
	private readonly quote: string;									// The quote currency (The currency being used to spend / trade for the base), eg. USDT
	private readonly quoteQty: number;								// The limit of how much of the quote currency the bot can use, eg. 10 USDT
	private readonly sellAtLossPercentage: number = 1;				// By default, see when the price drops by 1% (-1%)
	private readonly maxAtLossPercentage: number = 3;				// The complete total % between trades that the user is willing to lose - If null, bot continues to trade
	private readonly repeatedlyTrade!: boolean;						// Flat to indicate whether to continuously buy and sell (true) or shutdown after first sell (false)
	private readonly exchangeInfo: ExchangeInfoSymbol;				// The Binance details related to this trading pair - Limits, rounding, etc.
	private botState: TradingBotState = TradingBotState.WAITING;	// Current state of the bot
	private updateChecker: NodeJS.Timeout | undefined;				// A SetTimeout that will trigger updates
	private previousTradeDatas: BotTradeData[] = [];				// Numerical trade data - Previous multiple trades
	private currentTradeData!: BotTradeData;						// Numerical trade data - Current trade
	private currentPrice: number = 0;								// The current price for the symbol
	private priceChangeInterval: number = 1000;						// The interval gap between expected price updates
	private subscribedClients: string[] = [];						// Websocket Client Ids listening for bot updates
	private lastPublishedPrice: number = 0;							// Last time the price has been published to clients
	private botLogs: string[] = [];									// TODO: History of bot logs

	public getBotId = (): string => this.botId;
	public getBotState = (): TradingBotState => this.botState;
	public getAllTradeData = (): BotTradeData[] => this.previousTradeDatas;
	public getCurrentTradeData = (): BotTradeData => this.currentTradeData;

	public constructor(botId: string, base: string, quote: string, tradingPairSymbol: string, quoteQty: number,
					   repeatedlyTrade: boolean, exchangeInfo: ExchangeInfoSymbol,
					   sellAtLossPercentage?: number, clientSocketIds?: string[]) {
		this.botId = botId;
		this.tradingPairSymbol = tradingPairSymbol;
		this.base = base;
		this.quote = quote;
		this.quoteQty = quoteQty;
		this.repeatedlyTrade = repeatedlyTrade;
		this.exchangeInfo = exchangeInfo;
		this.CreateTradeData();
		if (sellAtLossPercentage) this.sellAtLossPercentage = sellAtLossPercentage;
		if (clientSocketIds && clientSocketIds.length) this.subscribedClients = clientSocketIds;
		this.SetState(TradingBotState.WAITING);
	}

	private CreateTradeData = (): void => {
		this.currentTradeData = new BotTradeData(this.botId, this.tradingPairSymbol, this.base,
			this.quote, this.priceChangeInterval, this.exchangeInfo);
	}

	public Start = (): void => {
		this.SetState(TradingBotState.STARTING);
		MultiPriceListener.SubscribeToSymbol(this.tradingPairSymbol);
		this.BeginCheckingUpdates();

		RedisActions.set(`bot#${this.getBotId()}`, 'true');
		RedisActions.set(`bot#${this.getBotId()}/current-trade`, this.currentTradeData.tradeDataId);
		// return this.currentTradeData;
	}

	public Stop = async (forceSell: boolean = false): Promise<void> => {
		if (this.updateChecker) clearInterval(this.updateChecker);
		MultiPriceListener.UnsubscribeToSymbol(this.tradingPairSymbol);
		if (forceSell) await this.SellCurrency();

		this.DeleteRedisData();
	}

	private DeleteRedisData = (): void => {
		RedisActions.delete(`bot#${this.getBotId()}`);
		RedisActions.delete(`bot#${this.getBotId()}/state`);
		RedisActions.delete(`bot#${this.getBotId()}/price-percentage-difference`);
		RedisActions.delete(`bot#${this.getBotId()}/price-percentage-from-high`);
		RedisActions.delete(`bot#${this.getBotId()}/current-trade`);
	}

	public Pause = (): void => this.SetState(TradingBotState.PAUSED);

	private BeginCheckingUpdates = (): void => {
		this.updateChecker = setInterval(async (): Promise<void> => {
			// console.log('Iterate', this.botState);
			const currentPrice: number = Number(MultiPriceListener.GetPrice(this.tradingPairSymbol));

			if (this.IsBotPriceUpdatable() && this.lastPublishedPrice !== currentPrice) {
				// console.log('Price Check');
				this.currentTradeData.UpdatePrice(currentPrice);

				RedisActions.set(`bot#${this.getBotId()}/price-percentage-difference`, this.currentTradeData.percentageDifference.toString());
				RedisActions.set(`bot#${this.getBotId()}/price-percentage-from-high`, this.currentTradeData.percentageDroppedFromHigh.toString());

				this.publishDataToClients({
					botId: this.botId,
					price: currentPrice,
					botUpdate: this.BOT_DETAILS(),
					tradeData: this.currentTradeData
				});

				this.lastPublishedPrice = currentPrice;
			}

			if (currentPrice !== 0) {
				await this.makeDecision();
			}
		}, this.priceChangeInterval);
	}

	private IsBotPriceUpdatable = (): boolean =>
		this.getBotState() === TradingBotState.WAITING || this.getBotState() === TradingBotState.TRADING

	private SetState = (state: TradingBotState): void => {
		this.botState = state;

		RedisActions.set(`bot#${this.getBotId()}/state`, this.botState);

		this.publishDataToClients({
			botId: this.botId,
			botState: this.botState,
			botLog: JSON.stringify({
				log: `The bot is ${this.botState.toLowerCase()}`,
				time: new Date().toISOString()
			})
		});
	}

	private saveTradeData = async (): Promise<void> => {
		if (ENV.BOT_TEST_MODE_ON) return;
		await CrudServiceBots.SaveBotTradeData(this.currentTradeData);
		this.previousTradeDatas.push(this.currentTradeData);
		// RedisActions.set(`bot#${this.getBotId()}/current-trade`, 'null');
	}

	private makeDecision = async (): Promise<void> => {
		if (this.botState === TradingBotState.STARTING) {
			this.SetState(TradingBotState.WAITING);
		}

		if (this.botState === TradingBotState.WAITING || this.botState === TradingBotState.WAITING_TO_REPEAT) {
			console.log('BUY');
			await this.BuyCurrency(this.quoteQty);
		}

		if (this.botState === TradingBotState.TRADING) {
			console.log('TRADE CHECK');
			if (this.currentTradeData.percentageDroppedFromHigh <= -this.sellAtLossPercentage) {
				this.publishDataToClients({
					botLog: JSON.stringify({
						log: `Profit / Loss is at -${this.sellAtLossPercentage}%\nBot is selling ${this.currentTradeData.base}`,
						time: new Date().toISOString()
					})
				});

				await this.SellCurrency();

				if (this.repeatedlyTrade) this.SetState(TradingBotState.BETWEEN_TRADES);
				else this.SetState(TradingBotState.FINISHED);
			}
		}

		if (this.botState === TradingBotState.BETWEEN_TRADES) {
			console.log('REPEAT');
			this.RepeatTrade();
		}

		if (this.botState === TradingBotState.SETTING_UP_TRADE) {
			// Skip and wait
		}

		if (this.botState === TradingBotState.FINISHED) {
			console.log('FINISHING & STOPPING');

			this.currentTradeData.Finish();
			// await this.saveTradeData();
			await this.Stop(false);
		}
	}

	private RepeatTrade = (): void => {
		this.ClearPreviousTradingData();
		this.SetState(TradingBotState.SETTING_UP_TRADE);
		this.CreateTradeData();
		this.SetState(TradingBotState.WAITING_TO_REPEAT);
	}

	private ClearPreviousTradingData = (): void => {
		this.currentPrice = 0;
		this.lastPublishedPrice = 0;
	}

	private BuyCurrency = async (quantity: number): Promise<ExchangeCurrencyTransactionFull | undefined> => {
		Logger.info(`BUYING ${this.base} with ${quantity} ${this.quote}`);

		let buy: TransactionResponseDto;

		try {
			buy = await CrudServiceTransactions.BuyCurrency(this.tradingPairSymbol, this.base, this.quote,
				quantity.toString(), ENV.FAKE_TRANSACTIONS_ON || ENV.BOT_TEST_MODE_ON);
		} catch (e) {
			console.error('Error: Failed to buy currency');
			return;
		}

		if (buy.success && buy.transaction && this.currentTradeData) {
			this.SetState(TradingBotState.TRADING);
			this.currentTradeData.SortBuyData(buy.transaction.response);

			this.publishDataToClients({
				botLog: JSON.stringify({
					log: `Bought ${this.currentTradeData.baseQty} ${this.currentTradeData.base} with ${this.currentTradeData.quoteQty} ${this.currentTradeData.quote}`,
					time: new Date().toISOString()
				})
			});
		} else {
			console.log('FAILED TO BUY');
		}

		return buy.transaction.response;
	}

	private SellCurrency = async (): Promise<ExchangeCurrencyTransactionFull | undefined> => {
		// if (!this.tradeData) return Logger.error('The Trade Data object for this bot does not exist');

		const sellQty: string = this.currentTradeData.GetSellQuantity();
		if (!sellQty) throw Error(`Unable to sell ${this.base} - Invalid sell quantity: ${sellQty}`);
		Logger.info(`SELLING ${sellQty} ${this.currentTradeData.base}`);

		let sell: TransactionResponseDto;

		try {
			sell = await CrudServiceTransactions.SellCurrency(this.tradingPairSymbol, this.base, this.quote,
				this.currentTradeData.GetSellQuantity(), ENV.FAKE_TRANSACTIONS_ON || ENV.BOT_TEST_MODE_ON);
		} catch (e) {
			console.error('Error: Failed to buy currency');
			return;
		}

		if (sell.success && sell.transaction && this.currentTradeData) {
			this.SetState(TradingBotState.PAUSED);
			this.currentTradeData.SortSellData(sell.transaction.response);

			this.publishDataToClients({
				botLog: JSON.stringify({
					log: `Sold ${this.currentTradeData.sellQty} ${this.currentTradeData.base}`,
					time: new Date().toISOString()
				})
			});

			await this.saveTradeData();
		} else {
			console.log('FAILED TO SELL');
		}

		return sell.transaction.response;
	}

	public subscribeClient = (socketClientId: string): void => {
		this.subscribedClients.push(socketClientId);
	}

	public unsubscribeClient = (socketClientId: string): void => {
		this.subscribedClients.splice(this.subscribedClients.indexOf(socketClientId), 1);
	}

	public BOT_DETAILS = (): object => ({
		botId: this.botId,
		botState: this.botState,
		tradingPairSymbol: this.tradingPairSymbol,
		base: this.base,
		quote: this.quote,
		quoteQty: this.quoteQty,
		repeatedlyTrade: this.repeatedlyTrade,
		currentPrice: this.currentPrice,
		priceChangeInterval: this.priceChangeInterval
	})

	private publishDataToClients = (data: object): void => {
		WebsocketProducer.sendMultiple(JSON.stringify(data), this.subscribedClients);
	}
}
