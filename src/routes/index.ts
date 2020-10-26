import express, { Router } from 'express';
import { BotController} from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', BotController.startBot);
indexRouter.get('/stop-bot', BotController.stopBot);
indexRouter.get('/bot-status', BotController.checkBotStatus);
indexRouter.get('/long-trade', BotController.longTrade);

export default indexRouter;
