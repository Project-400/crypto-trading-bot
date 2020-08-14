import { Socket } from '../websocket';

export const startBot = (req, res) => {
  Socket.start();
  res.status(200).json({ message: 'Started Bot' });
}

export const stopBot = (req, res) => {
  Socket.stop();
  res.status(200).json({ message: 'Stopped Bot' });
}
