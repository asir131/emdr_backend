import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  const response = {
    status: 'success',
    data,
  };
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode = 400) => {
  const response = {
    status: 'error',
    message,
  };
  res.status(statusCode).json(response);
};
