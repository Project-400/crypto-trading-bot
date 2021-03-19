import { CurrencySuggestion } from '@crypto-tracker/common-types';

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

export class CurrencySuggestions {

	public static suggestions: CurrencySuggestion[] = [];

	public static AddSuggestion = (suggestion: CurrencySuggestion): void => {
		console.log('Received Suggestion: ', suggestion);

		const existingSymbolSuggestionIndex: number =
			CurrencySuggestions.suggestions.findIndex((s: CurrencySuggestion): boolean => s.symbol === suggestion.symbol);

		if (existingSymbolSuggestionIndex > -1) CurrencySuggestions.suggestions.splice(existingSymbolSuggestionIndex, 1);

		CurrencySuggestions.suggestions.push(suggestion);

		console.log('All Suggestions: ', CurrencySuggestions.suggestions);
	}

}
