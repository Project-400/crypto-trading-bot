import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BinanceWS } from '../../environment';
import { SymbolTraderData } from '../../models/symbol-trader-data';
import { PositionState, SymbolType, TradingBotState } from '@crypto-tracker/common-types';
import { CrudService } from '../../external-api/crud-service';
import { Logger } from '../../config/logger/logger';

export class TraderBot {

	public state: TradingBotState = TradingBotState.WAITING;
	private readonly ws: WebSocket;
	private currentPrice: number = 0;
	private readonly tradeData: SymbolTraderData;
	private interval: NodeJS.Timeout | undefined;
	private readonly quoteQty: number = 0;
	public symbolType: SymbolType = SymbolType.NONE;
	public saved: boolean = false;
	public symbol: string;

	public constructor(symbol: string, base: string, quote: string, quoteQty: number, symbolType: SymbolType) {
		console.log('Trader Bot opening connection to Binance');
		this.ws = new WebSocket(BinanceWS);
		this.tradeData = new SymbolTraderData(symbol, base, quote, symbolType);
		this.quoteQty = quoteQty;
		this.symbolType = symbolType;
		this.symbol = symbol;
	}

	public startTrading = async (): Promise<{ trading: boolean }> => {
		await this.tradeData.getExchangeInfo();

		const data: any = {
			method: 'SUBSCRIBE',
			params: [`${this.tradeData.lowercaseSymbol}@bookTicker`],
			id: 1
		};

		this.ws.onopen = (): void => {
			console.log('Trader Bot connected to Binance');

			this.ws.send(JSON.stringify(data));

			this.interval = setInterval(async (): Promise<void> => {
				this.updatePrice();
				await this.makeDecision();
			}, 2000);
		};

		this.ws.onclose = (): void => {
			console.log('Trader Bot disconnected from Binance');
		};

		this.ws.onmessage = (msg: MessageEvent): void => {
			const msgData: any = JSON.parse(msg.data as string);
			if (msgData.result === null) return;
			this.currentPrice = msgData.a;
		};

		setTimeout((): void => {
			setInterval((): void => {
				if (this.tradeData.priceDifference < 1.5) {
					this.tradeData.state = PositionState.TIMEOUT_SELL;
				}
			}, 60000);
		}, 60000 * 15);

		return { trading: true };
	}

	public stopTrading = (): void => {
		console.log('Trader Bot closing connection to Binance');

		if (this.interval) clearInterval(this.interval);
		this.ws.close();
	}

	private updatePrice = (): void => {
		this.tradeData.updatePrice(this.currentPrice);
	}

	private makeDecision = async (): Promise<void> => {
		console.log('-------------------------------');
		console.log(`Symbol: ${this.tradeData.symbol}`);
		console.log(`Type: ${this.symbolType}`);
		console.log(`Price is: ${this.tradeData.currentPrice}`);
		console.log(`Price diff: ${this.tradeData.percentageDifference}%`);
		console.log(`Price drop diff: ${this.tradeData.percentageDroppedFromHigh}%`);
		console.log(`The bot is: ${this.state}`);
		console.log(`Trade position state: ${this.tradeData.state}`);

		Logger.info(`${this.tradeData.symbol} ($${this.tradeData.currentPrice} -- Percentage change: ${this.tradeData.percentageDifference}%`);

		if (this.state === TradingBotState.WAITING) {
			const buy: any = await this.buyCurrency(this.quoteQty);

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
			const sell: any = await this.sellCurrency();

			this.updateState(TradingBotState.PAUSED);

			if (sell.success && sell.transaction) {
				this.tradeData.logSell(sell);

				this.updateState(TradingBotState.FINISHED); // TEMPORARY
			}
		}

		if (this.state === TradingBotState.FINISHED) {
			this.tradeData.finish();
			await this.saveTradeData();

			this.stopTrading();
		}
	}

	private updateState = (state: TradingBotState): void => {
		this.state = state;
	}

	private saveTradeData = async (): Promise<void> => {
		if (this.saved) return;
		this.saved = true;
		return CrudService.post('/bots/trade/save', {
			tradeData: this.tradeData
		});
	}

	private buyCurrency = async (quantity: number): Promise<void> =>  {
		Logger.info(`Buying ${this.tradeData.base} with ${quantity} ${this.tradeData.quote}`);

		return CrudService.post('/transactions/buy', {
			symbol: this.tradeData.symbol,
			base: this.tradeData.base,
			quote: this.tradeData.quote,
			quantity,
			isTest: false
		});
	}

	private sellCurrency = async (): Promise<void> => {
		Logger.info(`Selling ${this.tradeData.getSellQuantity()} ${this.tradeData.base}`);

		return CrudService.post('/transactions/sell', {
			symbol: this.tradeData.symbol,
			base: this.tradeData.base,
			quote: this.tradeData.quote,
			quantity: this.tradeData.getSellQuantity(),
			isTest: false
		});
	}
}
