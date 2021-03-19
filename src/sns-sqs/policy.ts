import { AWS_ACCOUNT_ID, AWS_PRICE_SUGGESTIONS_SNS_TOPIC, AWS_REGION } from '../environment';

export const SQSPolicy = (queueName: string): string => {
	return `{"Version":"2012-10-17","Id":"arn:aws:sqs:${AWS_REGION}:${AWS_ACCOUNT_ID}:undefined/SQSDefaultPolicy",
			"Statement":[{"Sid":"topic-subscription-arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${AWS_PRICE_SUGGESTIONS_SNS_TOPIC}",
			"Effect":"Allow","Principal":{"AWS":"*"},"Action":"SQS:SendMessage",
			"Resource":"arn:aws:sqs:${AWS_REGION}:${AWS_ACCOUNT_ID}:${queueName}",
			"Condition":{"ArnLike":{"aws:SourceArn":"arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${AWS_PRICE_SUGGESTIONS_SNS_TOPIC}"}}}]}`;
};
