import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ConsensusEngine } from './services/ConsensusEngine';
import { ResolutionStore } from './services/ResolutionStore';
import type { ResolutionRequest } from './types';

const router = Router();
const engine = new ConsensusEngine();
const store = new ResolutionStore();

const resolveSchema = z.object({
  marketId: z.string().min(1),
  eventDescription: z.string().min(1),
  resolutionCriteria: z.string().min(1),
  domain: z.enum(['sports', 'crypto', 'elections'])
});

router.post('/resolve', async (req: Request, res: Response) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  const reqData = parsed.data as ResolutionRequest;
  try {
    const result = await engine.resolve(reqData);
    store.save(reqData.marketId, reqData, result);
    return res.json(result);
  } catch (e: any) {
    // Log the error to aid debugging
    // eslint-disable-next-line no-console
    console.error('Resolution error:', e);
    return res.status(500).json({ error: e?.message || 'Resolution failed' });
  }
});

router.get('/status/:marketId', async (req: Request, res: Response) => {
  const { marketId } = req.params;
  const entry = store.get(marketId);
  if (!entry) return res.json({ marketId, status: 'unknown', lastUpdated: new Date().toISOString() });
  return res.json({ marketId, status: 'resolved', lastUpdated: entry.timestamp, result: entry.result });
});

router.get('/proof/:marketId', async (req: Request, res: Response) => {
  const { marketId } = req.params;
  const entry = store.get(marketId);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  return res.json({ marketId, sources: entry.result.sources, proofHash: entry.result.proofHash, cid: entry.result.cid || null, timestamp: entry.timestamp });
});

router.get('/analytics', async (_req: Request, res: Response) => {
  return res.json({
    totalResolutions: 0,
    avgResolutionTimeSec: 0,
    accuracyEstimatePct: 0,
    revenueUsdEstimate: 0
  });
});

router.get('/feed', async (_req: Request, res: Response) => {
  const list = store.listLatest(50);
  const feed = list.map((e) => ({
    marketId: e.request.marketId,
    eventDescription: e.request.eventDescription,
    domain: e.request.domain,
    outcome: e.result.outcome,
    confidence: e.result.confidence,
    proofHash: e.result.proofHash,
    cid: e.result.cid || null,
    timestamp: e.timestamp,
    txHash: e.result.txHash,
    chainId: (e.result as any).chainId ?? null
  }));
  return res.json({ items: feed });
});

export default router;