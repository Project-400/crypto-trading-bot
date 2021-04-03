import { Request, Response } from 'express';
import { BotManager } from '../bots/bot-manager';
import ShortTermTraderBot from '../bots/short-term-trader-bot';

export class BotController {

	public static createBot = async (req: Request, res: Response): Promise<Response> => {
		// || !req.query.clientSocketId
		if (!req.body || !req.body.botId || !req.body.currency || !req.body.quoteAmount || req.body.repeatedlyTrade === undefined)
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
			await BotManager.deployNewBot(botId, currency, quoteAmount, repeatedlyTrade, percentageLoss);

		if (!bot) return res.status(500).json({ success: false });

		return res.status(200).json({ success: true, bot: bot?.BOT_DETAILS() });
	}

	public static removeBot = async (req: Request, res: Response): Promise<Response> => {
		if (!req.body || !req.query.botId) return res.status(400).json({ error: 'Invalid request params' });
		const botId: string = req.query.botId.toString();

		try {
			const shutdown: boolean = await BotManager.shutdownBot(botId);
			if (!shutdown) return res.status(404).json({ success: false });
		} catch (e) {
			return res.status(500).json({ success: false });
		}

		return res.status(200).json({ success: true });
	}

}
