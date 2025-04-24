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

// --- Contract Addresses (Copied from root constants.json) ---

export const MAINNET_ADDRESSES = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SUSHISWAP_V2_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
};

export const SEPOLIA_ADDRESSES = {
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  UNISWAP_V2_ROUTER: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3", // Consistent address used in backend
  SUSHISWAP_V2_ROUTER: "0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791",
  // Note: Add AAVE_POOL_PROVIDER if needed directly in frontend
  // AAVE_POOL_PROVIDER: "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A"
};
