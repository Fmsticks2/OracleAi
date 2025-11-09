import { ApiAgent } from '../agents/ApiAgent';
import { ScraperAgent } from '../agents/ScraperAgent';
import { ValidatorAgent } from '../agents/ValidatorAgent';
import { ReasoningAgent } from '../agents/ReasoningAgent';
import { ProofAgent } from '../agents/ProofAgent';
import { ChainService } from './ChainService';
import type { ResolutionRequest, ResolutionResult } from '../types';

export class ConsensusEngine {
  private api = new ApiAgent();
  private scraper = new ScraperAgent();
  private validator = new ValidatorAgent();
  private reasoner = new ReasoningAgent();
  private proof = new ProofAgent();
  private chain = new ChainService();

  async resolve(req: ResolutionRequest): Promise<ResolutionResult> {
    const start = Date.now();

    const apiData = await this.api.fetch(req);
    const scrapeData = await this.scraper.collect(req);
    const validation = this.validator.evaluate([apiData, scrapeData]);

    const reasoning = await this.reasoner.conclude(req, validation);
    const proofPayload = {
      req,
      validation,
      reasoning
    };
    const { hash, cid } = await this.proof.generate(proofPayload);

    const resolutionTime = Math.max(1, Math.round((Date.now() - start) / 1000));
    let txHash: string | null = null;
    if (this.chain.isReady()) {
      try {
        txHash = await this.chain.submitResolution(req.marketId, reasoning.outcome, reasoning.confidence, hash);
      } catch (e) {
        // On-chain submission failed; keep txHash null and continue
        txHash = null;
      }
    }

    return {
      outcome: reasoning.outcome,
      confidence: reasoning.confidence,
      proofHash: hash,
      cid: cid || null,
      sources: validation.sources,
      resolutionTime,
      txHash
    };
  }
}
