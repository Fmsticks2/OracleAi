import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import registryAbi from '../abi/OracleRegistry.json';
import { NonceStore } from './NonceStore';

function getConnectionOptions() {
  const url = process.env.REDIS_URL || '';
  if (!url) return undefined as any;
  // bullmq accepts IORedis connection options; URL parsing handled by ioredis internally if using "url" but bullmq expects options.
  // We will parse the URL to host/port/password for portability.
  try {
    const u = new URL(url);
    const opts: any = {
      host: u.hostname,
      port: Number(u.port || 6379)
    };
    if (u.password) opts.password = u.password;
    return opts;
  } catch {
    return undefined as any;
  }
}

const connOpts = getConnectionOptions();
export const chainQueue = new Queue('chain-jobs', { connection: connOpts });
export const queueEvents = new QueueEvents('chain-jobs', { connection: connOpts });

export function startChainWorker() {
  const enabled = (process.env.QUEUE_WORKER || '1').toString() === '1';
  if (!enabled) return;
  if (!connOpts) {
    // eslint-disable-next-line no-console
    console.warn('[ChainWorker] REDIS_URL not set; worker not started');
    return;
  }
  const rpcUrl = process.env.RPC_URL || '';
  const privateKey = process.env.PRIVATE_KEY || '';
  const address = process.env.REGISTRY_ADDRESS || '';
  if (!(rpcUrl && privateKey && address)) {
    // eslint-disable-next-line no-console
    console.warn('[ChainWorker] Chain not configured; worker disabled');
    return;
  }
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const registry = new Contract(address, registryAbi as any, wallet);
  const nonceStoreEnabled = (process.env.USE_REDIS_NONCE || '').toLowerCase() === 'true';
  const store = nonceStoreEnabled ? new NonceStore() : null;
  let nextNonce: number | null = null;

  async function getAndIncrementNonce(): Promise<number> {
    if (nonceStoreEnabled && store) {
      return await store.reserveNext(wallet.address);
    }
    if (nextNonce === null) {
      const current = await provider.getTransactionCount(wallet.address, 'latest');
      nextNonce = current;
    }
    const nonce = nextNonce!;
    nextNonce = nonce + 1;
    return nonce;
  }

  async function withRetry<T>(label: string, task: () => Promise<T>, retries = 2): Promise<T> {
    let attempt = 0;
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
          console.warn('[ChainWorker] retry after nonce error', { label, attempt, code, msg });
          nextNonce = null;
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        throw e;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log('[ChainWorker] starting');

  const worker = new Worker(
    'chain-jobs',
    async (job) => {
      if (job.name === 'registerMarket') {
        const { marketId, eventDescription, resolutionCriteria } = job.data as { marketId: string; eventDescription: string; resolutionCriteria: string };
        const txHash = await withRetry(`register:${marketId}`, async () => {
          const nonce = await getAndIncrementNonce();
          const tx = await registry.registerMarket(marketId, eventDescription, resolutionCriteria, { nonce });
          const receipt = await tx.wait();
          return receipt?.transactionHash || tx.hash;
        });
        return { txHash };
      }
      if (job.name === 'submitResolution') {
        const { marketId, u8Outcome, u8Conf, proofHash } = job.data as { marketId: string; u8Outcome: number; u8Conf: number; proofHash: string };
        const txHash = await withRetry(`submit:${marketId}`, async () => {
          const nonce = await getAndIncrementNonce();
          const tx = await registry.submitResolution(marketId, u8Outcome, u8Conf, proofHash, { nonce });
          const receipt = await tx.wait();
          return receipt?.hash || tx.hash;
        });
        return { txHash };
      }
      throw new Error(`Unknown job: ${job.name}`);
    },
    { connection: getConnectionOptions(), concurrency: 1 }
  );

  worker.on('completed', (job, result) => {
    // eslint-disable-next-line no-console
    console.log('[ChainWorker] completed', { id: job.id, name: job.name, result });
  });
  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error('[ChainWorker] failed', { id: job?.id, name: job?.name, err });
  });
}