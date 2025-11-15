import { useEffect, useMemo, useState } from 'react';
import './App.css';

type FeedItem = {
  marketId: string;
  eventDescription: string;
  domain: string;
  outcome: 'Yes' | 'No' | 'Invalid';
  confidence: number;
  proofHash: string;
  cid: string | null;
  timestamp: string;
  txHash: string | null;
};

function App() {
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const explorerBase = (import.meta as any).env?.VITE_EXPLORER_BASE_URL || 'https://testnet.bscscan.com';
  const [tab, setTab] = useState<'feed' | 'proof'>('feed');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketId, setMarketId] = useState('');
  const [proof, setProof] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<'all' | 'crypto' | 'sports' | 'elections'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs] = useState(10000);

  const loadFeed = async () => {
    if (tab !== 'feed') return;
    setLoading(true);
    try {
      const r = await fetch(`${apiBase}/feed`);
      const data = await r.json();
      setFeed((data.items || []).sort((a: FeedItem, b: FeedItem) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'feed') return;
    let timer: any;
    // initial load
    loadFeed();
    if (autoRefresh) {
      timer = setInterval(loadFeed, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, autoRefresh, intervalMs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.filter((item) => {
      const matchesDomain = domain === 'all' || item.domain === domain;
      const matchesQuery = !q || item.marketId.toLowerCase().includes(q) || item.eventDescription.toLowerCase().includes(q);
      return matchesDomain && matchesQuery;
    });
  }, [feed, domain, query]);

  const fetchProof = async () => {
    setError(null);
    setProof(null);
    if (!marketId) return;
    try {
      const r = await fetch(`${apiBase}/proof/${encodeURIComponent(marketId)}`);
      if (!r.ok) throw new Error('Not found');
      const data = await r.json();
      setProof(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>OracleAi Dashboard</h1>
        <nav>
          <button className={tab === 'feed' ? 'active' : ''} onClick={() => setTab('feed')}>Live Feed</button>
          <button className={tab === 'proof' ? 'active' : ''} onClick={() => setTab('proof')}>Proof Viewer</button>
        </nav>
      </header>

      {tab === 'feed' && (
        <section>
          <div className="feed-controls">
            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search marketId or description"
            />
            <select className="select" value={domain} onChange={(e) => setDomain(e.target.value as any)}>
              <option value="all">All Domains</option>
              <option value="crypto">Crypto</option>
              <option value="sports">Sports</option>
              <option value="elections">Elections</option>
            </select>
            <label className="auto">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh
            </label>
            <button onClick={loadFeed}>Refresh</button>
          </div>
          {loading ? (
            <p>Loading…</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <ul className="feed">
              {filtered.map((item) => (
                <li key={item.marketId} className="feed-item">
                  <div className="feed-row">
                    <strong>{item.marketId}</strong>
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="feed-row">
                    <span>{item.eventDescription}</span>
                    <span className={`badge ${item.outcome.toLowerCase()}`}>{item.outcome}</span>
                    <span>Confidence: {item.confidence}</span>
                  </div>
                  <div className="feed-row">
                    <span>Proof: {item.proofHash}</span>
                    {item.cid && (
                      <a href={`https://ipfs.io/ipfs/${item.cid}`} target="_blank" rel="noreferrer">
                        IPFS
                      </a>
                    )}
                    {item.txHash && (
                      <a href={`${explorerBase}/tx/${item.txHash}`} target="_blank" rel="noreferrer">
                        Tx
                      </a>
                    )}
                  </div>
                </li>
              ))}
              {filtered.length === 0 && !loading && (
                <li className="feed-item"><em>No results</em></li>
              )}
            </ul>
          )}
        </section>
      )}

      {tab === 'proof' && (
        <section className="proof">
          <div className="controls">
            <input value={marketId} onChange={(e) => setMarketId(e.target.value)} placeholder="Enter marketId" />
            <button onClick={fetchProof}>Fetch Proof</button>
          </div>
          {error && <p className="error">{error}</p>}
          {proof && (
            <div className="proof-card">
              <div className="rows">
                <div><strong>Market:</strong> {proof.marketId}</div>
                <div><strong>Proof Hash:</strong> {proof.proofHash}</div>
                {proof.cid && (
                  <div><strong>CID:</strong> <a href={`https://ipfs.io/ipfs/${proof.cid}`} target="_blank" rel="noreferrer">{proof.cid}</a></div>
                )}
                <div><strong>Timestamp:</strong> {new Date(proof.timestamp).toLocaleString()}</div>
                <div><strong>Sources:</strong> {(proof.sources || []).join(', ')}</div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
