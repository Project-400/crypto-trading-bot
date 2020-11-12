import { TradingBotState } from '@crypto-tracker/common-types';
import WebSocket from 'isomorphic-ws';

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
	private readonly interval: NodeJS.Timeout | undefined;		// A SetTimeout that will trigger updates
	private readonly binanceWsConnection!: WebSocket;			// Websocket Connection to Binance

	public getBotId = (): string => this.botId;
	public getIsWorking = (): boolean => this.isWorking;

	public constructor(botId: string, tradingPairSymbol: string, quoteQty: number) {
		this.botId = botId;
		this.tradingPairSymbol = tradingPairSymbol;
		this.quoteQty = quoteQty;
	}

	public Start = (): void => {
		this.isWorking = true;
	}

	public Stop = (): void => {
		this.isWorking = false;
	}

	public Pause = (): void => {
		this.isWorking = false;
	}

}
