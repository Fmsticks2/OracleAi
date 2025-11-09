import axios from 'axios';
import type { CryptoPriceCriteria } from '../types';

type SourceReading = { source: string; price: number | null };

function pairs(symbol: string) {
  const upper = symbol.toUpperCase();
  const binance = `${upper}USDT`;
  const coinbase = `${upper}-USD`;
  return { binance, coinbase };
}

function isoToRange(iso: string) {
  const start = new Date(iso).getTime();
  const end = start + 60_000; // one minute window
  return { start, end };
}

export async function resolveCryptoPrice(criteria: CryptoPriceCriteria) {
  const { binance, coinbase } = pairs(criteria.symbol);
  const { start, end } = isoToRange(criteria.timestamp);

  const readings: SourceReading[] = [];

  // Binance 1m candle close
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${binance}&interval=1m&startTime=${start}&endTime=${end}`;
    const resp = await axios.get(url, { timeout: 8000 });
    const arr = resp.data as any[];
    if (Array.isArray(arr) && arr.length > 0) {
      const close = Number(arr[0][4]);
      readings.push({ source: 'binance', price: isNaN(close) ? null : close });
    } else {
      readings.push({ source: 'binance', price: null });
    }
  } catch {
    readings.push({ source: 'binance', price: null });
  }

  // Coinbase 1m candle close
  try {
    const startIso = new Date(start).toISOString();
    const endIso = new Date(end).toISOString();
    const url = `https://api.exchange.coinbase.com/products/${coinbase}/candles?granularity=60&start=${startIso}&end=${endIso}`;
    const resp = await axios.get(url, { timeout: 8000 });
    const arr = resp.data as any[];
    if (Array.isArray(arr) && arr.length > 0) {
      // Coinbase returns [time, low, high, open, close, volume]
      const close = Number(arr[0][4]);
      readings.push({ source: 'coinbase', price: isNaN(close) ? null : close });
    } else {
      readings.push({ source: 'coinbase', price: null });
    }
  } catch {
    readings.push({ source: 'coinbase', price: null });
  }

  const prices = readings.filter(r => r.price !== null).map(r => r.price as number);
  const sources = readings.map(r => r.source);
  const agreementSources = prices.length;
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

  // Determine outcome
  let outcome: 'Yes' | 'No' | 'Invalid' = 'Invalid';
  if (avg !== null) {
    if (criteria.type === 'price_above' && typeof criteria.price === 'number') {
      outcome = avg > criteria.price ? 'Yes' : 'No';
    } else if (criteria.type === 'price_below' && typeof criteria.price === 'number') {
      outcome = avg < criteria.price ? 'Yes' : 'No';
    } else if (criteria.type === 'price_at') {
      outcome = 'Invalid'; // non-binary outcome; treat as invalid for MVP
    }
  }

  // Confidence: agreement * quality heuristic
  const base = agreementSources >= 2 ? 0.9 : agreementSources === 1 ? 0.7 : 0.3;
  const confidence = Math.round(base * 100);

  return { outcome, confidence, sources };
}