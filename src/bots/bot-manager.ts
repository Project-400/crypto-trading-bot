import { MarketBot } from './market-bot';

export class BotManager {

	private static deployedBots: MarketBot[] = [];

	public static getAllBots = (): MarketBot[] => BotManager.deployedBots;

	public static getBot = (botId: string): MarketBot | undefined =>
		BotManager.deployedBots.find((b: MarketBot): boolean => b.getBotId() === botId)

	private static getBotIndex = (botId: string): number =>
		BotManager.deployedBots.findIndex((b: MarketBot): boolean => b.getBotId() === botId)

	public static deployNewBot = (botId: string): MarketBot => {
		const bot: MarketBot = new MarketBot(botId, ['USDT'], ['BTCUSDT', 'BCHUSDT', 'ETHUSDT']);
		return bot;
		// bot.start();
	}

	public static shutdownBot = (botId: string): void => {
		const botIndex: number = BotManager.getBotIndex(botId);
		if (botIndex > -1) {
			BotManager.deployedBots[botIndex].stop();
			BotManager.deployedBots.splice(botIndex, 1);
		}
	}

}
