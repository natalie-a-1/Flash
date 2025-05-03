import { useState, useEffect } from "react";
import { calcArbUsdc } from "@/lib/utils/arbitrageUtils";

// Parameters required for arbitrage calculation hook
interface UseArbitrageCalculatorParams {
  loanAmount: string;
  buyPrice: string;
  sellPrice: string;
  tradingFees: string;
  slippage: string;
  gasCost: string;
  profitThreshold: string;
  flashLoanBps: number;
}

// Hook to calculate potential profit, profitability flag, and ROI
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
  const [potentialProfit, setPotentialProfit] = useState<number | null>(null);
  const [isProfitable, setIsProfitable] = useState<boolean>(false);
  const [roi, setRoi] = useState<number | null>(null);

  useEffect(() => {
    if (!loanAmount) {
      setPotentialProfit(null);
      setIsProfitable(false);
      setRoi(null);
      return;
    }

    // parse threshold
    const threshold = parseFloat(profitThreshold);

    // calculate using USDC arbitrage util
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
