import { useEffect, useState } from 'react';
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
  const [tab, setTab] = useState<'feed' | 'proof'>('feed');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketId, setMarketId] = useState('');
  const [proof, setProof] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'feed') return;
    setLoading(true);
    fetch('http://localhost:3000/api/v1/feed')
      .then((r) => r.json())
      .then((data) => setFeed(data.items || []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [tab]);

  const fetchProof = async () => {
    setError(null);
    setProof(null);
    if (!marketId) return;
    try {
      const r = await fetch(`http://localhost:3000/api/v1/proof/${encodeURIComponent(marketId)}`);
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
          {loading ? (
            <p>Loading…</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <ul className="feed">
              {feed.map((item) => (
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
                      <a href={`https://testnet.bscscan.com/tx/${item.txHash}`} target="_blank" rel="noreferrer">
                        Tx
                      </a>
                    )}
                  </div>
                </li>
              ))}
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
