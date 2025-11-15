import IORedis from 'ioredis';

function getRedis(): IORedis | null {
  const url = process.env.REDIS_URL || '';
  if (!url) return null;
  // ioredis accepts a Redis URL directly
  return new IORedis(url, { maxRetriesPerRequest: 3, enableReadyCheck: true });
}

export class NonceStore {
  private redis: IORedis | null;
  constructor() {
    this.redis = getRedis();
  }

  private key(address: string) {
    return `nonce:${address.toLowerCase()}`;
  }

  async init(address: string, current: number): Promise<void> {
    if (!this.redis) return;
    // Initialize only if not exists
    await this.redis.set(this.key(address), String(current), 'NX');
  }

  async reserveNext(address: string): Promise<number> {
    if (!this.redis) throw new Error('Redis not configured');
    const value = await this.redis.incr(this.key(address));
    return Number(value);
  }

  async reset(address: string, current: number): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(this.key(address), String(current));
  }
}