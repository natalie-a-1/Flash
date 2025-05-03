"use client";

import { useState, useEffect } from 'react';
import { formatCurrencyAmount, formatTokenAmount } from '@/lib/web3/utils';
import { ArbitrageProfitCalculatorProps as UpdatedArbitrageProfitCalculatorProps, ExchangePrices } from '@/types/arbitrage';
import { useArbitrageCalculator } from '@/hooks/useArbitrageCalculator';
import { useTransactionFees, useEstimateLoanFee } from '@/lib/web3/hooks/useTransactionFees';
import { TokenInfo } from '@/types/aave';
import { findBestArbitragePath } from '@/lib/services/priceService';

export default function ArbitrageProfitCalculator({
  loanAmount,
  selectedToken,
  flashLoanBps,
  dexPrices,
}: UpdatedArbitrageProfitCalculatorProps) {
  // Keep local UI state
  const [slippage, setSlippage] = useState<string>('0.5'); // Default 0.5%
  const [profitThreshold, setProfitThreshold] = useState<string>('10'); // Default $10

  // Fee statistics from network and estimate based on loan amount
  const { txFeeEth, txFeeUsdc } = useTransactionFees();
  const { gasLimit: loanGasLimit, txFeeEth: loanTxFeeEth, txFeeUsdc: loanTxFeeUsdc } = useEstimateLoanFee(loanAmount, selectedToken.decimals);

  // Calculate flash loan fee and total fees based on loan amount
  const loanAmtNum = parseFloat(loanAmount) || 0;
  const flashLoanFeeAmt = loanAmtNum > 0 ? (loanAmtNum * flashLoanBps) / 10_000 : 0;
  const gasFeeAmt = txFeeUsdc ? parseFloat(txFeeUsdc) : 0;

  // Fees are included or will be fetched internally; always use '0' for now
  const tradingFeesValue = '0';

  // Determine best arbitrage path (auto-select buy/sell DEX)
  const bestPath = dexPrices ? findBestArbitragePath(dexPrices) : null;
  const buyExchange = bestPath?.buy || '';
  const sellExchange = bestPath?.sell || '';
  const buyPriceValue = buyExchange && dexPrices ? dexPrices[buyExchange].toString() : '0';
  const sellPriceValue = sellExchange && dexPrices ? dexPrices[sellExchange].toString() : '0';

  // Use custom hook for calculation, pass gasCost in USDC
  const { potentialProfit, isProfitable, roi } = useArbitrageCalculator({
    loanAmount,
    buyPrice: buyPriceValue,
    sellPrice: sellPriceValue,
    tradingFees: tradingFeesValue,
    slippage,
    gasCost: loanTxFeeUsdc,
    profitThreshold,
    flashLoanBps,
  });

  return (
    <div className="p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 rounded-xl text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium text-white flex items-center">
          <div className="w-6 h-6 mr-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Arbitrage Profit Calculator
        </h3>
        
        {/* Result Summary */}
        <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
          potentialProfit === null ? 'bg-gray-500/20 text-gray-300' :
          isProfitable ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {potentialProfit === null ? 'Calculating...' : 
           isProfitable ? 'Profitable Opportunity' : 'Not Profitable'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: User Settings */}
        <div className="md:col-span-5 space-y-3">
          {/* Slippage */}
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <label className="text-white/80 text-xs font-medium mb-2 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 mr-2"></div>
              Slippage Tolerance
            </label>
            <div className="relative">
              <input
                type="text"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="0.5"
                className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-3 text-white/70 text-sm">
                %
              </div>
            </div>
          </div>
          
          {/* Profit Threshold */}
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <label className="text-white/80 text-xs font-medium mb-2 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 mr-2"></div>
              Profit Threshold
            </label>
            <div className="relative">
              <input
                type="text"
                value={profitThreshold}
                onChange={(e) => setProfitThreshold(e.target.value)}
                placeholder="10"
                className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-3 text-white/70 text-sm">
                USD
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Profit Info */}
        <div className="md:col-span-7">
          {/* Profit Details */}
          <div className={`p-4 border rounded-xl ${
            potentialProfit === null ? 'bg-white/5 border-white/10 text-white/50' :
            isProfitable ? 'bg-green-900/20 border-green-600/30 text-green-300' :
            'bg-red-900/20 border-red-600/30 text-red-300'
          }`}>
            <div className="text-center mb-3">
              <h4 className="text-sm font-medium mb-1">Estimated Profit</h4>
              <div className="text-xl font-bold">
                {potentialProfit !== null ? formatCurrencyAmount(potentialProfit, 'USD', 2) : '—'}
              </div>
              {roi !== null && (
                <div className="text-xs opacity-80 mt-1">
                  Return on Investment: {roi.toFixed(2)}%
                </div>
              )}
            </div>
            
            {/* Summary of fees and profit relative to loan amount */}
            <div className="space-y-2 border-t border-white/20 pt-3 text-xs">
              {/* Best Arbitrage Path */}
              {buyExchange && sellExchange && (
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1.5 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 15L17 12L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Buy on <span className="font-medium">{buyExchange}</span>:</span>
                    </div>
                    <span>{parseFloat(buyPriceValue).toFixed(8)} WETH</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1.5 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 9L11 12L14 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Sell on <span className="font-medium">{sellExchange}</span>:</span>
                    </div>
                    <span>{parseFloat(sellPriceValue).toFixed(8)} WETH</span>
                  </div>
                </div>
              )}
              
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 16.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7.5 13.5L10.5 16.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.5 7.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16.5 10.5L13.5 7.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Flash Loan Fee:</span>
                  </div>
                  <span>{formatTokenAmount(flashLoanFeeAmt, selectedToken.decimals, selectedToken.symbol, true)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
                      <path d="M2 12.8799V11.1199C2 10.0799 2.85 9.21994 3.9 9.21994C5.71 9.21994 6.45 7.93994 5.54 6.36994C5.02 5.46994 5.33 4.29994 6.24 3.77994L7.97 2.78994C8.76 2.31994 9.78 2.59994 10.25 3.38994L10.36 3.57994C11.26 5.14994 12.74 5.14994 13.65 3.57994L13.76 3.38994C14.23 2.59994 15.25 2.31994 16.04 2.78994L17.77 3.77994C18.68 4.29994 18.99 5.46994 18.47 6.36994C17.56 7.93994 18.3 9.21994 20.11 9.21994C21.15 9.21994 22.01 10.0699 22.01 11.1199V12.8799C22.01 13.9199 21.16 14.7799 20.11 14.7799C18.3 14.7799 17.56 16.0599 18.47 17.6299C18.99 18.5399 18.68 19.6999 17.77 20.2199L16.04 21.2099C15.25 21.6799 14.23 21.3999 13.76 20.6099L13.65 20.4199C12.75 18.8499 11.27 18.8499 10.36 20.4199L10.25 20.6099C9.78 21.3999 8.76 21.6799 7.97 21.2099L6.24 20.2199C5.33 19.6999 5.02 18.5299 5.54 17.6299C6.45 16.0599 5.71 14.7799 3.9 14.7799C2.85 14.7799 2 13.9199 2 12.8799Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Gas Estimate:</span>
                  </div>
                  <span>{loanTxFeeUsdc ? formatCurrencyAmount(parseFloat(loanTxFeeUsdc), 'USD', 4) : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}