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

  listLatest(limit = 20): StoredResolution[] {
    const items = Array.from(this.map.values());
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, limit);
  }
}