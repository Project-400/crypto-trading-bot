import { Logger } from '../config/logger/logger';
import { BINANCE_WS } from '../environment';
import SocketConnection, { SocketMessage } from '../config/websocket/connector';
import { BinanceBookTickerStreamData, BinanceWebsocketSubscription } from '../interfaces/interfaces';

export interface SymbolPriceData {
	symbol: string;
	lowercaseSymbol: string;
	price: string;
	priceNumerical: number;
	subscriptionId: number;
	subscriptionConfirmed: boolean;
}

export class MultiPriceListener {

	private static binanceWsConnection?: SocketConnection;		// Websocket Connection to Binance
	public static isListening: boolean = false;					// Lowercase version of the symbol, eg. btcusdt
	private static symbols: SymbolPriceData[] = [];				// The symbol string, eg. BTCUSDT

	public static AddSymbol = (symbol: string): SymbolPriceData => {
		let symbolPriceData: SymbolPriceData | undefined = MultiPriceListener.GetSymbolPriceData(symbol);
		if (symbolPriceData) return symbolPriceData;

		symbolPriceData = {
			symbol,
			lowercaseSymbol: symbol.toLowerCase(),
			price: '0',
			priceNumerical: 0,
			subscriptionId: new Date().getMilliseconds(),
			subscriptionConfirmed: false
		};

		MultiPriceListener.symbols.push(symbolPriceData);
		MultiPriceListener.SubscribeToSymbol(symbol);

		return symbolPriceData;
	}

	private static SubscribeToSymbol = (symbol: string): void => {
		const data: BinanceWebsocketSubscription = {
			method: 'SUBSCRIBE',
			params: [ `${symbol}@bookTicker` ],
			id: 1
		};

		MultiPriceListener.binanceWsConnection?.SendData(data);
	}

	private static GetSymbolPriceData = (symbol: string): SymbolPriceData => {
		let symbolPriceData: SymbolPriceData | undefined =
			MultiPriceListener.symbols.find((s: SymbolPriceData): boolean => s.symbol === symbol);
		if (!symbolPriceData) symbolPriceData = MultiPriceListener.AddSymbol(symbol);
		return symbolPriceData;
	}

	private static GetSymbolPriceDataById = (subscriptionId: number): SymbolPriceData | undefined =>
		MultiPriceListener.symbols.find((s: SymbolPriceData): boolean => s.subscriptionId === subscriptionId)

	private static GetSymbolPriceDataIndex = (symbol: string): number =>
		MultiPriceListener.symbols.findIndex((s: SymbolPriceData): boolean => s.symbol === symbol)

	public static GetPrice = (symbol: string): string => MultiPriceListener.GetSymbolPriceData(symbol).price;

	public static GetPriceNumerical = (symbol: string): number => MultiPriceListener.GetSymbolPriceData(symbol).priceNumerical;

	private static UpdatePrice = (symbol: string, price: string): void => {
		// const symbolPriceDataIndex: number = MultiPriceListener.GetSymbolPriceDataIndex(symbol);
		const symbolPriceData: SymbolPriceData | undefined = MultiPriceListener.GetSymbolPriceData(symbol);
		if (!symbolPriceData) return;

		symbolPriceData.price = price;
		symbolPriceData.priceNumerical = Number(price);
	}

	private static ConfirmSymbolSubscription = (subscriptionId: number): void => {
		const symbolPriceData: SymbolPriceData | undefined = MultiPriceListener.GetSymbolPriceDataById(subscriptionId);
		if (symbolPriceData) symbolPriceData.subscriptionConfirmed = true;
	}

	public ConnectAndListen = (): void => {
		Logger.info('Opening Connection to Binance WebSocket');

		MultiPriceListener.binanceWsConnection = new SocketConnection(
			BINANCE_WS,
			this.SocketOpen,
			this.SocketClose,
			this.SocketMessage,
			this.SocketError
		);
	}

	public static StopListening = (): void => {
		MultiPriceListener.binanceWsConnection?.Close();
		MultiPriceListener.binanceWsConnection = undefined;
		MultiPriceListener.isListening = true;
	}

	private SocketOpen = (): void => {
		Logger.info('Trader Bot connected to Binance WebSocket');
		MultiPriceListener.isListening = true;
	}

	private SocketClose = (): void => {
		Logger.info(`Trader Bot disconnected from Binance`);
		MultiPriceListener.isListening = false;
	}

	private SocketMessage = (msg: SocketMessage): void => {
		const msgData: BinanceBookTickerStreamData = JSON.parse(msg.data as string);
		if (msgData.result === null && msgData.id !== undefined) MultiPriceListener.ConfirmSymbolSubscription(msgData.id);
		MultiPriceListener.UpdatePrice(msgData.s, msgData.a); // TODO: Clarify whether to use msgData.a or msgData.b?
	}

	private SocketError = (): void => {
		Logger.info(`Trader Bot encountered an error while connected to Binance`);
	}

}
