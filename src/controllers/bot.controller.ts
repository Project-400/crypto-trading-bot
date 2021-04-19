import { Request, Response } from 'express';
import { BotConductor } from '../bots/bot-conductor';
import ShortTermTraderBot from '../bots/short-term-trader-bot';
import { BotWaitingQueue } from '../services/bot-waiting-queue';

export class BotController {

	public static createBot = async (req: Request, res: Response): Promise<Response> => {
		// || !req.query.clientSocketId
		if (!req.body || !req.body.botId || !req.body.quoteAmount || req.body.repeatedlyTrade === undefined || req.body.currencyPreChosen === undefined)
			return res.status(400).json({ error: 'Invalid request params' });
		//
		const botId: string = req.body.botId.toString();
		const currencyPreChosen: boolean = req.body.currencyPreChosen.toString() === 'true';
		const currency: string = currencyPreChosen ? req.body.currency.toString() : undefined;

		const quoteAmount: number = parseFloat(req.body.quoteAmount.toString());
		const repeatedlyTrade: boolean = req.body.repeatedlyTrade.toString() === 'true';
		const percentageLoss: number = req.query.percentageLoss ? parseFloat(req.query.percentageLoss.toString()) : 1;
		// const clientSocketId: string = req.query.clientSocketId.toString();

		// const priceInfo: GetSymbolPriceTickerDto = await BinanceApi.getCurrentPrice(currency);
		// const bot: ShortTermTraderBot | undefined =
		// 	await BotConductor.deployNewBot(currency, quoteAmount, repeatedlyTrade, clientSocketId, percentageLoss);

		if (currencyPreChosen) {
			const bot: ShortTermTraderBot | undefined =
				await BotConductor.deployNewBot(botId, true, currency, quoteAmount, repeatedlyTrade, percentageLoss);

			if (!bot) return res.status(500).json({ success: false });
		} else {
			BotWaitingQueue.AddBot({
				botId,
				quoteAmount,
				repeatedlyTrade,
				percentageLoss
			});
		}

		return res.status(200).json({ success: true });
	}

	public static stopBot = async (req: Request, res: Response): Promise<Response> => {
		console.log(req.query);
		if (!req.body || !req.query.botId) return res.status(400).json({ error: 'Invalid request params' });
		const botId: string = req.query.botId.toString();

		try {
			const shutdown: boolean = await BotConductor.shutdownBot(botId);
			if (!shutdown) return res.status(404).json({ success: false });
		} catch (e) {
			return res.status(500).json({ success: false });
		}

		return res.status(200).json({ success: true });
	}

}
