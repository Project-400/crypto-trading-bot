import { Request, Response } from 'express';

export class ConnectionController {

	public static openConnection = (req: Request, res: Response): Response => {
		return res.status(200).json({ success: true, connected: true });
	}

}
