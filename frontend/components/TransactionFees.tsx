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
  // Destructure updated fee statistics from the useTransactionFees hook
  const {
    baseFeeGwei,
    priorityFeeGwei,
    maxFeeGwei,
    gasLimit,
    txFeeEth,
    txFeeUsdc,
  } = useTransactionFees();

  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-lg p-3 shadow-lg border border-white/20">
      <h2 className="text-lg font-medium text-white mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 14L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 10L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 6L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 18L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Transaction Fees
      </h2>
      
      <div className="space-y-2">
        {/* Display Max Fee per Gas */}
        <div className="bg-white/5 rounded-lg p-2 border border-white/10 transition-all hover:bg-white/10">
          <div className="flex items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 mr-1.5"></div>
            <div className="flex-1">
              <p className="text-white/70 text-xs flex items-center">
                Max Fee
                <span className="ml-1 text-[8px] px-1 py-0.5 bg-purple-500/20 text-purple-300 rounded">Network Cap</span>
              </p>
              <div className="flex items-baseline">
                <p className="text-white text-xs">{maxFeeGwei} Gwei</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Base Fee per Gas */}
        <div className="bg-white/5 rounded-lg p-2 border border-white/10 transition-all hover:bg-white/10">
          <div className="flex items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 mr-1.5"></div>
            <div className="flex-1">
              <p className="text-white/70 text-xs flex items-center">
                Base Fee
                <span className="ml-1 text-[8px] px-1 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">Protocol Fee</span>
              </p>
              <div className="flex items-baseline">
                <p className="text-white text-xs">{baseFeeGwei} Gwei</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Max Priority Fee */}
        <div className="bg-white/5 rounded-lg p-2 border border-white/10 transition-all hover:bg-white/10">
          <div className="flex items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 mr-1.5"></div>
            <div className="flex-1">
              <p className="text-white/70 text-xs flex items-center">
                Priority Fee
                <span className="ml-1 text-[8px] px-1 py-0.5 bg-amber-500/20 text-amber-300 rounded">Validator Tip</span>
              </p>
              <div className="flex items-baseline">
                <p className="text-white text-xs">{priorityFeeGwei} Gwei</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
