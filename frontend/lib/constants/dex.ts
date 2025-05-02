import { MAINNET_ADDRESSES } from "@/lib/web3/config";

/**
 * List of decentralized exchanges (DEXs) with their respective router addresses and icons.
 * These are used for executing trades and fetching price data.
 */
export const EXCHANGES = [
  {
    name: "Uniswap V2", // Name of the exchange
    router: MAINNET_ADDRESSES.UNISWAP_V2_ROUTER, // Router address for Uniswap V2
    icon: "🦄", // Icon representing Uniswap V2
    feesIncluded: true // getAmountsOut on Uniswap V2 includes the 0.30% fee
  },
  {
    name: "SushiSwap", // Name of the exchange
    router: MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER, // Router address for SushiSwap
    icon: "🍣", // Icon representing SushiSwap
    feesIncluded: true // getAmountsOut on SushiSwap includes the 0.30% fee
  }
];

/**
 * Token pairs available for arbitrage opportunities.
 * Each pair includes the token addresses and their symbols.
 */
export const PAIRS = [
  {
    name: "USDC/WETH", // Name of the token pair
    tokens: [MAINNET_ADDRESSES.USDC, MAINNET_ADDRESSES.WETH], // Addresses of the tokens in the pair
    baseSymbol: "USDC", // Base token symbol
    quoteSymbol: "WETH" // Quote token symbol
  }
];

/**
 * Minimal ABI for interacting with the Uniswap V2 Router contract.
 * Specifically used for the getAmountsOut function to calculate output amounts.
 */
export const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
];

/**
 * Decimal precision for tokens used in calculations.
 * USDC and WETH have different decimal places which are crucial for accurate computations.
 */
export const USDC_DECIMALS = 6;  // USDC has 6 decimals
export const WETH_DECIMALS = 18; // WETH has 18 decimals