import { v4 as uuid } from 'uuid';
import * as AWS from 'aws-sdk';
import { ENV } from '../environment';

export class InstanceManagement {

	public static InstanceId: string;

	public static SetInstanceId = async (): Promise<void> => {
		console.log('Setting InstanceId');

		if (ENV.IS_LOCAL) {
			InstanceManagement.InstanceId = ENV.REUSE_LOCAL_INSTANCE_ID ? 'reusable-test-instance-id' : uuid();
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
