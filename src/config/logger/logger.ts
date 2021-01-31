import { WebsocketProducer } from '../websocket/producer';

export class Logger {

	public static info = (msg: string): void => {
		console.log(msg);
		WebsocketProducer.broadcast(msg);
	}

	// public static test = (CLIENTSOCKETID: string, msg: string): void => {
	// 	console.log(msg);
	// 	WebsocketProducer.send(msg, CLIENTSOCKETID);
	// }

	public static error = (msg: string): void => {
		console.error(msg);
		WebsocketProducer.broadcast(msg);
	}

}
