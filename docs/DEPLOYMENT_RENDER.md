# Deploy to Render

This guide helps deploy OracleAI backend and dashboard on Render using the `render.yaml` blueprint.

## Prerequisites

- A Render account
- Deployed `OracleRegistry` contract address on BSC Testnet or Mainnet
- RPC provider endpoints (Binance RPC, Ankr, Alchemy, etc.)
- Optional: Upstash Redis URL for multi-replica queue/nonce

## Steps

1. Push the repo to GitHub.
2. In Render, create a new Blueprint and point it to your repository. Render will read `render.yaml`.
3. Configure environment variables:
   - Backend (Web Service):
     - `RPC_URL` — your BSC RPC endpoint
     - `REGISTRY_ADDRESS` — deployed contract address
     - `PRIVATE_KEY` — wallet private key for submissions
     - `API_KEY` — backend auth key (clients send `x-api-key`)
     - `CHAIN_ID` — `97` for testnet, `56` for mainnet
     - Enable Redis if scaling beyond a single instance:
       - `REDIS_URL` — Upstash Redis URL
       - `USE_REDIS_QUEUE=true`
       - `USE_REDIS_NONCE=true`
       - `QUEUE_WORKER=1` — only on one worker instance
   - Dashboard (Static Site):
     - `VITE_API_BASE_URL` — the backend URL (e.g., `https://oracleai-backend.onrender.com/api/v1`)
     - `VITE_EXPLORER_BASE_URL` — default explorer base
     - `VITE_EXPLORER_BASE_MAP` — `56=https://bscscan.com,97=https://testnet.bscscan.com`
4. Deploy. Render will run the build and start services.

## Health & Monitoring

- Backend health: `GET /health`
- Metrics: `GET /metrics` (Prometheus format)
- Logs: Render web service logs

## Notes

- For multi-replica backends, set `USE_REDIS_QUEUE=true` and `USE_REDIS_NONCE=true`. Run exactly one worker (`QUEUE_WORKER=1`).
- Keep `PRIVATE_KEY` secure. Prefer Render encrypted env vars.
- For Mainnet, update dashboard explorer base accordingly.