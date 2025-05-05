"use client";

import React, { useState, useEffect } from "react";
import { useTransactionFees } from "@/lib/web3/hooks/useTransactionFees";
import { formatCurrencyAmount } from "@/lib/web3/utils";
import { useGlobalData } from "./web3/GlobalDataProvider";

/**
 * QuickStats component displays transaction fee statistics.
 * It fetches fee data using the useTransactionFees hook and formats
 * the values for display, including conversion to USD.
 * It now uses the GlobalDataProvider for timing updates.
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

  // Get the global update timestamp
  const { lastUpdated } = useGlobalData();

  // We no longer need to keep our own lastUpdated timestamp
  // since GlobalDataProvider manages this

  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/60 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Ethereum Gas</h3>
        <div className="text-xs px-1.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded flex items-center">
          <svg
            className="w-3 h-3 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Auto-updating
        </div>
      </div>

      <div className="space-y-3">
        {/* Display Max Fee per Gas */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-purple-500/30 group">
          <div className="flex items-center">
            <div className="w-10 h-10 flex-shrink-0 mr-3 bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-900/20">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-white/80 text-xs font-medium">Max Fee</p>
                <span className="text-xs px-1 py-0 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px]">
                  Network Cap
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white text-sm font-semibold">
                  {maxFeeGwei}{" "}
                  <span className="text-xs font-normal text-white/70">
                    Gwei
                  </span>
                </p>
                {txFeeUsdc && (
                  <p className="text-white/60 text-[10px]">
                    ≈ {formatCurrencyAmount(parseFloat(txFeeUsdc), "USD")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Display Base Fee per Gas */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-cyan-500/30 group">
          <div className="flex items-center">
            <div className="w-10 h-10 flex-shrink-0 mr-3 bg-gradient-to-br from-cyan-700 to-cyan-900 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-cyan-900/20">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-white/80 text-xs font-medium">Base Fee</p>
                <span className="text-xs px-1 py-0 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px]">
                  Protocol Fee
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white text-sm font-semibold">
                  {baseFeeGwei}{" "}
                  <span className="text-xs font-normal text-white/70">
                    Gwei
                  </span>
                </p>
                <p className="text-white/60 text-[10px]">Burned by protocol</p>
              </div>
            </div>
          </div>
        </div>

        {/* Display Max Priority Fee */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-amber-500/30 group">
          <div className="flex items-center">
            <div className="w-10 h-10 flex-shrink-0 mr-3 bg-gradient-to-br from-amber-700 to-amber-900 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-amber-900/20">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-white/80 text-xs font-medium">
                  Priority Fee
                </p>
                <span className="text-xs px-1 py-0 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px]">
                  Validator Tip
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white text-sm font-semibold">
                  {priorityFeeGwei}{" "}
                  <span className="text-xs font-normal text-white/70">
                    Gwei
                  </span>
                </p>
                <p className="text-white/60 text-[10px]">Paid to validators</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Gas Cost */}
        {txFeeEth && txFeeUsdc && (
          <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-lg p-2 border border-blue-500/20">
            <div className="flex justify-between items-center">
              <p className="text-white/80 text-xs font-medium">
                Total Gas Cost
              </p>
              <div className="flex items-center">
                <p className="text-white font-medium text-xs mr-1">
                  {txFeeEth} ETH
                </p>
                <p className="text-white/60 text-[10px]">
                  (
                  {txFeeUsdc &&
                    formatCurrencyAmount(parseFloat(txFeeUsdc), "USD")}
                  )
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* No longer need individual last updated indicator */}
      </div>
    </div>
  );
}
