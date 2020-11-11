import dotenv from 'dotenv';

dotenv.config();

export const BinanceWS: string = process.env.BINANCE_WS as string; // Deprecated
export const BINANCE_WS: string = process.env.BINANCE_WS as string;
export const BinanceAPI: string = process.env.BINANCE_API as string;
export const CrudServiceUrl: string = process.env.CRUD_SERVICE_URL as string;
