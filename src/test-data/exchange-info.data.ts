import { ExchangeInfoFilterType, ExchangeInfoSymbol } from '@crypto-tracker/common-types';

export const FakeExchangeInfo: ExchangeInfoSymbol = {
	pk: 'exchangeInfo#COMPBTC',
	sk: 'exchangeInfo#COMPBTC',
	sk2: 'quote#BTC',
	sk3: 'base#COMP',
	entity: 'exchangeInfo',
	symbol: 'COMPBTC',
	status: 'TRADING',
	baseAsset: 'COMP',
	baseAssetPrecision: 8,
	quoteAsset: 'BTC',
	quotePrecision: 8,
	quoteAssetPrecision: 8,
	orderTypes: [
		'LIMIT',
		'LIMIT_MAKER',
		'MARKET',
		'STOP_LOSS_LIMIT',
		'TAKE_PROFIT_LIMIT'
	],
	icebergAllowed: true,
	ocoAllowed: true,
	isSpotTradingAllowed: true,
	isMarginTradingAllowed: true,
	filters: [
		{
			maxPrice: '1000.00000000',
			filterType: ExchangeInfoFilterType.PRICE_FILTER,
			minPrice: '0.00000100',
			tickSize: '0.00000100'
		},
		{
			avgPriceMins: 5,
			multiplierDown: '0.2',
			multiplierUp: '5',
			filterType: ExchangeInfoFilterType.PERCENT_PRICE
		},
		{
			stepSize: '0.00100000',
			filterType: ExchangeInfoFilterType.LOT_SIZE,
			maxQty: '10000000.00000000',
			minQty: '0.00100000'
		},
		{
			avgPriceMins: 5,
			filterType: ExchangeInfoFilterType.MIN_NOTIONAL,
			applyToMarket: true,
			minNotional: '0.00010000'
		},
		{
			filterType: ExchangeInfoFilterType.ICEBERG_PARTS,
			limit: 10
		},
		// {
		// 	stepSize: '0.00000000',
		// 	filterType: 'MARKET_LOT_SIZE',
		// 	maxQty: '2676.64689229',
		// 	minQty: '0.00000000'
		// },
		{
			filterType: ExchangeInfoFilterType.MAX_NUM_ALGO_ORDERS,
			maxNumAlgoOrders: 5
		},
		{
			filterType: ExchangeInfoFilterType.MAX_NUM_ORDERS,
			maxNumOrders: 200
		}
	],
	permissions: [
		'SPOT',
		'MARGIN'
	],
	times: {
		createdAt: '2020-11-14T20:48:11.865Z',
		updatedAt: '2020-11-17T18:30:15.334Z'
	}
};
