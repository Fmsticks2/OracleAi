export const config = {
  port: Number(process.env.PORT || 3000),
  chain: {
    registryAddress: process.env.REGISTRY_ADDRESS || '',
    rpcUrl: process.env.RPC_URL || ''
  },
  apiKeys: {
    coingecko: process.env.COINGECKO_API_KEY || ''
  }
};