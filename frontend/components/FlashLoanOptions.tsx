"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { formatTokenAmount } from "@/lib/web3/utils";
import { ethers } from "ethers";
import { fetchAaveFlashLoanLimits, executeAaveFlashLoan } from "@/lib/web3/aave";
import { TokenInfo, FlashLoanLimitsResponse } from "@/types/aave";
import { TOKENS } from "@/lib/constants/tokens";
// import ContractOwnerStatus from "./ContractOwnerStatus";

export default function FlashLoanOptions() {
  const { web3, isConnected, isCorrectNetwork } = useWeb3();
  
  // State variables
  const [amounts, setAmounts] = useState<FlashLoanLimitsResponse>({});
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(TOKENS[0]);
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTokenData, setLoadingTokenData] = useState<boolean>(true);
  
  /**
   * Fetches flash loan limits from Aave for the available tokens
   */
  const getFlashLoanLimits = async () => {
    if (!isConnected || !isCorrectNetwork || !web3) {
      setLoadingTokenData(false);
      return;
    }
    
    setLoadingTokenData(true);
    
    try {
      // Use the service function to fetch flash loan limits
      const tokenAvailability = await fetchAaveFlashLoanLimits(web3, TOKENS);
      setAmounts(tokenAvailability);
    } catch (error) {
      console.error("Error fetching flash loan limits:", error);
      
      // Fallback to some default values if the API call fails
      const fallbackAmounts = {
        [TOKENS[0].address]: "100000000", // 100 USDC (with 6 decimals)
        [TOKENS[1].address]: "10000000000000000000", // 10 WETH (with 18 decimals)
      };
      
      setAmounts(fallbackAmounts);
    } finally {
      setLoadingTokenData(false);
    }
  };
  
  /**
   * Executes a flash loan with the selected token and amount
   */
  const handleFlashLoan = async () => {
    if (!isConnected || !isCorrectNetwork || !loanAmount) return;
    
    try {
      setIsLoading(true);
      
      // Convert user-friendly amount to token units
      const amountInWei = ethers.parseUnits(loanAmount, selectedToken.decimals).toString();
      
      // Call the service function to execute the flash loan
      const success = await executeAaveFlashLoan(selectedToken.address, amountInWei);
      
      if (success) {
        alert(`Flash loan for ${loanAmount} ${selectedToken.symbol} requested! Check your wallet for transaction confirmation.`);
        setLoanAmount("");
      } else {
        alert("Flash loan execution failed. Please check console for details.");
      }
    } catch (error) {
      console.error("Error executing flash loan:", error);
      let errorMessage = "Failed to execute flash loan.";
      
      if (error instanceof Error) {
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected in your wallet.";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas fees.";
        } else {
          errorMessage += " " + error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Effect to fetch flash loan limits when connection or network changes
   */
  useEffect(() => {
    getFlashLoanLimits();
  }, [isConnected, isCorrectNetwork, web3]);
  
  /**
   * Formats the maximum available amount for display
   */
  const formatMaxAmount = (address: string): string => {
    const amount = amounts[address] || "0";
    const token = TOKENS.find(t => t.address === address);
    
    if (!token) return "0";
    
    return formatTokenAmount(
      ethers.formatUnits(amount, token.decimals),
      token.symbol === "USDC" ? 2 : 4
    );
  };
  
  /**
   * Sets the input field to the maximum available amount
   */
  const setMaxAmount = (): void => {
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
      
      {/* Contract Owner Status */}
      {/* <div className="mb-6">
        <ContractOwnerStatus />
      </div> */}
      
      {/* Testnet Notice Banner */}
      <div className="mb-6 p-3 bg-amber-600/20 border border-amber-600/30 rounded-xl text-amber-300 text-sm">
        <div className="flex items-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Testnet Information</span>
        </div>
        <p>This is a demonstration of flash loan arbitrage on the Sepolia testnet.</p>
        <p className="mt-1">Note: You must be the owner of the deployed FlashLoan contract to execute flash loans.</p>
        <p className="mt-1">You also need to ensure routers are approved in the contract before executing.</p>
      </div>
      
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
                aria-label={`Select ${token.symbol}`}
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
            <label htmlFor="loan-amount" className="text-white/70 text-sm">Amount</label>
            <button
              onClick={setMaxAmount}
              className="text-cyan-400 text-xs hover:underline"
              disabled={loadingTokenData}
              aria-label="Set maximum amount"
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <input
              id="loan-amount"
              type="text"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              aria-label={`Enter ${selectedToken.symbol} amount`}
            />
            <div className="absolute top-1/2 transform -translate-y-1/2 right-3 text-white font-medium">
              {selectedToken.symbol}
            </div>
          </div>
        </div>
        
        {/* Execute Button */}
        <button
          onClick={handleFlashLoan}
          disabled={!isConnected || !isCorrectNetwork || !loanAmount || isLoading || loadingTokenData}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
            !isConnected || !isCorrectNetwork || !loanAmount || isLoading || loadingTokenData
              ? "bg-gray-600 text-white/50 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer"
          }`}
          aria-label="Execute flash loan"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            "Execute Flash Loan"
          )}
        </button>
        
        {/* Status Messages */}
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