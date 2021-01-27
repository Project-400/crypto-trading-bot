import { BinanceAPI } from '../environment';
import { HTTP } from './http';

export class BinanceApi {

	public static async getKlineData(symbol: string, interval: string, limit: number): Promise<any> {
		return HTTP.get(`${BinanceAPI}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
	}

	public static async getCurrentPrice(symbol: string): Promise<any> {
		return HTTP.get(`${BinanceAPI}/api/v3/ticker/price?symbol=${symbol}`);
	}

}
