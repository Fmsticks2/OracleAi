import type { ParsedCriteria, CryptoPriceCriteria } from '../types';

export function parseCriteria(domain: 'crypto', raw: string): ParsedCriteria {
  // Try JSON first
  try {
    const obj = JSON.parse(raw);
    if (obj && obj.domain === 'crypto') return obj as CryptoPriceCriteria;
  } catch {}

  // Fallback colon format: price_above:BTC:50000:2025-11-08T12:00:00Z
  const parts = raw.split(':');
  if (parts.length >= 4) {
    const [type, symbol, priceStr, timestamp] = parts;
    if (['price_above', 'price_below', 'price_at'].includes(type) && symbol && timestamp) {
      const priceNum = Number(priceStr);
      const criteria: CryptoPriceCriteria = {
        domain: 'crypto',
        type: type as CryptoPriceCriteria['type'],
        symbol,
        price: isNaN(priceNum) ? undefined : priceNum,
        timestamp
      };
      return criteria;
    }
  }

  // Minimal default: treat as invalid
  return {
    domain: 'crypto',
    type: 'price_at',
    symbol: 'BTC',
    timestamp: new Date().toISOString()
  };
}