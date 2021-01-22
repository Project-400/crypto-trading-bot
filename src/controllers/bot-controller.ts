import { Request, Response } from 'express';
// import { LongTradeBot } from '../bots/_retired/long-trade-bot';
import { BotManager } from '../bots/bot-manager';
import ShortTermTraderBot from '../bots/short-term-trader-bot';

export class BotController {

	public static deployBot = async (req: Request, res: Response): Promise<Response> => {
		if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		let bot: ShortTermTraderBot | undefined;

		console.log(1);
		try {
			bot = await BotManager.deployNewBot(botId, 'GTOBTC', 0.0001);
			console.log(2);
			console.log(bot);
		} catch (e) {
			console.log('Bot failed to deploy');
			console.log(e);

			if (bot) await BotManager.shutdownBot(botId);
			return res.status(400).json({ success: false });
		}
		return res.status(200).json({ success: true, message: 'Started Bot', bot });
	}

	public static stopBot = async (req: Request, res: Response): Promise<Response> => {
		if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		const bot: ShortTermTraderBot | undefined = BotManager.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		await BotManager.shutdownBot(botId);

		return res.status(200).json({ success: true, message: 'Stopped Bot', bot });
	}

	public static pauseBot = (req: Request, res: Response): Response => {
		if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		const bot: ShortTermTraderBot | undefined = BotManager.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		BotManager.pauseBot(botId);

		return res.status(200).json({ success: true, message: 'Paused Bot', bot });
	}

	public static getBot = (req: Request, res: Response): Response => {
		if (!req.query || !req.query.botId) return res.status(400).json({ error: 'Invalid request parameters' });

		const botId: string = req.query.botId.toString();
		const bot: ShortTermTraderBot | undefined = BotManager.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });

		return res.status(200).json({ success: true, bot });
	}

	public static getAllBots = (req: Request, res: Response): Response => {
		const bots: ShortTermTraderBot[] = BotManager.getAllBots();

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

	// public static longTrade = async (req: Request, res: Response): Promise<void> => {
	// 	const bot: LongTradeBot = new LongTradeBot('ATOMUSDT', 'ATOM', 'USDT', 10);
	// 	await bot.start();
	// 	res.status(200).json({ success: true, state: bot.state });
	// }

	public static openConnection = (req: Request, res: Response): Response => {
		return res.status(200).json({ success: true, connected: true });
	}

	/* Temp for testing bot */
	public static subscribe = async (req: Request, res: Response): Promise<Response> => {
		if (!req.body || !req.query.currency || !req.query.quoteAmount) return res.status(400).json({ error: 'Invalid request params' });
		const currency: string = req.query.currency.toString();
		const quoteAmount: number = parseFloat(req.query.quoteAmount.toString());

		const bot: ShortTermTraderBot | undefined = await BotManager.deployNewBot('FAKE_BOT_ID', currency, quoteAmount);
		return res.status(200).json({ success: true, subscribed: true, bot });
	}

	/* Temp for testing bot */
	public static unsubscribe = async (req: Request, res: Response): Promise<Response> => {
		await BotManager.shutdownBot('FAKE_BOT_ID');
		return res.status(200).json({ success: true, unsubscribed: true });
	}

}
