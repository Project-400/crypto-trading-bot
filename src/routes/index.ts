import express, { Router } from 'express';
import { HealthController, BotController, TestController, ConnectionController } from '../controllers';

const indexRouter: Router = express.Router();

// Health Endpoints

indexRouter.get('/health', HealthController.health);

// Bot Endpoints

indexRouter.post('/bot', BotController.createBot);
indexRouter.delete('/bot', BotController.removeBot);

// Connection Endpoints

indexRouter.post('/connect', ConnectionController.openConnection);

// Test Endpoints

indexRouter.get('/test/bot', TestController.getBot);
indexRouter.get('/test/bot/trade-data', TestController.getBotTradeData);
indexRouter.get('/test/bot/all', TestController.getAllBots);
indexRouter.get('/test/bot/count', TestController.getBotCount);
indexRouter.put('/test/bot/pause', TestController.pauseBot);
indexRouter.put('/test/bot/shutdown-all', TestController.shutdownBots);

export default indexRouter;
