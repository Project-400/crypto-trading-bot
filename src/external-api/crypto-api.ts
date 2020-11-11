import { CrudServiceUrl } from '../environment';
import { HTTP } from './http';

export class CryptoApi {

	public static async get(path: string): Promise<any> {
		return HTTP.get(`${CrudServiceUrl}${path}`);
	}

	public static async post(path: string, postData: any): Promise<any> {
		return HTTP.post(`${CrudServiceUrl}${path}`, postData);
	}

}
