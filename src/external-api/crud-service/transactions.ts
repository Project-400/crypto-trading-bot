import { CrudService } from './crud-service';

export default class CrudServiceTransactions extends CrudService {

	public static BuyCurrency = async (symbol: string, base: string, quote: string, quantity: string): Promise<void> =>
		CrudService.post('/transactions/buy', {
			symbol,
			base,
			quote,
			quantity,
			isTest: false
		})

	public static SellCurrency = async (symbol: string, base: string, quote: string, quantity: string): Promise<void> =>
		CrudService.post('/transactions/buy', {
			symbol,
			base,
			quote,
			quantity,
			isTest: false
		})

}
