import express from 'express';
import { priceChanges } from '../controllers';
const indexRouter = express.Router();

indexRouter.get('/price-changes', priceChanges);

export default indexRouter;
