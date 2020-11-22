import { ExchangeInfoFilterType, ExchangeInfoSymbol } from '@crypto-tracker/common-types';

export const FakeExchangeInfo_COMP: ExchangeInfoSymbol = {
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
		{
			stepSize: '0.00000000',
			filterType: ExchangeInfoFilterType.MARKET_LOT_SIZE,
			maxQty: '2676.64689229',
			minQty: '0.00000000'
		},
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

export const FakeExchangeInfo_GTO: ExchangeInfoSymbol = {
	baseAsset: 'GTO',
	baseAssetPrecision: 8,
	entity: 'exchangeInfo',
	filters: [
		{
			filterType: ExchangeInfoFilterType.PRICE_FILTER,
			maxPrice: '1000.00000000',
			minPrice: '0.00000001',
			tickSize: '0.00000001'
		},
		{
			avgPriceMins: 5,
			filterType: ExchangeInfoFilterType.PERCENT_PRICE,
			multiplierDown: '0.2',
			multiplierUp: '5'
		},
		{
			filterType: ExchangeInfoFilterType.LOT_SIZE,
			maxQty: '90000000.00000000',
			minQty: '1.00000000',
			stepSize: '1.00000000'
		},
		{
			applyToMarket: true,
			avgPriceMins: 5,
			filterType: ExchangeInfoFilterType.MIN_NOTIONAL,
			minNotional: '0.00010000'
		},
		{
			filterType: ExchangeInfoFilterType.ICEBERG_PARTS,
			limit: 10
		},
		{
			filterType: ExchangeInfoFilterType.MARKET_LOT_SIZE,
			maxQty: '8779212.19001387',
			minQty: '0.00000000',
			stepSize: '0.00000000'
		},
		{
			filterType: ExchangeInfoFilterType.MAX_NUM_ORDERS,
			maxNumOrders: 200
		},
		{
			filterType: ExchangeInfoFilterType.MAX_NUM_ALGO_ORDERS,
			maxNumAlgoOrders: 5
		}
	],
	icebergAllowed: true,
	isMarginTradingAllowed: false,
	isSpotTradingAllowed: true,
	ocoAllowed: true,
	orderTypes: [
		'LIMIT',
		'LIMIT_MAKER',
		'MARKET',
		'STOP_LOSS_LIMIT',
		'TAKE_PROFIT_LIMIT'
	],
	permissions: [
		'SPOT'
	],
	pk: 'exchangeInfo#GTOBTC',
	quoteAsset: 'BTC',
	quoteAssetPrecision: 8,
	quotePrecision: 8,
	sk: 'exchangeInfo#GTOBTC',
	sk2: 'quote#BTC',
	sk3: 'base#GTO',
	status: 'TRADING',
	symbol: 'GTOBTC',
	times: {
		createdAt: '2020-11-14T20:48:11.359Z',
		updatedAt: '2020-11-22T20:34:45.713Z'
	}
};
