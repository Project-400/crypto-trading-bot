import { BINANCE_WS, ENV } from '../environment';
import SocketConnection, { SocketMessage } from '../config/websocket/connector';
import { BinanceBookTickerStreamData, BinanceWebsocketSubscription } from '../interfaces/interfaces';
import { FakePriceSocket } from './fake-price-socket';

export interface SymbolPriceData {
	symbol: string;
	lowercaseSymbol: string;
	price: string;
	priceNumerical: number;
	subscriptionId: number;
	subscriptionConfirmed: boolean;
	subscriptionCount: number;
}

export class MultiPriceListener {

	private static binanceWsConnection?: SocketConnection;		// Websocket Connection to Binance
	public static isListening: boolean = false;					// Lowercase version of the symbol, eg. btcusdt
	private static symbols: SymbolPriceData[] = [];				// The symbol string, eg. BTCUSDT

	public static SubscribeToSymbol = (symbol: string): SymbolPriceData => {
		let symbolPriceData: SymbolPriceData = MultiPriceListener.GetSymbolPriceData(symbol);

		if (symbolPriceData) {
			symbolPriceData = MultiPriceListener.IncrementSubscriptionCount(symbolPriceData);
		}

		if (ENV.SIMULATE_PRICE_LISTENER) FakePriceSocket.AddFakePrice(symbol);

		return symbolPriceData;
	}

	public static UnsubscribeToSymbol = (symbol: string): void => {
		let symbolPriceData: SymbolPriceData = MultiPriceListener.GetSymbolPriceData(symbol);

		if (!symbolPriceData) return;

		symbolPriceData = MultiPriceListener.DecrementSubscriptionCount(symbolPriceData);

		if (symbolPriceData.subscriptionCount <= 0) {
			if (!ENV.SIMULATE_PRICE_LISTENER) MultiPriceListener.SymbolSubUnsub(symbolPriceData, false);
			MultiPriceListener.RemoveSymbol(symbol);
		}
	}

	private static RemoveSymbol = (symbol: string): void => {
		const symbolIndex: number = MultiPriceListener.GetSymbolPriceDataIndex(symbol);

		if (symbolIndex > -1) MultiPriceListener.symbols.splice(symbolIndex, 1);
	}

	private static CreateSub = (symbol: string): SymbolPriceData => {
		const symbolPriceData: SymbolPriceData = {
			symbol,
			lowercaseSymbol: symbol.toLowerCase(),
			price: '0',
			priceNumerical: 0,
			subscriptionId: new Date().getTime(),
			subscriptionConfirmed: false,
			subscriptionCount: 0
		};

		MultiPriceListener.symbols.push(symbolPriceData);
		if (!ENV.SIMULATE_PRICE_LISTENER) MultiPriceListener.SymbolSubUnsub(symbolPriceData, true);

		return symbolPriceData;
	}

	private static SymbolSubUnsub = (symbolPriceData: SymbolPriceData, isSub: boolean): void => {
		const data: BinanceWebsocketSubscription = {
			method: isSub ? 'SUBSCRIBE' : 'UNSUBSCRIBE',
			params: [ `${symbolPriceData.lowercaseSymbol}@bookTicker` ],
			id: symbolPriceData.subscriptionId
		};

		MultiPriceListener.binanceWsConnection?.SendData(data);
	}

	private static IncrementSubscriptionCount = (symbolPriceData: SymbolPriceData): SymbolPriceData => {
		symbolPriceData.subscriptionCount = symbolPriceData.subscriptionCount + 1;
		return symbolPriceData;
	}

	private static DecrementSubscriptionCount = (symbolPriceData: SymbolPriceData): SymbolPriceData => {
		symbolPriceData.subscriptionCount = symbolPriceData.subscriptionCount - 1;
		return symbolPriceData;
	}

	private static GetSymbolPriceData = (symbol: string): SymbolPriceData => {
		let symbolPriceData: SymbolPriceData | undefined =
			MultiPriceListener.symbols.find((s: SymbolPriceData): boolean => s.symbol === symbol);
		if (!symbolPriceData) symbolPriceData = MultiPriceListener.CreateSub(symbol);
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

	public static ConnectAndListen = (): void => {
		if (ENV.SIMULATE_PRICE_LISTENER) {
			console.log('Setting up Simulated Price Listener');
			MultiPriceListener.isListening = true;
			FakePriceSocket.SimulateWebsocketMessages(MultiPriceListener.symbols, MultiPriceListener.SocketMessage);
		} else {
			console.log('Setting up Price Listener - Opening Connection to Binance WebSocket');
			MultiPriceListener.binanceWsConnection = new SocketConnection(
				BINANCE_WS,
				MultiPriceListener.SocketOpen,
				MultiPriceListener.SocketClose,
				MultiPriceListener.SocketMessage,
				MultiPriceListener.SocketError
			);
		}
	}

	public static StopListening = (): void => {
		if (!ENV.SIMULATE_PRICE_LISTENER) {
			MultiPriceListener.binanceWsConnection?.Close();
			MultiPriceListener.binanceWsConnection = undefined;
		}
		MultiPriceListener.isListening = false;
	}

	private static SocketOpen = (): void => {
		console.log('Price Listener connected to Binance WebSocket');
		MultiPriceListener.isListening = true;
	}

	private static SocketClose = (): void => {
		console.log(`Price Listener disconnected from Binance Websocket`);
		MultiPriceListener.isListening = false;
	}

	private static SocketMessage = (msg: SocketMessage): void => {
		const msgData: BinanceBookTickerStreamData = JSON.parse(msg.data as string);
		if (ENV.SIMULATE_PRICE_LISTENER) console.log(msgData);
		if (msgData.result === null && msgData.id !== undefined) return MultiPriceListener.ConfirmSymbolSubscription(msgData.id);
		MultiPriceListener.UpdatePrice(msgData.s, msgData.a); // TODO: Clarify whether to use msgData.a or msgData.b?
	}

	private static SocketError = (): void => {
		console.log(`Trader Bot encountered an error while connected to Binance`);
	}

}
