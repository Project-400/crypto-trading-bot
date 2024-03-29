import { CurrencySuggestion } from '@crypto-tracker/common-types';
import { CurrencySuggestionsManager } from './currency-suggestions-manager';
import { BotConductor } from '../bots/bot-conductor';

interface WaitingBot {
	botId: string;
	quoteAmount: number;
	repeatedlyTrade: boolean;
	percentageLoss?: number;
	deployed?: boolean;
}

export class BotWaitingQueue {

	public static waitingBots: WaitingBot[] = [];

	public static AddBot = (bot: WaitingBot): void => {
		bot.deployed = false;
		BotWaitingQueue.waitingBots.push(bot);
	}

	public static SetupBotReadyIntervalChecker = (): void => {
		setInterval(async (): Promise<void> => {
			console.log('WAITING QUEUE CHECK');
			console.log(`${BotWaitingQueue.waitingBots.length} bots waiting`);
			if (!BotWaitingQueue.waitingBots.length) return;
			const suggestions: CurrencySuggestion[] = CurrencySuggestionsManager.suggestions;
			if (!suggestions.length) return;

			const latestSuggestedCurrency: CurrencySuggestion = suggestions[suggestions.length - 1];

			await Promise.all(
				BotWaitingQueue.waitingBots.map(async (b: WaitingBot): Promise<void> => {
					console.log(`The bot ${b.botId} will trade ${latestSuggestedCurrency.symbol}`);
					await BotConductor.deployNewBot(b.botId, false, latestSuggestedCurrency.symbol, b.quoteAmount, b.repeatedlyTrade, b.percentageLoss);

					b.deployed = true;
				})
			);

			BotWaitingQueue.waitingBots = BotWaitingQueue.waitingBots.filter((b: WaitingBot): boolean => !b.deployed); // Remove deployed bots
		}, 5000);

		console.log('Successfully set up Bot Ready interval checker.');
	}

}
