import { CryptoApiUrl } from '../settings';
import { HTTP } from './http';

export class CryptoApi {
  
  public static async get(path: string): Promise<any> {
    return await HTTP.get(`${CryptoApiUrl}${path}`);
  }
  
  public static async post(path: string, postData: any): Promise<any> {
    return await HTTP.post(`${CryptoApiUrl}${path}`, postData);
  }
  
}
