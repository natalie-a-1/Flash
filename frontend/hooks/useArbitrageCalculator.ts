import { useState, useEffect } from "react";
import { calcArbUsdc } from "@/lib/utils/arbitrageUtils";

/**
 * Parameters required for the arbitrage calculation hook.
 */
interface UseArbitrageCalculatorParams {
  loanAmount: string; // The amount of the loan in USDC
  buyPrice: string; // The price at which the asset is bought (WETH per USD)
  sellPrice: string; // The price at which the asset is sold (WETH per USD)
  tradingFees: string; // The trading fees percentage
  slippage: string; // The slippage percentage
  gasCost: string; // The cost of gas in USD
  profitThreshold: string; // The minimum profit threshold in USD
  flashLoanBps: number; // The basis points for the flash loan fee
}

/**
 * Custom hook to calculate potential profit, profitability flag, and ROI for arbitrage opportunities.
 *
 * @param {UseArbitrageCalculatorParams} params - The parameters for the arbitrage calculation.
 * @returns {Object} - An object containing potential profit, profitability status, and ROI.
 */
export function useArbitrageCalculator({
  loanAmount,
  buyPrice,
  sellPrice,
  tradingFees,
  slippage,
  gasCost,
  profitThreshold,
  flashLoanBps,
}: UseArbitrageCalculatorParams) {
  const [potentialProfit, setPotentialProfit] = useState<number | null>(null); // State for potential profit
  const [isProfitable, setIsProfitable] = useState<boolean>(false); // State for profitability status
  const [roi, setRoi] = useState<number | null>(null); // State for return on investment

  useEffect(() => {
    if (!loanAmount) {
      setPotentialProfit(null);
      setIsProfitable(false);
      setRoi(null);
      return;
    }

    // Parse the profit threshold from string to float
    const threshold = parseFloat(profitThreshold);

    // Calculate net profit and ROI using the USDC arbitrage utility function
    const { netProfit, roiPct } = calcArbUsdc({
      loanUsdc: parseFloat(loanAmount),
      buyPriceWethPerUsd: parseFloat(buyPrice),
      sellPriceWethPerUsd: parseFloat(sellPrice),
      buyFeePct: parseFloat(tradingFees),
      sellFeePct: parseFloat(tradingFees),
      buySlipPct: parseFloat(slippage),
      sellSlipPct: parseFloat(slippage),
      gasCostUsd: parseFloat(gasCost),
      flashLoanBps,
    });

    // Update state with calculated values
    setPotentialProfit(netProfit);
    setIsProfitable(netProfit >= threshold);
    setRoi(roiPct);
  }, [
    loanAmount,
    buyPrice,
    sellPrice,
    tradingFees,
    slippage,
    gasCost,
    profitThreshold,
    flashLoanBps,
  ]);

  return { potentialProfit, isProfitable, roi };
}
