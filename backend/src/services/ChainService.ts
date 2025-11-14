import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import registryAbi from '../abi/OracleRegistry.json';

type Outcome = 'Yes' | 'No' | 'Invalid';

export class ChainService {
  private provider?: JsonRpcProvider;
  private wallet?: Wallet;
  private registry?: Contract;

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
    const tx = await this.registry!.submitResolution(marketId, u8Outcome, u8Conf, proofHash);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  async registerMarket(marketId: string, eventDescription: string, resolutionCriteria: string): Promise<string | null> {
    if (!this.registry) return null;
    try {
      const tx = await this.registry!.registerMarket(marketId, eventDescription, resolutionCriteria);
      const receipt = await tx.wait();
      return receipt?.transactionHash || tx.hash;
    } catch (_e) {
      return null;
    }
  }
}