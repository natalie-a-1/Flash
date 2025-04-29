"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { ethers } from "ethers";
import { fetchDexPrices } from "@/lib/services/priceService";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";
import { formatCurrencyAmount } from "@/lib/web3/utils";

export default function QuickStats() {
  const { isCorrectNetwork, web3 } = useWeb3();
  const [gasPrice, setGasPrice] = useState<string>("");
  const [baseFee, setBaseFee] = useState<string>("");
  const [priorityFee, setPriorityFee] = useState<string>("");
  const [maxFeePerGas, setMaxFeePerGas] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string>("");
  const [estimatedFeeUSDC, setEstimatedFeeUSDC] = useState<string>("");
  // USDC conversion per gas unit for each fee
  const [convBaseFeeUSDC, setConvBaseFeeUSDC] = useState<string>("");
  const [convPriorityFeeUSDC, setConvPriorityFeeUSDC] = useState<string>("");
  const [convMaxFeePerGasUSDC, setConvMaxFeePerGasUSDC] = useState<string>("");
  const [convGasPriceUSDC, setConvGasPriceUSDC] = useState<string>("");

  useEffect(() => {
    const fetchFees = async () => {
      if (!web3 || typeof window === "undefined") return;
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );

      try {
        const [feeData, block] = await Promise.all([
          provider.getFeeData(),
          provider.getBlock("latest"),
        ]);

        // Gas Price
        if (feeData.gasPrice) {
          const gpGwei = parseFloat(
            ethers.utils.formatUnits(feeData.gasPrice, "gwei")
          );
          setGasPrice(gpGwei.toFixed(2));
        }
        
        const base =
          feeData.lastBaseFeePerGas ?? block.baseFeePerGas ??
          ethers.BigNumber.from(0);
        const tip = feeData.maxPriorityFeePerGas ??
          ethers.BigNumber.from(0);
        const maxFee = feeData.maxFeePerGas ?? base.add(tip);

        // format fees in Gwei
        setBaseFee(
          parseFloat(ethers.utils.formatUnits(base, "gwei")).toFixed(2)
        );
        setPriorityFee(
          parseFloat(ethers.utils.formatUnits(tip, "gwei")).toFixed(2)
        );
        setMaxFeePerGas(
          parseFloat(ethers.utils.formatUnits(maxFee, "gwei")).toFixed(2)
        );

        const gasLimit = ethers.BigNumber.from(21000);
        const cost = maxFee.mul(gasLimit);
        const costEth = parseFloat(ethers.utils.formatEther(cost));
        setEstimatedFee(costEth.toFixed(6));

        // fetch USDC/WETH price
        const dexPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
        const wethPerUsdc = dexPrices[PAIRS[0].name][EXCHANGES[0].name] || 0;
        if (wethPerUsdc > 0) {
          const usdcPerWeth = 1 / wethPerUsdc;

          // Gas Price conversion
          const gpGwei = feeData.gasPrice
            ? parseFloat(ethers.utils.formatUnits(feeData.gasPrice, "gwei"))
            : 0;
          const convGP = gpGwei * 1e-9 * usdcPerWeth;
          setConvGasPriceUSDC(convGP.toFixed(6));

          // Base Fee conversion
          const baseGwei = parseFloat(
            ethers.utils.formatUnits(base, "gwei")
          );
          const convBase = baseGwei * 1e-9 * usdcPerWeth;
          setConvBaseFeeUSDC(convBase.toFixed(6));

          // Priority Fee conversion
          const tipGwei = parseFloat(
            ethers.utils.formatUnits(tip, "gwei")
          );
          const convTip = tipGwei * 1e-9 * usdcPerWeth;
          setConvPriorityFeeUSDC(convTip.toFixed(6));

          // Max Fee conversion
          const maxGwei = parseFloat(
            ethers.utils.formatUnits(maxFee, "gwei")
          );
          const convMax = maxGwei * 1e-9 * usdcPerWeth;
          setConvMaxFeePerGasUSDC(convMax.toFixed(6));

          // Tx Fee conversion
          setEstimatedFeeUSDC((costEth * usdcPerWeth).toFixed(4));
        }
      } catch (e) {
        console.error("Error fetching fee data", e);
      }
    };
    fetchFees();
  }, [web3]);

  return (
    <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-medium text-white mb-4">Transaction Fee Stats</h2>
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Gas Price</p>
          <p className="text-white font-medium">
            {gasPrice} Gwei
            <small className="text-white/50 ml-2">
              ≈ {formatCurrencyAmount(convGasPriceUSDC, 'USD', 6, false)}/gas
            </small>
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Max Fee per Gas</p>
          <p className="text-white font-medium">{maxFeePerGas} Gwei</p>
          <small className="text-white/50">
            ≈ {formatCurrencyAmount(convMaxFeePerGasUSDC, 'USD', 6, false)}/gas
          </small>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Base Fee per Gas</p>
          <p className="text-white font-medium">{baseFee} Gwei</p>
          <small className="text-white/50">
            ≈ {formatCurrencyAmount(convBaseFeeUSDC, 'USD', 6, false)}/gas
          </small>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Max Priority Fee</p>
          <p className="text-white font-medium">{priorityFee} Gwei</p>
          <small className="text-white/50">
            ≈ {formatCurrencyAmount(convPriorityFeeUSDC, 'USD', 6, false)}/gas
          </small>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Estimated Tx Fee (21,000 gas)</p>
          <p className="text-white font-medium">
            {estimatedFee} ETH
            {estimatedFeeUSDC && (
              <span className="text-white/50 text-sm ml-2">
                ≈ {formatCurrencyAmount(estimatedFeeUSDC, 'USD', 2, false)}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
