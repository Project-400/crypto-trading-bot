import {
  ExchangeInfoSymbol,
  ISymbolTraderData,
  PositionState, 
  SymbolType,
  TransactionFillCommission
} from '@crypto-tracker/common-types';
import { CryptoApi } from '../api/crypto-api';

export class SymbolTraderData implements ISymbolTraderData {

  public symbol: string;
  public base: string;
  public quote: string;
  public lowercaseSymbol: string;
  public baseInitialQty: number = 0; // to do
  public quoteQtySpent: number = 0; // to do
  public baseQty: number = 0;
  public quoteQty: number = 0;
  public profit: number = 0;
  public startPrice: number = 0;
  public currentPrice: number = 0;
  public priceDifference: number = 0;
  public percentageDifference: number = 0;
  public commissions: TransactionFillCommission[] = [];
  public state: PositionState = PositionState.BUY;
  public exchangeInfo?: ExchangeInfoSymbol;
  public baseMinQty: number = 0;
  public baseStepSize: number = 0;
  public highestPriceReached: number = 0;
  public lowestPriceReached: number = 0;
  public symbolType: SymbolType = SymbolType.NONE;
  public percentageDroppedFromHigh: number = 0;
  public times = {
    createdAt: '',
    finishedAt: ''
  };
  public startTime: number;

  constructor(
    symbol: string,
    base: string,
    quote: string,
    symbolType: SymbolType
  ) {
    this.symbol = symbol;
    this.base = base;
    this.quote = quote;
    this.symbolType = symbolType;
    this.lowercaseSymbol = symbol.toLowerCase();
    this.times.createdAt = new Date().toISOString();
    this.startTime = new Date().getTime();
  }

  public updatePrice = (price: number) => {
    if (this.currentPrice) this.calculatePriceChanges(price);
    else {
      this.currentPrice = price;
      this.highestPriceReached = price;
      this.lowestPriceReached = price;
    }
    
    if (this.percentageDroppedFromHigh < -1) {
      this.state = PositionState.SELL;
    }
    // else if (this.percentageDifference > 10) {
    //   this.state = PositionState.SELL;
    // }
    else if (this.state !== PositionState.TIMEOUT_SELL) this.state = PositionState.HOLD;
  }
  
  private calculatePriceChanges = (newPrice: number) => {
    this.priceDifference = this.currentPrice - newPrice;

    if (newPrice > this.highestPriceReached) this.highestPriceReached = newPrice;
    else if (newPrice < this.lowestPriceReached) this.lowestPriceReached = newPrice;
    this.currentPrice = newPrice;

    const tempStartPrice = this.startPrice * 1000;

    const tempNewPrice = newPrice * 1000;
    const tempPriceDifference = tempNewPrice - tempStartPrice;
    
    if (tempNewPrice !== tempStartPrice) this.percentageDifference = (tempPriceDifference / tempStartPrice) * 100;
    else this.percentageDifference = 0;

    const tempHighPrice = this.highestPriceReached * 1000;
    const tempHighPriceDifference = tempNewPrice - tempHighPrice;

    if (tempNewPrice < tempHighPrice) this.percentageDroppedFromHigh = (tempHighPriceDifference / tempHighPrice) * 100;
    else this.percentageDroppedFromHigh = 0;
  }
  
  public logBuy = (buy: any) => {
    const transaction = buy.transaction;
    if (transaction.response && transaction.response.fills) {
      const commission = this.logCommissions(transaction.response.fills);
      this.logPrice(transaction.response.fills);
      this.baseQty += transaction.response.executedQty - (commission.isBase ? commission.total : 0);
      this.quoteQty -= transaction.response.cummulativeQuoteQty;
      this.state = PositionState.HOLD;
    }
  }
  
  public logSell = (sell: any) => {
    const transaction = sell.transaction;
    if (transaction.response && transaction.response.fills) {
      const commission = this.logCommissions(transaction.response.fills);
      this.baseQty -= transaction.response.executedQty;
      this.quoteQty += transaction.response.cummulativeQuoteQty - (commission.isQuote ? commission.total : 0);
      this.state = PositionState.SOLD;
    }
  }

  private logCommissions = (fills: TransactionFillCommission[]): { total: number, isQuote: boolean, isBase: boolean } => {
    this.commissions.push(...fills);
    let total: number = 0;
    let isQuote: boolean = false;
    let isBase: boolean = false;
    fills.map((c: TransactionFillCommission) => {
      isQuote = c.commissionAsset === this.quote; // To be changed - May have multiple commissions
      isBase = c.commissionAsset === this.base;
      total += c.commission;
    });
    return { total, isQuote, isBase };
  }

  private logPrice = (fills: any[]): void => {
    let total: number = 0;
    fills.map((c: any) => total += c.price);
    if (total) {
      const avgPrice = total / fills.length;
      this.startPrice = avgPrice;
      this.currentPrice = avgPrice;
    }
  }
  
  public getExchangeInfo = async () => {
    const response: any = await CryptoApi.get(`/exchange-info/single/${this.symbol}/${this.quote}`);
    if (response.success) this.exchangeInfo = response.info;
    
    if (!this.exchangeInfo) console.error(`No exchange info for ${this.symbol}`);
    
    this.getLotSize();
  }
  
  private getLotSize = () => {
    const lotSizeFilter: any = this.exchangeInfo?.filters.find((f: any) => f.filterType === 'LOT_SIZE');
    if (lotSizeFilter) {
      console.log(`${this.symbol} has a step size limit of ${lotSizeFilter.stepSize}`)
      this.baseMinQty = lotSizeFilter.minQty;
      this.baseStepSize = lotSizeFilter.stepSize;
    }
  }
  
  public getSellQuantity = (): string => {
    let qty: number = 0;
    
    if (this.baseStepSize) {
      const trim: number = this.baseQty % this.baseStepSize;
      qty = this.baseQty - trim;
    } else {
      qty = this.baseQty;
    }
    
    return qty.toFixed(this.exchangeInfo?.quotePrecision);
  }
  
  public finish = () => {
    this.times.finishedAt = new Date().toISOString();
  }

}
