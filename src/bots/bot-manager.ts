import ShortTermTraderBot from './short-term-trader-bot';
import CrudServiceExchangeInfo, { GetExchangeInfoResponseDto } from '../external-api/crud-service/services/exchange-info';

export class BotManager {

	private static deployedBots: ShortTermTraderBot[] = [];

	public static getAllBots = (): ShortTermTraderBot[] => BotManager.deployedBots;

	public static getBot = (botId: string): ShortTermTraderBot | undefined =>
		BotManager.deployedBots.find((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	private static getBotIndex = (botId: string): number =>
		BotManager.deployedBots.findIndex((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	public static deployNewBot = async (botId: string, currency: string, quoteAmount: number): Promise<ShortTermTraderBot | undefined> => {
		if (BotManager.getBot(botId)) throw Error('Bot already exists');

		const exchangeInfo: GetExchangeInfoResponseDto = await CrudServiceExchangeInfo.GetExchangeInfo(currency);

		console.log();
		console.log(exchangeInfo);
		console.log();
		// const exchangeInfo: any = { success: true, info: true };
		let bot: ShortTermTraderBot | undefined;

		if (exchangeInfo.success) {
			bot = new ShortTermTraderBot(botId, exchangeInfo.info.baseAsset, exchangeInfo.info.quoteAsset,
				'currency', quoteAmount, true, exchangeInfo.info);
			BotManager.deployedBots.push(bot);
			// const buyData: any = await bot.Start(); // To be removed
			// return buyData;
		}

		return bot;
	}

	public static shutdownBot = async (botId: string): Promise<void> => {
		const botIndex: number = BotManager.getBotIndex(botId);
		console.log('Stopping bot at index ' + botIndex);
		if (botIndex > -1) {
			console.log('2) Stopping bot at index ' + botIndex);
			await BotManager.deployedBots[botIndex].Stop();
			BotManager.deployedBots.splice(botIndex, 1);
		}
	}

	public static pauseBot = (botId: string): void => {
		const botIndex: number = BotManager.getBotIndex(botId);
		if (botIndex > -1) BotManager.deployedBots[botIndex].Pause();
	}

	public static shutdownAllBots = (): number => {
		const count: number = BotManager.deployedBots.length;

		// BotManager.deployedBots.map((bot: ShortTermTraderBot): void => bot.Stop());
		BotManager.deployedBots = [];

		return count;
	}

}
