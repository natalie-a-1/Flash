import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { fetchDexPrices } from "@/lib/services/priceService";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";

/**
 * Interface representing the structure of transaction fee statistics.
 */
export interface FeeStats {
  baseFeeGwei: string; // Base fee per gas unit in Gwei
  priorityFeeGwei: string; // Priority fee per gas unit in Gwei
  maxFeeGwei: string; // Max fee per gas unit in Gwei
  gasLimit: string; // Estimated gas units (with buffer)
  txFeeEth: string; // Total estimated tx fee in ETH
  txFeeUsdc: string; // Total estimated tx fee in USDC
}

/**
 * Custom hook to fetch and provide transaction fee statistics.
 * It uses the injected window.ethereum provider to fetch EIP-1559 fee data,
 * estimate gas usage (with buffer), and compute total fees in ETH and USDC.
 *
 * @returns {FeeStats} An object containing various transaction fee statistics.
 */
export function useTransactionFees(): FeeStats {
  const [stats, setStats] = useState<FeeStats>({
    baseFeeGwei: "",
    priorityFeeGwei: "",
    maxFeeGwei: "",
    gasLimit: "",
    txFeeEth: "",
    txFeeUsdc: "",
  });

  useEffect(() => {
    // Only run in browser with injected provider
    if (typeof window === "undefined" || !window.ethereum) return;

    async function updateFees() {
      try {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as any,
        );
        const { lastBaseFeePerGas, maxPriorityFeePerGas, maxFeePerGas } =
          await provider.getFeeData();
        const baseFeeBN = lastBaseFeePerGas ?? ethers.BigNumber.from(0);
        const priorityFeeBN = maxPriorityFeePerGas ?? ethers.BigNumber.from(0);
        const effectiveMaxFeeBN = maxFeePerGas ?? baseFeeBN.add(priorityFeeBN);

        const signer = provider.getSigner();
        const fromAddress = await signer.getAddress();
        // Estimate gas for a zero-value call to self, catch errors and fallback
        const txReq: any = {
          to: fromAddress,
          from: fromAddress,
          value: ethers.constants.Zero,
        };
        let gasLimitBN;
        try {
          gasLimitBN = await provider.estimateGas(txReq);
          gasLimitBN = gasLimitBN.mul(12).div(10);
        } catch (err) {
          console.warn(
            "Failed to estimate gas for transaction fees, using default gas limit",
            err,
          );
          gasLimitBN = ethers.BigNumber.from(21000);
        }

        const totalFeeWei = effectiveMaxFeeBN.mul(gasLimitBN);
        const txFeeEthRaw = parseFloat(ethers.utils.formatEther(totalFeeWei));
        const txFeeEth = txFeeEthRaw.toFixed(6);

        const dexPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
        const wethPerUsdc = dexPrices[PAIRS[0].name][EXCHANGES[0].name] || 0;
        const usdcPerWeth = wethPerUsdc ? 1 / wethPerUsdc : 0;
        const txFeeUsdc = (txFeeEthRaw * usdcPerWeth).toFixed(4);

        setStats({
          baseFeeGwei: parseFloat(
            ethers.utils.formatUnits(baseFeeBN, "gwei"),
          ).toFixed(2),
          priorityFeeGwei: parseFloat(
            ethers.utils.formatUnits(priorityFeeBN, "gwei"),
          ).toFixed(2),
          maxFeeGwei: parseFloat(
            ethers.utils.formatUnits(effectiveMaxFeeBN, "gwei"),
          ).toFixed(2),
          gasLimit: gasLimitBN.toString(),
          txFeeEth,
          txFeeUsdc,
        });
      } catch (error) {
        console.error("Failed to update transaction fees", error);
      }
    }

    updateFees();
    const intervalId = setInterval(updateFees, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return stats;
}

// New hook: estimate gas and total fee for loan amount transactions
export function useEstimateLoanFee(
  loanAmount: string,
  decimals: number,
): { gasLimit: string; txFeeEth: string; txFeeUsdc: string } {
  const [estimate, setEstimate] = useState<{
    gasLimit: string;
    txFeeEth: string;
    txFeeUsdc: string;
  }>({
    gasLimit: "",
    txFeeEth: "",
    txFeeUsdc: "",
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum || !loanAmount) {
      return;
    }
    let canceled = false;
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);

    async function calc() {
      try {
        const signer = provider.getSigner();
        const from = await signer.getAddress();
        // Estimate gas for a zero-value call to self to avoid funds errors
        const txReq: ethers.providers.TransactionRequest = {
          to: from,
          from,
          value: ethers.constants.Zero, // zero ETH transfer for gas estimation
        };

        // estimate gas with buffer, handle errors and fallback
        let gasBN;
        try {
          gasBN = await provider.estimateGas(txReq);
          gasBN = gasBN.mul(12).div(10);
        } catch (err) {
          console.warn(
            "Failed to estimate loan gas, using default gas limit",
            err,
          );
          gasBN = ethers.BigNumber.from(21000);
        }

        // get fee data
        const { lastBaseFeePerGas, maxPriorityFeePerGas, maxFeePerGas } =
          await provider.getFeeData();
        const baseFeeBN = lastBaseFeePerGas ?? ethers.BigNumber.from(0);
        const priorityFeeBN = maxPriorityFeePerGas ?? ethers.BigNumber.from(0);
        const effectiveMaxFeeBN = maxFeePerGas ?? baseFeeBN.add(priorityFeeBN);

        // total fee in wei
        const totalWei = effectiveMaxFeeBN.mul(gasBN);
        const feeEthRaw = parseFloat(ethers.utils.formatEther(totalWei));
        const feeEth = feeEthRaw.toFixed(6);

        // convert to USDC
        const dexPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
        const wethPerUsdc = dexPrices[PAIRS[0].name][EXCHANGES[0].name] || 0;
        const usdcPerWeth = wethPerUsdc ? 1 / wethPerUsdc : 0;
        const feeUsdc = (feeEthRaw * usdcPerWeth).toFixed(4);

        if (!canceled) {
          setEstimate({
            gasLimit: gasBN.toString(),
            txFeeEth: feeEth,
            txFeeUsdc: feeUsdc,
          });
        }
      } catch (err) {
        console.error("Failed to estimate loan fee", err);
      }
    }

    calc();
    return () => {
      canceled = true;
    };
  }, [loanAmount, decimals]);

  return estimate;
}
