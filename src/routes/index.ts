import express, { Router } from 'express';
import { startBot, stopBot, checkBotStatus, longTrade } from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', startBot);
indexRouter.get('/stop-bot', stopBot);
indexRouter.get('/bot-status', checkBotStatus);
indexRouter.get('/long-trade', longTrade);

export default indexRouter;
