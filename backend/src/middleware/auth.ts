import { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const requiredKey = process.env.API_KEY || '';
  if (!requiredKey) return next(); // auth disabled if no key set
  const key = req.header('x-api-key');
  if (key && key === requiredKey) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}