import { TokenInfo } from "@/types/aave";
import { MAINNET_ADDRESSES } from "@/lib/web3/config";

/**
 * Array of token definitions used in the application.
 * Each token is represented with its symbol, mainnet address, icon, color, and decimal precision.
 */
export const TOKENS: TokenInfo[] = [
  {
    symbol: "USDC", // Symbol for the token
    address: MAINNET_ADDRESSES.USDC, // Mainnet address for USDC
    icon: "💲", // Icon representing USDC
    color: "bg-blue-500", // CSS class for the token's color
    decimals: 6 // Number of decimal places for USDC
  },
  {
    symbol: "WETH", // Symbol for the token
    address: MAINNET_ADDRESSES.WETH, // Mainnet address for WETH
    icon: "Ξ", // Icon representing WETH
    color: "bg-purple-500", // CSS class for the token's color
    decimals: 18 // Number of decimal places for WETH
  }
]; 