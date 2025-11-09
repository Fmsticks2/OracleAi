import { Router } from 'express';
import { z } from 'zod';
import { ConsensusEngine } from './services/ConsensusEngine';
import type { ResolutionRequest } from './types';

const router = Router();
const engine = new ConsensusEngine();

const resolveSchema = z.object({
  marketId: z.string().min(1),
  eventDescription: z.string().min(1),
  resolutionCriteria: z.string().min(1),
  domain: z.enum(['sports', 'crypto', 'elections'])
});

router.post('/resolve', async (req, res) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  const reqData = parsed.data as ResolutionRequest;
  try {
    const result = await engine.resolve(reqData);
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Resolution failed' });
  }
});

router.get('/status/:marketId', async (req, res) => {
  const { marketId } = req.params;
  return res.json({ marketId, status: 'unknown', lastUpdated: new Date().toISOString() });
});

router.get('/proof/:marketId', async (req, res) => {
  const { marketId } = req.params;
  return res.json({ marketId, sources: [], proofHash: null, timestamp: new Date().toISOString() });
});

router.get('/analytics', async (_req, res) => {
  return res.json({
    totalResolutions: 0,
    avgResolutionTimeSec: 0,
    accuracyEstimatePct: 0,
    revenueUsdEstimate: 0
  });
});

export default router;