import type { ResolutionRequest } from '../types';

export class ApiAgent {
  async fetch(req: ResolutionRequest): Promise<{ sources: string[]; agreement: number }> {
    // Placeholder: real implementation will call domain-specific APIs
    const sources =
      req.domain === 'crypto'
        ? ['https://api.coingecko.com', 'https://api.binance.com', 'https://api.coinmarketcap.com']
        : req.domain === 'sports'
        ? ['https://www.espn.com', 'https://www.thescore.com', 'https://www.nba.com']
        : ['https://www.apnews.com', 'https://www.reuters.com', 'https://www.bbc.com'];
    const agreement = 0.9; // 90% placeholder agreement
    return { sources, agreement };
  }
}