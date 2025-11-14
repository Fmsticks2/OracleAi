import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import routes from './routes';
import { apiKeyAuth } from './middleware/auth';
import { limiter } from './middleware/rateLimit';

const logger = pino({ name: 'oracleai-backend' });
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1', limiter, apiKeyAuth, routes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => logger.info({ port }, 'API server listening'));