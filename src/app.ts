import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import indexRouter from './routes';
import { WebsocketProducer } from './config/websocket/producer';
import { SQSConsumer } from './sns-sqs/consumer';
import { CurrencySuggestionsManager } from './services/currency-suggestions-manager';
import { InstanceManagement } from './services/instance-management';
import { RedisActions } from './redis/redis';

const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(session({ secret: 'test-secret' }));
app.use('/v1', indexRouter);

InstanceManagement.SetInstanceId().then(async (): Promise<void> => {
	await SQSConsumer.SetupConsumer(InstanceManagement.InstanceId);
});

RedisActions.SetupRedisConnection();

CurrencySuggestionsManager.SetupExpirationChecker();
WebsocketProducer.setup(app);

app.listen(3001, '0.0.0.0', (): void => {
	console.log('Listening to port: ' + 3000);
});

export default app;
