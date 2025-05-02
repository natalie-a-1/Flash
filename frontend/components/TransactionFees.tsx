"use client";

import React from "react";
import { useTransactionFees } from "@/lib/web3/hooks/useTransactionFees";
import { formatCurrencyAmount } from "@/lib/web3/utils";

/**
 * QuickStats component displays transaction fee statistics.
 * It fetches fee data using the useTransactionFees hook and formats
 * the values for display, including conversion to USD.
 */
export default function QuickStats() {
  // Destructure fee statistics from the useTransactionFees hook
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
      <h2 className="text-2xl font-medium text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 14L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 10L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 6L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 18L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Transaction Fee Stats
      </h2>
      
      <p className="text-white/50 text-sm mb-4">
        Current Ethereum network gas fees. These values update in real-time and are used to calculate transaction costs.
      </p>
      
      <div className="space-y-3">
        {/* Display Max Fee per Gas */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 transition-all hover:bg-white/10">
          <div className="flex items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 mr-2"></div>
            <div className="flex-1">
              <p className="text-white/70 text-sm flex items-center">
                Max Fee per Gas
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">Network Cap</span>
              </p>
              <div className="flex items-baseline mt-0.5">
                <p className="text-white font-medium">{maxFeePerGas} Gwei</p>
                <small className="text-white/50 ml-2">
                  ≈ {formatCurrencyAmount(convMaxFeePerGasUSDC, 'USD', 6, false)}/gas
                </small>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Base Fee per Gas */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 transition-all hover:bg-white/10">
          <div className="flex items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 mr-2"></div>
            <div className="flex-1">
              <p className="text-white/70 text-sm flex items-center">
                Base Fee per Gas
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">Protocol Fee</span>
              </p>
              <div className="flex items-baseline mt-0.5">
                <p className="text-white font-medium">{baseFee} Gwei</p>
                <small className="text-white/50 ml-2">
                  ≈ {formatCurrencyAmount(convBaseFeeUSDC, 'USD', 6, false)}/gas
                </small>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Max Priority Fee */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 transition-all hover:bg-white/10">
          <div className="flex items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 mr-2"></div>
            <div className="flex-1">
              <p className="text-white/70 text-sm flex items-center">
                Max Priority Fee
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">Tip to Validators</span>
              </p>
              <div className="flex items-baseline mt-0.5">
                <p className="text-white font-medium">{priorityFee} Gwei</p>
                <small className="text-white/50 ml-2">
                  ≈ {formatCurrencyAmount(convPriorityFeeUSDC, 'USD', 6, false)}/gas
                </small>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Estimated Transaction Fee */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-4 border border-white/10 mt-4">
          <p className="text-white/80 text-sm font-medium mb-1">Estimated Transaction Fee</p>
          <div className="flex items-baseline">
            <p className="text-white text-lg font-medium">{estimatedFee} ETH</p>
            {estimatedFeeUSDC && (
              <span className="text-white/60 text-sm ml-2">
                ≈ {formatCurrencyAmount(estimatedFeeUSDC, 'USD', 2, false)}
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs mt-1">Calculated as max gas price × estimated gas units (21,000 for basic transfer)</p>
        </div>
      </div>
    </div>
  );
}
