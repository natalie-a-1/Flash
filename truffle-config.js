/**
 * Truffle configuration file
 */

// Load environment variables from .env file (if present)
require("dotenv").config();

// Uncomment to use HDWalletProvider for Sepolia
const HDWalletProvider = require("@truffle/hdwallet-provider");
//
const MNEMONIC = process.env.MNEMONIC || "Your mnemonic here...";
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";

module.exports = {
  // Configure networks
  networks: {
    // Development network with Ganache
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
    },

    // Sepolia testnet
    // To use this configuration:
    // 1. Uncomment the HDWalletProvider import and config above
    // 2. Install: npm install @truffle/hdwallet-provider
    // 3. Set your MNEMONIC and SEPOLIA_RPC_URL in a .env file (never commit this to git)
    sepolia: {
      provider: () => new HDWalletProvider(MNEMONIC, SEPOLIA_RPC_URL),
      network_id: 11155111,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },

    // Add other networks as needed (testnet, mainnet, etc.)
  },

  // Configure compilers
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },

  // Project directory structure
  contracts_directory: "./contracts",
  contracts_build_directory: "./build/contracts",
  migrations_directory: "./migrations",
  test_directory: "./test",
};
