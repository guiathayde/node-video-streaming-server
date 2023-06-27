import { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError';

export function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const { token } = request.cookies;
  if (token === undefined || token.length === 0)
    throw new AppError('Invalid token', 401);

  next();
}
