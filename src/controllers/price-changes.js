import { Socket } from '../websocket';

export const priceChanges = (req, res) => {
  Socket.start();
  res.status(200).json({ message: 'Connected' });
}
