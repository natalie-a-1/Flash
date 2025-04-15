/**
 * Configuration for the frontend application
 */

// Ethereum network IDs
export const NETWORK_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  LOCALHOST: 1337,
};

// Network names
export const NETWORK_NAMES = {
  [NETWORK_IDS.MAINNET]: "Ethereum Mainnet",
  [NETWORK_IDS.SEPOLIA]: "Sepolia Testnet",
  [NETWORK_IDS.LOCALHOST]: "Local Development",
};

// RPC URLs
export const RPC_URLS = {
  [NETWORK_IDS.SEPOLIA]: "https://rpc.sepolia.org",
};

// Block explorers
export const BLOCK_EXPLORERS = {
  [NETWORK_IDS.MAINNET]: "https://etherscan.io",
  [NETWORK_IDS.SEPOLIA]: "https://sepolia.etherscan.io",
};

// Faucets
export const FAUCETS = {
  [NETWORK_IDS.SEPOLIA]: [
    { name: "Alchemy Faucet", url: "https://sepoliafaucet.com" },
    { name: "PK910 Faucet", url: "https://sepolia-faucet.pk910.de" },
    { name: "Sepolia Faucet", url: "https://faucet.sepolia.dev" },
  ],
};

// Application settings
export const APP_CONFIG = {
  defaultNetwork: NETWORK_IDS.SEPOLIA,
  appName: "Flash Blockchain",
  supportEmail: "support@example.com",
};
