# Per-Network Configuration (BSC)

Use these settings to flip between BSC Testnet and Mainnet cleanly.

## Backend

- `RPC_URL` — provider endpoint
- `REGISTRY_ADDRESS` — deployed OracleRegistry
- `PRIVATE_KEY` — signer wallet key
- `CHAIN_ID` — `97` (testnet) or `56` (mainnet)
- `CORS_ORIGIN` — your dashboard domain

## Dashboard

- `VITE_API_BASE_URL` — backend API base
- `VITE_EXPLORER_BASE_URL` — default explorer
- `VITE_EXPLORER_BASE_MAP` — comma-separated mapping: `56=https://bscscan.com,97=https://testnet.bscscan.com`

## Example

Testnet:
- Backend: `CHAIN_ID=97`, `RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545`
- Dashboard: `VITE_EXPLORER_BASE_MAP=56=https://bscscan.com,97=https://testnet.bscscan.com`

Mainnet:
- Backend: `CHAIN_ID=56`, `RPC_URL=https://bsc-dataseed.binance.org`
- Dashboard: `VITE_EXPLORER_BASE_URL=https://bscscan.com`

## Tips

- Redeploy contract(s) per network and update `REGISTRY_ADDRESS`.
- If multi-replica backend, enable Redis queue/nonce.
- Ensure clients send `x-api-key` to the backend.