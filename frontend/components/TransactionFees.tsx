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
    <div className="rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-lg p-2.5 shadow-xl border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center">
        <div className="w-5 h-5 mr-1.5 bg-gradient-to-br from-cyan-500 to-teal-400 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 14L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 10L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 6L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 18L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        Transaction Fees
      </h2>
      
      <div className="space-y-2">
        {/* Display Max Fee per Gas */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-purple-500/30 group">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-1 mr-2 shadow-md group-hover:shadow-purple-500/20 transition-all">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.18 10.16 8.49001 10.96 8.49001H12.84C13.76 8.49001 14.51 9.27001 14.51 10.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 3V7H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                <p className="text-white text-sm font-semibold">{maxFeeGwei} <span className="text-xs font-normal text-white/70">Gwei</span></p>
                {txFeeUsdc && (
                  <p className="text-white/60 text-[10px]">≈ {formatCurrencyAmount(parseFloat(txFeeUsdc), 'USD')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Base Fee per Gas */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-cyan-500/30 group">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-1 mr-2 shadow-md group-hover:shadow-cyan-500/20 transition-all">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.5 9.5L12 13L8.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 14.5L12 18L15.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                <p className="text-white text-sm font-semibold">{baseFeeGwei} <span className="text-xs font-normal text-white/70">Gwei</span></p>
                <p className="text-white/60 text-[10px]">Burned by protocol</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Max Priority Fee */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-amber-500/30 group">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-1 mr-2 shadow-md group-hover:shadow-amber-500/20 transition-all">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
                <path d="M2 12.8799V11.1199C2 10.0799 2.85 9.21994 3.9 9.21994C5.71 9.21994 6.45 7.93994 5.54 6.36994C5.02 5.46994 5.33 4.29994 6.24 3.77994L7.97 2.78994C8.76 2.31994 9.78 2.59994 10.25 3.38994L10.36 3.57994C11.26 5.14994 12.74 5.14994 13.65 3.57994L13.76 3.38994C14.23 2.59994 15.25 2.31994 16.04 2.78994L17.77 3.77994C18.68 4.29994 18.99 5.46994 18.47 6.36994C17.56 7.93994 18.3 9.21994 20.11 9.21994C21.15 9.21994 22.01 10.0699 22.01 11.1199V12.8799C22.01 13.9199 21.16 14.7799 20.11 14.7799C18.3 14.7799 17.56 16.0599 18.47 17.6299C18.99 18.5399 18.68 19.6999 17.77 20.2199L16.04 21.2099C15.25 21.6799 14.23 21.3999 13.76 20.6099L13.65 20.4199C12.75 18.8499 11.27 18.8499 10.36 20.4199L10.25 20.6099C9.78 21.3999 8.76 21.6799 7.97 21.2099L6.24 20.2199C5.33 19.6999 5.02 18.5299 5.54 17.6299C6.45 16.0599 5.71 14.7799 3.9 14.7799C2.85 14.7799 2 13.9199 2 12.8799Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-white/80 text-xs font-medium">Priority Fee</p>
                <span className="text-xs px-1 py-0 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px]">
                  Validator Tip
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white text-sm font-semibold">{priorityFeeGwei} <span className="text-xs font-normal text-white/70">Gwei</span></p>
                <p className="text-white/60 text-[10px]">Paid to validators</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Gas Cost */}
        {txFeeEth && txFeeUsdc && (
          <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-lg p-2 border border-blue-500/20">
            <div className="flex justify-between items-center">
              <p className="text-white/80 text-xs font-medium">Total Gas Cost</p>
              <div className="flex items-center">
                <p className="text-white font-medium text-xs mr-1">{txFeeEth} ETH</p>
                <p className="text-white/60 text-[10px]">({txFeeUsdc && formatCurrencyAmount(parseFloat(txFeeUsdc), 'USD')})</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
