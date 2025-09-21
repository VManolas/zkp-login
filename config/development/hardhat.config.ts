import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.4.0", // Latest stable version
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
        mode: "3",
      },
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: "https://sepolia.era.zksync.dev",
    ethNetwork: "sepolia",
  },
  networks: {
    hardhat: {
      zksync: true,
    },
    zkSyncEraTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
    },
    localhost: {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545",
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 60000, // 60 seconds timeout for tests
  },
};

export default config;

