import { Socket } from '../websocket';
import { Request, Response } from 'express';

export const startBot = (req: Request, res: Response): void => {
  Socket.start();
  res.status(200).json({ message: 'Started Bot' });
}

export const stopBot = (req: Request, res: Response): void => {
  Socket.stop();
  res.status(200).json({ message: 'Stopped Bot' });
}
