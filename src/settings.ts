import dotenv from 'dotenv';

dotenv.config();

export const BinanceWS: string = process.env.BINANCE_WS as string;
export const CryptoApiUrl: string = process.env.CRYPTO_API_URL_DEV as string;
