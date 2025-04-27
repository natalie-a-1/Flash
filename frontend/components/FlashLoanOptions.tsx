"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { formatTokenAmount } from "@/lib/web3/utils";
import { ethers } from "ethers";
import { SEPOLIA_ADDRESSES } from "@/lib/web3/config";

// Tokens and their icons
const TOKENS = [
  {
    symbol: "USDC",
    address: SEPOLIA_ADDRESSES.USDC,
    icon: "💲",
    color: "bg-blue-500",
    decimals: 6
  },
  {
    symbol: "WETH",
    address: SEPOLIA_ADDRESSES.WETH,
    icon: "Ξ",
    color: "bg-purple-500",
    decimals: 18
  }
];

export default function FlashLoanOptions() {
  const { web3, isConnected, isCorrectNetwork } = useWeb3();
  
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [loanAmount, setLoanAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTokenData, setLoadingTokenData] = useState(true);
  
  // Mock function to get flash loan maximum amounts
  // In a real application, these would be fetched from the protocol
  const fetchFlashLoanLimits = async () => {
    setLoadingTokenData(true);
    
    try {
      // Mock data - in a real app you would query the actual Aave contracts
      const mockAmounts = {
        [TOKENS[0].address]: "500000000", // 500 USDC (with 6 decimals)
        [TOKENS[1].address]: "50000000000000000000", // 50 WETH (with 18 decimals)
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAmounts(mockAmounts);
    } catch (error) {
      console.error("Error fetching flash loan limits:", error);
    } finally {
      setLoadingTokenData(false);
    }
  };
  
  // Execute flash loan (would connect to the contract in a real implementation)
  const executeFlashLoan = async () => {
    if (!isConnected || !isCorrectNetwork || !loanAmount) return;
    
    try {
      setIsLoading(true);
      
      // This would actually call the contract in a real implementation
      console.log(`Executing flash loan for ${loanAmount} ${selectedToken.symbol}`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Flash loan for ${loanAmount} ${selectedToken.symbol} requested!`);
      setLoanAmount("");
    } catch (error) {
      console.error("Error executing flash loan:", error);
      alert("Failed to execute flash loan. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchFlashLoanLimits();
    }
  }, [isConnected, isCorrectNetwork]);
  
  // Format the maximum amount for display
  const formatMaxAmount = (address: string) => {
    const amount = amounts[address] || "0";
    const token = TOKENS.find(t => t.address === address);
    
    if (!token) return "0";
    
    return formatTokenAmount(
      ethers.formatUnits(amount, token.decimals),
      token.symbol === "USDC" ? 2 : 4
    );
  };
  
  // Set the maximum amount for the selected token
  const setMaxAmount = () => {
    if (!amounts[selectedToken.address]) return;
    
    const maxAmount = ethers.formatUnits(
      amounts[selectedToken.address],
      selectedToken.decimals
    );
    
    setLoanAmount(maxAmount);
  };
  
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-medium text-white mb-4">Flash Loan Options</h2>
      
      <div className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-white/70 text-sm mb-2">Select Token</label>
          <div className="grid grid-cols-2 gap-3">
            {TOKENS.map((token) => (
              <button
                key={token.address}
                onClick={() => setSelectedToken(token)}
                className={`flex items-center p-3 rounded-xl border transition-all ${
                  selectedToken.address === token.address
                    ? `${token.color} border-white/30 shadow-lg`
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${token.color}`}>
                  {token.icon}
                </div>
                <div className="ml-3 text-left">
                  <div className="text-white font-medium">{token.symbol}</div>
                  <div className="text-xs text-white/60">
                    {loadingTokenData ? (
                      <span className="inline-block w-16 bg-white/10 animate-pulse rounded h-3"></span>
                    ) : (
                      `Max: ${formatMaxAmount(token.address)}`
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Amount Input */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-white/70 text-sm">Amount</label>
            <button
              onClick={setMaxAmount}
              className="text-cyan-400 text-xs hover:underline"
              disabled={loadingTokenData}
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <div className="absolute top-1/2 transform -translate-y-1/2 right-3 text-white font-medium">
              {selectedToken.symbol}
            </div>
          </div>
        </div>
        
        {/* Execute Button */}
        <button
          onClick={executeFlashLoan}
          disabled={!isConnected || !isCorrectNetwork || !loanAmount || isLoading || loadingTokenData}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
            !isConnected || !isCorrectNetwork || !loanAmount || isLoading || loadingTokenData
              ? "bg-gray-600 text-white/50 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            "Execute Flash Loan"
          )}
        </button>
        
        {!isConnected && (
          <p className="text-amber-400 text-xs text-center">Please connect your wallet first</p>
        )}
        
        {isConnected && !isCorrectNetwork && (
          <p className="text-amber-400 text-xs text-center">Please switch to Sepolia network</p>
        )}
      </div>
    </div>
  );
} 