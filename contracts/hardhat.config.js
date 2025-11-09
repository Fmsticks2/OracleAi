require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: {
    version: '0.8.21',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 97
    }
  }
};