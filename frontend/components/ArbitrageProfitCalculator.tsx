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
    <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white flex items-center">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Profit Estimate
        </h3>
        
        {/* Result Summary */}
        <div className={`px-2 py-0.5 rounded text-xs font-medium ${
          potentialProfit === null ? 'bg-gray-500/20 text-gray-300' :
          isProfitable ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          {potentialProfit === null ? 'Calculating...' : 
           isProfitable ? 'Profitable' : 'Not Profitable'}
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-2">
        {/* Left Column: User Settings */}
        <div className="col-span-5 space-y-1.5">
          {/* Slippage */}
          <div>
            <label className="text-white/70 text-[10px] mb-0.5 flex items-center">
              <div className="w-1 h-1 rounded-full bg-purple-400 mr-1"></div>
              Slippage Tolerance
            </label>
            <div className="relative">
              <input
                type="text"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="0.5"
                className="w-full p-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-white/70 text-[10px]">
                %
              </div>
            </div>
          </div>
          
          {/* Profit Threshold */}
          <div>
            <label className="text-white/70 text-[10px] mb-0.5 flex items-center">
              <div className="w-1 h-1 rounded-full bg-cyan-400 mr-1"></div>
              Profit Threshold
            </label>
            <div className="relative">
              <input
                type="text"
                value={profitThreshold}
                onChange={(e) => setProfitThreshold(e.target.value)}
                placeholder="10"
                className="w-full p-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-white/70 text-[10px]">
                USD
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Profit Info */}
        <div className="col-span-7">
          {/* Profit Details */}
          <div className={`p-1.5 border rounded-lg ${
            potentialProfit === null ? 'bg-white/5 border-white/10 text-white/50' :
            isProfitable ? 'bg-green-900/20 border-green-600/30 text-green-300' :
            'bg-red-900/20 border-red-600/30 text-red-300'
          }`}>
            {/* Summary of fees and profit relative to loan amount */}
            <div className="text-[9px] space-y-1 border-t border-white/10 pt-1 opacity-80">
              {/* Best Arbitrage Path */}
              {buyExchange && sellExchange && (
                <>
                  <div>Buy on <span className="font-medium">{buyExchange}</span>: {parseFloat(buyPriceValue).toFixed(8)} WETH</div>
                  <div>Sell on <span className="font-medium">{sellExchange}</span>: {parseFloat(sellPriceValue).toFixed(8)} WETH</div>
                </>
              )}
              {/* Flash Loan and Gas Costs */}
              <div>Flash Loan Fee: {formatTokenAmount(flashLoanFeeAmt, selectedToken.decimals, selectedToken.symbol, true)}</div>
              <div>Gas Estimate: {loanTxFeeUsdc ? formatCurrencyAmount(parseFloat(loanTxFeeUsdc), 'USD', 4) : '-'}</div>
              {/* Profit and ROI */}
              <div>Potential Profit: {potentialProfit !== null ? formatCurrencyAmount(potentialProfit, 'USD', 2) : '-'}</div>
              {roi !== null && <div>ROI: {roi.toFixed(2)}%</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}