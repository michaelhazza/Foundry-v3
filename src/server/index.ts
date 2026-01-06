import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env, features } from './config/env';
import { db } from './db';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/error';
import { requestIdMiddleware } from './middleware/requestLogger';
import { logger } from './lib/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  } : false,
}));

// CORS configuration - allow all origins in development for Replit proxy
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.APP_URL
    : true,
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request ID middleware
app.use(requestIdMiddleware);

// Request logging
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
}));

// Health check - REQUIRED for Replit
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    features,
    environment: env.NODE_ENV,
  });
});

// API Routes
registerRoutes(app);

// CRITICAL: Serve static files in production
if (env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../dist/client');
  app.use(express.static(staticPath));

  // SPA fallback - must be after API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Global error handler - must be last
app.use(errorHandler);

// Start server
const PORT = env.PORT;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`📦 Environment: ${env.NODE_ENV}`);
  logger.info(`✨ Features: ${JSON.stringify(features)}`);
});

export default app;
