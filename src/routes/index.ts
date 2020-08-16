import express, { Router } from 'express';
import { startBot, stopBot, buyCurrency } from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', startBot);
indexRouter.get('/stop-bot', stopBot);
indexRouter.get('/currency/buy', buyCurrency);

export default indexRouter;
