import { BinanceAPI, CryptoApiUrl } from '../settings';
import { HTTP } from './http';

export class BinanceApi {

  public static async getKlineData(symbol: string): Promise<any> {
    return await HTTP.get(`${BinanceAPI}/api/v3/klines?symbol=${symbol}&interval=1m`);
  }

}
