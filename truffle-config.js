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
const MAINNET_RPC_URL =
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
  "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY";

module.exports = {
  // Configure networks
  networks: {
    // Development network with Ganache
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 9000000,            // per-tx cap
      gasPrice: 20000000000    // 20 Gwei
    },

    // Development network forking Sepolia
    // Requires SEPOLIA_RPC_URL in .env and Ganache installed
    // **NOTE:** This requires running Ganache CLI manually in a separate terminal:
    // `ganache --fork <YOUR_SEPOLIA_RPC_URL>`
    development_fork: {
      host: "127.0.0.1", // Ganache's default host
      port: 8545, // Ganache's default port
      network_id: "*", // Match any network ID
      // This crucial parameter tells Truffle that the Ganache instance at host:port
      // should be a fork of the specified network (using the RPC URL from .env).
      fork: SEPOLIA_RPC_URL,
      // A higher gas limit is often needed for complex interactions on forks,
      // like flash loans involving multiple external calls.
      gas: 8000000,
      // Optional: Set a reasonable gas price (e.g., 20 Gwei).
      gasPrice: 20000000000,
    },

    // Development network forking Mainnet
    mainnet_fork: {
      host: "127.0.0.1", // Ganache's default host
      port: 8545, // Ganache's default port
      network_id: "*", // Match any network ID
      // Fork from Mainnet using Alchemy RPC
      fork: MAINNET_RPC_URL,
      // A higher gas limit is often needed for complex interactions on forks
      gas: 9000000,            // per-tx cap
      // Optional: Set a reasonable gas price (e.g., 20 Gwei).
      gasPrice: 20000000000,
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
