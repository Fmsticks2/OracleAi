import { ApiAgent } from '../agents/ApiAgent';
import { ScraperAgent } from '../agents/ScraperAgent';
import { ValidatorAgent } from '../agents/ValidatorAgent';
import { ReasoningAgent } from '../agents/ReasoningAgent';
import { ProofAgent } from '../agents/ProofAgent';
import { ChainService } from './ChainService';
import { config } from '../config';
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

    // eslint-disable-next-line no-console
    console.log('[ConsensusEngine] fetching API data');
    const apiData = await this.api.fetch(req);
    // eslint-disable-next-line no-console
    console.log('[ConsensusEngine] API data fetched');
    const scrapeData = await this.scraper.collect(req);
    // eslint-disable-next-line no-console
    console.log('[ConsensusEngine] scrape data collected');
    const validation = this.validator.evaluate([apiData, scrapeData]);
    // eslint-disable-next-line no-console
    console.log('[ConsensusEngine] validation complete');

    const reasoning = await this.reasoner.conclude(req, validation);
    // eslint-disable-next-line no-console
    console.log('[ConsensusEngine] reasoning concluded', reasoning);
    const proofPayload = {
      req,
      validation,
      reasoning
    };
    const { hash, cid } = await this.proof.generate(proofPayload);
    // eslint-disable-next-line no-console
    console.log('[ConsensusEngine] proof generated', { hash, cid });

    const resolutionTime = Math.max(1, Math.round((Date.now() - start) / 1000));
    let txHash: string | null = null;
    if (this.chain.isReady()) {
      try {
        // Ensure market is registered on-chain
        await this.chain.registerMarket(req.marketId, req.eventDescription, req.resolutionCriteria);
        txHash = await this.chain.submitResolution(req.marketId, reasoning.outcome, reasoning.confidence, hash);
      } catch (e) {
        // On-chain submission failed; keep txHash null and continue
        // eslint-disable-next-line no-console
        console.error('[ConsensusEngine] chain submission failed', e);
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
      txHash,
      chainId: config.chain?.chainId ?? undefined
    };
  }
}
