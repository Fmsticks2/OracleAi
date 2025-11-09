export type Domain = 'sports' | 'crypto' | 'elections';

export interface ResolutionRequest {
  marketId: string;
  eventDescription: string;
  resolutionCriteria: string;
  domain: Domain;
}

export type Outcome = 'Yes' | 'No' | 'Invalid';

export interface ResolutionResult {
  outcome: Outcome;
  confidence: number;
  proofHash: string;
  cid?: string | null;
  sources: string[];
  resolutionTime: number; // seconds
  txHash: string | null; // BNB Chain transaction (future)
}

// Criteria types (initial: crypto)
export type CryptoCriteriaType = 'price_above' | 'price_below' | 'price_at';
export interface CryptoPriceCriteria {
  domain: 'crypto';
  type: CryptoCriteriaType;
  symbol: string; // e.g., BTC, ETH
  price?: number; // required for above/below
  timestamp: string; // ISO string (UTC)
}

export type ParsedCriteria = CryptoPriceCriteria; // extend with sports/elections later