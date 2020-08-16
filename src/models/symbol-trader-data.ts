export class SymbolTraderData {

  public symbol: string;
  public lowercaseSymbol: string;
  public prices: number[] = [];

  constructor(
    symbol: string
  ) {
    this.symbol = symbol;
    this.lowercaseSymbol = symbol.toLowerCase();
  }

  public updatePrice = (price: number) => {
    this.prices.push(price);
  }

}
