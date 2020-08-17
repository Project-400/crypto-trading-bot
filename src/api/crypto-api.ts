import axios, {AxiosError, AxiosResponse} from "axios";
import { CryptoApiUrl } from '../settings';

export class CryptoApi {
  
  public static async get(path: string): Promise<any> {
    return await new Promise((resolve: any, reject: any): void => {
      axios.get(`${CryptoApiUrl}${path}`)
        .then((res: AxiosResponse) => {
          if (res.status === 200) resolve(res.data);
          else reject(res);
        })
        .catch((error: AxiosError) => {
          console.error(error);
          reject(error);
        });
    });
  }
  
  public static async post(path: string, postData: any): Promise<any> {
    return await new Promise((resolve: any, reject: any): void => {
      axios.post(`${CryptoApiUrl}${path}`, postData)
        .then((res: AxiosResponse) => {
          if (res.status === 200) resolve(res.data);
          else reject(res);
        })
        .catch((error: AxiosError) => {
          console.error(error);
          reject(error);
        });
    });
  }
  
}
