import http from 'http';
import * as WebSocket from 'ws';
// tslint:disable-next-line:no-duplicate-imports
import { AddressInfo } from 'ws';
import express from 'express';

export class WebsocketProducer {

	private static server: http.Server;
	private static wss: WebSocket.Server;
	private static webS: WebSocket;

	public static setup = (app: express.Application): void => {
		WebsocketProducer.server = http.createServer(app);
		WebsocketProducer.wss = new WebSocket.Server({ server: WebsocketProducer.server });

		console.log('SETUP');
		console.log(WebsocketProducer);

		WebsocketProducer.wss.on('connection', (ws: WebSocket): void => {
			WebsocketProducer.webS = ws;

			ws.on('message', (message: string): void => {
				console.log('received: %s', message);
				ws.send(`Hello, you sent -> ${message}`);
			});

			ws.send('Hi there, I am a WebSocket server');
		});

		WebsocketProducer.wss.on('close', (ws: WebSocket): void => {
			console.log('Connection closed');
		});

		WebsocketProducer.server.listen(process.env.PORT || 8999, (): void => {
			if (WebsocketProducer.server.address() && (WebsocketProducer.server.address() as AddressInfo).port)
				console.log(`Server started on port ${(WebsocketProducer.server.address() as AddressInfo).port} :)`);
			else
				console.log('Server not started');
		});
	}

	public static sendMessage = (msg: string): void => {
		WebsocketProducer.webS.send(msg);
	}

}
