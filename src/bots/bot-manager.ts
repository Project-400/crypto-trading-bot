import MarketAnalystBot from './market-analyst-bot';

export class BotManager {

	private static deployedBots: MarketAnalystBot[] = [];

	public static getAllBots = (): MarketAnalystBot[] => BotManager.deployedBots;

	public static getBot = (botId: string): MarketAnalystBot | undefined =>
		BotManager.deployedBots.find((b: MarketAnalystBot): boolean => b.getBotId() === botId)

	private static getBotIndex = (botId: string): number =>
		BotManager.deployedBots.findIndex((b: MarketAnalystBot): boolean => b.getBotId() === botId)

	public static deployNewBot = (botId: string): MarketAnalystBot => {
		if (BotManager.getBot(botId)) throw Error('Bot already exists');

		const bot: MarketAnalystBot = new MarketAnalystBot(botId, ['USDT'], ['BTCUSDT', 'BCHUSDT', 'ETHUSDT']);
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

		BotManager.deployedBots.map((bot: MarketAnalystBot): void => bot.Stop());

		BotManager.deployedBots = [];

		return count;
	}

}
