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

## Endpoints

- `POST /api/v1/resolve`
- `GET /api/v1/status/:marketId`
- `GET /api/v1/proof/:marketId`
- `GET /api/v1/analytics`

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