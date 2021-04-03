import { Request, Response } from 'express';
import ShortTermTraderBot from '../bots/short-term-trader-bot';
import { BotConductor } from '../bots/bot-conductor';
import { BotTradeData } from '../models/bot-trade-data';

export class TestController {

	public static pauseBot = (req: Request, res: Response): Response => {
		if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		const bot: ShortTermTraderBot | undefined = BotConductor.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		BotConductor.pauseBot(botId);

		return res.status(200).json({ success: true, message: 'Paused Bot', bot });
	}

	public static getAllBots = (req: Request, res: Response): Response => {
		const bots: ShortTermTraderBot[] = BotConductor.getAllBots();

		return res.status(200).json({ success: true, bots });
	}

	public static getBotCount = (req: Request, res: Response): Response => {
		const botCount: number = BotConductor.getBotCount();

		return res.status(200).json({ success: true, botCount });
	}

	public static getBotTradeData = async (req: Request, res: Response): Promise<Response> => {
		if (!req.body || !req.query.botId) return res.status(400).json({ error: 'Invalid request params' });
		const botId: string = req.query.botId.toString();

		const bot: ShortTermTraderBot | undefined = BotConductor.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });
		const tradeData: BotTradeData[] = bot.getAllTradeData();

		return res.status(200).json({ success: true, tradeData });
	}

	public static getBot = (req: Request, res: Response): Response => {
		if (!req.query || !req.query.botId) return res.status(400).json({ error: 'Invalid request parameters' });

		const botId: string = req.query.botId.toString();
		const bot: ShortTermTraderBot | undefined = BotConductor.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		return res.status(200).json({ success: true, bot });
	}

	public static shutdownBots = (req: Request, res: Response): Response => {
		const count: number = BotConductor.shutdownAllBots();

		return res.status(200).json({ success: true, message: 'Shutdown all bots', count });
	}

}
