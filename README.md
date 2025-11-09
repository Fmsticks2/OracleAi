# OracleAI

Resolve prediction markets in seconds, not days. This repository contains the initial scaffold for:

- Smart contracts (BNB Chain) for market registration, resolution, challenges, and fee collection
- Backend API (Node.js + TypeScript) with a multi-agent resolution pipeline
- Future web dashboard (React + TypeScript)

## Quick Start

### Contracts (Hardhat)

1. Navigate to the contracts package:
   - `cd contracts`
2. Install dependencies:
   - `npm install`
3. Compile contracts:
   - `npx hardhat compile`
4. Configure `.env` with `BSC_TESTNET_URL` and `PRIVATE_KEY` to deploy.
5. Deploy to BNB Testnet:
   - `npx hardhat run scripts/deploy.js --network bscTestnet`

### Backend API (Express + TypeScript)

1. Navigate to the backend package:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Copy `.env.example` to `.env` and adjust values as needed.
4. Start development server:
   - `npm run dev`
5. Endpoints available:
   - `POST /api/v1/resolve`
   - `GET  /api/v1/status/:marketId`
   - `GET  /api/v1/proof/:marketId`
   - `GET  /api/v1/analytics`

Resolution Criteria (Crypto):

- JSON: `{ "domain": "crypto", "type": "price_above", "symbol": "BTC", "price": 50000, "timestamp": "2025-11-08T12:00:00Z" }`
- Colon: `price_above:BTC:50000:2025-11-08T12:00:00Z`

The API aggregates Binance and Coinbase 1-minute candles at the given timestamp and evaluates the outcome with a confidence score.

## Project Structure

```
OracleAi/
├── README.md
├── .gitignore
├── contracts/
│   ├── package.json
│   ├── hardhat.config.js
│   ├── contracts/
│   │   ├── OracleRegistry.sol
│   │   ├── DisputeResolution.sol
│   │   └── FeeCollector.sol
│   ├── scripts/deploy.js
│   ├── .env.example
│   └── README.md
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── README.md
    └── src/
        ├── server.ts
        ├── routes.ts
        ├── types.ts
        ├── config.ts
        └── agents/
            ├── ApiAgent.ts
            ├── ScraperAgent.ts
            ├── ValidatorAgent.ts
            ├── ReasoningAgent.ts
            └── ProofAgent.ts
```

## Notes

- Contracts are optimized for clarity at this stage; gas optimizations and UMA OO fallback will be added next.
- Backend agents currently use placeholder logic and sources to ensure stability; integrations (APIs, scraping, Claude) will be layered in step-by-step.