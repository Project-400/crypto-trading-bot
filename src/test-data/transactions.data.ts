import { ExchangeCurrencyTransactionFull } from '@crypto-tracker/common-types';
import {
	BinanceOrderStatus,
	BinanceTimeInForce,
	BinanceTransactionSide,
	BinanceTransactionType
} from '@crypto-tracker/common-types/lib/enums';

export const FakeBuyTransaction_BNB_Commission: ExchangeCurrencyTransactionFull = {
	clientOrderId: 'qXVLGZLQmkfaugdggBIgK8',
	cummulativeQuoteQty: '0.00010306',
	executedQty: '0.01300000',
	fills: [
		{
			commission: '0.00004442',
			commissionAsset: 'BNB',
			price: '0.00792800',
			qty: '0.01300000',
			tradeId: 2118656
		}
	],
	orderId: 56985724,
	orderListId: -1,
	origQty: '0.01300000',
	price: '0.00000000',
	side: BinanceTransactionSide.BUY,
	status: BinanceOrderStatus.FILLED,
	symbol: 'COMPBTC',
	timeInForce: BinanceTimeInForce.GTC,
	transactTime: 1605458535616,
	type: BinanceTransactionType.MARKET
};

export const FakeBuyTransaction_COMP_Commission: ExchangeCurrencyTransactionFull = {
	clientOrderId: 'krNPRX1fG2OB7wLkGT38gX',
	cummulativeQuoteQty: '0.00010480',
	executedQty: '0.01400000',
	fills: [
		{
			commission: '0.00001400',
			commissionAsset: 'COMP',
			price: '0.00748600',
			qty: '0.01400000',
			tradeId: 2128193
		}
	],
	orderId: 57397308,
	orderListId: -1,
	origQty: '0.01400000',
	price: '0.00000000',
	side: BinanceTransactionSide.BUY,
	status: BinanceOrderStatus.FILLED,
	symbol: 'COMPBTC',
	timeInForce: BinanceTimeInForce.GTC,
	transactTime: 1605512698211,
	type: BinanceTransactionType.MARKET
};

export const FakeBuyTransaction_BNB_DoubleCommission: ExchangeCurrencyTransactionFull = {
	clientOrderId: 'qXVLGZLQmkfaugdggBIgK8',
	cummulativeQuoteQty: '0.00010306',
	executedQty: '0.01300000',
	fills: [
		{
			commission: '0.00003333',
			commissionAsset: 'BNB',
			price: '0.00792800',
			qty: '0.00975000',
			tradeId: 2118656
		},
		{
			commission: '0.00001111',
			commissionAsset: 'BNB',
			price: '0.00792900',
			qty: '0.00325000',
			tradeId: 2118657
		}
	],
	orderId: 56985724,
	orderListId: -1,
	origQty: '0.01300000',
	price: '0.00000000',
	side: BinanceTransactionSide.BUY,
	status: BinanceOrderStatus.FILLED,
	symbol: 'COMPBTC',
	timeInForce: BinanceTimeInForce.GTC,
	transactTime: 1605458535616,
	type: BinanceTransactionType.MARKET
};

export const FakeBuyTransaction_COMP_DoubleCommission: ExchangeCurrencyTransactionFull = {
	clientOrderId: 'krNPRX1fG2OB7wLkGT38gX',
	cummulativeQuoteQty: '0.00010480',
	executedQty: '0.01400000',
	fills: [
		{
			commission: '0.00001050',
			commissionAsset: 'COMP',
			price: '0.00748600',
			qty: '0.01050000',
			tradeId: 2128193
		},
		{
			commission: '0.00000350',
			commissionAsset: 'COMP',
			price: '0.00748500',
			qty: '0.003500000',
			tradeId: 2128194
		}
	],
	orderId: 57397308,
	orderListId: -1,
	origQty: '0.01400000',
	price: '0.00000000',
	side: BinanceTransactionSide.BUY,
	status: BinanceOrderStatus.FILLED,
	symbol: 'COMPBTC',
	timeInForce: BinanceTimeInForce.GTC,
	transactTime: 1605512698211,
	type: BinanceTransactionType.MARKET
};

export const FakeBuyTransaction_Mixed_Commission: ExchangeCurrencyTransactionFull = {
	clientOrderId: 'krNPRX1fG2OB7wLkGT38gX',
	cummulativeQuoteQty: '0.00010480',
	executedQty: '0.01400000',
	fills: [
		{
			commission: '0.00000700',
			commissionAsset: 'COMP',
			price: '0.00748600',
			qty: '0.00700000',
			tradeId: 2128072
		},
		{
			commission: '0.00001740',
			commissionAsset: 'BNB',
			price: '0.00748600',
			qty: '0.00525000',
			tradeId: 2128073
		},
		{
			commission: '0.00000580',
			commissionAsset: 'BNB',
			price: '0.00748700',
			qty: '0.00175000',
			tradeId: 2128074
		}
	],
	orderId: 57397308,
	orderListId: -1,
	origQty: '0.01400000',
	price: '0.00000000',
	side: BinanceTransactionSide.BUY,
	status: BinanceOrderStatus.FILLED,
	symbol: 'COMPBTC',
	timeInForce: BinanceTimeInForce.GTC,
	transactTime: 1605512698211,
	type: BinanceTransactionType.MARKET
};

export const FakeBuyTransaction_GTO_BNB_Commission: ExchangeCurrencyTransactionFull = {
	clientOrderId: 'uzY3VWGBmd6IcfozDqrfFn',
	cummulativeQuoteQty: '0.00010988',
	executedQty: '268.00000000',
	fills: [
		{
			commission: '0.00005037',
			commissionAsset: 'BNB',
			price: '0.00000041',
			qty: '0.01300000',
			tradeId: 9072958
		}
	],
	orderId: 66189006,
	orderListId: -1,
	origQty: '268.00000000',
	price: '0.00000000',
	side: BinanceTransactionSide.BUY,
	status: BinanceOrderStatus.FILLED,
	symbol: 'GTOBTC',
	timeInForce: BinanceTimeInForce.GTC,
	transactTime: 1606077286556,
	type: BinanceTransactionType.MARKET
};
