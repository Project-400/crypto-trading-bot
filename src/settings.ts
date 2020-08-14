import dotenv from 'dotenv';

dotenv.config();

export const BinanceWS: string = process.env.BINANCE_WS as string;
