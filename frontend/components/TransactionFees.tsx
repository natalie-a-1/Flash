"use client";

import React from "react";
import { useTransactionFees } from "@/lib/web3/hooks/useTransactionFees";
import { formatCurrencyAmount } from "@/lib/web3/utils";

export default function QuickStats() {
  const {
    baseFee,
    priorityFee,
    maxFeePerGas,
    estimatedFee,
    estimatedFeeUSDC,
    convBaseFeeUSDC,
    convPriorityFeeUSDC,
    convMaxFeePerGasUSDC,
  } = useTransactionFees();

  return (
    <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-medium text-white mb-4">Transaction Fee Stats</h2>
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Max Fee per Gas</p>
          <p className="text-white font-medium">
            {maxFeePerGas} Gwei 
            <small className="text-white/50 ml-2">
              ≈ {formatCurrencyAmount(convMaxFeePerGasUSDC, 'USD', 6, false)}/gas
            </small>
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Base Fee per Gas</p>
          <p className="text-white font-medium">
            {baseFee} Gwei 
            <small className="text-white/50 ml-2">
              ≈ {formatCurrencyAmount(convBaseFeeUSDC, 'USD', 6, false)}/gas
            </small>
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">Max Priority Fee</p>
          <p className="text-white font-medium">
            {priorityFee} Gwei 
            <small className="text-white/50 ml-2">
              ≈ {formatCurrencyAmount(convPriorityFeeUSDC, 'USD', 6, false)}/gas
            </small>
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/70 text-sm">
            Estimated Tx Fee
          </p>
          <p className="text-white font-medium">
            {estimatedFee} ETH
            {estimatedFeeUSDC && (
              <span className="text-white/50 text-sm ml-2">
                ≈ {formatCurrencyAmount(estimatedFeeUSDC, 'USD', 2, false)} (gas price x gas units)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
