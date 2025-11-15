# OracleAI Backend

Express + TypeScript API providing resolution endpoints and a multi-agent pipeline.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start development server (ts-node)
- `npm run build` — build to `dist/`
- `npm start` — run built server

## Environment

Copy `.env.example` to `.env` and set:

- `PORT` — API port (default `3000`)
- `RPC_URL` — BNB RPC (optional for now)
- `REGISTRY_ADDRESS` — OracleRegistry contract address (optional for now)
- `COINGECKO_API_KEY` — optional API key
- `PRIVATE_KEY` — wallet key for on-chain submission (optional)
- `PINATA_API_KEY` and `PINATA_SECRET_KEY` — for IPFS pinning of proof payloads (optional)
- `REDIS_URL` — enable Redis-backed queue and nonce store (recommended for multi-replica)
- `USE_REDIS_QUEUE` and `USE_REDIS_NONCE` — set to `true` to enable distributed queue and nonce allocation
- `QUEUE_WORKER` — set to `1` on exactly one replica to run the chain worker

## Endpoints

- `POST /api/v1/resolve`
- `GET /api/v1/status/:marketId`
- `GET /api/v1/proof/:marketId`
- `GET /api/v1/analytics`
- `GET /api/v1/feed` — recent resolutions feed for dashboard

### Resolution Criteria (Crypto)

Provide `resolutionCriteria` as either JSON or colon format.

- JSON:
  - `{ "domain": "crypto", "type": "price_above", "symbol": "BTC", "price": 50000, "timestamp": "2025-11-08T12:00:00Z" }`
- Colon format:
  - `price_above:BTC:50000:2025-11-08T12:00:00Z`

Supported types:

- `price_above` — returns `Yes` if average close price across sources is above `price` at minute `timestamp`
- `price_below` — returns `Yes` if average close price is below `price` at minute `timestamp`
- `price_at` — currently treated as `Invalid` (non-binary)

Sources used:

- Binance `BTCUSDT` 1-minute candles
- Coinbase `BTC-USD` 1-minute candles

### Resolution Criteria (Sports)

Provide `resolutionCriteria` as JSON or colon format.

- JSON:
  - `{ "domain": "sports", "type": "match_winner", "league": "NBA", "home": "LAL", "away": "BOS", "pick": "LAL", "date": "2025-11-08" }`
- Colon:
  - `match_winner:NBA:2025-11-08:LAL:BOS:LAL`

Sources used:

- ESPN NBA Scoreboard
- Official NBA scores page

### Resolution Criteria (Elections)

- JSON:
  - `{ "domain": "elections", "type": "winner", "race": "US-President", "candidate": "Joe Biden", "date": "2024-11-05" }`
- Colon:
  - `winner:US-President:2024-11-05:Joe Biden`

Sources used (heuristic fallback for MVP):

- AP News elections hub
- Reuters US politics