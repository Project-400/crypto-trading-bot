import ShortTermTraderBot from './short-term-trader-bot';
import CrudServiceExchangeInfo, { GetExchangeInfoResponseDto } from '../external-api/crud-service/services/exchange-info';
import { v4 as uuid } from 'uuid';
import { RedisActions } from '../redis/redis';

export class BotManager {

	private static deployedBots: ShortTermTraderBot[] = [];

	public static getAllBots = (): ShortTermTraderBot[] => BotManager.deployedBots;

	public static getBotCount = (): number => BotManager.deployedBots.length;

	public static getBot = (botId: string): ShortTermTraderBot | undefined =>
		BotManager.deployedBots.find((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	private static getBotIndex = (botId: string): number =>
		BotManager.deployedBots.findIndex((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	// public static deployNewBot = async (currency: string, quoteAmount: number, repeatedlyTrade: boolean,
	// clientSocketId?: string, percentageLoss?: number): Promise<ShortTermTraderBot | undefined> => {
	public static deployNewBot = async (botId: string, currency: string, quoteAmount: number, repeatedlyTrade: boolean, percentageLoss: number = 1)
		: Promise<ShortTermTraderBot | undefined> => {

		const exchangeInfo: GetExchangeInfoResponseDto = await CrudServiceExchangeInfo.GetExchangeInfo(currency);

		// const exchangeInfo: any = { success: true, info: true };
		let bot: ShortTermTraderBot | undefined;
		let clonedBot: ShortTermTraderBot | undefined;

		if (exchangeInfo.success) {
			bot = new ShortTermTraderBot(botId, exchangeInfo.info.baseAsset, exchangeInfo.info.quoteAsset,
				currency, quoteAmount, repeatedlyTrade, exchangeInfo.info,
				percentageLoss, []);
				// percentageLoss, clientSocketId ? [ clientSocketId ] : undefined);

			if (bot) clonedBot = { ...bot } as ShortTermTraderBot;
			BotManager.deployedBots.push(bot);
			bot.Start();
		}

		return clonedBot;
	}

	public static shutdownBot = async (botId: string): Promise<boolean> => {
		const botIndex: number = BotManager.getBotIndex(botId);

		if (botIndex > -1) {
			await BotManager.deployedBots[botIndex].Stop(true);
			BotManager.deployedBots.splice(botIndex, 1);
			return true;
		}

		return false;
	}

	public static pauseBot = (botId: string): void => {
		const botIndex: number = BotManager.getBotIndex(botId);
		if (botIndex > -1) BotManager.deployedBots[botIndex].Pause();
	}

	public static shutdownAllBots = (): number => {
		const count: number = BotManager.deployedBots.length;

		BotManager.deployedBots.map(async (bot: ShortTermTraderBot): Promise<void> => bot.Stop());
		BotManager.deployedBots = [];

		return count;
	}

}
