import type { ResolutionRequest } from '../types';

export class ScraperAgent {
  async collect(_req: ResolutionRequest): Promise<{ sources: string[]; agreement: number }> {
    // Placeholder: real implementation will scrape pages with Playwright/Puppeteer
    const sources = ['https://example.com/source1', 'https://example.com/source2'];
    const agreement = 0.85; // 85% placeholder agreement
    return { sources, agreement };
  }
}