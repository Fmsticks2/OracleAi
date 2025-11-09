import type { ResolutionRequest, ResolutionResult } from '../types';

interface StoredResolution {
  request: ResolutionRequest;
  result: ResolutionResult;
  timestamp: string;
}

export class ResolutionStore {
  private map = new Map<string, StoredResolution>();

  save(marketId: string, request: ResolutionRequest, result: ResolutionResult) {
    const entry: StoredResolution = { request, result, timestamp: new Date().toISOString() };
    this.map.set(marketId, entry);
  }

  get(marketId: string): StoredResolution | undefined {
    return this.map.get(marketId);
  }
}