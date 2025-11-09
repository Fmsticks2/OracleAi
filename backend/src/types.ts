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

// Sports criteria
export type SportsLeague = 'NBA';
export type SportsCriteriaType = 'match_winner';
export interface SportsMatchCriteria {
  domain: 'sports';
  type: SportsCriteriaType;
  league: SportsLeague;
  home: string; // team code, e.g., LAL
  away: string; // team code, e.g., BOS
  pick: string; // team code or 'home'/'away'
  date: string; // YYYY-MM-DD
}

// Elections criteria
export type ElectionsCriteriaType = 'winner';
export interface ElectionsCriteria {
  domain: 'elections';
  type: ElectionsCriteriaType;
  race: string; // e.g., US-President
  candidate: string; // candidate full name
  date: string; // ISO date
}

export type ParsedCriteria = CryptoPriceCriteria | SportsMatchCriteria | ElectionsCriteria;