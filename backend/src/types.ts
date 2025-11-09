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
  sources: string[];
  resolutionTime: number; // seconds
  txHash: string | null; // BNB Chain transaction (future)
}