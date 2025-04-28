import { TokenInfo } from "@/types/aave";
import { MAINNET_ADDRESSES } from "@/lib/web3/config";

/**
 * Token definitions for the application (using Mainnet addresses)
 */
export const TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    address: MAINNET_ADDRESSES.USDC,
    icon: "💲",
    color: "bg-blue-500",
    decimals: 6
  },
  {
    symbol: "WETH",
    address: MAINNET_ADDRESSES.WETH,
    icon: "Ξ",
    color: "bg-purple-500",
    decimals: 18
  }
]; 