import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error | ApiError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }


  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    const field = firstError.path[firstError.path.length - 1]?.toString();
    
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError.message,
        field: field || undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  
  if (err instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(err.errors)[0];
    const field = firstError.path;
    
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError.message,
        field,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }


  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    
    res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email already registered',
        field,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }


  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid ID format',
        field: err.path,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }


  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.field && { field: err.field }),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

 
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token expired',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }


  console.error('💥 Unexpected Error:', err);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ApiError(404, 'NOT_FOUND', `Route ${req.originalUrl} not found`);
  next(error);
};
