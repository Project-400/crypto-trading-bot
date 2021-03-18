import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import indexRouter from './routes';
import { WebsocketProducer } from './config/websocket/producer';
import { SQSConsumer } from './sns-sqs/consumer';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(session({ secret: 'test-secret' }));
app.use('/v1', indexRouter);

console.log('process.env.IS_LOCAL');
console.log(process.env.IS_LOCAL);

if (process.env.IS_LOCAL) {
	const instanceId: string = uuid();
	SQSConsumer.SetupConsumer(instanceId);
} else {
	const meta: any = new AWS.MetadataService();

	meta.request('/latest/meta-data/instance-id', (err: Error, instanceId: string): void => {
		console.log(`Instance Id: ${instanceId}`);
		SQSConsumer.SetupConsumer(instanceId);
	});
}

WebsocketProducer.setup(app);

app.listen(3001, '0.0.0.0', (): void => {
	console.log('Listening to port: ' + 3000);
});

export default app;
