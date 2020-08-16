"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../controllers");
const indexRouter = express_1.default.Router();
indexRouter.get('/start-bot', controllers_1.startBot);
indexRouter.get('/stop-bot', controllers_1.stopBot);
indexRouter.get('/currency/sell', controllers_1.sellCurrency);
exports.default = indexRouter;
