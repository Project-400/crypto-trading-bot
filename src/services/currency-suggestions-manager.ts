import { CurrencySuggestion } from '@crypto-tracker/common-types';
import moment from 'moment';

/*
*
* This is used to store data received from the Price Monitor Service (external).
* The Price monitor listens to the market prices and dispatches messages to a SNS topic.
* This app is listening to an SQS queue that is subscribed to the topic.
* Messages received will contain specific currencies that are doing well.
* Any bots deployed in this app that are open to suggestions (user has not selected a currency)
* can and will trade these suggested currencies.
*
* */

export class CurrencySuggestionsManager {

	public static suggestions: CurrencySuggestion[] = [];

	public static AddSuggestion = (suggestion: CurrencySuggestion): void => {
		console.log('Received Suggestion: ', suggestion);

		CurrencySuggestionsManager.RemoveSuggestion(suggestion.symbol);
		CurrencySuggestionsManager.suggestions.push(suggestion);

		console.log('All Suggestions: ', CurrencySuggestionsManager.suggestions);
	}

	public static RemoveSuggestion = (symbol: string): void => {
		const existingSymbolSuggestionIndex: number =
			CurrencySuggestionsManager.suggestions.findIndex((s: CurrencySuggestion): boolean => s.symbol === symbol);

		if (existingSymbolSuggestionIndex > -1) CurrencySuggestionsManager.suggestions.splice(existingSymbolSuggestionIndex, 1);
	}

	public static SetupExpirationChecker = (): void => {
		setInterval((): void => {
			if (!CurrencySuggestionsManager.suggestions.length) return;

			const date: moment.Moment = moment(new Date());

			CurrencySuggestionsManager.suggestions = [
				...CurrencySuggestionsManager.suggestions.filter((s: CurrencySuggestion): boolean =>
					date.isBefore(moment(s.expirationTime)))
			];
		}, 10000);

		console.log('Successfully set up Price Suggestions expiration checker.');
	}

}
