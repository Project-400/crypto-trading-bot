import { CRUD_SERVICE_URL } from '../../environment';
import { HTTP } from '../http';

export default class CrudService {

	protected static async get(path: string): Promise<any> {
		return HTTP.get(`${CRUD_SERVICE_URL}${path}`);
	}

	protected static async post(path: string, postData: any): Promise<any> {
		return HTTP.post(`${CRUD_SERVICE_URL}${path}`, postData);
	}

	protected static async post2(path: string, postData: any): Promise<any> {
		return HTTP.post(`http://localhost:15002${path}`, postData);
	}

}

export interface CrudServiceResponse {
	success: boolean;
}
