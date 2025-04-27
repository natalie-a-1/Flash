import { MAINNET_ADDRESSES } from "@/lib/web3/config";

// Exchange objects with name, router address, and icon
export const EXCHANGES = [
  {
    name: "Uniswap V2",
    router: MAINNET_ADDRESSES.UNISWAP_V2_ROUTER,
    icon: "🦄"
  },
  {
    name: "SushiSwap",
    router: MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER,
    icon: "🍣"
  }
];

// Token pairs for arbitrage
export const PAIRS = [
  {
    name: "USDC/WETH",
    tokens: [MAINNET_ADDRESSES.USDC, MAINNET_ADDRESSES.WETH],
    baseSymbol: "USDC",
    quoteSymbol: "WETH"
  }
];

// Minimal ABI for Uniswap V2 Router getAmountsOut
export const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
];

// Token Decimals
export const USDC_DECIMALS = 6;  // USDC has 6 decimals
export const WETH_DECIMALS = 18; // WETH has 18 decimals 