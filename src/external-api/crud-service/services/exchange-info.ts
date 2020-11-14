import CrudService, { CrudServiceResponse } from '../index';
import { ExchangeInfoSymbol } from '@crypto-tracker/common-types';

export default class CrudServiceExchangeInfo extends CrudService {

	private static SERVICE_PATH: string = '/exchange-info';

	public static GetExchangeInfo = async (symbol: string): Promise<GetExchangeInfoResponseDto> =>
		CrudService.get(`${CrudServiceExchangeInfo.SERVICE_PATH}/single/${symbol}`)

}

export interface GetExchangeInfoResponseDto extends CrudServiceResponse {
	info: ExchangeInfoSymbol;
}
