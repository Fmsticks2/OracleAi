import axios from 'axios';

async function main() {
  const base = 'http://localhost:3000/api/v1';
  const headers = { 'Content-Type': 'application/json' };

  const tests = [
    {
      name: 'crypto: ETH above 1000 at 2024-01-01T00:00:00Z',
      body: {
        marketId: 'mkt-eth-above-1000',
        domain: 'crypto',
        eventDescription: 'ETH above 1000 at 2024-01-01T00:00:00Z',
        resolutionCriteria: JSON.stringify({ domain: 'crypto', type: 'price_above', symbol: 'ETH', price: 1000, timestamp: '2024-01-01T00:00:00Z' })
      }
    },
    {
      name: 'sports: NBA LAL vs BOS winner home',
      body: {
        marketId: 'mkt-nba-lal-bos-2025-11-08',
        domain: 'sports',
        eventDescription: 'NBA LAL vs BOS winner home',
        resolutionCriteria: JSON.stringify({ domain: 'sports', type: 'match_winner', league: 'NBA', date: '2025-11-08', home: 'LAL', away: 'BOS', pick: 'home' })
      }
    },
    {
      name: 'elections: US President 2024 winner Joe Biden',
      body: {
        marketId: 'mkt-election-joe-biden',
        domain: 'elections',
        eventDescription: 'US President 2024 winner Joe Biden',
        resolutionCriteria: JSON.stringify({ domain: 'elections', type: 'winner', race: 'US-President', candidate: 'Joe Biden', date: '2024-11-05' })
      }
    }
  ];

  const posts = tests.map(async (t) => {
    try {
      const resp = await axios.post(`${base}/resolve`, t.body, { headers });
      console.log(`\n[${t.name}]`);
      console.log(JSON.stringify(resp.data, null, 2));
    } catch (e: any) {
      console.error(`\n[${t.name}] ERROR`, e?.response?.data || e?.message);
    }
  });

  await Promise.all(posts);

  const feedResp = await axios.get(`${base}/feed`);
  console.log('\n[feed]');
  console.log(JSON.stringify(feedResp.data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});