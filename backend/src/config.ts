export const config = {
  port: Number(process.env.PORT || 3000),
  chain: {
    registryAddress: process.env.REGISTRY_ADDRESS || '',
    rpcUrl: process.env.RPC_URL || '',
    chainId: Number(process.env.CHAIN_ID || 0) || undefined
  },
  apiKeys: {
    coingecko: process.env.COINGECKO_API_KEY || ''
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN || ''
  },
  limits: {
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100)
  }
};