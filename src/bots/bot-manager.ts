import ShortTermTraderBot from './short-term-trader-bot';

export class BotManager {

	private static deployedBots: ShortTermTraderBot[] = [];

	public static getAllBots = (): ShortTermTraderBot[] => BotManager.deployedBots;

	public static getBot = (botId: string): ShortTermTraderBot | undefined =>
		BotManager.deployedBots.find((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	private static getBotIndex = (botId: string): number =>
		BotManager.deployedBots.findIndex((b: ShortTermTraderBot): boolean => b.getBotId() === botId)

	public static deployNewBot = (botId: string): ShortTermTraderBot => {
		if (BotManager.getBot(botId)) throw Error('Bot already exists');

		const bot: ShortTermTraderBot = new ShortTermTraderBot(botId, 'BTC', 'USDT', 'BTCUSDT', 10, true);
		BotManager.deployedBots.push(bot);
		bot.Start();
		return bot;
	}

	public static shutdownBot = (botId: string): void => {
		const botIndex: number = BotManager.getBotIndex(botId);
		if (botIndex > -1) {
			BotManager.deployedBots[botIndex].Stop();
			BotManager.deployedBots.splice(botIndex, 1);
		}
	}

	public static pauseBot = (botId: string): void => {
		const botIndex: number = BotManager.getBotIndex(botId);
		if (botIndex > -1) BotManager.deployedBots[botIndex].Pause();
	}

	public static shutdownAllBots = (): number => {
		const count: number = BotManager.deployedBots.length;

		BotManager.deployedBots.map((bot: ShortTermTraderBot): void => bot.Stop());
		BotManager.deployedBots = [];

		return count;
	}

}
