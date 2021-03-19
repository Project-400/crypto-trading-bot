import https from 'https';
import * as AWS from 'aws-sdk';
import { Consumer, SQSMessage } from 'sqs-consumer';

AWS.config.update({
	region: 'eu-west-1'
});

export class SQSConsumer {

	public static SetupConsumer = async (instanceId: string): Promise<void> => {
		const queueName: string = await SQSConsumer.CreateQueue(instanceId);
		SQSConsumer.ListenToQueue(queueName);
		setTimeout(async (): Promise<void> => {
			await SQSConsumer.SubscribeToSNSTopic(queueName);
		}, 3000);
	}

	public static ListenToQueue = (queueName: string): void => {
		const consumer: Consumer = Consumer.create({
			queueUrl: `https://sqs.eu-west-1.amazonaws.com/068475715603/${queueName}`,
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

	private static SubscribeToSNSTopic = (queueName: string): Promise<boolean> => {
		const sns: AWS.SNS = new AWS.SNS();

		const topicArn: string = 'arn:aws:sns:eu-west-1:068475715603:TestTopic';
		const sqsEndpoint: string = `arn:aws:sqs:eu-west-1:068475715603:${queueName}`;

		const params: AWS.SNS.SubscribeInput = {
			Protocol: 'sqs',
			TopicArn: topicArn,
			Endpoint: sqsEndpoint
		};

		return new Promise((resolve: any, reject: any): void => {
			sns.subscribe(params, (err: AWS.AWSError, data: AWS.SNS.SubscribeResponse): void => {
				if (err) {
					console.log(`Failed to subscribe SQS queue ${sqsEndpoint} to SNS Topic ${topicArn}`);
					console.log(err, err.stack);
					reject(false);
				} else {
					console.log(`Successfully subscribed to SNS Topic`);
					resolve(true);
				}
			});
		});
	}

	private static CreateQueue = (instanceId: string): Promise<string> => {
		const sqs: AWS.SQS = new AWS.SQS({ apiVersion: '2012-11-05' });

		const queueName: string = `crypto-bot-${instanceId}`;

		const params: AWS.SQS.CreateQueueRequest = {
			QueueName: queueName,
			Attributes: {
				MessageRetentionPeriod: '86400',
				Policy: `{"Version":"2012-10-17","Id":"arn:aws:sqs:eu-west-1:068475715603:undefined/SQSDefaultPolicy","Statement":[{"Sid":"topic-subscription-arn:aws:sns:eu-west-1:068475715603:TestTopic","Effect":"Allow","Principal":{"AWS":"*"},"Action":"SQS:SendMessage","Resource":"arn:aws:sqs:eu-west-1:068475715603:crypto-bot-${instanceId}","Condition":{"ArnLike":{"aws:SourceArn":"arn:aws:sns:eu-west-1:068475715603:TestTopic"}}}]}`
			}
		};

		return new Promise((resolve: any, reject: any): void => {
			sqs.createQueue(params, (err: AWS.AWSError, data: AWS.SQS.CreateQueueResult): void => {
				if (err) {
					console.error(`Error Creating SQS Queue ${queueName}`, err);
					reject(false);
				} else {
					console.log(`Successfully Created SQS Queue ${queueName}`);
					resolve(queueName);
				}
			});
		});
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
