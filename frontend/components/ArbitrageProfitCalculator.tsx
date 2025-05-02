"use client";

import { useState, useEffect } from 'react';
import { formatCurrencyAmount } from '@/lib/web3/utils';
import { TokenInfo } from '@/types/aave';

interface ArbitrageProfitCalculatorProps {
  loanAmount: string;
  selectedToken: TokenInfo;
  flashLoanPremium: number; // in percentage
}

export default function ArbitrageProfitCalculator({ 
  loanAmount, 
  selectedToken, 
  flashLoanPremium 
}: ArbitrageProfitCalculatorProps) {
  // Keep only user decision inputs
  const [slippage, setSlippage] = useState<string>('0.5'); // Default 0.5%
  const [profitThreshold, setProfitThreshold] = useState<string>('10'); // Default $10

  // Auto-filled values (would be replaced by API data)
  const [buyPrice, setBuyPrice] = useState<string>('1000'); // Default example value
  const [sellPrice, setSellPrice] = useState<string>('1020'); // Default example value
  const [tradingFees, setTradingFees] = useState<string>('0.3'); // Default 0.3%
  const [gasCost, setGasCost] = useState<string>('50'); // Default $50 worth of ETH
  
  // Calculated values
  const [potentialProfit, setPotentialProfit] = useState<number | null>(null);
  const [isProfitable, setIsProfitable] = useState<boolean>(false);
  const [roi, setRoi] = useState<number | null>(null);
  
  // Calculate profit when inputs change
  useEffect(() => {
    if (!loanAmount) {
      setPotentialProfit(null);
      setIsProfitable(false);
      setRoi(null);
      return;
    }
    
    try {
      // Parse all inputs to numbers
      const amount = parseFloat(loanAmount);
      const buy = parseFloat(buyPrice);
      const sell = parseFloat(sellPrice);
      const fees = parseFloat(tradingFees) / 100;
      const slip = parseFloat(slippage) / 100;
      const gas = parseFloat(gasCost);
      const threshold = parseFloat(profitThreshold);
      const flashLoanFee = amount * (flashLoanPremium / 100);
      
      // Validate inputs to avoid division by zero and negative values
      if (amount <= 0 || buy <= 0 || sell <= 0 || fees < 0 || slip < 0 || gas < 0 || threshold < 0) {
        setPotentialProfit(null);
        setIsProfitable(false);
        setRoi(null);
        return;
      }
      
      // Calculate token amounts (simplified model)
      const tokensBought = amount / buy * (1 - slip);
      const sellValue = tokensBought * sell * (1 - fees);
      
      // Calculate profit
      const grossProfit = sellValue - amount;
      const netProfit = grossProfit - flashLoanFee - gas;
      
      // Calculate ROI percentage
      const totalCost = amount + flashLoanFee + gas;
      const roiPercentage = (netProfit / totalCost) * 100;
      
      setPotentialProfit(netProfit);
      setIsProfitable(netProfit >= threshold);
      setRoi(roiPercentage);
    } catch (error) {
      console.error("Error calculating profit:", error);
      setPotentialProfit(null);
      setIsProfitable(false);
      setRoi(null);
    }
  }, [loanAmount, buyPrice, sellPrice, tradingFees, slippage, gasCost, profitThreshold, flashLoanPremium]);
  
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
            {potentialProfit !== null && (
              <div className="text-[9px] grid grid-cols-2 gap-x-1 border-t border-white/10 pt-1 opacity-80">
                <div>Buy Price:</div>
                <div className="text-right">{formatCurrencyAmount(parseFloat(buyPrice), 'USD', 2)}</div>
                
                <div>Sell Price:</div>
                <div className="text-right">{formatCurrencyAmount(parseFloat(sellPrice), 'USD', 2)}</div>
                
                <div>Flash Loan Fee:</div>
                <div className="text-right">{formatCurrencyAmount(parseFloat(loanAmount) * flashLoanPremium / 100, 'USD', 2)}</div>
                
                <div>Est. Gas:</div>
                <div className="text-right">{formatCurrencyAmount(parseFloat(gasCost), 'USD', 2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 