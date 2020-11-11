import { TradingPairPriceData } from '../../models/symbol-price-data';

/*
*
* A service to simply remove trading pairs (symbols) that are not to be traded.
* These can include UP / DOWN (leveraged) pairs which are high risk and aren't traded the same way.
*
* */

export class SymbolPairFiltering {

	public static FilterUnwantedPairs = (
		tradingPairPriceData: TradingPairPriceData[],
		allowedQuotes: string[],
		ignoredPairs: string[]
	): TradingPairPriceData[] =>
		tradingPairPriceData.filter(
			(s: TradingPairPriceData): boolean =>
			!SymbolPairFiltering.isTinyCurrency(s.symbol, s.prices.now - s.prices.sixtySeconds) &&
			!SymbolPairFiltering.isLeveraged(s.symbol) &&
			!SymbolPairFiltering.isIgnoredPair(s.symbol, ignoredPairs) &&
			SymbolPairFiltering.isAllowedQuote(s.symbol, allowedQuotes)
		)

	private static isLeveraged = (symbol: string): boolean => symbol.includes('UP') || symbol.includes('DOWN');

	private static isTinyCurrency = (symbol: string, priceChange: number): boolean => {
		if (symbol.endsWith('USDT') && priceChange < 0.0006) return true;
		if (symbol.endsWith('BTC') && priceChange < 0.00000005) return true;
		if (symbol.endsWith('ETH') && priceChange < 0.0000015) return true;
		return false;
	}

	private static isAllowedQuote = (symbol: string, allowedQuotes: string[]): boolean =>
		!!allowedQuotes.find((q: string): boolean => q === symbol)

	private static isIgnoredPair = (symbol: string, ignoredPairs: string[]): boolean =>
		!!ignoredPairs.find((p: string): boolean => p === symbol)

}
