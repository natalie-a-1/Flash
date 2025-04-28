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

// --- Contract Addresses (Manually Defined for Mainnet) ---

export const MAINNET_ADDRESSES = {
  // Tokens
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Added DAI Mainnet address

  // DEX Routers
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", 
  SUSHISWAP_V2_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", 
  
  // Aave V3 Ethereum Mainnet Addresses (from https://aave.com/docs/resources/addresses)
  AAVE_POOL_ADDRESSES_PROVIDER: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
  AAVE_POOL: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  AAVE_UI_POOL_DATA_PROVIDER: "0x3F78BBD206e4D3c504Eb854232EdA7e47E9Fd8FC",
  AAVE_PROTOCOL_DATA_PROVIDER: "0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6",
  AAVE_ORACLE: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
  AAVE_UI_INCENTIVE_DATA_PROVIDER: "0xe3dFf4052F0bF6134ACb73bEaE8fe2317d71F047",
  AAVE_WALLET_BALANCE_PROVIDER: "0xC7be5307ba715ce89b152f3Df0658295b3dbA8E2",

  // Deployed FlashLoan Contract (Placeholder - UPDATE MANUALLY AFTER DEPLOYMENT)
  FLASH_LOAN: "0x0000000000000000000000000000000000000000", // TODO: Update with deployed contract address
};

// Remove SEPOLIA_ADDRESSES section entirely
/*
export const SEPOLIA_ADDRESSES = { ... };
*/
