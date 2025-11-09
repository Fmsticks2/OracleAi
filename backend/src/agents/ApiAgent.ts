import type { ResolutionRequest } from '../types';
import { parseCriteria } from '../services/criteria';
import { resolveCryptoPrice } from '../services/CryptoResolver';
import { resolveSportsMatch } from '../services/SportsResolver';
import { resolveElectionWinner } from '../services/ElectionsResolver';

export class ApiAgent {
  async fetch(req: ResolutionRequest): Promise<{ sources: string[]; agreement: number; proposedOutcome?: 'Yes' | 'No' | 'Invalid'; confidence?: number }> {
    if (req.domain === 'crypto') {
      const criteria = parseCriteria('crypto', req.resolutionCriteria);
      const result = await resolveCryptoPrice(criteria);
      return { sources: result.sources, agreement: result.confidence / 100, proposedOutcome: result.outcome, confidence: result.confidence };
    }
    if (req.domain === 'sports') {
      const criteria = parseCriteria('sports', req.resolutionCriteria);
      const result = await resolveSportsMatch(criteria);
      return { sources: result.sources, agreement: result.confidence / 100, proposedOutcome: result.outcome, confidence: result.confidence };
    }
    if (req.domain === 'elections') {
      const criteria = parseCriteria('elections', req.resolutionCriteria);
      const result = await resolveElectionWinner(criteria);
      return { sources: result.sources, agreement: result.confidence / 100, proposedOutcome: result.outcome, confidence: result.confidence };
    }
    return { sources: [], agreement: 0.5 };
  }
}