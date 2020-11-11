import { TradingPairPriceData } from '../models/symbol-price-data';

export class MarketAlgorithms {

	public static findHighestGainer = (symbol: TradingPairPriceData, highestGain: number):
		{ symbol: TradingPairPriceData; highestGain: number } => {
		if (!highestGain) return {
			symbol,
			highestGain: Math.max(...Object.values(symbol.pricePercentageChanges))
		};

		if (
			symbol.pricePercentageChanges.now > highestGain ||
			symbol.pricePercentageChanges.tenSeconds > highestGain ||
			symbol.pricePercentageChanges.twentySeconds > highestGain ||
			symbol.pricePercentageChanges.thirtySeconds > highestGain ||
			symbol.pricePercentageChanges.fortySeconds > highestGain ||
			symbol.pricePercentageChanges.sixtySeconds > highestGain
		) return {
			symbol,
			highestGain: Math.max(...Object.values(symbol.pricePercentageChanges))
		};

		return {
			symbol,
			highestGain
		};
	}

	public static findBestClimber = (symbol: TradingPairPriceData, current?: TradingPairPriceData): TradingPairPriceData => {
		if (!current) return symbol;

		return (
			symbol.pricePercentageChanges.sixtySeconds > current.pricePercentageChanges.sixtySeconds &&
			symbol.prices.now >= symbol.prices.tenSeconds &&
			symbol.prices.tenSeconds >= symbol.prices.twentySeconds &&
			symbol.prices.twentySeconds >= symbol.prices.thirtySeconds &&
			symbol.prices.thirtySeconds >= symbol.prices.fortySeconds &&
			symbol.prices.fortySeconds >= symbol.prices.fiftySeconds &&
			symbol.prices.fiftySeconds >= symbol.prices.sixtySeconds &&
			symbol.pricePercentageChanges.tenSeconds >= 0 &&
			symbol.pricePercentageChanges.twentySeconds >= 0 &&
			symbol.pricePercentageChanges.thirtySeconds >= 0 &&
			symbol.pricePercentageChanges.fortySeconds >= 0 &&
			symbol.pricePercentageChanges.fiftySeconds >= 0 &&
			symbol.pricePercentageChanges.sixtySeconds >= 0
		) ? symbol : current;
	}

	public static findHighestRecentLeaper = (symbol: TradingPairPriceData, current?: TradingPairPriceData): TradingPairPriceData => {
		if (!current) return symbol;

		return (symbol.pricePercentageChanges.tenSeconds > current.pricePercentageChanges.tenSeconds) ? symbol : current;
	}

	public static findHighestAverageGainer = (symbol: TradingPairPriceData, highestAvg: number):
		{ symbol: TradingPairPriceData; highestAvg: number } => {
		const avg: number = (
			symbol.pricePercentageChanges.now +
			symbol.pricePercentageChanges.tenSeconds +
			symbol.pricePercentageChanges.twentySeconds +
			symbol.pricePercentageChanges.thirtySeconds +
			symbol.pricePercentageChanges.fortySeconds +
			symbol.pricePercentageChanges.sixtySeconds
		) / 6;

		if (!highestAvg) return {
			symbol,
			highestAvg: avg
		};

		if (avg > highestAvg) return {
			symbol,
			highestAvg: avg
		};

		return {
			symbol,
			highestAvg
		};
	}

}
