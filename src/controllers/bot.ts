import { Request, Response } from 'express';
import { LongTradeBot } from '../bots/long-trade-bot';
import { BotManager } from '../bots/bot-manager';
import { MarketBot } from '../bots/market-bot';

export class BotController {

	public static deployBot = (req: Request, res: Response): Response => {
		if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		let bot!: MarketBot;

		try {
			bot = BotManager.deployNewBot(botId);
		} catch (e) {
			console.log('Bot failed to deploy');
			console.log(e);

			if (bot) BotManager.shutdownBot(botId);
			return res.status(400).json({ success: false });
		}
		return res.status(200).json({ success: true, message: 'Started Bot', bot });
	}

	public static stopBot = (req: Request, res: Response): Response => {
		if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		const bot: MarketBot | undefined = BotManager.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		BotManager.shutdownBot(botId);

		return res.status(200).json({ success: true, message: 'Stopped Bot', bot });
	}

	public static pauseBot = (req: Request, res: Response): Response => {
		if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		const bot: MarketBot | undefined = BotManager.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		BotManager.pauseBot(botId);

		return res.status(200).json({ success: true, message: 'Paused Bot', bot });
	}

	public static getBot = (req: Request, res: Response): Response => {
		if (!req.query || !req.query.botId) return res.status(400).json({ error: 'Invalid request parameters' });

		const botId: string = req.query.botId.toString();
		const bot: MarketBot | undefined = BotManager.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		return res.status(200).json({ success: true, bot });
	}

	public static getAllBots = (req: Request, res: Response): Response => {
		const bots: MarketBot[] = BotManager.getAllBots();

		return res.status(200).json({ success: true, bots });
	}

	public static shutdownBots = (req: Request, res: Response): Response => {
		const count: number = BotManager.shutdownAllBots();

		return res.status(200).json({ success: true, message: 'Shutdown all bots', count });
	}

	// public static checkBotStatus = (req: Request, res: Response): Response => {
	// 	if (!req.query || !req.query.botId) return res.status(400).json({ error: 'Invalid request parameters' });
	//
	// 	const botId: string = req.query.botId as string;
	// 	const bot: MarketBot | undefined = BotManager.getBot(botId);
	//
	// 	if (!bot) return res.status(404).json({ error: 'Bot not found' });
	//
	// 	return res.status(200).json({ status: bot. });
	// }

	public static longTrade = async (req: Request, res: Response): Promise<void> => {
		const bot: LongTradeBot = new LongTradeBot('ATOMUSDT', 'ATOM', 'USDT', 10);
		await bot.start();
		res.status(200).json({ success: true, state: bot.state });
	}

}
