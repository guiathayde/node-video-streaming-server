import { Request, Response, NextFunction } from 'express';

export function allowCrossDomain(
  request: Request,
  response: Response,
  next: NextFunction
) {
  response.header('Access-Control-Allow-Origin', `${process.env.FRONT_URL}`);
  response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  response.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}
