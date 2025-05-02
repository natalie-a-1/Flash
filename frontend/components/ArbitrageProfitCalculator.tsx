"use client";

import { useState, useEffect } from 'react';
import { formatCurrencyAmount, formatTokenAmount } from '@/lib/web3/utils';
import { ArbitrageProfitCalculatorProps } from '@/types/arbitrage';
import { useArbitrageCalculator } from '@/hooks/useArbitrageCalculator';
import { getEthersV5Provider } from '@/lib/web3/web3';
import { fetchDexPrices, findBestArbitragePath } from '@/lib/services/priceService';
import { EXCHANGES, PAIRS } from '@/lib/constants/dex';
import { useTransactionFees } from '@/lib/web3/hooks/useTransactionFees';
import type { ExchangePrices, ArbitragePath } from '@/types/arbitrage';

export default function ArbitrageProfitCalculator({ 
  loanAmount, 
  selectedToken, 
  flashLoanBps 
}: ArbitrageProfitCalculatorProps) {
  // Keep only user decision inputs
  const [slippage, setSlippage] = useState<string>('0.5'); // Default 0.5%
  const [profitThreshold, setProfitThreshold] = useState<string>('10'); // Default $10
  // trading fees handled internally, always pass '0' for now

  // Live on-chain price data and best arbitrage path
  const [dexPrices, setDexPrices] = useState<ExchangePrices | null>(null);
  const [arbPath, setArbPath] = useState<ArbitragePath | null>(null);
  
  // Gas fee statistics from network
  const { estimatedFee, estimatedFeeUSDC } = useTransactionFees();

  // Fees are included or will be fetched internally; always use '0' for now
  const tradingFeesValue = '0';

  // Use custom hook for calculation
  const { potentialProfit, isProfitable, roi } = useArbitrageCalculator({
    loanAmount,
    // use on-chain prices or fallback to zero
    buyPrice: arbPath ? dexPrices![arbPath.buy].toString() : '0',
    sellPrice: arbPath ? dexPrices![arbPath.sell].toString() : '0',
    tradingFees: tradingFeesValue,
    slippage,
    gasCost: estimatedFee,
    profitThreshold,
    flashLoanBps,
  });

  // Fetch on-chain prices once
  useEffect(() => {
    const loadPrices = async () => {
      const provider = getEthersV5Provider();
      if (!provider) {
        console.error('MetaMask provider not available, please connect your wallet');
        return;
      }
      try {
        const allPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
        const pairPrices = allPrices[PAIRS[0].name];
        setDexPrices(pairPrices);
      } catch (err) {
        console.error('Failed to fetch dex prices', err);
      }
    };
    loadPrices();
  }, []);

  // Determine best arbitrage path when prices update
  useEffect(() => {
    if (!dexPrices) return;
    const path = findBestArbitragePath(dexPrices);
    setArbPath(path);
  }, [dexPrices]);
  
  // Determine default buy/sell exchanges when no arbitrary path exists
  const defaultBuyExchange = dexPrices
    ? Object.entries(dexPrices).reduce(
        (prev, [ex, price]) =>
          price < (dexPrices[prev] ?? Infinity) ? ex : prev,
        Object.keys(dexPrices)[0]
      )
    : null;
  const defaultSellExchange = dexPrices
    ? Object.entries(dexPrices).reduce(
        (prev, [ex, price]) =>
          price > (dexPrices[prev] ?? -Infinity) ? ex : prev,
        Object.keys(dexPrices)[0]
      )
    : null;
  const displayBuyExchange = arbPath?.buy || defaultBuyExchange;
  const displaySellExchange = arbPath?.sell || defaultSellExchange;

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
      
      {arbPath && (
        <div className="text-[9px] text-white/70 mb-2">
          Path: Buy on {arbPath.buy}, Sell on {arbPath.sell}
        </div>
      )}
      
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
            {/* Net Profit */}
            <div className="mb-1 text-center">
              <div className="text-[10px] opacity-80">Potential Profit</div>
              <div className="text-sm font-bold">
                {potentialProfit === null ? '-' : formatCurrencyAmount(potentialProfit, 'USD', 2)}
              </div>
              {roi !== null && (
                <div className="text-[10px] opacity-80">ROI: {roi.toFixed(2)}%</div>
              )}
            </div>

            {/* Profit Breakdown */}
            {dexPrices && potentialProfit !== null && (
              <div className="text-[9px] grid grid-cols-2 gap-x-1 border-t border-white/10 pt-1 opacity-80">
                <div>Buy Price ({displayBuyExchange}):</div>
                <div className="text-right">
                  {displayBuyExchange
                    ? formatCurrencyAmount(
                        dexPrices[displayBuyExchange],
                        'USD',
                        6
                      )
                    : '-'}
                </div>

                <div>Sell Price ({displaySellExchange}):</div>
                <div className="text-right">
                  {displaySellExchange
                    ? formatCurrencyAmount(
                        dexPrices[displaySellExchange],
                        'USD',
                        6
                      )
                    : '-'}
                </div>

                <div>Flash Loan Fee:</div>
                <div className="text-right">
                  {parseFloat(loanAmount) > 0
                    ? formatTokenAmount(
                        (parseFloat(loanAmount) * flashLoanBps) / 10000,
                        selectedToken.decimals,
                        selectedToken.symbol,
                        false
                      )
                    : '-'}
                </div>

                <div>Est. Gas:</div>
                <div className="text-right">
                  {estimatedFeeUSDC
                    ? formatCurrencyAmount(
                        parseFloat(estimatedFeeUSDC),
                        'USD',
                        2
                      )
                    : '-'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}