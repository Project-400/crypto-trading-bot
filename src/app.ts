import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import indexRouter from './routes';
import session from 'express-session';
import http from "http";
import * as WebSocket from "ws";

const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'test-secret' }));
app.use('/v1', indexRouter);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// }

wss.on('connection', (ws: WebSocket) => {

  //connection is up, let's add a simple simple event
  ws.on('message', (message: string) => {

    //log the received message and send it back to the client
    console.log('received: %s', message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  //send immediatly a feedback to the incoming connection    
  ws.send('Hi there, I am a WebSocket server');
});

server.listen(process.env.PORT || 8999, () => {
  // @ts-ignore
  if (server.address() && server.address().port) console.log(`Server started on port ${server.address().port} :)`);
  else console.log('Server not started');
});

export default app;
