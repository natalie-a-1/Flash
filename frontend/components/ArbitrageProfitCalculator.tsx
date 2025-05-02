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
  // State for input values
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [tradingFees, setTradingFees] = useState<string>('0.3'); // Default 0.3%
  const [slippage, setSlippage] = useState<string>('0.5'); // Default 0.5%
  const [gasCost, setGasCost] = useState<string>('50'); // Default $50 worth of ETH
  const [profitThreshold, setProfitThreshold] = useState<string>('10'); // Default $10
  
  // Calculated values
  const [potentialProfit, setPotentialProfit] = useState<number | null>(null);
  const [isProfitable, setIsProfitable] = useState<boolean>(false);
  const [roi, setRoi] = useState<number | null>(null);
  
  // Calculate profit when inputs change
  useEffect(() => {
    if (!loanAmount || !buyPrice || !sellPrice) {
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
    <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs space-y-2">
      <h3 className="text-sm font-medium text-white mb-1 flex items-center">
        <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Arbitrage Calculator
      </h3>
      
      <div className="p-1.5 bg-blue-900/20 border border-blue-600/30 rounded-lg text-blue-300 text-[10px]">
        Arbitrage trading takes advantage of price differences for the same asset across exchanges.
      </div>
      
      {/* Exchange Prices and Costs - 2 column layout */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left Column */}
        <div className="space-y-1.5">
          {/* Buy Price */}
          <div>
            <label className="block text-white/70 text-[10px] mb-0.5 flex items-center">
              <div className="w-1 h-1 rounded-full bg-green-400 mr-1"></div>
              Buy Price (Exchange 1)
            </label>
            <div className="relative">
              <input
                type="text"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.0"
                className="w-full p-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-white/70 text-[10px]">
                USD
              </div>
            </div>
          </div>
          
          {/* Trading Fees */}
          <div>
            <label className="block text-white/70 text-[10px] mb-0.5 flex items-center">
              <div className="w-1 h-1 rounded-full bg-amber-400 mr-1"></div>
              Trading Fees
            </label>
            <div className="relative">
              <input
                type="text"
                value={tradingFees}
                onChange={(e) => setTradingFees(e.target.value)}
                placeholder="0.3"
                className="w-full p-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-white/70 text-[10px]">
                %
              </div>
            </div>
          </div>
          
          {/* Gas Cost */}
          <div>
            <label className="block text-white/70 text-[10px] mb-0.5 flex items-center">
              <div className="w-1 h-1 rounded-full bg-red-400 mr-1"></div>
              Gas Cost
            </label>
            <div className="relative">
              <input
                type="text"
                value={gasCost}
                onChange={(e) => setGasCost(e.target.value)}
                placeholder="50"
                className="w-full p-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-white/70 text-[10px]">
                USD
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-1.5">
          {/* Sell Price */}
          <div>
            <label className="block text-white/70 text-[10px] mb-0.5 flex items-center">
              <div className="w-1 h-1 rounded-full bg-blue-400 mr-1"></div>
              Sell Price (Exchange 2)
            </label>
            <div className="relative">
              <input
                type="text"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.0"
                className="w-full p-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-white/70 text-[10px]">
                USD
              </div>
            </div>
          </div>
          
          {/* Slippage */}
          <div>
            <label className="block text-white/70 text-[10px] mb-0.5 flex items-center">
              <div className="w-1 h-1 rounded-full bg-purple-400 mr-1"></div>
              Slippage
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
            <label className="block text-white/70 text-[10px] mb-0.5 flex items-center">
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
      </div>
      
      {/* Flash Loan Fee and Profit Results */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Flash Loan Fee Display */}
        <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg">
          <div className="text-white/70 text-[10px] font-medium mb-1">Flash Loan Fee ({flashLoanPremium}%):</div>
          {loanAmount && (
            <div className="text-white text-[11px] font-medium">
              {formatCurrencyAmount((parseFloat(loanAmount) * flashLoanPremium / 100), 'USD', 2)}
            </div>
          )}
        </div>
        
        {/* Results */}
        <div className={`p-1.5 border rounded-lg ${
          potentialProfit === null 
            ? 'bg-white/5 border-white/10 text-white/50' 
            : isProfitable 
              ? 'bg-green-900/20 border-green-600/30 text-green-300' 
              : 'bg-red-900/20 border-red-600/30 text-red-300'
        }`}>
          <div className="text-[10px] font-medium mb-0.5">Potential Profit:</div>
          
          {potentialProfit === null ? (
            <div className="text-[11px]">Enter values</div>
          ) : (
            <>
              <div className="text-sm font-bold">
                {formatCurrencyAmount(potentialProfit, 'USD', 2)}
              </div>
              {roi !== null && (
                <div className="text-[10px]">
                  ROI: {roi.toFixed(2)}%
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Profit Breakdown - Only show when we have a calculated profit */}
      {potentialProfit !== null && (
        <div className="text-[10px] grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-white/10 pt-1">
          <div className="text-white/70">Gross Profit:</div>
          <div className="text-right">{loanAmount && buyPrice && sellPrice ? 
            formatCurrencyAmount(
              (parseFloat(loanAmount) / parseFloat(buyPrice) * (1 - parseFloat(slippage)/100) * 
              parseFloat(sellPrice) * (1 - parseFloat(tradingFees)/100)) - parseFloat(loanAmount), 
              'USD', 2
            ) : '0.00 USD'}</div>
          
          <div className="text-white/70">Flash Loan Fee:</div>
          <div className="text-right">-{loanAmount ? 
            formatCurrencyAmount(parseFloat(loanAmount) * flashLoanPremium / 100, 'USD', 2) : '0.00 USD'}</div>
          
          <div className="text-white/70">Gas Cost:</div>
          <div className="text-right">-{formatCurrencyAmount(parseFloat(gasCost), 'USD', 2)}</div>
          
          <div className="text-white/70 font-medium">Net Profit:</div>
          <div className="text-right font-medium">{formatCurrencyAmount(potentialProfit, 'USD', 2)}</div>
        </div>
      )}
    </div>
  );
} 