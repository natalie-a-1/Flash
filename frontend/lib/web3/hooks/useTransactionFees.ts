import { useState, useEffect } from "react";
import { useWeb3 } from "@/components/web3/Web3Provider";
import { ethers } from "ethers";
import { fetchDexPrices } from "@/lib/services/priceService";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";

export interface FeeStats {
  baseFee: string;
  priorityFee: string;
  maxFeePerGas: string;
  estimatedFee: string;
  estimatedFeeUSDC: string;
  convBaseFeeUSDC: string;
  convPriorityFeeUSDC: string;
  convMaxFeePerGasUSDC: string;
}

export function useTransactionFees(): FeeStats {
  const { web3 } = useWeb3();
  const [stats, setStats] = useState<FeeStats>({
    baseFee: "",
    priorityFee: "",
    maxFeePerGas: "",
    estimatedFee: "",
    estimatedFeeUSDC: "",
    convBaseFeeUSDC: "",
    convPriorityFeeUSDC: "",
    convMaxFeePerGasUSDC: "",
  });

  useEffect(() => {
    async function fetchFees() {
      if (!web3 || typeof window === "undefined") return;
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      try {
        const [feeData, block] = await Promise.all([
          provider.getFeeData(),
          provider.getBlock("latest"),
        ]);

        const base =
          feeData.lastBaseFeePerGas ?? block.baseFeePerGas ??
          ethers.BigNumber.from(0);
        const tip = feeData.maxPriorityFeePerGas ?? ethers.BigNumber.from(0);
        const maxFee = feeData.maxFeePerGas ?? base.add(tip);

        const baseFee = parseFloat(
          ethers.utils.formatUnits(base, "gwei")
        ).toFixed(2);
        const priorityFee = parseFloat(
          ethers.utils.formatUnits(tip, "gwei")
        ).toFixed(2);
        const maxFeePerGas = parseFloat(
          ethers.utils.formatUnits(maxFee, "gwei")
        ).toFixed(2);

        // calculate estimated tx fee (21k gas) in ETH
        const gasLimit = ethers.BigNumber.from(21000);
        const cost = maxFee.mul(gasLimit);
        const costEth = parseFloat(ethers.utils.formatEther(cost));
        const estimatedFee = costEth.toFixed(6);

        // fetch current USDC/WETH rate
        const dexPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
        const wethPerUsdc = dexPrices[PAIRS[0].name][EXCHANGES[0].name] || 0;

        let convBaseFeeUSDC = "",
          convPriorityFeeUSDC = "",
          convMaxFeePerGasUSDC = "",
          estimatedFeeUSDC = "";

        if (wethPerUsdc > 0) {
          const usdcPerWeth = 1 / wethPerUsdc;
          const baseGwei = parseFloat(
            ethers.utils.formatUnits(base, "gwei")
          );
          convBaseFeeUSDC = (baseGwei * 1e-9 * usdcPerWeth).toFixed(6);

          const tipGwei = parseFloat(
            ethers.utils.formatUnits(tip, "gwei")
          );
          convPriorityFeeUSDC = (tipGwei * 1e-9 * usdcPerWeth).toFixed(6);

          const maxGwei = parseFloat(
            ethers.utils.formatUnits(maxFee, "gwei")
          );
          convMaxFeePerGasUSDC = (maxGwei * 1e-9 * usdcPerWeth).toFixed(6);

          estimatedFeeUSDC = (costEth * usdcPerWeth).toFixed(4);
        }

        setStats({
          baseFee,
          priorityFee,
          maxFeePerGas,
          estimatedFee,
          estimatedFeeUSDC,
          convBaseFeeUSDC,
          convPriorityFeeUSDC,
          convMaxFeePerGasUSDC,
        });
      } catch (e) {
        console.error("Error fetching fee data", e);
      }
    }
    fetchFees();
  }, [web3]);

  return stats;
} 