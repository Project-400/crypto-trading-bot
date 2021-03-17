import https from 'https';
import * as AWS from 'aws-sdk';
import { Consumer, SQSMessage } from 'sqs-consumer';

AWS.config.update({
	region: 'eu-west-1'
	// accessKeyId: '...',
	// secretAccessKey: '...'
});

export class SQSConsumer {

	public static SetupConsumer = (): void => {
		const consumer: Consumer = Consumer.create({
			queueUrl: `https://sqs.eu-west-1.amazonaws.com/068475715603/BotQueue2`,
			handleMessage: async (message: SQSMessage): Promise<void> => {
				await SQSConsumer.HandleMessage(message);
			},
			sqs: new AWS.SQS({
				httpOptions: {
					agent: new https.Agent({
						keepAlive: true
					})
				}
			})
		});

		consumer.on('error', (err: Error): void => {
			console.error(err.message);
		});

		consumer.on('processing_error', (err: Error): void => {
			console.error(err.message);
		});

		consumer.on('processing_error', (err: Error): void => {
			console.error(err.message);
		});

		consumer.start();
	}

	private static HandleMessage = (message: SQSMessage): void => {
		console.log('HANDLE MESSAGE FROM SQS');
		console.log(message);
		let messageText: any;
		try {
			if (message.Body) {
				const messageBody: any = JSON.parse(message.Body);
				messageText = JSON.parse(messageBody.Message);
			}
		} catch (err) {
			console.error(`Failed to parse SQS message: ${err}`);
		}

		console.log(messageText);
	}

}
