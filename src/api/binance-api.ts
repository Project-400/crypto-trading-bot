import { BinanceAPI } from '../settings';
import { HTTP } from './http';

export class BinanceApi {

	public static async getKlineData(symbol: string, interval: string, limit: number): Promise<any> {
		return HTTP.get(`${BinanceAPI}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
	}

}
