import axios, {AxiosError, AxiosResponse} from "axios";

export class CryptoApi {
  
  public get(): any {
    
  }
  
  public static async post(url: string, postData: any): Promise<any> {
    return await new Promise((resolve: any, reject: any): void => {
      axios.post(url, postData)
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
