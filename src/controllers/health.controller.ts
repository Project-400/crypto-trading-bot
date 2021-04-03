import { Request, Response } from 'express';

export class HealthController {

	public static health = async (req: Request, res: Response): Promise<Response> =>
		res.status(200).json({ success: true })

}
