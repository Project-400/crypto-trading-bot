import { Request, Response } from 'express';
// import { LongTradeBot } from '../bots/_retired/long-trade-bot';
import { BotManager } from '../bots/bot-manager';
import ShortTermTraderBot from '../bots/short-term-trader-bot';
import { Logger } from '../config/logger/logger';
import { BinanceApi, GetSymbolPriceTickerDto } from '../external-api/binance-api';
import { BotTradeData } from '../models/bot-trade-data';

export class BotController {

	public static deployBot = async (req: Request, res: Response): Promise<Response> => {
		// if (!req.body || !req.body.botId) return res.status(400).json({ error: 'Invalid request body' });
		// if (!req.body) return res.status(400).json({ error: 'Invalid request body' });

		const botId: string = req.body.botId.toString();
		let bot: ShortTermTraderBot | undefined;

		try {
			bot = await BotManager.deployNewBot('GTOBTC', 0.0001, false);
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

	public static getBotCount = (req: Request, res: Response): Response => {
		const botCount: number = BotManager.getBotCount();

		return res.status(200).json({ success: true, botCount });
	}

	public static shutdownBots = (req: Request, res: Response): Response => {
		const count: number = BotManager.shutdownAllBots();

		return res.status(200).json({ success: true, message: 'Shutdown all bots', count });
	}

	public static openConnection = (req: Request, res: Response): Response => {
		return res.status(200).json({ success: true, connected: true });
	}

	public static getBotTradeData = async (req: Request, res: Response): Promise<Response> => {
		if (!req.body || !req.query.botId) return res.status(400).json({ error: 'Invalid request params' });
		const botId: string = req.query.botId.toString();

		const bot: ShortTermTraderBot | undefined = BotManager.getBot(botId);

		if (!bot) return res.status(404).json({ error: 'Bot not found' });
		const tradeData: BotTradeData[] = bot.getAllTradeData();

		return res.status(200).json({ success: true, tradeData });
	}

	/*
	*
	* New set of endpoints. Above to be removed
	* */

	public static createBot = async (req: Request, res: Response): Promise<Response> => {
		// || !req.query.clientSocketId
		if (!req.body || !req.body.botId || !req.body.currency || !req.body.quoteAmount || !req.body.repeatedlyTrade)
			return res.status(400).json({ error: 'Invalid request params' });
		//
		const botId: string = req.body.botId.toString();
		const currency: string = req.body.currency.toString();
		const quoteAmount: number = parseFloat(req.body.quoteAmount.toString());
		const repeatedlyTrade: boolean = req.body.repeatedlyTrade.toString() === 'true';
		const percentageLoss: number = req.query.percentageLoss ? parseFloat(req.query.percentageLoss.toString()) : 1;
		// const clientSocketId: string = req.query.clientSocketId.toString();

		// const priceInfo: GetSymbolPriceTickerDto = await BinanceApi.getCurrentPrice(currency);
		// const bot: ShortTermTraderBot | undefined =
		// 	await BotManager.deployNewBot(currency, quoteAmount, repeatedlyTrade, clientSocketId, percentageLoss);
		const bot: ShortTermTraderBot | undefined =
			await BotManager.deployNewBot(currency, quoteAmount, repeatedlyTrade, percentageLoss);

		return res.status(200).json({ success: true, bot: bot?.BOT_DETAILS() });
	}

	public static removeBot = async (req: Request, res: Response): Promise<Response> => {
		if (!req.body || !req.query.botId) return res.status(400).json({ error: 'Invalid request params' });
		const botId: string = req.query.botId.toString();

		await BotManager.shutdownBot(botId);

		return res.status(200).json({ success: true });
	}

}
