/**
 * Configuration for the frontend application
 */
// Import specific exports from the aave-address-book package
import { AaveV3Ethereum } from "@bgd-labs/aave-address-book";

// Ethereum network IDs
export const NETWORK_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,  // Keeping for reference
  LOCALHOST: 1337,
};

// Network names
export const NETWORK_NAMES = {
  [NETWORK_IDS.MAINNET]: "Ethereum Mainnet",
  [NETWORK_IDS.SEPOLIA]: "Sepolia Testnet",
  [NETWORK_IDS.LOCALHOST]: "Local Development (Mainnet Fork)",
};

// RPC URLs
export const RPC_URLS = {
  [NETWORK_IDS.MAINNET]: "https://mainnet.infura.io/v3/YOUR_INFURA_ID", // Replace with your Infura ID or use other provider
  [NETWORK_IDS.LOCALHOST]: "http://localhost:8545", // Local Ganache fork
};

// Block explorers
export const BLOCK_EXPLORERS = {
  [NETWORK_IDS.MAINNET]: "https://etherscan.io",
  [NETWORK_IDS.SEPOLIA]: "https://sepolia.etherscan.io",
};

// Faucets - not applicable for mainnet
export const FAUCETS = {
  [NETWORK_IDS.SEPOLIA]: [
    { name: "Alchemy Faucet", url: "https://sepoliafaucet.com" },
    { name: "PK910 Faucet", url: "https://sepolia-faucet.pk910.de" },
    { name: "Sepolia Faucet", url: "https://faucet.sepolia.dev" },
  ],
};

// Application settings
export const APP_CONFIG = {
  defaultNetwork: NETWORK_IDS.MAINNET, // Changed from SEPOLIA to MAINNET
  appName: "Flash Blockchain",
  supportEmail: "support@example.com",
};

// --- Contract Addresses (Imported from Aave Address Book) ---

// Ethereum Mainnet Addresses (official and verified)
export const MAINNET_ADDRESSES = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Verified Mainnet WETH
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Verified Mainnet USDC
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
  SUSHISWAP_V2_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap V2 Router
  
  // Aave V3 addresses from Aave Address Book
  AAVE_POOL_PROVIDER: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  AAVE_UI_POOL_DATA_PROVIDER: AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  POOL: AaveV3Ethereum.POOL,
  POOL_CONFIGURATOR: AaveV3Ethereum.POOL_CONFIGURATOR,
  ORACLE: AaveV3Ethereum.ORACLE,
};

// Legacy Sepolia addresses (keeping for reference)
export const SEPOLIA_ADDRESSES = {
  // Token addresses
  WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // Sepolia WETH address
  USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Sepolia USDC address
  
  // DEX addresses
  UNISWAP_V2_ROUTER: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  SUSHISWAP_V2_ROUTER: "0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791",
};
