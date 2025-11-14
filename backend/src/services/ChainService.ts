import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import registryAbi from '../abi/OracleRegistry.json';

type Outcome = 'Yes' | 'No' | 'Invalid';

export class ChainService {
  private provider?: JsonRpcProvider;
  private wallet?: Wallet;
  private registry?: Contract;
  // Simple in-process per-wallet queue to serialize tx submissions
  private processing = false;
  private pending: Array<{ label: string; fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }> = [];

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
      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing) return;
    const item = this.pending.shift();
    if (!item) return;
    this.processing = true;
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
    } finally {
      this.processing = false;
      // schedule next task without blocking this turn
      setImmediate(() => this.processNext());
    }
  }

  isReady() {
    return !!this.registry;
  }

  outcomeToUint(outcome: Outcome): number {
    return outcome === 'Yes' ? 0 : outcome === 'No' ? 1 : 2;
  }

  async submitResolution(marketId: string, outcome: Outcome, confidence: number, proofHash: string): Promise<string> {
    if (!this.registry) throw new Error('Chain not configured');
    const u8Outcome = this.outcomeToUint(outcome);
    const u8Conf = Math.max(0, Math.min(100, Math.round(confidence)));
    return this.enqueue<string>(`submit:${marketId}`, async () => {
      const tx = await this.registry!.submitResolution(marketId, u8Outcome, u8Conf, proofHash);
      const receipt = await tx.wait();
      return receipt?.hash || tx.hash;
    });
  }

  async registerMarket(marketId: string, eventDescription: string, resolutionCriteria: string): Promise<string | null> {
    if (!this.registry) return null;
    return this.enqueue<string | null>(`register:${marketId}`, async () => {
      try {
        const tx = await this.registry!.registerMarket(marketId, eventDescription, resolutionCriteria);
        const receipt = await tx.wait();
        return receipt?.transactionHash || tx.hash;
      } catch (_e) {
        return null;
      }
    });
  }
}