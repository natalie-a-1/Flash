/**
 * @file hardhat.config.js
 * @description Hardhat configuration for the Flash Loan Arbitrage project
 * 
 * This file configures the Hardhat development environment with:
 * - Multiple Solidity compiler versions and optimization settings
 * - Network configurations for local development and Sepolia testnet
 * - Etherscan verification support
 * - Project path configurations
 */

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Environment variables for network configuration and API keys
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/your-api-key";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  /**
   * Solidity compiler configuration
   * Using version 0.8.20 with optimization and IR-based code generation (viaIR)
   * for better gas optimization and compatibility with OpenZeppelin contracts
   */
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true, // Use the new IR-based code generator (helps with stack too deep errors)
        },
      },
    ],
  },
  
  /**
   * Network configurations
   * - hardhat: Local development network that forks Sepolia for testing
   * - sepolia: Ethereum Sepolia testnet for deployment
   */
  networks: {
    hardhat: {
      forking: {
        url: SEPOLIA_RPC_URL,
        // Sepolia doesn't need a specific block number as it's newer and more stable
        enabled: true,
      },
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  
  /**
   * Etherscan configuration for contract verification
   */
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  
  /**
   * Project directory structure configuration
   */
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
