import axios from 'axios';

async function main() {
  const base = 'http://localhost:3000/api/v1';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = process.env.API_KEY || '';
  if (apiKey) headers['x-api-key'] = apiKey;

  const tests = [
    {
      name: 'crypto: ETH > 1000 at 2024-01-01',
      body: {
        marketId: 'mkt-eth-above-1000',
        domain: 'crypto' as const,
        eventDescription: 'ETH above 1000 at 2024-01-01T00:00:00Z',
        resolutionCriteria: 'price_above:ETH:1000:2024-01-01T00:00:00Z'
      }
    },
    {
      name: 'sports: NBA LAL vs BOS winner home on 2025-11-08',
      body: {
        marketId: 'mkt-nba-lal-bos-2025-11-08',
        domain: 'sports' as const,
        eventDescription: 'NBA LAL vs BOS winner home',
        resolutionCriteria: 'match_winner:NBA:2025-11-08:LAL:BOS:home'
      }
    },
    {
      name: 'elections: US President 2024 winner Joe Biden',
      body: {
        marketId: 'mkt-election-joe-biden',
        domain: 'elections' as const,
        eventDescription: 'US President 2024 winner Joe Biden',
        resolutionCriteria: 'winner:US President 2024:2024-11-05:Joe Biden'
      }
    }
  ];

  for (const t of tests) {
    try {
      const resp = await axios.post(`${base}/resolve`, t.body, { headers });
      console.log(`\n[${t.name}]`);
      console.log(JSON.stringify(resp.data, null, 2));
    } catch (e: any) {
      console.error(`\n[${t.name}] ERROR`, e?.response?.data || e?.message);
    }
    // Small delay to avoid nonce collisions on local automining
    await new Promise((r) => setTimeout(r, 1500));
  }

  try {
    const feed = await axios.get(`${base}/feed`, { headers });
    console.log('\n[feed]');
    console.log(JSON.stringify(feed.data, null, 2));
  } catch (e: any) {
    console.error('\n[feed] ERROR', e?.response?.data || e?.message);
  }
}

main().catch((e) => {
  console.error('fatal', e);
  process.exit(1);
});