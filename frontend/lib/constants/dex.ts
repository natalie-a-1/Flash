import { MAINNET_ADDRESSES } from "@/lib/web3/config";
import { Exchange } from "@/types/arbitrage";

/**
 * List of decentralized exchanges (DEXs) with their respective router addresses and icons.
 * These are used for executing trades and fetching price data.
 */
export const EXCHANGES: Exchange[] = [
  {
    name: "Uniswap V2", // Name of the exchange
    router: MAINNET_ADDRESSES.UNISWAP_V2_ROUTER, // Router address for Uniswap V2
    icon: "🦄", // Icon representing Uniswap V2
    feesIncluded: true, // getAmountsOut on Uniswap V2 includes the 0.30% fee
  },
  {
    name: "SushiSwap", // Name of the exchange
    router: MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER, // Router address for SushiSwap
    icon: "🍣", // Icon representing SushiSwap
    feesIncluded: true, // getAmountsOut on SushiSwap includes the 0.30% fee
  },
  {
    name: "Uniswap V3 (0.05%)",
    router: MAINNET_ADDRESSES.UNISWAP_V3_QUOTER,
    icon: "🦄",
    type: "v3",
    feeTier: 500,
  },
  {
    name: "Uniswap V3 (0.30%)",
    router: MAINNET_ADDRESSES.UNISWAP_V3_QUOTER,
    icon: "🦄",
    type: "v3",
    feeTier: 3000,
  },
  {
    name: "Balancer V2",
    router: MAINNET_ADDRESSES.BALANCER_VAULT,
    icon: "⚖️",
    type: "balancer",
    poolId:
      "0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000063",
  },
  {
    name: "Curve USDC/ETH", // Update name
    router: MAINNET_ADDRESSES.CURVE_USDC_ETH_POOL, // Use correct pool address
    icon: "🌀",
    type: "curve_get_dy", // Use a specific type for this logic
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
