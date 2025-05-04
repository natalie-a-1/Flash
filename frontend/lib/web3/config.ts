/**
 * Configuration for the frontend application.
 * This file contains network IDs, network names, RPC URLs, block explorers,
 * application settings, and contract addresses for tokens and DEX routers on Mainnet.
 */

// Ethereum network IDs
export const NETWORK_IDS = {
  MAINNET: 1, // Ethereum Mainnet network ID
  LOCALHOST: 1337, // Localhost network ID for Mainnet fork testing
};

// Network names corresponding to network IDs
export const NETWORK_NAMES = {
  [NETWORK_IDS.MAINNET]: "Ethereum Mainnet", // Name for Ethereum Mainnet
  [NETWORK_IDS.LOCALHOST]: "Local Development (Mainnet Fork)", // Name for local development network
};

// RPC URLs for connecting to Ethereum networks
export const RPC_URLS = {
  [NETWORK_IDS.MAINNET]: "https://eth.llamarpc.com", // LlamaRPC public endpoint for Ethereum Mainnet
  [NETWORK_IDS.LOCALHOST]: "http://localhost:8545", // Local Ganache fork endpoint
};

// Block explorers for viewing transactions and contracts
export const BLOCK_EXPLORERS = {
  [NETWORK_IDS.MAINNET]: "https://etherscan.io", // Etherscan for Ethereum Mainnet
};

// Application settings including default network and contact information
export const APP_CONFIG = {
  defaultNetwork: NETWORK_IDS.MAINNET, // Default network set to Ethereum Mainnet
  appName: "Flash Blockchain", // Name of the application
  supportEmail: "support@example.com", // Support contact email
};

// Contract addresses for tokens and DEX routers on Ethereum Mainnet
export const MAINNET_ADDRESSES = {
  // Token contract addresses
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Wrapped Ether (WETH) contract address
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USD Coin (USDC) contract address
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Dai Stablecoin (DAI) contract address

  // DEX router contract addresses
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router contract address
  SUSHISWAP_V2_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap V2 Router contract address

  // New DEX router addresses
  UNISWAP_V3_QUOTER: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6", // Uniswap V3 Quoter contract address
  BALANCER_VAULT: "0xBA12222222228d8Ba445958a75a0704d566BF2C8", // Balancer V2 Vault contract address
  CURVE_3POOL: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", // Curve 3Pool contract address
  CURVE_TRICRYPTO_POOL: "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46", // Curve Tricrypto2 Pool address (USDT/WBTC/WETH)
  CURVE_USDC_ETH_POOL: "0x37c47000c58bfcdc1a2886b5559f49a74d9e1389", // Curve USDC/ETH Pool address
};

export const SUPPORTED_NETWORK_IDS = [NETWORK_IDS.MAINNET, NETWORK_IDS.LOCALHOST];
