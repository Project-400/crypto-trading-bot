import dotenv from 'dotenv';

dotenv.config();

// export const IS_LOCAL: boolean = process.env.IS_LOCAL as string === 'true';
export const IS_LOCAL: boolean = process.env.NODE_ENV as string === 'LOCAL';

// Reuse a fake instance id instead of generating a new ID each time during development
export const REUSE_LOCAL_INSTANCE_ID: boolean = process.env.REUSE_LOCAL_INSTANCE_ID as string === 'true';

// Use fake transaction JSON to mimic currency buy & sell
export const FAKE_TRANSACTIONS_ON: boolean = process.env.FAKE_TRANSACTIONS_ON as string === 'true';

// Prevent saving details to DB while testing bot functionality
export const BOT_TEST_MODE_ON: boolean = process.env.BOT_TEST_MODE_ON as string === 'true';

export const BinanceWS: string = process.env.BINANCE_WS as string; // Deprecated
export const BINANCE_WS: string = process.env.BINANCE_WS as string;
export const BinanceAPI: string = process.env.BINANCE_API as string; // Deprecated
export const BINANCE_API: string = process.env.BINANCE_API as string;
export const CRUD_SERVICE_URL: string = process.env.CRUD_SERVICE_URL as string;
export const CRUD_SERVICE_URL_TRADE_DATA: string = process.env.CRUD_SERVICE_URL_TRADE_DATA as string; // Temporary

export const AWS_ACCOUNT_ID: string = process.env.AWS_ACCOUNT_ID as string;
export const AWS_REGION: string = process.env.AWS_REGION as string;
export const AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY_ID: string = process.env.AWS_SECRET_ACCESS_KEY_ID as string;

export const AWS_PRICE_SUGGESTIONS_SNS_TOPIC: string = process.env.AWS_PRICE_SUGGESTIONS_SNS_TOPIC as string;
export const AWS_REDIS_URL: string = process.env.AWS_REDIS_URL as string;

export const PRICE_SUGGESTION_EXPIRATION_CHECK_INTERVAL: number = Number(process.env.PRICE_SUGGESTION_EXPIRATION_CHECK_INTERVAL);

export const ENV: { [key: string]: any } = {
	IS_LOCAL,
	REUSE_LOCAL_INSTANCE_ID,
	FAKE_TRANSACTIONS_ON,
	BOT_TEST_MODE_ON,
	AWS: {
		AWS_ACCOUNT_ID,
		AWS_REGION,
		AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY_ID,
		AWS_PRICE_SUGGESTIONS_SNS_TOPIC,
		AWS_REDIS_URL,
		PRICE_SUGGESTION_EXPIRATION_CHECK_INTERVAL
	},
	BINANCE_API,
	CRUD_SERVICE_URL,
	CRUD_SERVICE_URL_TRADE_DATA
};
