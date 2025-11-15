import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { Registry, collectDefaultMetrics } from 'prom-client';
import routes from './routes';
import { apiKeyAuth } from './middleware/auth';
import { limiter } from './middleware/rateLimit';
import { config } from './config';

const logger = pino({ name: 'oracleai-backend', level: process.env.LOG_LEVEL || 'info' });
const app = express();

// Trust proxy in production behind load balancer
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Request logging
app.use(pinoHttp({ logger }));

// CORS: default to env origin if provided
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));

app.use(express.json());
app.use('/api/v1', limiter, apiKeyAuth, routes);

// Health
app.get('/health', (_req: express.Request, res: express.Response) => res.json({ status: 'ok' }));

// Prometheus metrics
const register = new Registry();
collectDefaultMetrics({ register });
app.get('/metrics', async (_req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT || config.port || 3000);
app.listen(port, () => logger.info({ port }, 'API server listening'));