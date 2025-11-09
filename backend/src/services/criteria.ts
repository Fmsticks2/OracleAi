import type { ParsedCriteria, CryptoPriceCriteria, SportsMatchCriteria, ElectionsCriteria } from '../types';

export function parseCriteria(domain: 'crypto' | 'sports' | 'elections', raw: string): ParsedCriteria {
  // Try JSON first
  try {
    const obj = JSON.parse(raw);
    if (obj && obj.domain === 'crypto') return obj as CryptoPriceCriteria;
    if (obj && obj.domain === 'sports') return obj as SportsMatchCriteria;
    if (obj && obj.domain === 'elections') return obj as ElectionsCriteria;
  } catch {}

  const parts = raw.split(':');

  if (domain === 'crypto') {
    // Fallback colon format: price_above:BTC:50000:2025-11-08T12:00:00Z
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
    return {
      domain: 'crypto',
      type: 'price_at',
      symbol: 'BTC',
      timestamp: new Date().toISOString()
    };
  }

  if (domain === 'sports') {
    // Colon format: match_winner:NBA:YYYY-MM-DD:HOME:AWAY:PICK
    if (parts.length >= 6) {
      const [type, league, date, home, away, pick] = parts;
      if (type === 'match_winner' && league === 'NBA') {
        const criteria: SportsMatchCriteria = {
          domain: 'sports',
          type: 'match_winner',
          league: 'NBA',
          home,
          away,
          pick,
          date
        };
        return criteria;
      }
    }
    // Default invalid
    return {
      domain: 'sports',
      type: 'match_winner',
      league: 'NBA',
      home: 'UNK',
      away: 'UNK',
      pick: 'home',
      date: new Date().toISOString().slice(0, 10)
    };
  }

  if (domain === 'elections') {
    // Colon format: winner:RACE:DATE:CANDIDATE
    if (parts.length >= 4) {
      const [type, race, date, candidate] = parts;
      if (type === 'winner' && race && candidate) {
        const criteria: ElectionsCriteria = {
          domain: 'elections',
          type: 'winner',
          race,
          candidate,
          date
        };
        return criteria;
      }
    }
    return {
      domain: 'elections',
      type: 'winner',
      race: 'unknown',
      candidate: 'unknown',
      date: new Date().toISOString()
    };
  }

  // Default (shouldn't reach)
  return { domain: 'crypto', type: 'price_at', symbol: 'BTC', timestamp: new Date().toISOString() };
}