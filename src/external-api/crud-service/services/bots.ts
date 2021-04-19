import CrudService from '../index';
import { BotTradeData } from '../../../models/bot-trade-data';

export default class CrudServiceBots extends CrudService {

	private static SERVICE_PATH: string = '/trader-bot';

	public static SaveBotTradeData = async (tradeData: BotTradeData): Promise<void> =>
		CrudService.post(`${CrudServiceBots.SERVICE_PATH}/data`, tradeData)

}
