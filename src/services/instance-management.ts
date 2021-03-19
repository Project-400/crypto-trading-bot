import { v4 as uuid } from 'uuid';
import * as AWS from 'aws-sdk';

export class InstanceManagement {

	public static InstanceId: string;

	public static SetInstanceId = async (): Promise<void> => {
		console.log('Setting InstanceId');

		if (process.env.IS_LOCAL) {
			InstanceManagement.InstanceId = uuid();
		} else {
			const meta: any = new AWS.MetadataService();

			InstanceManagement.InstanceId = await new Promise((resolve: any, reject: any): void => {
				meta.request('/latest/meta-data/instance-id', (err: Error, instanceId: string): void => {
					resolve(instanceId);
				});
			});
		}

		console.log(`InstanceId Set: ${InstanceManagement.InstanceId}`);
	}

}
