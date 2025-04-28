/**
 * Configuration for the frontend application
 */
// Removed Aave Address Book import

// Ethereum network IDs
export const NETWORK_IDS = {
  MAINNET: 1,
  LOCALHOST: 1337, // For local Mainnet fork testing
};

// Network names
export const NETWORK_NAMES = {
  [NETWORK_IDS.MAINNET]: "Ethereum Mainnet",
  [NETWORK_IDS.LOCALHOST]: "Local Development (Mainnet Fork)",
};

// RPC URLs
export const RPC_URLS = {
  [NETWORK_IDS.MAINNET]: "https://eth.llamarpc.com", // Using LlamaRPC public endpoint for Ethereum
  [NETWORK_IDS.LOCALHOST]: "http://localhost:8545", // Local Ganache fork
};

// Block explorers
export const BLOCK_EXPLORERS = {
  [NETWORK_IDS.MAINNET]: "https://etherscan.io",
};

// Faucets - Not applicable for Mainnet

// Application settings
export const APP_CONFIG = {
  defaultNetwork: NETWORK_IDS.MAINNET, // Ensure default is Mainnet
  appName: "Flash Blockchain",
  supportEmail: "support@example.com",
};

// --- Contract Addresses for Tokens and DEX Routers on Mainnet ---
export const MAINNET_ADDRESSES = {
  // Tokens
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F", 

  // DEX Routers
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", 
  SUSHISWAP_V2_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
};

// Removed manual Aave V3 addresses; using @bgd-labs/aave-address-book in components directly

// Removed FLASH_LOAN placeholder; still manage contract address in deployment or env if needed

// Remove SEPOLIA_ADDRESSES section entirely
/*
export const SEPOLIA_ADDRESSES = { ... };
*/
