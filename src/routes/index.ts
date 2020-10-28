import express, { Router } from 'express';
import { BotController} from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/get-bot', BotController.getBot);
indexRouter.get('/get-all-bots', BotController.getAllBots);
indexRouter.post('/start-bot', BotController.deployBot);
indexRouter.put('/stop-bot', BotController.stopBot);
indexRouter.put('/shutdown-bots', BotController.shutdownBots);
// indexRouter.get('/bot-status', BotController.checkBotStatus);
indexRouter.post('/long-trade', BotController.longTrade);

export default indexRouter;
