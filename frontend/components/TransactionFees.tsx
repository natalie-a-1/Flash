"use client";

import React from "react";
import { useTransactionFees } from "@/lib/web3/hooks/useTransactionFees";
import { formatCurrencyAmount } from "@/lib/web3/utils";
import { useGlobalData } from "./web3/GlobalDataProvider";

/**
 * QuickStats component displays transaction fee statistics in a compact format.
 */
export default function QuickStats() {
  const {
    baseFeeGwei,
    priorityFeeGwei,
    maxFeeGwei,
    txFeeEth,
    txFeeUsdc,
  } = useTransactionFees();
  const { lastUpdated } = useGlobalData();

  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-white">Ethereum Gas</h3>
        <div className="text-xs px-1.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded flex items-center">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Auto-updating
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Max Fee */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 hover:border-purple-500/30 group">
          <div className="flex items-center mb-1">
            <div className="w-5 h-5 mr-1 bg-gradient-to-br from-purple-700 to-purple-900 rounded-md flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-white/80 text-xs">Max Fee</p>
          </div>
          <p className="text-white text-sm font-semibold">{maxFeeGwei} <span className="text-xs text-white/70">Gwei</span></p>
        </div>

        {/* Base Fee */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 hover:border-cyan-500/30 group">
          <div className="flex items-center mb-1">
            <div className="w-5 h-5 mr-1 bg-gradient-to-br from-cyan-700 to-cyan-900 rounded-md flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-white/80 text-xs">Base Fee</p>
          </div>
          <p className="text-white text-sm font-semibold">{baseFeeGwei} <span className="text-xs text-white/70">Gwei</span></p>
        </div>

        {/* Priority Fee */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 hover:border-amber-500/30 group">
          <div className="flex items-center mb-1">
            <div className="w-5 h-5 mr-1 bg-gradient-to-br from-amber-700 to-amber-900 rounded-md flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <p className="text-white/80 text-xs">Priority</p>
          </div>
          <p className="text-white text-sm font-semibold">{priorityFeeGwei} <span className="text-xs text-white/70">Gwei</span></p>
        </div>
      </div>

      {/* Total Gas Cost */}
      {txFeeEth && txFeeUsdc && (
        <div className="mt-2 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-lg p-2 border border-blue-500/20">
          <div className="flex justify-between items-center">
            <p className="text-white/80 text-xs font-medium">Total Gas</p>
            <div className="flex items-center">
              <p className="text-white font-medium text-xs mr-1">{txFeeEth} ETH</p>
              <p className="text-white/60 text-[10px]">({formatCurrencyAmount(parseFloat(txFeeUsdc || "0"), "USD")})</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
