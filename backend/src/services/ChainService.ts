import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import registryAbi from '../abi/OracleRegistry.json';

type Outcome = 'Yes' | 'No' | 'Invalid';

export class ChainService {
  private provider?: JsonRpcProvider;
  private wallet?: Wallet;
  private registry?: Contract;
  // Simple in-process per-wallet queue to serialize tx submissions
  private draining = false;
  private pending: Array<{ label: string; fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }> = [];
  private nextNonce: number | null = null;

  constructor() {
    const rpcUrl = process.env.RPC_URL || '';
    const privateKey = process.env.PRIVATE_KEY || '';
    const address = process.env.REGISTRY_ADDRESS || '';
    if (rpcUrl && privateKey && address) {
      this.provider = new JsonRpcProvider(rpcUrl);
      this.wallet = new Wallet(privateKey, this.provider);
      this.registry = new Contract(address, registryAbi as any, this.wallet);
      // eslint-disable-next-line no-console
      console.log('[ChainService] configured', { rpcUrl, address, wallet: this.wallet.address });
    }
  }

  private enqueue<T>(label: string, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.push({ label, fn, resolve, reject });
      this.drainQueue();
    });
  }

  private async drainQueue() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.pending.length > 0) {
        const item = this.pending.shift()!;
        // eslint-disable-next-line no-console
        console.log('[ChainService] queue start', { label: item.label, size: this.pending.length });
        try {
          const res = await item.fn();
          item.resolve(res);
          // eslint-disable-next-line no-console
          console.log('[ChainService] queue done', { label: item.label });
        } catch (e) {
          item.reject(e);
          // eslint-disable-next-line no-console
          console.error('[ChainService] queue fail', { label: item.label, error: e });
        }
      }
    } finally {
      this.draining = false;
    }
  }

  isReady() {
    return !!this.registry;
  }

  outcomeToUint(outcome: Outcome): number {
    return outcome === 'Yes' ? 0 : outcome === 'No' ? 1 : 2;
  }

  private async withRetry<T>(label: string, task: () => Promise<T>, retries = 2): Promise<T> {
    let attempt = 0;
    // eslint-disable-next-line no-console
    while (true) {
      try {
        return await task();
      } catch (e: any) {
        const msg = String(e?.shortMessage || e?.message || '');
        const code = e?.code || '';
        const shouldRetry = attempt < retries && (code === 'NONCE_EXPIRED' || /nonce/i.test(msg));
        if (shouldRetry) {
          attempt += 1;
          // eslint-disable-next-line no-console
          console.warn('[ChainService] retrying task after nonce error', { label, attempt, code, msg });
          // Reset local nonce to resync with chain on retry
          this.nextNonce = null;
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        throw e;
      }
    }
  }

  private async getAndIncrementNonce(): Promise<number> {
    if (!this.wallet) throw new Error('Wallet not configured');
    if (this.nextNonce === null) {
      // Use latest mined nonce to avoid Hardhat automining pending-queue issues
      const addr = this.wallet.address;
      const current = await this.provider!.getTransactionCount(addr, 'latest');
      this.nextNonce = current;
    }
    const nonce = this.nextNonce;
    this.nextNonce = nonce + 1;
    return nonce;
  }

  async submitResolution(marketId: string, outcome: Outcome, confidence: number, proofHash: string): Promise<string> {
    if (!this.registry) throw new Error('Chain not configured');
    const u8Outcome = this.outcomeToUint(outcome);
    const u8Conf = Math.max(0, Math.min(100, Math.round(confidence)));
    return this.enqueue<string>(`submit:${marketId}`, async () => {
      const txHash = await this.withRetry(`submit:${marketId}`, async () => {
        const nonce = await this.getAndIncrementNonce();
        const tx = await this.registry!.submitResolution(marketId, u8Outcome, u8Conf, proofHash, { nonce });
        const receipt = await tx.wait();
        return receipt?.hash || tx.hash;
      });
      return txHash;
    });
  }

  async registerMarket(marketId: string, eventDescription: string, resolutionCriteria: string): Promise<string | null> {
    if (!this.registry) return null;
    return this.enqueue<string | null>(`register:${marketId}`, async () => {
      try {
        const txHash = await this.withRetry(`register:${marketId}`, async () => {
          const nonce = await this.getAndIncrementNonce();
          const tx = await this.registry!.registerMarket(marketId, eventDescription, resolutionCriteria, { nonce });
          const receipt = await tx.wait();
          return receipt?.transactionHash || tx.hash;
        });
        return txHash;
      } catch (_e) {
        return null;
      }
    });
  }
}