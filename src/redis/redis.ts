import { ENV } from '../environment';
import Redis from 'ioredis';

export class RedisActions {

	private static redis: Redis.Redis;

	public static SetupRedisConnection = (): void => {
		console.log('Setting up Redis Connection');

		if (ENV.IS_LOCAL) { 					// Connect to local instance of Redis Server
			RedisActions.redis = new Redis();

			console.log('Successfully connected to local instance of Redis Server');
		} else {								// Connect to remote AWS Redis Server
			const redisOptions: Redis.RedisOptions = {
				host: ENV.AWS_REDIS_URL,
				port: 6379,
				autoResubscribe: true,
				maxRetriesPerRequest: 5
			};

			RedisActions.redis = new Redis(redisOptions);

			console.log('Successfully connected to remote AWS Redis Server');
		}
	}

	public static set = (key: string, value: string): void => {
		RedisActions.redis.set(key, value, (err: Error | null, reply: any): void => {
			console.log(reply);
		});
	}

	public static get = (key: string): Promise<string | number> | string | number =>
		new Promise((resolve: any, reject: any): void => {
			RedisActions.redis.get(key, (err: Error | null, reply: any): void => {
				console.log(reply);
				resolve(reply);
			});
		})

	public static delete = (key: string): Promise<boolean> | boolean =>
		new Promise((resolve: any, reject: any): void => {
			RedisActions.redis.del(key, (err: Error | null, reply: any): void => {
				console.log(reply);
				resolve(reply);
			});
		})

}
