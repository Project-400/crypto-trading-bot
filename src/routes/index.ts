import express, { Router } from 'express';
import {startBot, stopBot, sellCurrency, trade} from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', startBot);
indexRouter.get('/stop-bot', stopBot);
indexRouter.get('/currency/sell', sellCurrency);
indexRouter.get('/bot/trade', trade);

export default indexRouter;
