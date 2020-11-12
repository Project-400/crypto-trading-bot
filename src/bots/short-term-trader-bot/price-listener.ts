import { Logger } from '../../config/logger/logger';
import { BINANCE_WS } from '../../environment';
import SocketConnection, { SocketMessage } from '../../config/websocket/connector';
import { BinanceBookTickerStreamData, BinanceWebsocketSubscription } from '../../interfaces/interfaces';

export default class PriceListener {

	private binanceWsConnection?: SocketConnection;		// Websocket Connection to Binance
	private currentPrice: number = 0;					// The current price for the symbol being watched
	private readonly symbol: string;					// The symbol string, eg. BTCUSDT
	private readonly lowercaseSymbol: string;			// Lowercase version of the symbol, eg. btcusdt

	public constructor(symbol: string) {
		this.symbol = symbol;
		this.lowercaseSymbol = this.symbol.toLowerCase();
	}

	public Price = (): number => this.currentPrice;

	public ConnectAndListen = (): void => {
		Logger.info('Opening Connection to Binance WebSocket');

		this.binanceWsConnection = new SocketConnection(
			BINANCE_WS,
			this.SocketOpen,
			this.SocketClose,
			this.SocketMessage,
			this.SocketError
		);
	}

	public StopListening = (): void => {
		this.binanceWsConnection?.Close();
		this.binanceWsConnection = undefined;
	}

	private SocketOpen = (): void => {
		Logger.info('Trader Bot connected to Binance WebSocket');

		const data: BinanceWebsocketSubscription = {
			method: 'SUBSCRIBE',
			params: [ `${this.lowercaseSymbol}@bookTicker` ],
			id: 1
		};

		this.binanceWsConnection?.SendData(data);
	}

	private SocketClose = (): void => {
		Logger.info(`Trader Bot disconnected from Binance`);
	}

	private SocketMessage = (msg: SocketMessage): void => {
		const msgData: BinanceBookTickerStreamData = JSON.parse(msg.data as string);
		if (msgData.result === null) return;
		this.currentPrice = Number(msgData.a);
	}

	private SocketError = (): void => {
		Logger.info(`Trader Bot encountered an error while connected to Binance`);
	}

}
