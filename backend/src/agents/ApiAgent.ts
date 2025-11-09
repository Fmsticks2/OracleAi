import type { ResolutionRequest } from '../types';
import { parseCriteria } from '../services/criteria';
import { resolveCryptoPrice } from '../services/CryptoResolver';

export class ApiAgent {
  async fetch(req: ResolutionRequest): Promise<{ sources: string[]; agreement: number; proposedOutcome?: 'Yes' | 'No' | 'Invalid'; confidence?: number }> {
    if (req.domain === 'crypto') {
      const criteria = parseCriteria('crypto', req.resolutionCriteria);
      const result = await resolveCryptoPrice(criteria);
      return { sources: result.sources, agreement: result.confidence / 100, proposedOutcome: result.outcome, confidence: result.confidence };
    }
    // Placeholders for other domains
    const sources =
      req.domain === 'sports'
        ? ['https://www.espn.com', 'https://www.thescore.com', 'https://www.nba.com']
        : ['https://www.apnews.com', 'https://www.reuters.com', 'https://www.bbc.com'];
    const agreement = 0.8;
    return { sources, agreement };
  }
}