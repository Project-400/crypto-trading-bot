import https from 'https';
import * as AWS from 'aws-sdk';
import { Consumer, SQSMessage } from 'sqs-consumer';
import { AWS_ACCESS_KEY_ID, AWS_ACCOUNT_ID, AWS_PRICE_SUGGESTIONS_SNS_TOPIC, AWS_REGION, AWS_SECRET_ACCESS_KEY_ID } from '../environment';
import { CurrencySuggestion } from '@crypto-tracker/common-types';
import { CurrencySuggestionsManager } from '../services/currency-suggestions-manager';
import { SQSPolicy } from './policy';

AWS.config.update({
	region: AWS_REGION,
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY_ID
});

export class SQSConsumer {

	public static SetupConsumer = async (instanceId: string): Promise<void> => {
		const queueName: string = await SQSConsumer.CreateQueue(instanceId);
		await SQSConsumer.SubscribeToSNSTopic(queueName);
		SQSConsumer.ListenToQueue(queueName);
	}

	public static ListenToQueue = (queueName: string): void => {
		const consumer: Consumer = Consumer.create({
			queueUrl: `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/${queueName}`,
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

		consumer.start();
	}

	private static SubscribeToSNSTopic = (queueName: string): Promise<boolean> => {
		const sns: AWS.SNS = new AWS.SNS();

		const topicArn: string = `arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${AWS_PRICE_SUGGESTIONS_SNS_TOPIC}`;
		const sqsEndpoint: string = `arn:aws:sqs:${AWS_REGION}:${AWS_ACCOUNT_ID}:${queueName}`;

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
				Policy: SQSPolicy(queueName)
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
		let messageBody: any;

		console.log(message);

		try {
			if (message.Body) messageBody = JSON.parse(message.Body);
		} catch (err) {
			console.error(`Failed to parse SQS message: ${err}`);
		}

		if (messageBody) {
			const currencySuggestion: CurrencySuggestion = JSON.parse(messageBody.Message);

			if (currencySuggestion.symbol) CurrencySuggestionsManager.AddSuggestion(currencySuggestion);
		}
	}

}
