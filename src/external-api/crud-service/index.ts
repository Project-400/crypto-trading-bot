import { CRUD_SERVICE_URL } from '../../environment';
import { HTTP } from '../http';

export class CrudService {

	protected static async get(path: string): Promise<any> {
		return HTTP.get(`${CRUD_SERVICE_URL}${path}`);
	}

	protected static async post(path: string, postData: any): Promise<any> {
		return HTTP.post(`${CRUD_SERVICE_URL}${path}`, postData);
	}

}
