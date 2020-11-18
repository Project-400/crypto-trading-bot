export interface KlineDataPoint {
	openTime: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	closeTime: number;
	quoteAssetVolume: number;
	numberOfTrades: number;
	takerBuyBaseAssetVolume: number;
	takerBuyQuoteAssetVolume: number;
}

export interface BinanceWebsocketSubscription {
	method: string,
	params: string[],
	id: number
}

export interface BinanceStreamResult {
	result?: any;
	id?: number;
}

export interface BinanceBookTickerStreamData extends BinanceStreamResult {
	u: number,     	// order book updateId
	s: string,     	// symbol
	b: string, 		// best bid price
	B: string, 		// best bid qty
	a: string, 		// best ask price
	A: string  		// best ask qty
}

export interface FillPriceCalculations {
	highest: number;
	lowest: number;
	average: number;
}
