import express, { Router } from 'express';
import { startBot, stopBot, trade, test, analystBot } from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', startBot);
indexRouter.get('/stop-bot', stopBot);
indexRouter.get('/bot/trade', trade);
indexRouter.get('/test', test);
indexRouter.get('/analyst', analystBot);

export default indexRouter;
