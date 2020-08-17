import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import indexRouter from './routes';
// import session from 'express-session';
import http from "http";
import * as WebSocket from "ws";
import { WebsocketProducer } from './websocket/websocket';

const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(session({ secret: 'test-secret' }));
app.use('/v1', indexRouter);

WebsocketProducer.setup(app);

export default app;
