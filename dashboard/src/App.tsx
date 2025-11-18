import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import './App.css';
import MarketFactoryAbi from './abi/MarketFactory.json';
import MarketAbi from './abi/Market.json';
import { getSigner, ensureBscChain, toWei, isAddress, getDefaultChainId } from './lib/eth';

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
  chainId?: number | null;
};

function App() {
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const explorerBase = (import.meta as any).env?.VITE_EXPLORER_BASE_URL || 'https://testnet.bscscan.com';
  const explorerMapRaw = (import.meta as any).env?.VITE_EXPLORER_BASE_MAP || '';
  const factoryAddress = (import.meta as any).env?.VITE_FACTORY_ADDRESS || '';
  const DEFAULT_EXPLORERS: Record<number, string> = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    56: 'https://bscscan.com',
    97: 'https://testnet.bscscan.com',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
    42161: 'https://arbiscan.io',
    421614: 'https://sepolia.arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    11155420: 'https://sepolia-optimism.etherscan.io',
    8453: 'https://basescan.org',
    84532: 'https://sepolia.basescan.org',
    43114: 'https://snowtrace.io',
    43113: 'https://testnet.snowtrace.io',
    250: 'https://ftmscan.com',
    4002: 'https://testnet.ftmscan.com',
  };
  const explorerMap: Record<number, string> = useMemo(() => {
    const map: Record<number, string> = { ...DEFAULT_EXPLORERS };
    const entries = String(explorerMapRaw).split(',').map(s => s.trim()).filter(Boolean);
    for (const ent of entries) {
      const [k, v] = ent.split('=');
      const id = Number(k);
      if (!isNaN(id) && v) map[id] = v;
    }
    return map;
  }, [explorerMapRaw]);
  const [tab, setTab] = useState<'feed' | 'proof' | 'bet'>('feed');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketId, setMarketId] = useState('');
  const [proof, setProof] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<'all' | 'crypto' | 'sports' | 'elections'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs] = useState(10000);

  // Wallet/Bet UI state
  const [wallet, setWallet] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [betMarketInput, setBetMarketInput] = useState<string>('');
  const [betOutcome, setBetOutcome] = useState<'Yes' | 'No'>('Yes');
  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [betStatus, setBetStatus] = useState<string>('');
  const [betTxHash, setBetTxHash] = useState<string | null>(null);

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

  const connectWallet = async () => {
    setError(null);
    setBetStatus('Connecting wallet…');
    try {
      const signer = await getSigner();
      const addr = await signer.getAddress();
      const switched = await ensureBscChain(getDefaultChainId());
      setWallet(addr);
      setChainId(switched);
      setBetStatus('Wallet connected');
    } catch (e: any) {
      setError(e?.message || String(e));
      setBetStatus('');
    }
  };

  const resolveMarketAddress = async (signer: any): Promise<string> => {
    const input = betMarketInput.trim();
    if (!input) throw new Error('Enter a market address or numeric ID');
    if (isAddress(input)) return input;
    if (!factoryAddress) throw new Error('Factory address not configured');
    const factory = new (await import('ethers')).ethers.Contract(factoryAddress, MarketFactoryAbi as any, signer);
    const id = BigInt(Number(input));
    const addr: string = await factory.getMarket(id);
    if (!isAddress(addr)) throw new Error('Factory returned invalid market address');
    return addr;
  };

  const placeBet = async () => {
    setError(null);
    setBetTxHash(null);
    setBetStatus('Preparing transaction…');
    try {
      const signer = await getSigner();
      const addr = await signer.getAddress();
      const switched = await ensureBscChain(getDefaultChainId());
      setWallet(addr);
      setChainId(switched);

      const marketAddress = await resolveMarketAddress(signer);
      const { ethers } = await import('ethers');
      const market = new ethers.Contract(marketAddress, MarketAbi as any, signer);
      const outcomeVal = betOutcome === 'Yes' ? 1 : 0;
      const value = toWei(betAmount);
      setBetStatus('Sending transaction…');
      const tx = await market.placeBet(outcomeVal, { value });
      setBetTxHash(tx.hash);
      setBetStatus('Waiting for confirmation…');
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        setBetStatus('Bet placed successfully');
      } else {
        setBetStatus('Transaction failed');
      }
    } catch (e: any) {
      setError(e?.message || String(e));
      setBetStatus('');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">
          <Icon icon="mdi:chart-timeline-variant" className="title-icon" />
          OracleAi Dashboard
        </h1>
        <nav>
          <button className={tab === 'feed' ? 'active' : ''} onClick={() => setTab('feed')}>
            <Icon icon="mdi:view-list" /> Live Feed
          </button>
          <button className={tab === 'proof' ? 'active' : ''} onClick={() => setTab('proof')}>
            <Icon icon="mdi:file-document-outline" /> Proof Viewer
          </button>
          <button className={tab === 'bet' ? 'active' : ''} onClick={() => setTab('bet')}>
            <Icon icon="mdi:currency-btc" /> Bet (BNB)
          </button>
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
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <Icon icon="mdi:refresh-auto" /> Auto-refresh
            </label>
            <button onClick={loadFeed}><Icon icon="mdi:refresh" /> Refresh</button>
          </div>
          {loading ? (
            <p>Loading…</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <div className="feed-grid">
              <AnimatePresence>
                {filtered.map((item) => (
                  <motion.div
                    key={item.marketId}
                    className="feed-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="feed-row">
                      <strong className="marketId">
                        <Icon icon="mdi:identifier" /> {item.marketId}
                      </strong>
                      <span className="timestamp">
                        <Icon icon="mdi:clock-outline" /> {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="feed-row">
                      <span className="description">{item.eventDescription}</span>
                    </div>
                    <div className="feed-row stats">
                      <span className={`badge ${item.outcome.toLowerCase()}`}>{item.outcome}</span>
                      <span className="confidence"><Icon icon="mdi:trending-up" /> {item.confidence}</span>
                      {item.chainId ? (
                        <span className="network"><Icon icon="mdi:lan" /> {item.chainId}</span>
                      ) : (
                        <span className="network muted"><Icon icon="mdi:lan" /> n/a</span>
                      )}
                    </div>
                    <div className="feed-row links">
                      <span className="proof">Proof: {item.proofHash}</span>
                      {item.cid && (
                        <a className="link" href={`https://ipfs.io/ipfs/${item.cid}`} target="_blank" rel="noreferrer">
                          <Icon icon="mdi:cloud-outline" /> IPFS
                        </a>
                      )}
                      {item.txHash && (
                        <a
                          className="link"
                          href={`${(item.chainId && explorerMap[item.chainId]) ? explorerMap[item.chainId] : explorerBase}/tx/${item.txHash}`}
                          target="_blank" rel="noreferrer"
                        >
                          <Icon icon="mdi:link-variant" /> Tx
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <div className="feed-card empty"><em>No results</em></div>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'proof' && (
        <section className="proof">
          <div className="controls">
            <input value={marketId} onChange={(e) => setMarketId(e.target.value)} placeholder="Enter marketId" />
            <button onClick={fetchProof}><Icon icon="mdi:file-find-outline" /> Fetch Proof</button>
          </div>
          {error && <p className="error">{error}</p>}
          {proof && (
            <motion.div className="proof-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rows">
                <div><strong>Market:</strong> {proof.marketId}</div>
                <div><strong>Proof Hash:</strong> {proof.proofHash}</div>
                {proof.cid && (
                  <div><strong>CID:</strong> <a href={`https://ipfs.io/ipfs/${proof.cid}`} target="_blank" rel="noreferrer">{proof.cid}</a></div>
                )}
                <div><strong>Timestamp:</strong> {new Date(proof.timestamp).toLocaleString()}</div>
                <div><strong>Sources:</strong> {(proof.sources || []).join(', ')}</div>
              </div>
            </motion.div>
          )}
        </section>
      )}

      {tab === 'bet' && (
        <section className="bet">
          <div className="bet-controls">
            <button onClick={connectWallet}>
              <Icon icon="mdi:wallet-outline" /> {wallet ? 'Wallet Connected' : 'Connect Wallet'}
            </button>
            {wallet && (
              <span className="wallet-info">
                <Icon icon="mdi:account" /> {wallet.slice(0, 6)}…{wallet.slice(-4)}
              </span>
            )}
            {chainId && (
              <span className="wallet-info">
                <Icon icon="mdi:lan" /> Chain: {chainId}
              </span>
            )}
          </div>

          <div className="bet-form">
            <input
              value={betMarketInput}
              onChange={(e) => setBetMarketInput(e.target.value)}
              placeholder="Market address (0x...) or numeric ID"
            />

            <div className="bet-outcome">
              <label>
                <input type="radio" name="outcome" checked={betOutcome === 'Yes'} onChange={() => setBetOutcome('Yes')} />
                <span className="badge yes">Yes</span>
              </label>
              <label>
                <input type="radio" name="outcome" checked={betOutcome === 'No'} onChange={() => setBetOutcome('No')} />
                <span className="badge no">No</span>
              </label>
            </div>

            <div className="bet-amount">
              <input
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Amount in BNB (e.g., 0.1)"
              />
              <button onClick={placeBet}>
                <Icon icon="mdi:hand-coin-outline" /> Place Bet
              </button>
            </div>
          </div>

          {betStatus && <p className="status">{betStatus}</p>}
          {error && <p className="error">{error}</p>}

          {betTxHash && (
            <p>
              <Icon icon="mdi:link-variant" /> Tx:
              <a
                className="link"
                href={`${(chainId && explorerMap[chainId]) ? explorerMap[chainId] : explorerBase}/tx/${betTxHash}`}
                target="_blank" rel="noreferrer"
              >
                {betTxHash.slice(0, 10)}…
              </a>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
