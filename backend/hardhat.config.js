import { config as loadEnv } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";

loadEnv(); // loads .env automatically

const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    amoy: {
      url: process.env.RPC_URL,
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : []
    }
  }
};

export default config;
