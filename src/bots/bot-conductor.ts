import ShortTermTraderBot from './short-term-trader-bot';
import CrudServiceExchangeInfo, { GetExchangeInfoResponseDto } from '../external-api/crud-service/services/exchange-info';
import { TradingBotState } from '@crypto-tracker/common-types';

export class BotConductor {

	private static deployedBots: ShortTermTraderBot[] = [];
	private static interval: NodeJS.Timeout;

	public static getAllBots = (): ShortTermTraderBot[] => BotConductor.deployedBots;

	public static getBotCount = (): number => BotConductor.deployedBots.length;

	public static getBot = (botId: string): ShortTermTraderBot | undefined =>
		BotConductor.deployedBots.find((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	private static getBotIndex = (botId: string): number =>
		BotConductor.deployedBots.findIndex((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	// public static deployNewBot = async (currency: string, quoteAmount: number, repeatedlyTrade: boolean,
	// clientSocketId?: string, percentageLoss?: number): Promise<ShortTermTraderBot | undefined> => {
	public static deployNewBot = async (botId: string, currency: string, quoteAmount: number, repeatedlyTrade: boolean, percentageLoss: number = 1)
		: Promise<ShortTermTraderBot | undefined> => {
		let exchangeInfo: GetExchangeInfoResponseDto;

		try {
			exchangeInfo = await CrudServiceExchangeInfo.GetExchangeInfo(currency);
		} catch (e) {
			console.error('Error: Failed to retrieve exchange info from CRUD service');
			return undefined;
		}

		let bot: ShortTermTraderBot | undefined;
		let clonedBot: ShortTermTraderBot | undefined;

		if (exchangeInfo.success) {
			bot = new ShortTermTraderBot(botId, exchangeInfo.info.baseAsset, exchangeInfo.info.quoteAsset,
				currency, quoteAmount, repeatedlyTrade, exchangeInfo.info,
				percentageLoss, []);
				// percentageLoss, clientSocketId ? [ clientSocketId ] : undefined);

			if (bot) clonedBot = { ...bot } as ShortTermTraderBot;
			BotConductor.deployedBots.push(bot);
			bot.Start();
		}

		return clonedBot;
	}

	public static shutdownBot = async (botId: string): Promise<boolean> => {
		const bot: ShortTermTraderBot | undefined = BotConductor.deployedBots.find((b: ShortTermTraderBot) => b.getBotId() === botId);
		if (bot) await bot.Stop(true);

		return BotConductor.deleteBot(botId);
	}

	public static deleteBot = (botId: string): boolean => {
		const botIndex: number = BotConductor.getBotIndex(botId);

		if (botIndex > -1) {
			BotConductor.deployedBots.splice(botIndex, 1);
			return true;
		}

		return false;
	}

	public static pauseBot = (botId: string): void => {
		const botIndex: number = BotConductor.getBotIndex(botId);
		if (botIndex > -1) BotConductor.deployedBots[botIndex].Pause();
	}

	public static shutdownAllBots = (): number => {
		const count: number = BotConductor.deployedBots.length;

		BotConductor.deployedBots.map(async (bot: ShortTermTraderBot): Promise<void> => bot.Stop());
		BotConductor.deployedBots = [];

		return count;
	}

	public static monitorCompletedBots = (): void => {
		BotConductor.interval = setInterval((): void => {
			console.log('REMOVE BOTS');
			console.log(BotConductor.deployedBots.length);
			const completedBotIds: string[] =
				BotConductor.deployedBots
					.filter((b: ShortTermTraderBot): boolean => b.getBotState() === TradingBotState.FINISHED)
					.map((b: ShortTermTraderBot): string => b.getBotId());

			completedBotIds.map((botId: string): void => {
				console.log(botId);
				BotConductor.deleteBot(botId);
			});

			console.log(BotConductor.deployedBots.length);
		}, 10000);
	}

}
