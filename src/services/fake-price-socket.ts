import { SymbolPriceData } from './multi-price-listener';
import { SocketMessage } from '../config/websocket/connector';

export class FakePriceSocket {

	private static messageInterval: NodeJS.Timeout | undefined;
	private static messageIntervalPeriod: number = 10000;
	private static prevPrices: { [symbol: string]: number } = {
		ALPHABTC: 2.5,
		SUSHIUSDT: 32
	};

	public static SimulateWebsocketMessages = (symbols: SymbolPriceData[], receiveFunc: (msg: SocketMessage) => void): void => {
		FakePriceSocket.messageInterval = setInterval((): void => {
			console.log('Run check');
			console.log(symbols);

			symbols.map((s: SymbolPriceData): void => {
				const currentPrice: number = FakePriceSocket.prevPrices[s.symbol];
				console.log('currentPrice');
				console.log(currentPrice);
				const newPrice: number = currentPrice + (currentPrice * 0.005);
				console.log(newPrice);
				FakePriceSocket.prevPrices[s.symbol] = newPrice;

				receiveFunc({
					data: `{"u":123,"s":"${s.symbol}","b":"${newPrice}","B":"0","a":"${newPrice}","A":"0"}`
				});
			});
		}, FakePriceSocket.messageIntervalPeriod);
	}

}