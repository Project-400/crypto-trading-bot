import express, { Router } from 'express';
import { startBot, stopBot } from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', startBot);
indexRouter.get('/stop-bot', stopBot);

export default indexRouter;
