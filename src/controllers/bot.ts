import { MarketBot } from '../services/market-bot';
import { Request, Response } from 'express';

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
