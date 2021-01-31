import { ExchangeCurrencyTransactionFull, ExchangeInfoSymbol, PositionState, TradingBotState } from '@crypto-tracker/common-types';
import { Logger } from '../../config/logger/logger';
import PriceListener from './price-listener';
import { BotTradeData } from '../../models/bot-trade-data';
import CrudServiceTransactions, { TransactionResponseDto } from '../../external-api/crud-service/services/transactions';
import CrudServiceBots from '../../external-api/crud-service/services/bots';
import { WebsocketProducer } from '../../config/websocket/producer';
import { FakeBuyTransaction_CELO, FakeBuyTransaction_COMP_Commission, FakeSellTransaction_CELO } from '../../test-data/transactions.data';

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
	private botState: TradingBotState = TradingBotState.WAITING;	// Current state of the bot
	private readonly tradingPairSymbol: string;						// The symbol the bot should trade with, eg. USDTBTC
	private readonly base: string;									// The base currency (The currency being bought), eg. BTC
	private readonly quote: string;									// The quote currency (The currency being used to spend / trade for the base), eg. USDT
	private readonly quoteQty: number;								// The limit of how much of the quote currency the bot can use, eg. 10 USDT
	private updateChecker: NodeJS.Timeout | undefined;				// A SetTimeout that will trigger updates
	private readonly repeatedlyTrade!: boolean;						// Flat to indicate whether to continuously buy and sell (true) or shutdown after first sell (false)
	private tradeData!: BotTradeData;								// Numerical trade data
	private readonly priceListener: PriceListener;					// Price listener
	private currentPrice: number = 0;								// The current price for the symbol
	private readonly exchangeInfo: ExchangeInfoSymbol;				// The Binance details related to this trading pair - Limits, rounding, etc.
	private priceChangeInterval: number = 1000;						// The interval gap between expected price updates
	private subscribedClients: string[] = [];						// Websocket Client Ids listening for bot updates
	private lastPublishedPrice: number = 0;							// Last time the price has been published to clients
	private sellAtLossPercentage: number = 1;						// By default, see when the price drops by 1% (-1%)
	private IN_TEST_MODE: boolean = true;							// Flag for whether the bot is in test mode or not

	public getBotId = (): string => this.botId;
	public getBotState = (): TradingBotState => this.botState;

	public constructor(botId: string, base: string, quote: string, tradingPairSymbol: string, quoteQty: number,
					   repeatedlyTrade: boolean, exchangeInfo: ExchangeInfoSymbol, sellAtLossPercentage?: number) {
		this.botId = botId;
		this.tradingPairSymbol = tradingPairSymbol;
		this.base = base;
		this.quote = quote;
		this.quoteQty = quoteQty;
		this.repeatedlyTrade = repeatedlyTrade;
		this.priceListener = new PriceListener(this.tradingPairSymbol);
		this.exchangeInfo = exchangeInfo;
		if (sellAtLossPercentage) this.sellAtLossPercentage = sellAtLossPercentage;
		this.SetState(TradingBotState.WAITING);
	}

	public Start = async (): Promise<BotTradeData | undefined> => {
		this.SetState(TradingBotState.STARTING);
		this.priceListener.ConnectAndListen();
		this.BeginCheckingUpdates();
		return this.tradeData;
	}

	public Stop = async (forceSell: boolean = false): Promise<void> => {
		if (this.updateChecker) clearInterval(this.updateChecker);
		if (this.priceListener.isListening) this.priceListener.StopListening();
		if (forceSell) await this.SellCurrency();
	}

	public Pause = (): TradingBotState => this.SetState(TradingBotState.PAUSED);

	private BeginCheckingUpdates = (): void => {
		this.updateChecker = setInterval(async (): Promise<void> => {
			const currentPrice: number = this.priceListener.Price();

			if (currentPrice !== 0) {
				if (this.botState === TradingBotState.STARTING) this.SetState(TradingBotState.WAITING);
				await this.makeDecision();
			}

			if (currentPrice !== 0) console.log(`CURRENT PRICE IS ${this.priceListener.Price()}`);
			else console.log('PRICE is still 0');

			if (this.lastPublishedPrice !== currentPrice) {
				this.tradeData?.UpdatePrice(currentPrice);

				WebsocketProducer.sendMultiple(JSON.stringify({
					price: currentPrice,
					botUpdate: this.BOT_DETAILS(),
					tradeData: this.tradeData
				}), this.subscribedClients);

				this.lastPublishedPrice = currentPrice;
			}
		}, this.priceChangeInterval);
	}

	private SetState = (state: TradingBotState): TradingBotState => this.botState = state;

	private saveTradeData = async (): Promise<void> => {
		if (!this.tradeData || this.IN_TEST_MODE) return;
		return CrudServiceBots.SaveBotTradeData(this.tradeData);
	}

	private makeDecision = async (): Promise<void> => {
		console.log(`Bot is ${this.botState}`);

		if (this.botState === TradingBotState.WAITING) {
			this.tradeData = new BotTradeData(this.tradingPairSymbol, this.base, this.quote, this.priceChangeInterval, this.exchangeInfo);

			await this.BuyCurrency(this.quoteQty);
		}

		if (this.botState === TradingBotState.TRADING) {
			if (this.tradeData.percentageDifference <= -this.sellAtLossPercentage) {
				await this.SellCurrency();

				if (!this.repeatedlyTrade) {
					this.SetState(TradingBotState.FINISHED); // TEMPORARY
				}
			}
		}

		if (this.botState === TradingBotState.FINISHED) {
			console.log('FINISHING & STOPPING');

			this.tradeData.Finish();
			await this.saveTradeData();
			await this.Stop(false);
		}
	}

	private BuyCurrency = async (quantity: number): Promise<ExchangeCurrencyTransactionFull> =>  {
		Logger.info(`BUYING ${this.base} with ${quantity} ${this.quote}`);

		// if (!quantity) return Logger.error(`Unable to buy ${this.base} - Invalid buy quantity: ${quantity}`);

		const buy: TransactionResponseDto =
			this.IN_TEST_MODE ?
			{ success: true, transaction: { response: FakeBuyTransaction_CELO } } :
			await CrudServiceTransactions.BuyCurrency(this.tradingPairSymbol, this.base, this.quote, quantity.toString());

		if (buy.success && buy.transaction && this.tradeData) {
			this.SetState(TradingBotState.TRADING);
			this.tradeData.SortBuyData(buy.transaction.response);
		} else {
			console.log('FAILED TO BUY');
		}

		return buy.transaction.response;
	}

	private SellCurrency = async (): Promise<ExchangeCurrencyTransactionFull> => {
		// if (!this.tradeData) return Logger.error('The Trade Data object for this bot does not exist');

		const sellQty: string = this.tradeData.GetSellQuantity();
		if (!sellQty) throw Error(`Unable to sell ${this.base} - Invalid sell quantity: ${sellQty}`);
		Logger.info(`SELLING ${sellQty} ${this.tradeData.base}`);

		const sell: TransactionResponseDto =
			this.IN_TEST_MODE ?
				{ success: true, transaction: { response: FakeSellTransaction_CELO } } :
				await CrudServiceTransactions.SellCurrency(this.tradingPairSymbol, this.base, this.quote, this.tradeData.GetSellQuantity());

		if (sell.success && sell.transaction && this.tradeData) {
			this.SetState(TradingBotState.PAUSED);
			this.tradeData.SortSellData(sell.transaction.response);
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

}
