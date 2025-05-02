"use client";

import { useState } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { ethers } from "ethers";
import { executeAaveFlashLoan } from "@/lib/web3/aave";
import { useFlashLoanData } from "@/lib/web3/hooks/useFlashLoanData";
import { formatMaxAmount, getStatusStyle } from "../lib/utils/flashLoanUtils";
import { formatTokenAmount, formatCurrencyAmount } from "@/lib/web3/utils";
import { TokenInfo } from "@/types/aave";
import { TOKENS } from "@/lib/constants/tokens";

/**
 * FlashLoanOptions component provides the interface for executing flash loans.
 * It manages state for reserves, selected token, loan amount, and error handling.
 */
export default function FlashLoanOptions() {
  const { web3, isConnected, isCorrectNetwork, account } = useWeb3();

  // Unified hook for reserves and fee data
  const {
    reserves,
    flashLoanFees,
    loadingReserves,
    loadingFees,
    errorReserves,
    errorFees,
    reload,
  } = useFlashLoanData();
  
  // Selected token state
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(TOKENS[0]);
  // Reserve information for the selected token
  const reserve = reserves[selectedToken.address];

  // State variables
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executes a flash loan with the selected token and amount.
   */
  const handleFlashLoan = async () => {
    if (!isConnected || !isCorrectNetwork || !loanAmount || !web3 || !account) return;

    const selectedReserve = reserves[selectedToken.address];

    if (!selectedReserve || !selectedReserve.flashLoanEnabled) {
      setError(`${selectedToken.symbol} is not available for flash loans at this time`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!window.flashLoanContract) {
        alert("Flash Loan contract is not deployed on this network. This is a demo mode that only shows flash loan limits without the ability to execute loans.");
        setIsLoading(false);
        return;
      }

      const amountInWei = ethers.utils.parseUnits(loanAmount, selectedToken.decimals);
      const availableLiquidityBN = ethers.utils.parseUnits(selectedReserve.availableLiquidity, selectedToken.decimals);

      if (amountInWei.gt(availableLiquidityBN)) {
        // Use formatMaxAmount to display available liquidity with USD value
        const availableDisplay = formatMaxAmount(selectedReserve, selectedToken);
        setError(`Requested amount exceeds available liquidity (${availableDisplay})`);
        setIsLoading(false);
        return;
      }

      const success = await executeAaveFlashLoan(web3, selectedToken, amountInWei.toString());

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
        } else if (error.message.includes("contract not loaded")) {
          errorMessage = "Flash Loan contract is not deployed on this network. This is a demo mode that only shows flash loan limits.";
        } else {
          errorMessage += " " + error.message;
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        const errMsg = (error as { message: string }).message;
        if (errMsg.includes("user rejected")) {
          errorMessage = "Transaction was rejected in your wallet.";
        } else if (errMsg.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas fees.";
        } else {
          errorMessage += " " + errMsg;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-medium text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 4.03491C8.69974 3.1966 10.4768 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 10.5563 3.30253 9.13228 3.87868 7.87868" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Flash Loan Options
      </h2>
      
      {/* Aave Flash Loan Status Information */}
      {Object.values(reserves).some(reserve =>
        !reserve ||
        reserve.isActive === false ||
        !reserve.flashLoanEnabled ||
        reserve.isFrozen ||
        reserve.isPaused
      ) && (
        <div className="mb-5 p-4 bg-blue-600/20 border border-blue-600/30 rounded-xl text-blue-300 text-sm">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Aave Flash Loan Availability</span>
          </div>
          <p className="ml-7">Some tokens may show as "UNAVAILABLE" for flash loans. This means:</p>
          <ul className="list-disc list-inside mt-1 space-y-1 ml-7 text-blue-200">
            <li>The token may not be supported by Aave V3 on Ethereum Mainnet</li>
            <li>Flash loans might be disabled for that specific token</li>
            <li>The reserves could be paused or frozen by Aave governance</li>
            <li>The reserve might not be active</li>
          </ul>
          <p className="mt-2 ml-7">
            Please check the <a href="https://app.aave.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-100 hover:text-white transition-colors">Aave app</a> for the latest reserve status.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {/* Token Selection */}
        <div>
          <label className="block text-white/70 text-sm mb-3 flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2"></div>
            Select Token
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TOKENS.map((token) => {
              const tokenReserve = reserves[token.address];
              const isActiveAndEnabled = tokenReserve?.isActive && tokenReserve?.flashLoanEnabled;

              return (
                <button
                  key={token.address}
                  onClick={() => setSelectedToken(token)}
                  className={`flex items-center p-3 rounded-xl border transition-all group ${
                    selectedToken.address === token.address
                      ? "bg-gradient-to-r from-white/10 to-white/5 border-white/20 shadow-lg"
                      : `${token.color} border-white/10 hover:border-white/30 hover:shadow-lg`
                  }`}
                  aria-label={`Select ${token.symbol}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${token.color} group-hover:scale-110 transition-transform`}>
                    {token.icon}
                  </div>
                  <div className="ml-3 text-left flex-1">
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-xs text-white/60 flex justify-between items-center">
                      {loadingReserves ? (
                        <span className="inline-block w-16 bg-white/10 animate-pulse rounded h-3"></span>
                      ) : (
                        <span>Max: {formatMaxAmount(tokenReserve, token)}</span>
                      )}

                      {tokenReserve && !loadingReserves && (
                        <span className={`text-xs px-1.5 py-0.5 ml-2 rounded ${getStatusStyle(tokenReserve)}`}>
                          {isActiveAndEnabled ? "Active" : tokenReserve.isFrozen ? "FROZEN" :
                           tokenReserve.isPaused ? "PAUSED" : "UNAVAILABLE"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div className="pt-1">
          <div className="flex justify-between mb-2">
            <label htmlFor="loan-amount" className="block text-white/70 text-sm flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></div>
              Loan Amount
            </label>
            <button
              onClick={() => {
                if (reserve && reserve.flashLoanEnabled) {
                  // Set amount to max available liquidity
                  setLoanAmount(reserve.availableLiquidity);
                }
              }}
              className={`text-xs px-2 py-0.5 rounded ${
                loadingReserves || !reserve?.flashLoanEnabled 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer'
              }`}
              disabled={loadingReserves || !reserve?.flashLoanEnabled}
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
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              aria-label={`Enter ${selectedToken.symbol} amount`}
            />
            <div className="absolute top-1/2 transform -translate-y-1/2 right-3 text-white/70 font-medium">
              {selectedToken.symbol}
            </div>
          </div>
          {reserve && !loadingReserves && (
            <p className="text-white/50 text-xs mt-1.5 flex items-center">
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 17V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 8V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Available: {formatMaxAmount(reserve, selectedToken)}
            </p>
          )}
        </div>

        {/* Error Message */}
        {(error || errorReserves || errorFees) && (
          <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-xl text-red-300 text-sm">
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 17V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 13V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {error || errorReserves || errorFees}
              </span>
              <button
                onClick={reload}
                className="ml-2 flex-shrink-0 bg-white/5 hover:bg-white/10 text-cyan-300 rounded-full p-1 transition-colors"
                disabled={loadingReserves || loadingFees}
                aria-label="Refresh data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Data Loading Indicator */}
        {(loadingReserves || loadingFees) && (
          <div className="flex items-center justify-center py-3 text-cyan-300 text-sm bg-white/5 rounded-xl border border-white/10">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Aave liquidity data...
          </div>
        )}

        {/* Selected Token Additional Info */}
        {reserve && !loadingReserves && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm">
            <h3 className="text-white/80 font-medium mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Reserve Information
            </h3>
            <div className="grid grid-cols-1 gap-2 text-white/60">
              <div className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                <span className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2"></div>
                  Available Liquidity:
                </span>
                <span className="text-white/90 font-medium">
                  {formatMaxAmount(reserve, selectedToken)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                <span className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></div>
                  Reserve Status:
                </span>
                <span className={`${getStatusStyle(reserve)} px-2 py-0.5 rounded text-xs`}>
                  {reserve.isActive ? "ACTIVE" :
                  reserve.isFrozen ? "FROZEN" :
                  reserve.isPaused ? "PAUSED" : "INACTIVE"}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                <span className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></div>
                  Flash Loans:
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${reserve.flashLoanEnabled ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  {reserve.flashLoanEnabled ? "ENABLED" : "DISABLED"}
                </span>
              </div>
            </div>
          </div>
        )}

        {reserve && !loadingReserves && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm">
            {/* Flash Loan Premium Fees */}
            <h4 className="text-white/80 font-medium mb-2 mt-4 flex items-center">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13.5 8C13.5 8.82843 12.8284 9.5 12 9.5C11.1716 9.5 10.5 8.82843 10.5 8C10.5 7.17157 11.1716 6.5 12 6.5C12.8284 6.5 13.5 7.17157 13.5 8Z" fill="currentColor" />
                <path d="M12 17V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Aave Flash Loan Fees
            </h4>
            <p className="text-white/50 text-xs mb-3">The following fees are charged by Aave for all flash loans. Protocol Treasury and Liquidity Providers fees are components of the Total Fee, not additional charges.</p>
            <div className="space-y-1 text-white/60">
              <div className="flex justify-between items-center pb-1 border-b border-white/10">
                <span className="font-medium">Total Fee:</span>
                {loadingFees ? (
                  <span className="inline-block w-8 h-3 bg-white/10 animate-pulse rounded"></span>
                ) : (
                  <span className="font-medium text-white">{`${flashLoanFees?.total}%`}</span>
                )}
              </div>
              <div className="pl-3 mt-1 pt-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2"></div>
                    <span>Protocol Treasury:</span>
                  </div>
                  {loadingFees ? (
                    <span className="inline-block w-8 h-3 bg-white/10 animate-pulse rounded"></span>
                  ) : (
                    <span className="text-white">{`${flashLoanFees?.protocol}%`}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></div>
                    <span>Liquidity Providers:</span>
                  </div>
                  {loadingFees ? (
                    <span className="inline-block w-8 h-3 bg-white/10 animate-pulse rounded"></span>
                  ) : (
                    <span className="text-white">{`${flashLoanFees?.liquidityProviders}%`}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleFlashLoan}
          disabled={
            !isConnected ||
            !isCorrectNetwork ||
            !loanAmount ||
            isLoading ||
            loadingReserves ||
            error !== null ||
            !reserve?.flashLoanEnabled
          }
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 relative overflow-hidden group ${
            !isConnected ||
            !isCorrectNetwork ||
            !loanAmount ||
            isLoading ||
            loadingReserves ||
            error !== null ||
            !reserve?.flashLoanEnabled
              ? "bg-gray-600/50 text-white/50 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white cursor-pointer shadow-lg"
          }`}
          aria-label="Execute flash loan"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
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
          <p className="text-amber-400 text-sm text-center mt-2 flex items-center justify-center">
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 16V16.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Please connect your wallet first
          </p>
        )}

        {isConnected && !isCorrectNetwork && (
          <p className="text-amber-400 text-sm text-center mt-2 flex items-center justify-center">
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 16V16.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Please switch to Ethereum Mainnet
          </p>
        )}
      </div>
    </div>
  );
} 