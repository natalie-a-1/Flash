import { HumanizedReserveData, TokenInfo } from "@/types/aave";
import { ethers } from "ethers";
import { formatTokenAmount, formatCurrencyAmount } from "@/lib/web3/utils";

/**
 * Returns the CSS style classes for a reserve status.
 */
export function getStatusStyle(reserve: HumanizedReserveData): string {
  if (!reserve) return "bg-gray-500/20";

  if (reserve.isActive && reserve.flashLoanEnabled) {
    return parseFloat(reserve.availableLiquidity) === 0
      ? "bg-yellow-500/20 text-yellow-300"
      : "bg-green-500/20 text-green-300";
  } else if (reserve.isFrozen) {
    return "bg-blue-500/20 text-blue-300";
  } else if (reserve.isPaused) {
    return "bg-yellow-500/20 text-yellow-300";
  } else {
    return "bg-red-500/20 text-red-300";
  }
}

/**
 * Formats the maximum available amount and optional USD value for a reserve.
 */
export function formatMaxAmount(
  reserve: HumanizedReserveData | undefined,
  token: TokenInfo
): string {
  if (!reserve) return "0";
  if (!reserve.isActive || !reserve.flashLoanEnabled) {
    return "Unavailable";
  }

  const humanAmount = ethers.utils.formatUnits(
    reserve.availableLiquidity,
    token.decimals
  );
  const tokenDisplay = formatTokenAmount(
    humanAmount,
    4,
    token.symbol,
    true
  );

  if (reserve.availableLiquidityUSD) {
    const usdDisplay = formatCurrencyAmount(
      reserve.availableLiquidityUSD,
      "USD",
      2,
      true
    );
    return `${tokenDisplay} (${usdDisplay})`;
  }

  return tokenDisplay;
} 