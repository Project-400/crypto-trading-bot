/*
*
* Market Analyst Bot
*
* This bot's main objective is to watch all Cryptocurreny symbol prices.
* It will detect when a Symbol is increasing in price, which can indicate an opportunity for profit.
*
* */

export default class MarketAnalystBot {

	private isWorking: boolean = false;			// Flag for when bot is currently trading or not
	private allowedQuotes: string[]; 			// Currencies the bot is allowed to use to trade with, eg. USDT
	private ignorePairs: string[];				// Symbol pairs to ignore and not trade with, eg. USDTBTC
	private readonly botId: string;				// Unique Id generated when the Bot entity is created in the CRUD service

	public getBotId = (): string => this.botId;
	public getIsWorking = (): boolean => this.isWorking;

	public constructor(botId: string, allowedQuotes: string[], ignorePairs: string[]) {
		this.botId = botId;
		this.allowedQuotes = allowedQuotes;
		this.ignorePairs = ignorePairs;
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
