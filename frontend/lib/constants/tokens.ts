import { TokenInfo } from "@/types/aave";
import { SEPOLIA_ADDRESSES } from "@/lib/web3/config";

/**
 * Token definitions for the application
 */
export const TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    address: SEPOLIA_ADDRESSES.USDC,
    icon: "💲",
    color: "bg-blue-500",
    decimals: 6
  },
  {
    symbol: "WETH",
    address: SEPOLIA_ADDRESSES.WETH,
    icon: "Ξ",
    color: "bg-purple-500",
    decimals: 18
  }
]; 