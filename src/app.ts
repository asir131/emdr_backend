import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { logger } from './config/logger';
import { redis } from './config/redis';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : '*',
  credentials: true,
}));

// NoSQL injection prevention
app.use(mongoSanitize());

// HTTP request logging — skip in test env
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// Global rate limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check — includes DB + Redis status
app.get('/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch {
    redisStatus = 'disconnected';
  }

  const healthy = dbStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

// API routes
app.use('/api', routes);

// 404 + error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
