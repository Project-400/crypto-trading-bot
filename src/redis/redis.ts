import { ENV } from '../environment';
import Redis from 'ioredis';

export class RedisActions {

	private static RedisParams: Redis.RedisOptions = {
		host: 'crypto-bot-data.tgmeob.ng.0001.euw1.cache.amazonaws.com',
		port: 6379,
		autoResubscribe: true,
		maxRetriesPerRequest: 5
	};
	private static redis: Redis.Redis = new Redis(RedisActions.RedisParams);

	private static localValues: { [key: string]: string | number } = { };

	public static SetValue = (key: string, value: string): void => {
		if (ENV.IS_LOCAL) {
			RedisActions.localValues[key] = value;
		} else {
			RedisActions.redis.set(key, value, (err: Error | null, reply: any): void => {
				console.log(reply);
			});
		}
	}

	public static GetValue = (key: string): Promise<string | number> | string | number => {
		if (ENV.IS_LOCAL) {
			return RedisActions.localValues[key];
		}

		return new Promise((resolve: any, reject: any): void => {
			RedisActions.redis.get(key, (err: Error | null, reply: any): void => {
				console.log(reply);
				resolve(reply);
			});
		});
	}

	public static DeleteValue = (key: string): Promise<boolean> | boolean => {
		if (ENV.IS_LOCAL) {
			return delete RedisActions.localValues[key];
		}

		return new Promise((resolve: any, reject: any): void => {
			RedisActions.redis.del(key, (err: Error | null, reply: any): void => {
				console.log(reply);
				resolve(reply);
			});
		});
	}

}
