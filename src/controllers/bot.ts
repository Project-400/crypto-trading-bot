import { MarketBot } from '../bots/market-bot';
import { Request, Response } from 'express';
import {LongTradeBot} from "../bots/long-trade-bot";

export const startBot = (req: Request, res: Response): void => {
  try {
    MarketBot.start(['USDT'], ['BTCUSDT', 'BCHUSDT', 'ETHUSDT']);
  } catch (e) {
    console.log('An error occurred during trading');
    console.log(e);
    
    MarketBot.stop();
  }
  res.status(200).json({ message: 'Started Bot' });
}

export const stopBot = (req: Request, res: Response): void => {
  MarketBot.stop();
  res.status(200).json({ message: 'Stopped Bot' });
}

export const checkBotStatus = (req: Request, res: Response): void => {
  res.status(200).json({ botWorking: MarketBot.isWorking });
}

export const longTrade = async (req: Request, res: Response): Promise<void> => {
  const bot: LongTradeBot = new LongTradeBot('OMGUSDT');
  await bot.start();
  res.status(200).json({ state: bot.state });
}
