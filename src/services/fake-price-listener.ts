import { SocketMessage } from '../config/websocket/connector';
import { BinanceBookTickerStreamData } from '../interfaces/interfaces';
import { SymbolPriceData } from './multi-price-listener';

export class FakePriceListener {

	public static isListening: boolean = false;					// Lowercase version of the symbol, eg. btcusdt
	private static symbols: SymbolPriceData[] = [];				// The symbol string, eg. BTCUSDT
	private static messageInterval: NodeJS.Timeout | undefined;
	private static messageIntervalPeriod: number = 10000;

	public static SubscribeToSymbol = (symbol: string, startingPrice: number): SymbolPriceData => {
		let symbolPriceData: SymbolPriceData = FakePriceListener.GetSymbolPriceData(symbol);

		if (symbolPriceData) {
			symbolPriceData = FakePriceListener.IncrementSubscriptionCount(symbolPriceData);
			symbolPriceData.price = startingPrice.toString();
			symbolPriceData.priceNumerical = startingPrice;
			return symbolPriceData;
		}

		symbolPriceData = FakePriceListener.CreateSub(symbol);

		return symbolPriceData;
	}

	public static UnsubscribeToSymbol = (symbol: string): void => {
		let symbolPriceData: SymbolPriceData = FakePriceListener.GetSymbolPriceData(symbol);

		if (!symbolPriceData) return;

		symbolPriceData = FakePriceListener.DecrementSubscriptionCount(symbolPriceData);

		if (symbolPriceData.subscriptionCount <= 0) {
			FakePriceListener.RemoveSymbol(symbol);
		}
	}

	private static RemoveSymbol = (symbol: string): void => {
		const symbolIndex: number = FakePriceListener.GetSymbolPriceDataIndex(symbol);

		if (symbolIndex > -1) FakePriceListener.symbols.splice(symbolIndex, 1);
	}

	private static CreateSub = (symbol: string): SymbolPriceData => {
		const symbolPriceData: SymbolPriceData = {
			symbol,
			lowercaseSymbol: symbol.toLowerCase(),
			price: '0',
			priceNumerical: 0,
			subscriptionId: new Date().getTime(),
			subscriptionConfirmed: false,
			subscriptionCount: 1
		};

		FakePriceListener.symbols.push(symbolPriceData);

		return symbolPriceData;
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
			FakePriceListener.symbols.find((s: SymbolPriceData): boolean => s.symbol === symbol);
		if (!symbolPriceData) symbolPriceData = FakePriceListener.CreateSub(symbol);
		return symbolPriceData;
	}

	private static GetSymbolPriceDataById = (subscriptionId: number): SymbolPriceData | undefined =>
		FakePriceListener.symbols.find((s: SymbolPriceData): boolean => s.subscriptionId === subscriptionId)

	private static GetSymbolPriceDataIndex = (symbol: string): number =>
		FakePriceListener.symbols.findIndex((s: SymbolPriceData): boolean => s.symbol === symbol)

	public static GetPrice = (symbol: string): string => FakePriceListener.GetSymbolPriceData(symbol).price;

	public static GetPriceNumerical = (symbol: string): number => FakePriceListener.GetSymbolPriceData(symbol).priceNumerical;

	private static UpdatePrice = (symbol: string, price: string): void => {
		// const symbolPriceDataIndex: number = MultiPriceListener.GetSymbolPriceDataIndex(symbol);
		const symbolPriceData: SymbolPriceData | undefined = FakePriceListener.GetSymbolPriceData(symbol);
		if (!symbolPriceData) return;

		symbolPriceData.price = price;
		symbolPriceData.priceNumerical = Number(price);
	}

	private static ConfirmSymbolSubscription = (subscriptionId: number): void => {
		const symbolPriceData: SymbolPriceData | undefined = FakePriceListener.GetSymbolPriceDataById(subscriptionId);
		if (symbolPriceData) symbolPriceData.subscriptionConfirmed = true;
	}

	public static ConnectAndListen = (): void => {
		console.log('Setting up Simulated Price Listener');
		FakePriceListener.isListening = true;

		FakePriceListener.SimulateWebsocketMessages();
	}

	public static StopListening = (): void => {
		FakePriceListener.isListening = false;
	}

	private static SimulateWebsocketMessages = (): void => {
		FakePriceListener.messageInterval = setInterval((): void => {
			FakePriceListener.symbols.map((s: SymbolPriceData): void => {
				FakePriceListener.SocketMessage(({
					u: 123,
					s: s.symbol,
					b: `${s.priceNumerical + (s.priceNumerical * 0.005)}`,
					B: '0',
					a: `${s.priceNumerical + (s.priceNumerical * 0.005)}`,
					A: '0'
				}).toString());
			});
		}, FakePriceListener.messageIntervalPeriod);
	}

	private static SocketMessage = (msg: SocketMessage): void => {
		console.log('SOCKET MESSAGE');
		const msgData: BinanceBookTickerStreamData = JSON.parse(msg.data as string);
		console.log(msgData);
		if (msgData.result === null && msgData.id !== undefined) return FakePriceListener.ConfirmSymbolSubscription(msgData.id);
		FakePriceListener.UpdatePrice(msgData.s, msgData.a); // TODO: Clarify whether to use msgData.a or msgData.b?
	}

}
