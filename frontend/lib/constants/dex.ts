import { MAINNET_ADDRESSES } from "@/lib/web3/config";
import { Exchange } from "@/types/arbitrage";

/**
 * List of decentralized exchanges (DEXs) with their respective router addresses and icons.
 * These are used for executing trades and fetching price data.
 */
export const EXCHANGES: Exchange[] = [
  {
    name: "Uniswap V2", // Name of the exchange
    router: MAINNET_ADDRESSES.UNISWAP_V2_ROUTER, // Keep original name 'router'
    icon: "🦄", // Icon representing Uniswap V2
    feePct: 0.3, // Standard 0.30% fee for V2
    type: "v2",
  },
  {
    name: "SushiSwap", // Name of the exchange
    router: MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER, // Keep original name 'router'
    icon: "🍣", // Icon representing SushiSwap
    feePct: 0.3, // Standard 0.30% fee for SushiSwap
    type: "v2",
  },
  {
    name: "Uniswap V3 (0.05%)",
    router: MAINNET_ADDRESSES.UNISWAP_V3_ROUTER, // Use V3 ROUTER
    icon: "🦄",
    type: "v3",
    feeTier: 500,
    feePct: 0.05,
  },
  {
    name: "Uniswap V3 (0.30%)",
    router: MAINNET_ADDRESSES.UNISWAP_V3_ROUTER, // Use V3 ROUTER
    icon: "🦄",
    type: "v3",
    feeTier: 3000,
    feePct: 0.3,
  },
  {
    name: "Uniswap V3 (1.00%)",
    router: MAINNET_ADDRESSES.UNISWAP_V3_ROUTER, // Use V3 ROUTER
    icon: "🦄",
    type: "v3",
    feeTier: 10000,
    feePct: 1.0,
  },
  {
    name: "Balancer V2",
    router: MAINNET_ADDRESSES.BALANCER_VAULT, // Keep original name 'router'
    icon: "⚖️",
    type: "balancer",
    poolId:
      "0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000063", // Example Pool ID for WETH/USDC - might vary
    feePct: 0.05, // Example: Assuming a common Balancer pool fee, adjust if needed
  },
  {
    name: "Curve USDC/ETH", // Update name
    router: MAINNET_ADDRESSES.CURVE_USDC_ETH_POOL, // Keep original name 'router'
    icon: "🌀",
    type: "curve_get_dy", // Use a specific type for this logic
    feePct: 0.04, // Example: Common fee for Curve stable pools, adjust if needed
  },
];

/**
 * Token pairs available for arbitrage opportunities.
 * Each pair includes the token addresses and their symbols.
 */
export const PAIRS = [
  {
    name: "USDC/WETH", // Name of the token pair
    tokens: [
      MAINNET_ADDRESSES.USDC, // USD Coin (USDC) contract address
      MAINNET_ADDRESSES.WETH, // Wrapped Ether (WETH) contract address
    ],
    baseSymbol: "USDC", // Base token symbol (input)
    quoteSymbol: "WETH", // Quote token symbol (output)
  },
];

/**
 * Minimal ABI for interacting with the Uniswap V2 Router contract.
 * Specifically used for the getAmountsOut function to calculate output amounts.
 */
export const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
];

/**
 * Decimal precision for tokens used in calculations.
 * USDC and WETH have different decimal places which are crucial for accurate computations.
 */
export const USDC_DECIMALS = 6; // USDC has 6 decimals
export const WETH_DECIMALS = 18; // WETH has 18 decimals

/**
 * ABIs for new DEX types
 */
export const QUOTER_ABI = [
  "function quoteExactInputSingle(address,address,uint24,uint256,uint160) view returns (uint256)",
];

export const BALANCER_VAULT_ABI = [
  "function queryBatchSwap(uint8,tuple(bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[],address[],tuple(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance)) view returns (int256[])",
];

// ABI for Curve pools using get_dy(int128, int128, uint256)
export const CURVE_GET_DY_ABI = [
  "function get_dy(int128 i, int128 j, uint256 dx) view returns (uint256)",
];

// Remove or comment out the Tricrypto ABI if no longer needed
/*
export const CURVE_TRICRYPTO_ABI = [
  "function exchange(uint256 i, uint256 j, uint256 dx, uint256 min_dy) view returns (uint256)"
];
*/
