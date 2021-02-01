import CrudService from '../index';
import { ExchangeCurrencyTransactionFull } from '@crypto-tracker/common-types';

export interface TransactionResponseDto {
	success: boolean;
	transaction: {
		response: ExchangeCurrencyTransactionFull;
	};
}

export default class CrudServiceTransactions extends CrudService {

	public static BuyCurrency = async (symbol: string, base: string, quote: string, quantity: string)
		: Promise<TransactionResponseDto> =>
		CrudService.post2('/transactions/buy', {
			symbol,
			base,
			quote,
			quantity,
			isTest: false
		})

	public static SellCurrency = async (symbol: string, base: string, quote: string, quantity: string)
		: Promise<TransactionResponseDto> =>
		CrudService.post2('/transactions/buy', {
			symbol,
			base,
			quote,
			quantity,
			isTest: false
		})

}
