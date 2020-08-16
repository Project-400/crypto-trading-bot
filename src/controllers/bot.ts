import { MarketBot } from '../services/market-bot';
import { TraderBot } from '../services/trader-bot';
import { Request, Response } from 'express';

export const startBot = (req: Request, res: Response): void => {
  MarketBot.start();
  res.status(200).json({ message: 'Started Bot' });
}

export const stopBot = (req: Request, res: Response): void => {
  MarketBot.stop();
  res.status(200).json({ message: 'Stopped Bot' });
}

export const buyCurrency = async (req: Request, res: Response): Promise<void> => {
  const response = await TraderBot.buyCurrency('ASTBTC', 'AST', 'BTC', 0.0001);
  res.status(200).json({ response });
}
