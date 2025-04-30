import { useState, useEffect } from "react";
import { useWeb3 } from "@/components/web3/Web3Provider";
import { ethers } from "ethers";
import { fetchDexPrices } from "@/lib/services/priceService";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";

/**
 * Interface representing the structure of transaction fee statistics.
 */
export interface FeeStats {
  baseFee: string; // Base fee per gas in Gwei
  priorityFee: string; // Priority fee per gas in Gwei
  maxFeePerGas: string; // Maximum fee per gas in Gwei
  estimatedFee: string; // Estimated transaction fee in ETH
  estimatedFeeUSDC: string; // Estimated transaction fee in USDC
  convBaseFeeUSDC: string; // Converted base fee per gas in USDC
  convPriorityFeeUSDC: string; // Converted priority fee per gas in USDC
  convMaxFeePerGasUSDC: string; // Converted max fee per gas in USDC
}

/**
 * Custom hook to fetch and provide transaction fee statistics.
 * It utilizes the Web3 context to access the Ethereum provider and fetches
 * fee data from the network, converting it to both ETH and USDC.
 * 
 * @returns {FeeStats} An object containing various transaction fee statistics.
 */
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
    // Only fetch when web3 is ready and running in a browser environment
    if (!web3 || typeof window === "undefined") return;

    /**
     * Fetches the current transaction fees from the Ethereum network.
     * It calculates the base, priority, and max fees, and estimates the transaction cost.
     * Additionally, it fetches the USDC/WETH rate to convert fees to USDC.
     */
    async function fetchFees() {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      try {
        const [feeData, block] = await Promise.all([
          provider.getFeeData(),
          provider.getBlock("latest"),
        ]);

        const base = feeData.lastBaseFeePerGas ?? block.baseFeePerGas ?? ethers.BigNumber.from(0);
        const tip = feeData.maxPriorityFeePerGas ?? ethers.BigNumber.from(0);
        const maxFee = feeData.maxFeePerGas ?? base.add(tip);

        const baseFee = parseFloat(ethers.utils.formatUnits(base, "gwei")).toFixed(2);
        const priorityFee = parseFloat(ethers.utils.formatUnits(tip, "gwei")).toFixed(2);
        const maxFeePerGas = parseFloat(ethers.utils.formatUnits(maxFee, "gwei")).toFixed(2);

        // Calculate estimated transaction fee (21k gas) in ETH
        const gasLimit = ethers.BigNumber.from(21000);
        const cost = maxFee.mul(gasLimit);
        const costEth = parseFloat(ethers.utils.formatEther(cost));
        const estimatedFee = costEth.toFixed(6);

        // Fetch current USDC/WETH rate
        const dexPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
        const wethPerUsdc = dexPrices[PAIRS[0].name][EXCHANGES[0].name] || 0;

        let convBaseFeeUSDC = "",
          convPriorityFeeUSDC = "",
          convMaxFeePerGasUSDC = "",
          estimatedFeeUSDC = "";

        if (wethPerUsdc > 0) {
          const usdcPerWeth = 1 / wethPerUsdc;
          const baseGwei = parseFloat(ethers.utils.formatUnits(base, "gwei"));
          convBaseFeeUSDC = (baseGwei * 1e-9 * usdcPerWeth).toFixed(6);

          const tipGwei = parseFloat(ethers.utils.formatUnits(tip, "gwei"));
          convPriorityFeeUSDC = (tipGwei * 1e-9 * usdcPerWeth).toFixed(6);

          const maxGwei = parseFloat(ethers.utils.formatUnits(maxFee, "gwei"));
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

    // Initial fetch
    fetchFees();
    // Poll every 5 minutes to stay in sync with price updates
    const intervalId = setInterval(fetchFees, 300000);
    return () => clearInterval(intervalId);
  }, [web3]);

  return stats;
} 