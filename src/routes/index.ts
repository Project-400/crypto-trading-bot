import express, { Router } from 'express';
import { BotController} from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/start-bot', BotController.deployBot);
indexRouter.get('/stop-bot', BotController.stopBot);
indexRouter.get('/get-bot', BotController.getBot);
indexRouter.get('/get-all-bots', BotController.getAllBots);
// indexRouter.get('/bot-status', BotController.checkBotStatus);
indexRouter.get('/long-trade', BotController.longTrade);

export default indexRouter;
