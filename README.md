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
   - `GET  /api/v1/feed`

Resolution Criteria:

Crypto

- JSON: `{ "domain": "crypto", "type": "price_above", "symbol": "BTC", "price": 50000, "timestamp": "2025-11-08T12:00:00Z" }`
- Colon: `price_above:BTC:50000:2025-11-08T12:00:00Z`

Sports (NBA)

- JSON: `{ "domain": "sports", "type": "match_winner", "league": "NBA", "home": "LAL", "away": "BOS", "pick": "LAL", "date": "2025-11-08" }`
- Colon: `match_winner:NBA:2025-11-08:LAL:BOS:LAL`

Elections (heuristic)

- JSON: `{ "domain": "elections", "type": "winner", "race": "US-President", "candidate": "Joe Biden", "date": "2024-11-05" }`
- Colon: `winner:US-President:2024-11-05:Joe Biden`

The API aggregates Binance and Coinbase 1-minute candles at the given timestamp (crypto), uses ESPN/NBA scores (sports), and AP/Reuters headlines heuristics (elections), then evaluates the outcome with a confidence score.

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
- On-chain submission is wired; set `RPC_URL`, `REGISTRY_ADDRESS`, and `PRIVATE_KEY` in `backend/.env` to enable. Proof payloads can be pinned to IPFS if `PINATA_API_KEY` and `PINATA_SECRET_KEY` are set.