import { MarketBot } from '../services/market-bot';
import { TraderBot } from '../services/trader-bot';
import { Request, Response } from 'express';
import {WebsocketProducer} from "../websocket/websocket";
import {SymbolAnalystBot, SymbolPerformanceType} from "../services/symbol-analyst-bot";
import {SymbolPriceData} from "../models/symbol-price-data";

export const startBot = (req: Request, res: Response): void => {
  MarketBot.start();
  res.status(200).json({ message: 'Started Bot' });
}

export const stopBot = (req: Request, res: Response): void => {
  MarketBot.stop();
  res.status(200).json({ message: 'Stopped Bot' });
}

export const trade = async (req: Request, res: Response): Promise<void> => {
  const response = await TraderBot.watchPriceChanges('FETBTC', 'FET', 'BTC');
  res.status(200).json({ response });
}

export const test = async (req: Request, res: Response): Promise<void> => {
  setTimeout(() => {
    WebsocketProducer.sendMessage('HELLO THERE');
  }, 5000)
  res.status(200).json({ msg: 'Sending socket message in 5 seconds' });
}

export const analystBot = async (req: Request, res: Response): Promise<void> => {
  const bot: SymbolAnalystBot = new SymbolAnalystBot(
    new SymbolPriceData('FETUSDT', 0.18135),
    SymbolPerformanceType.LEAPER
  );
  
  bot.start();
  
  res.status(200).json({ bot });
}
