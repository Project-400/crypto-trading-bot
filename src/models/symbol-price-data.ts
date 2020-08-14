export class SymbolPriceData {
  
  public symbol: string;
  public prices: PriceTimes = {
    now: 0,
    tenSeconds: 0,
    twentySeconds: 0,
    thirtySeconds: 0,
    fortySeconds: 0,
    fiftySeconds: 0,
    sixtySeconds: 0
  }
  
  constructor(
    symbol: string,
    price: number
  ) {
    this.symbol = symbol;
    this.prices.now = price;
  }
  
  public updatePrice = (price: number) => {
    const currentPrices = this.prices;

    this.prices = {
      now: price,
      tenSeconds: currentPrices.now,
      twentySeconds: currentPrices.tenSeconds,
      thirtySeconds: currentPrices.twentySeconds,
      fortySeconds: currentPrices.thirtySeconds,
      fiftySeconds: currentPrices.fortySeconds,
      sixtySeconds: currentPrices.fiftySeconds
    }
  }
  
}

interface PriceTimes {
  now: number;
  tenSeconds: number;
  twentySeconds: number;
  thirtySeconds: number;
  fortySeconds: number;
  fiftySeconds: number;
  sixtySeconds: number;
}
