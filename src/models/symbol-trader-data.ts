// import {
// 	ExchangeInfoSymbol,
// 	ISymbolTraderData,
// 	PositionState,
// 	SymbolType,
// 	TransactionFillCommission
// } from '@crypto-tracker/common-types';
//
// export class SymbolTraderData implements ISymbolTraderData {
//
// 	public symbol: string;
// 	public base: string;
// 	public quote: string;
// 	public lowercaseSymbol: string;
// 	public baseInitialQty: number = 0; // to do
// 	public quoteQtySpent: number = 0; // to do
// 	public baseQty: number = 0;
// 	public quoteQty: number = 0;
// 	public profit: number = 0;
// 	public startPrice: number = 0;
// 	public currentPrice: number = 0;
// 	public priceDifference: number = 0;
// 	public percentageDifference: number = 0;
// 	public commissions: TransactionFillCommission[] = [];
// 	public state: PositionState = PositionState.BUY;
// 	public exchangeInfo?: ExchangeInfoSymbol;
// 	public baseMinQty: number = 0;
// 	public baseStepSize: number = 0;
// 	public highestPriceReached: number = 0;
// 	public lowestPriceReached: number = 0;
// 	// public symbolType: SymbolType = SymbolType.NONE;
// 	public percentageDroppedFromHigh: number = 0;
// 	public times: { createdAt: string; finishedAt: string } = {
// 		createdAt: '',
// 		finishedAt: ''
// 	};
// 	public startTime: number;
//
// 	public constructor(symbol: string, base: string, quote: string) {
// 		this.symbol = symbol;
// 		this.base = base;
// 		this.quote = quote;
// 		this.lowercaseSymbol = symbol.toLowerCase();
// 		this.times.createdAt = new Date().toISOString();
// 		this.startTime = new Date().getTime();
// 	}
//
// 	public updatePrice = (price: number): void => {
// 		if (this.currentPrice) this.calculatePriceChanges(price);
// 		else {
// 			this.currentPrice = price;
// 			this.highestPriceReached = price;
// 			this.lowestPriceReached = price;
// 		}
//
// 		if (this.percentageDroppedFromHigh < -1) {
// 			this.state = PositionState.SELL;
// 		} else if (this.state !== PositionState.TIMEOUT_SELL) this.state = PositionState.HOLD;
// 		// else if (this.percentageDifference > 10) {
// 		//   this.state = PositionState.SELL;
// 		// }
// 	}
//
// 	private calculatePriceChanges = (newPrice: number): void => {
// 		this.priceDifference = this.currentPrice - newPrice;
//
// 		if (newPrice > this.highestPriceReached) this.highestPriceReached = newPrice;
// 		else if (newPrice < this.lowestPriceReached) this.lowestPriceReached = newPrice;
// 		this.currentPrice = newPrice;
//
// 		const tempStartPrice: number = this.startPrice * 1000;
//
// 		const tempNewPrice: number = newPrice * 1000;
// 		const tempPriceDifference: number = tempNewPrice - tempStartPrice;
//
// 		if (tempNewPrice !== tempStartPrice) this.percentageDifference = (tempPriceDifference / tempStartPrice) * 100;
// 		else this.percentageDifference = 0;
//
// 		const tempHighPrice: number = this.highestPriceReached * 1000;
// 		const tempHighPriceDifference: number = tempNewPrice - tempHighPrice;
//
// 		if (tempNewPrice < tempHighPrice) this.percentageDroppedFromHigh = (tempHighPriceDifference / tempHighPrice) * 100;
// 		else this.percentageDroppedFromHigh = 0;
// 	}
//
// 	public logBuy = (buy: any): void => {
// 		console.log(buy);
// 		const transaction: any = buy.transaction;
// 		if (transaction.response && transaction.response.fills) {
// 			const commission: { total: number; isQuote: boolean; isBase: boolean } = this.logCommissions(transaction.response.fills);
// 			console.log('commission');
// 			console.log(commission);
// 			this.logPrice(transaction.response.fills);
// 			this.baseQty += transaction.response.executedQty - (commission.isBase ? commission.total : 0);
// 			console.log(this.baseQty);
// 			this.quoteQty -= transaction.response.cummulativeQuoteQty;
// 			console.log(this.quoteQty);
// 			this.state = PositionState.HOLD;
// 		}
// 	}
//
// 	public logSell = (sell: any): void => {
// 		const transaction: any = sell.transaction;
// 		if (transaction.response && transaction.response.fills) {
// 			const commission: { total: number; isQuote: boolean; isBase: boolean } = this.logCommissions(transaction.response.fills);
// 			this.baseQty -= transaction.response.executedQty;
// 			this.quoteQty += transaction.response.cummulativeQuoteQty - (commission.isQuote ? commission.total : 0);
// 			this.state = PositionState.SOLD;
// 		}
// 	}
//
// 	private logCommissions = (fills: TransactionFillCommission[]): { total: number; isQuote: boolean; isBase: boolean } => {
// 		this.commissions.push(...fills);
// 		let total: number = 0;
// 		let isQuote: boolean = false;
// 		let isBase: boolean = false;
// 		fills.map((c: TransactionFillCommission): void => {
// 			console.log(c);
// 			isQuote = c.commissionAsset === this.quote; // To be changed - May have multiple commissions
// 			isBase = c.commissionAsset === this.base;
// 			total += c.commission;
// 		});
// 		return { total, isQuote, isBase };
// 	}
//
// 	private logPrice = (fills: any[]): void => {
// 		let total: number = 0;
// 		fills.map((c: any): void => total += c.price);
// 		if (total) {
// 			const avgPrice: number = total / fills.length;
// 			this.startPrice = avgPrice;
// 			this.currentPrice = avgPrice;
// 		}
// 	}
//
// 	public getExchangeInfo = async (): Promise<void> => {
// 		const response: any = await CrudService.get(`/exchange-info/single/${this.symbol}/${this.quote}`);
// 		if (response.success) this.exchangeInfo = response.info;
//
// 		if (!this.exchangeInfo) console.error(`No exchange info for ${this.symbol}`);
//
// 		this.getLotSize();
// 	}
//
// 	private getLotSize = (): void => {
// 		const lotSizeFilter: any = this.exchangeInfo?.filters.find((f: any): boolean => f.filterType === 'LOT_SIZE');
// 		if (lotSizeFilter) {
// 			console.log(`${this.symbol} has a step size limit of ${lotSizeFilter.stepSize}`);
// 			this.baseMinQty = lotSizeFilter.minQty;
// 			this.baseStepSize = lotSizeFilter.stepSize;
// 		}
// 	}
//
// 	public getSellQuantity = (): string => {
// 		let qty: number = 0;
//
// 		if (this.baseStepSize) {
// 			const trim: number = this.baseQty % this.baseStepSize;
// 			qty = this.baseQty - trim;
//
// 			console.log(this.baseQty);
// 			console.log('1');
// 			console.log(trim);
// 			console.log(qty);
//
// 		} else {
// 			qty = this.baseQty;
// 			console.log(this.baseQty);
// 			console.log('2');
// 			console.log(qty);
// 		}
//
// 		qty = this.baseQty - (this.baseQty / 800);
//
// 		console.log('QTY');
// 		console.log(qty);
//
// 		return qty.toFixed(this.exchangeInfo?.quotePrecision);
// 	}
//
// 	public finish = (): void => {
// 		this.times.finishedAt = new Date().toISOString();
// 	}
//
// }
