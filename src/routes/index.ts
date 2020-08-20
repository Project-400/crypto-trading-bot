import express, { Router } from 'express';
import { startBot, stopBot, checkBotStatus } from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', startBot);
indexRouter.get('/stop-bot', stopBot);
indexRouter.get('/bot-status', checkBotStatus);

export default indexRouter;
