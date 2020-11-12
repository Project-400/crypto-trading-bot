import express, { Router } from 'express';
import { HealthController, BotController } from '../controllers';

const indexRouter: Router = express.Router();

indexRouter.get('/health', HealthController.health);

indexRouter.get('/trader-bot', BotController.getBot);
indexRouter.get('/trader-bot/all', BotController.getAllBots);
indexRouter.post('/trader-bot', BotController.deployBot);
indexRouter.put('/trader-bot/stop', BotController.stopBot);
indexRouter.put('/trader-bot/pause', BotController.pauseBot);
indexRouter.put('/trader-bot/shutdown-all', BotController.shutdownBots);
// indexRouter.get('/bot-status', BotController.checkBotStatus);
indexRouter.post('/long-trade', BotController.longTrade);
indexRouter.post('/connect', BotController.openConnection);

export default indexRouter;
