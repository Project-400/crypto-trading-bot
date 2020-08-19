import { WebsocketProducer } from "../websocket/websocket";

export class Logger {
  
  public static info(msg: string) {
    console.log(msg);
    WebsocketProducer.sendMessage(msg);
  }

}
