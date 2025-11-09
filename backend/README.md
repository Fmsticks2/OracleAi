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