import express from 'express';
import { startBot, stopBot } from '../controllers';
const indexRouter = express.Router();

indexRouter.get('/start-bot', startBot);
indexRouter.get('/stop-bot', stopBot);

export default indexRouter;
