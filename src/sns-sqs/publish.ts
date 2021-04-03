import * as AWS from 'aws-sdk';
import {
	AWS_ACCESS_KEY_ID,
	AWS_ACCOUNT_ID,
	AWS_AUTO_DELETED_BOTS_SNS_TOPIC,
	AWS_REGION,
	AWS_SECRET_ACCESS_KEY_ID
} from '../environment';

AWS.config.update({
	region: AWS_REGION,
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY_ID
});

const sns: AWS.SNS = new AWS.SNS({ apiVersion: '2010-03-31' });

export class SNSPublish {

	public static sendAutoDeletedBots = (botIds: string[]): void => {
		if (!botIds.length) return;

		botIds.map((botId: string): void => {
			const params: AWS.SNS.PublishInput = {
				Message: botId,
				TopicArn: `arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${AWS_AUTO_DELETED_BOTS_SNS_TOPIC}`
			};

			sns.publish(params, (err: AWS.AWSError, data: AWS.SNS.PublishResponse): void => {
				if (err) console.error('SNS Message Failed to Send', err, err.stack);
				else console.log('SNS Message Sent', data);
			});
		});
	}

	// public static sendClientBotUpdate = (message: string): void => {
	// 	if (!message) throw Error('SNS message not sent - Message was empty');
	//
	// 	const sns: AWS.SNS = new AWS.SNS({ apiVersion: '2010-03-31' });
	//
	// 	const params: AWS.SNS.PublishInput = {
	// 		Message: message,
	// 		TopicArn: `arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${AWS_PRICE_SUGGESTIONS_SNS_TOPIC}`
	// 	};
	//
	// 	sns.publish(params, (err: AWS.AWSError, data: AWS.SNS.PublishResponse): void => {
	// 		if (err) console.error('SNS Message Failed to Send', err, err.stack);
	// 		else console.log('SNS Message Sent', data);
	// 	});
	// }

}
