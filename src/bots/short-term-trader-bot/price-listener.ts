import { Logger } from '../../config/logger/logger';
import WebSocket, { MessageEvent } from 'isomorphic-ws';
import { BINANCE_WS } from '../../environment';

export default class PriceListener {

	private binanceWsConnection!: WebSocket;		// Websocket Connection to Binance
	private currentPrice: number = 0;				// The current price for the symbol being watched
	private readonly symbol: string;				// The symbol string, eg. USDTBTC
	private readonly lowercaseSymbol: string;		// Lowercase version of the symbol, eg. usdtbtc

	public constructor(symbol: string) {
		this.symbol = symbol;
		this.lowercaseSymbol = this.symbol.toLowerCase();
	}

	public ConnectAndListen = (): void => {
		Logger.info('Opening Connection to Binance WebSocket');

		this.binanceWsConnection = new WebSocket(BINANCE_WS);

		const data: any = {
			method: 'SUBSCRIBE',
			params: [ `${this.lowercaseSymbol}@bookTicker` ],
			id: 1
		};

		this.binanceWsConnection.onopen = (): void => {
			Logger.info('Trader Bot to Binance WebSocket');

			this.binanceWsConnection.send(JSON.stringify(data));
		};

		this.binanceWsConnection.onclose = (): void => {
			Logger.info(`Trader Bot disconnected from Binance`);
		};

		this.binanceWsConnection.onmessage = (msg: MessageEvent): void => {
			const msgData: any = JSON.parse(msg.data as string);
			if (msgData.result === null) return;
			this.currentPrice = msgData.a;
		};
	}

}
