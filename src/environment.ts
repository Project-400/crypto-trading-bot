import dotenv from 'dotenv';

dotenv.config();

export const BinanceWS: string = process.env.BINANCE_WS as string; // Deprecated
export const BINANCE_WS: string = process.env.BINANCE_WS as string;
export const BinanceAPI: string = process.env.BINANCE_API as string; // Deprecated
export const BINANCE_API: string = process.env.BINANCE_API as string;
export const CRUD_SERVICE_URL: string = process.env.CRUD_SERVICE_URL as string;
export const CRUD_SERVICE_URL_TRADE_DATA: string = process.env.CRUD_SERVICE_URL_TRADE_DATA as string; // Temporary

export const AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY_ID: string = process.env.AWS_SECRET_ACCESS_KEY_ID as string;
