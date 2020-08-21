import http from "http";
import * as WebSocket from "ws";
import express from "express";

export class WebsocketProducer {

  static server: http.Server;
  static wss: WebSocket.Server;
  static webS: WebSocket;
  
  public static setup(app: express.Application) {
    WebsocketProducer.server = http.createServer(app);
    WebsocketProducer.wss = new WebSocket.Server({ server: WebsocketProducer.server });

    console.log('SETUP')
    console.log(WebsocketProducer)

    WebsocketProducer.wss.on('connection', (ws: WebSocket) => {
      WebsocketProducer.webS = ws;

      ws.on('message', (message: string) => {
        console.log('received: %s', message);
        ws.send(`Hello, you sent -> ${message}`);
      });

      ws.send('Hi there, I am a WebSocket server');
    });

    WebsocketProducer.wss.on('close', (ws: WebSocket) => {
      console.log('Connection closed')
    });

    WebsocketProducer.server.listen(process.env.PORT || 8999, () => {
      // @ts-ignore
      if (WebsocketProducer.server.address() && WebsocketProducer.server.address().port) console.log(`Server started on port ${WebsocketProducer.server.address().port} :)`);
      else console.log('Server not started');
    });

  }
  
  public static sendMessage(msg: string) {
    WebsocketProducer.webS.send(msg);
  }

}
