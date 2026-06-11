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
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerCustomCss } from './config/swagger';

const app = express();

const allowedHeaders = [
  'Authorization',
  'Content-Type',
  'Accept',
  'Origin',
  'X-Requested-With',
  'ngrok-skip-browser-warning',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // In dev, allow and echo any origin to satisfy browser credential security
    if (!origin || env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    const allowed = env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
    if (allowed.includes(origin) || allowed.includes('*')) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders,
};

// Trust proxy — required when running behind Cloudflare tunnel or any reverse proxy
// This allows express-rate-limit to correctly identify client IPs from X-Forwarded-For
app.set('trust proxy', 1);

// Security headers — configured to allow Swagger's internal assets
app.use(helmet({
  contentSecurityPolicy: false, 
}));

// CORS — Dynamic origin to support tunnel & multiple devices
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
}));

// Body parsing
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

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

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: swaggerCustomCss,
  customSiteTitle: 'MY-EMDR API Documentation',
}));

// Serving payment tester diagnostic page
import path from 'path';
app.get('/test-payment', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'payment-tester.html'));
});

// API routes
app.use('/api', routes);

// 404 + error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
