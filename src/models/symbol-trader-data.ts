import {
  ExchangeInfoSymbol,
  ISymbolTraderData,
  PositionState,
  TransactionFillCommission
} from '@crypto-tracker/common-types';
import axios, { AxiosError, AxiosResponse } from 'axios';

export class SymbolTraderData implements ISymbolTraderData {

  public symbol: string;
  public base: string;
  public quote: string;
  public lowercaseSymbol: string;
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
  public times = {
    createdAt: '',
    finishedAt: ''
  };

  constructor(
    symbol: string,
    base: string,
    quote: string
  ) {
    this.symbol = symbol;
    this.base = base;
    this.quote = quote;
    this.lowercaseSymbol = symbol.toLowerCase();
    this.times.createdAt = new Date().toISOString();
  }

  public updatePrice = (price: number) => {
    if (this.currentPrice) this.calculatePriceChanges(price);
    else this.currentPrice = price
    
    if (this.percentageDifference < -0.4) this.state = PositionState.SELL;
    else if (this.percentageDifference > 1) this.state = PositionState.SELL;
    else this.state = PositionState.HOLD;
  }
  
  private calculatePriceChanges = (newPrice: number) => {
    this.priceDifference = this.currentPrice - newPrice;
    
    const tempNewPrice = newPrice * 1000;
    const tempStartPrice = this.startPrice * 1000;
    const tempPriceDifference = tempNewPrice - tempStartPrice;

    this.currentPrice = newPrice;

    if (tempNewPrice !== tempStartPrice) this.percentageDifference = (tempPriceDifference / tempStartPrice) * 100;
    else this.percentageDifference = 0;
  }
  
  public logBuy = (buy: any) => {
    const transaction = buy.transaction;
    if (transaction.response && transaction.response.fills) {
      const commission: number = this.logCommissions(transaction.response.fills);
      this.logPrice(transaction.response.fills);
      this.baseQty += transaction.response.executedQty - commission;
      this.quoteQty -= transaction.response.cummulativeQuoteQty;
      this.state = PositionState.HOLD;
    }
  }
  
  public logSell = (sell: any) => {
    const transaction = sell.transaction;
    if (transaction.response && transaction.response.fills) {
      const commission: number = this.logCommissions(transaction.response.fills);
      this.baseQty -= transaction.response.executedQty;
      this.quoteQty += transaction.response.cummulativeQuoteQty - commission;
      this.state = PositionState.SOLD;
    }
  }

  private logCommissions = (fills: TransactionFillCommission[]): number => {
    this.commissions.push(...fills);
    let total: number = 0;
    fills.map((c: TransactionFillCommission) => total += c.commission);
    return total;
  }

  private logPrice = (fills: any[]): void => {
    let total: number = 0;
    fills.map((c: any) => total += c.price);
    const avgPrice = total / fills.length;
    this.startPrice = avgPrice;
    this.currentPrice = avgPrice;
  }
  
  public getExchangeInfo = async () => {
    this.exchangeInfo = await new Promise((resolve: any, reject: any): void => {
      axios.get(`https://w0sizekdyd.execute-api.eu-west-1.amazonaws.com/dev/exchange-info/single/${this.symbol}/${this.quote}`)
        .then((res: AxiosResponse) => {
          if (res.status === 200 && res.data.success) resolve(res.data.info);
        })
        .catch((error: AxiosError) => {
          console.error(error);
          reject(error);
        });
    });

    console.log(this.exchangeInfo)
    
    if (!this.exchangeInfo) console.error(`No exchange info for ${this.symbol}`);
    
    const lotSizeFilter: any = this.exchangeInfo?.filters.find((f: any) => f.filterType === 'LOT_SIZE');
    if (lotSizeFilter) {
      console.log(`${this.symbol} has a step size limit of ${lotSizeFilter.stepSize}`)
      this.baseMinQty = lotSizeFilter.minQty;
      this.baseStepSize = lotSizeFilter.stepSize;
    }
  }
  
  public getSellQuantity = (): number => {
    if (this.baseStepSize) {
      const trim: number = this.baseQty % this.baseStepSize;
      return this.baseQty - trim;
    }
    
    return this.baseQty;
  }
  
  public finish = () => {
    this.times.finishedAt = new Date().toISOString();
  }

}
