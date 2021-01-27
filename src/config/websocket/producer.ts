import http from 'http';
import * as WebSocket from 'ws';
// tslint:disable-next-line:no-duplicate-imports
import { AddressInfo } from 'ws';
import express from 'express';
import { v4 as uuid } from 'uuid';

export class WebsocketProducer {

	private static server: http.Server;
	private static wss: WebSocket.Server;
	// private static webS: WebSocket;
	private static connectedSockets: WebSocket[] = []; // List of connected clients

	public static setup = (app: express.Application): void => {
		WebsocketProducer.server = http.createServer(app);
		WebsocketProducer.wss = new WebSocket.Server({ server: WebsocketProducer.server });

		console.log('SETUP');
		console.log(WebsocketProducer);

		WebsocketProducer.wss.on('connection', (ws: WebSocket): void => {
			// WebsocketProducer.webS = ws;
			// tslint:disable-next-line:ban-ts-ignore
			// @ts-ignore
			ws.id = uuid();
			WebsocketProducer.connectedSockets.push(ws);
			console.log(WebsocketProducer.connectedSockets);

			ws.on('message', (message: string): void => {
				console.log('received: %s', message);
				ws.send(`Hello, you sent -> ${message}`);
			});

			ws.send('Connected to the trader bot service.');
		});

		WebsocketProducer.wss.on('close', (ws: WebSocket): void => {
			console.log(WebsocketProducer.connectedSockets);
			console.log('Connection closed');
		});

		WebsocketProducer.wss.on('unexpected-response', (ws: WebSocket): void => {
			console.log('Unexpected Response in Websocket Producer');
		});

		WebsocketProducer.wss.on('ping', (ws: WebSocket): void => {
			console.log('Websocket Producer Ping');
		});

		WebsocketProducer.wss.on('pong', (ws: WebSocket): void => {
			console.log('Websocket Producer Pong');
		});

		WebsocketProducer.wss.on('error', (ws: WebSocket): void => {
			console.log('Websocket Producer Error');
		});

		WebsocketProducer.server.listen(process.env.PORT || 8999, (): void => {
			if (WebsocketProducer.server.address() && (WebsocketProducer.server.address() as AddressInfo).port)
				console.log(`Server started on port ${(WebsocketProducer.server.address() as AddressInfo).port} :)`);
			else
				console.log('Server not started');
		});
	}

	public static sendMessage = (msg: string): void => {
		try {
			// WebsocketProducer.webS.send(msg);
			WebsocketProducer.connectedSockets.map((socket: WebSocket): void => {
				// tslint:disable-next-line:ban-ts-ignore
				// @ts-ignore
				if (socket.CLOSED) console.log(`Connection ${socket.id} is closed`);
				if (socket.OPEN) {
					// tslint:disable-next-line:ban-ts-ignore
					// @ts-ignore
					console.log(`Connection ${socket.id} is open`);
					socket.send(msg);
				}
			});
		} catch (e) {
			console.error(`The error likely occurred because there are no clients subscribed to the Websocket. Error: ${e.message}`);
		}
	}

}
