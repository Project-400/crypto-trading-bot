import { MarketBot } from '../bots/market-bot';
import { Request, Response } from 'express';
import { LongTradeBot } from '../bots/long-trade-bot';

export class BotController {
	public static startBot = (req: Request, res: Response): void => {
		try {
			// MarketBot.start(['USDT'], ['BTCUSDT', 'BCHUSDT', 'ETHUSDT']);

			const bot: MarketBot = new MarketBot(['USDT'], ['BTCUSDT', 'BCHUSDT', 'ETHUSDT']);
			bot.start();
		} catch (e) {
			console.log('An error occurred during trading');
			console.log(e);

			MarketBot.stop(); // TODO: Store references to all bots in a list
		}
		res.status(200).json({ message: 'Started Bot' });
	}

	public static stopBot = (req: Request, res: Response): void => {
		MarketBot.stop(); // TODO: Store references to all bots in a list
		res.status(200).json({ message: 'Stopped Bot' });
	}

	public static checkBotStatus = (req: Request, res: Response): void => {
		res.status(200).json({ botWorking: MarketBot.isWorking }); // TODO: Store references to all bots in a list
	}

	public static longTrade = async (req: Request, res: Response): Promise<void> => {
		const bot: LongTradeBot = new LongTradeBot('ATOMUSDT', 'ATOM', 'USDT', 10);
		await bot.start();
		res.status(200).json({ state: bot.state });
	}

}
