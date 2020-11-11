import { WebsocketProducer } from '../websocket/websocket';

export class Logger {

	public static info = (msg: string): void => {
		console.log(msg);
		WebsocketProducer.sendMessage(msg);
	}

}
