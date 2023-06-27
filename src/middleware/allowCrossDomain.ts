import { Request, Response, NextFunction } from 'express';

export function allowCrossDomain(
  request: Request,
  response: Response,
  next: NextFunction
) {
  response.header(
    'Access-Control-Allow-Origin',
    process.env.NODE_ENV === 'prod' ? 'video.guiathayde.dev' : 'localhost:5173'
  );
  response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  response.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}
