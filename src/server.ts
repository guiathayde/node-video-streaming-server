import 'reflect-metadata';
import 'dotenv/config';
import 'express-async-errors';

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';

import { ensureAuthenticated } from './middleware/ensureAuthenticated';

import { AppError } from './errors/AppError';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.post('/login', (request, response) => {
  const { password } = request.body;
  if (!password) throw new AppError('Password not provided', 401);

  if (password === process.env.SECRET_TOKEN) {
    const randomNumber = Math.random().toString();
    const token = randomNumber.substring(2, randomNumber.length);
    return response
      .cookie('token', token, { maxAge: 900000, httpOnly: true })
      .status(200)
      .send();
  }

  throw new AppError('Senha inválida', 401);
});

app.post('/checkSession', (request, response) => {
  const { token } = request.cookies;
  if (token === undefined || token.length === 0)
    return response.status(401).send();

  return response.status(200).send();
});

app.post('/logout', (request, response) => {
  return response
    .cookie('token', '', { maxAge: 0, httpOnly: true })
    .status(200)
    .send();
});

app.get('/', ensureAuthenticated, (request, response) => {
  const videosFolderPath = path.resolve(__dirname, '..', 'files');
  const videosFileMap = fs.readdirSync(videosFolderPath);

  return response.json(videosFileMap);
});

app.get('/:fileName', ensureAuthenticated, (request, response) => {
  const videosFolderPath = path.resolve(__dirname, '..', 'files');
  const videosFileMap = fs.readdirSync(videosFolderPath);

  const { fileName } = request.params;
  if (!videosFileMap.includes(fileName))
    throw new AppError('File not found', 400);

  const filePath = path.resolve(__dirname, '..', 'files', fileName);
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = request.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    response.writeHead(206, head);
    file.pipe(response);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    response.writeHead(200, head);
    fs.createReadStream(filePath).pipe(response);
  }
});

app.use(
  (err: Error, request: Request, response: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      return response.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    console.error(err);

    return response.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
