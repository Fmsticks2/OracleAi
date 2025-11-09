import { ApiAgent } from '../agents/ApiAgent';
import { ScraperAgent } from '../agents/ScraperAgent';
import { ValidatorAgent } from '../agents/ValidatorAgent';
import { ReasoningAgent } from '../agents/ReasoningAgent';
import { ProofAgent } from '../agents/ProofAgent';
import type { ResolutionRequest, ResolutionResult } from '../types';

export class ConsensusEngine {
  private api = new ApiAgent();
  private scraper = new ScraperAgent();
  private validator = new ValidatorAgent();
  private reasoner = new ReasoningAgent();
  private proof = new ProofAgent();

  async resolve(req: ResolutionRequest): Promise<ResolutionResult> {
    const start = Date.now();

    const apiData = await this.api.fetch(req);
    const scrapeData = await this.scraper.collect(req);
    const validation = this.validator.evaluate([apiData, scrapeData]);

    const reasoning = await this.reasoner.conclude(req, validation);
    const hash = await this.proof.generate({
      req,
      validation,
      reasoning
    });

    const resolutionTime = Math.max(1, Math.round((Date.now() - start) / 1000));
    return {
      outcome: reasoning.outcome,
      confidence: reasoning.confidence,
      proofHash: hash,
      sources: validation.sources,
      resolutionTime,
      txHash: null
    };
  }
}
