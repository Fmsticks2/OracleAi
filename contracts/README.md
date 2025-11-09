# OracleAI Contracts

Smart contracts for market registration, resolution submission, challenges, finalization, and fee logic on BNB Chain.

## Setup

1. `npm install`
2. `npx hardhat compile`
3. Copy `.env.example` to `.env` and set `BSC_TESTNET_URL` and `PRIVATE_KEY`.
4. `npx hardhat run scripts/deploy.js --network bscTestnet`

## Contracts

- `OracleRegistry.sol` — registers markets and manages resolution lifecycle.
- `DisputeResolution.sol` — pure functions for challenge windows based on confidence.
- `FeeCollector.sol` — simple fee configuration and computation utility.