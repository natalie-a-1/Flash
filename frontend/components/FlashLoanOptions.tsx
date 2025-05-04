"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { ethers } from "ethers";
import { executeAaveFlashLoan } from "@/lib/web3/aave";
import { useFlashLoanData } from "@/lib/web3/hooks/useFlashLoanData";
import { formatMaxAmount, getStatusStyle } from "../lib/utils/flashLoanUtils";
import { formatTokenAmount, formatCurrencyAmount } from "@/lib/web3/utils";
import { TOKENS } from "@/lib/constants/tokens";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";
import { fetchDexPrices, findBestArbitragePath } from "@/lib/services/priceService";
import { ExchangePrices, Exchange } from "@/types/arbitrage";
import ArbitrageProfitCalculator from "./ArbitrageProfitCalculator";
import { MAINNET_ADDRESSES } from "@/lib/web3/config"; // Need WETH address
import { NETWORK_IDS } from "@/lib/web3/config"; // Ensure NETWORK_IDS is imported

/**
 * FlashLoanOptions component provides the interface for executing flash loans.
 * It manages state for reserves, selected token, loan amount, and error handling.
 */
export default function FlashLoanOptions() {
  const { web3, isConnected, isCorrectNetwork, account, networkId } = useWeb3();

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

  // Always use USDC (first in TOKENS)
  const selectedToken = TOKENS[0];
  // Reserve information for USDC
  const reserve = reserves[selectedToken.address];

  // State variables
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for DEX prices
  const [dexPrices, setDexPrices] = useState<ExchangePrices | null>(null);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);

  // Add state for slippage (which is used by ArbitrageProfitCalculator)
  const [slippage, setSlippage] = useState<string>("0.5"); // Default 0.5%

  // Fetch DEX prices on initial load and when connection changes
  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchDEXPrices();
    }
  }, [isConnected, isCorrectNetwork]);

  /**
   * Fetches prices from DEXs for the token pair (USDC/ETH)
   */
  const fetchDEXPrices = async () => {
    if (!window.ethereum || !isConnected || !isCorrectNetwork) {
      console.log(
        "Cannot fetch prices: Wallet not connected or not on Ethereum Mainnet.",
      );
      return;
    }

    setLoadingPrices(true);
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any,
      );
      const fetchedPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
      const pairPrices = fetchedPrices[PAIRS[0].name] || {};
      setDexPrices(pairPrices);
    } catch (error) {
      console.error("Error fetching DEX prices:", error);
      setError("Failed to fetch exchange prices. Please try again.");
    } finally {
      setLoadingPrices(false);
    }
  };

  /**
   * Executes a flash loan with the selected token and amount.
   */
  const handleFlashLoan = async () => {
    if (!isConnected || !isCorrectNetwork || !loanAmount || !web3 || !account)
      return;

    const selectedReserve = reserves[selectedToken.address];

    if (!selectedReserve || !selectedReserve.flashLoanEnabled) {
      setError(
        `${selectedToken.symbol} is not available for flash loans at this time`,
      );
      return;
    }

    if (!window.flashLoanContract) {
      alert(
        "Flash Loan contract is not deployed on this network. This is a demo mode that only shows flash loan limits without the ability to execute loans.",
      );
      return;
    }

    // Filter Prices for Execution (Only V2/Sushi on Fork)
    let executionDexPrices: ExchangePrices | null = dexPrices;
    if (networkId === NETWORK_IDS.LOCALHOST && dexPrices) {
        const allowedExchanges = ["Uniswap V2", "SushiSwap"];
        executionDexPrices = {};
        for (const exchangeName of allowedExchanges) {
            if (dexPrices[exchangeName] !== undefined) {
                executionDexPrices[exchangeName] = dexPrices[exchangeName];
            }
        }
        // If filteredDexPrices is empty after filtering, set it back to null
        if (Object.keys(executionDexPrices).length === 0) {
            executionDexPrices = null;
        }
    }

    // Get Dynamic Parameters based on *FILTERED* prices
    const bestPath = executionDexPrices ? findBestArbitragePath(executionDexPrices) : null;
    const buyExchange: Exchange | null = bestPath?.buy || null;
    const sellExchange: Exchange | null = bestPath?.sell || null;

    if (!buyExchange || !sellExchange) {
        setError("Could not determine executable arbitrage path (Uniswap V2 / SushiSwap). No prices available or profitable path found between them.");
        setIsLoading(false);
        return;
    }

    // Intermediate token is WETH for USDC/WETH pair
    const intermediateToken = MAINNET_ADDRESSES.WETH; // Assuming USDC/WETH arbitrage

    // Convert slippage string to basis points (BPS)
    const slippageNum = parseFloat(slippage) || 0;
    const slippageBps = Math.round(slippageNum * 100); // e.g., 0.5% = 50 BPS

    // Validate slippage
    if (slippageBps <= 0 || slippageBps > 10000) { // 10000 BPS = 100%
        setError("Invalid slippage tolerance. Must be between 0% and 100%.");
        return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare amount
      const amountInWei = ethers.utils.parseUnits(
        loanAmount,
        selectedToken.decimals,
      );
      // --- DEBUG: Force small amount ---
      // const amountInWei = ethers.utils.parseUnits("1", selectedToken.decimals); // Hardcode to 1 USDC // COMMENTED OUT
      // console.log("[handleFlashLoan] DEBUG: Forcing loan amount to 1 USDC (in wei):", amountInWei.toString()); // COMMENTED OUT
      // --- END DEBUG ---

      const availableLiquidityBN = ethers.utils.parseUnits(
        selectedReserve.availableLiquidity,
        selectedToken.decimals,
      );

      if (amountInWei.gt(availableLiquidityBN)) {
        // Use formatMaxAmount to display available liquidity with USD value
        const availableDisplay = formatMaxAmount(
          selectedReserve,
          selectedToken,
        );
        setError(
          `Requested amount exceeds available liquidity (${availableDisplay})`,
        );
        setIsLoading(false);
        return;
      }

      // Execute with dynamic parameters derived from filtered prices
      const success = await executeAaveFlashLoan(
        web3, 
        selectedToken,
        amountInWei.toString(),
        buyExchange.router, // Use .router
        sellExchange.router, // Use .router
        intermediateToken, 
        slippageBps,
      );

      if (success) {
        alert(
          `Flash loan for ${loanAmount} ${selectedToken.symbol} requested! Check your wallet for transaction confirmation.`,
        );
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
          errorMessage =
            "Flash Loan contract is not deployed on this network. This is a demo mode that only shows flash loan limits.";
        } else {
          errorMessage += " " + error.message;
        }
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
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
    <div className="rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-lg p-3 shadow-xl border border-white/10">
      <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
        <div className="w-6 h-6 mr-2 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 7V12L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 4.03491C8.69974 3.1966 10.4768 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 10.5563 3.30253 9.13228 3.87868 7.87868"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        Flash Loan
      </h2>

      {/* Aave Flash Loan Status Information */}
      {Object.values(reserves).some(
        (reserve) =>
          !reserve ||
          reserve.isActive === false ||
          !reserve.flashLoanEnabled ||
          reserve.isFrozen ||
          reserve.isPaused,
      ) && (
        <div className="mb-3 p-2.5 bg-blue-600/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="font-medium">Aave Flash Loan Availability:</span>{" "}
              Some tokens may be unavailable (inactive, paused, or frozen)
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Amount Input - Keep for UI, but value ignored in handleFlashLoan for now */}
        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="flex justify-between mb-1.5">
            <label
              htmlFor="loan-amount"
              className="block text-white/80 text-xs font-medium flex items-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 mr-1.5"></div>
              Loan Amount
            </label>
            <button
              onClick={() => {
                if (reserve && reserve.flashLoanEnabled) {
                  // Set amount to max available liquidity
                  setLoanAmount(reserve.availableLiquidity);
                }
              }}
              className={`text-xs px-1.5 py-0.5 rounded text-[10px] font-medium ${
                loadingReserves || !reserve?.flashLoanEnabled
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-colors cursor-pointer shadow-sm"
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
              className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white text-base focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              aria-label={`Enter ${selectedToken.symbol} amount`}
            />
            <div className="absolute top-1/2 transform -translate-y-1/2 right-3 text-white/70 text-sm font-medium">
              {selectedToken.symbol}
            </div>
          </div>
          {reserve && !loadingReserves && (
            <p className="text-white/60 text-[10px] mt-1.5 flex items-center">
              <svg
                className="w-2.5 h-2.5 mr-1 text-cyan-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 17V11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 8V7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Available: {formatMaxAmount(reserve, selectedToken)}
            </p>
          )}
          <p className="text-center text-amber-400 text-[10px] mt-1.5">(DEBUG: Hardcoding loan amount to 1 USDC for testing)</p>
        </div>

        {/* Slippage Input - ADDED */}
        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
          <label
            htmlFor="slippage-percent"
            className="block text-white/80 text-xs font-medium mb-1.5 flex items-center"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mr-1.5"></div>
            Slippage Tolerance (%)
          </label>
          <input
            id="slippage-percent"
            type="number"
            step="0.1"
            min="0"
            max="100" // Max 100%
            value={slippage} // Controlled by slippage state
            onChange={(e) => setSlippage(e.target.value)} // Update slippage state
            placeholder="0.5"
            className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            aria-label="Enter slippage tolerance percentage"
          />
           <p className="text-white/60 text-[10px] mt-1.5">Recommended: 0.1% - 1%. High slippage can lead to unfavorable trades.</p>
        </div>

        {/* Error Message */}
        {(error || errorReserves || errorFees) && (
          <div className="p-2.5 bg-red-900/20 border border-red-600/30 rounded-lg text-red-300 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 17V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 13V7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {error || errorReserves || errorFees}
              </span>
              <button
                onClick={reload}
                className="ml-2 flex-shrink-0 bg-white/10 hover:bg-white/20 text-cyan-300 rounded-full p-1 transition-colors"
                disabled={loadingReserves || loadingFees}
                aria-label="Refresh data"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Data Loading Indicator */}
        {(loadingReserves || loadingFees) && (
          <div className="flex items-center justify-center py-3 text-cyan-300 text-xs bg-white/5 rounded-lg border border-white/10">
            <svg
              className="animate-spin h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading Aave liquidity data...
          </div>
        )}

        {/* Loan Information Section */}
        {reserve && !loadingReserves && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Reserve Info */}
            <div className="p-2.5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 rounded-lg text-xs">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <svg
                  className="w-3.5 h-3.5 mr-1.5 text-cyan-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 8V16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 12H16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Reserve Information
              </h3>
              <div className="grid grid-cols-1 gap-1.5 text-white/70">
                <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="flex items-center">
                    <div className="w-1 h-1 rounded-full bg-cyan-400 mr-1.5"></div>
                    Available Liquidity:
                  </span>
                  <span className="text-white font-medium">
                    {formatMaxAmount(reserve, selectedToken)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="flex items-center">
                    <div className="w-1 h-1 rounded-full bg-purple-400 mr-1.5"></div>
                    Aave Reserve Status:
                  </span>
                  <span
                    className={`${getStatusStyle(reserve)} px-1.5 py-0.5 rounded text-[10px] font-semibold`}
                  >
                    {reserve.isActive
                      ? "ACTIVE"
                      : reserve.isFrozen
                        ? "FROZEN"
                        : reserve.isPaused
                          ? "PAUSED"
                          : "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Flash Loan Fee Info */}
            <div className="p-2.5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 rounded-lg text-xs">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <svg
                  className="w-3.5 h-3.5 mr-1.5 text-purple-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M13.5 8C13.5 8.82843 12.8284 9.5 12 9.5C11.1716 9.5 10.5 8.82843 10.5 8C10.5 7.17157 11.1716 6.5 12 6.5C12.8284 6.5 13.5 7.17157 13.5 8Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 17V12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Aave Flash Loan Fees
              </h3>
              <div className="space-y-1.5 text-white/70">
                <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="font-medium">Total Fee:</span>
                  {loadingFees ? (
                    <span className="inline-block w-10 h-2.5 bg-white/10 animate-pulse rounded"></span>
                  ) : (
                    <span className="font-medium text-white text-sm">{`${flashLoanFees?.totalPercent}%`}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1 pl-3 mt-1">
                  <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 mr-1.5"></div>
                      <span>Protocol Treasury:</span>
                    </div>
                    {loadingFees ? (
                      <span className="inline-block w-6 h-2.5 bg-white/10 animate-pulse rounded"></span>
                    ) : (
                      <span className="text-white">{`${flashLoanFees?.protocolPercent}%`}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-purple-400 mr-1.5"></div>
                      <span>Liquidity Providers:</span>
                    </div>
                    {loadingFees ? (
                      <span className="inline-block w-6 h-2.5 bg-white/10 animate-pulse rounded"></span>
                    ) : (
                      <span className="text-white">{`${flashLoanFees?.liquidityProvidersPercent}%`}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Arbitrage Profit Calculator - Pass slippage state */}
        {dexPrices && (
          <ArbitrageProfitCalculator
            loanAmount={loanAmount || "0"}
            selectedToken={selectedToken}
            flashLoanBps={flashLoanFees?.totalBps || 0.09}
            dexPrices={dexPrices}
            // Pass slippage state and its setter to the calculator
            // (or ensure calculator reads slippage from its own input)
            // This component doesn't directly need slippage, handleFlashLoan reads it.
          />
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
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden group ${
            !isConnected ||
            !isCorrectNetwork ||
            !loanAmount ||
            isLoading ||
            loadingReserves ||
            error !== null ||
            !reserve?.flashLoanEnabled
              ? "bg-gray-600/50 text-white/50 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white cursor-pointer shadow-lg"
          }`}
          aria-label="Execute flash loan"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          ) : (
            "Execute Flash Loan"
          )}
        </button>

        {/* Status Messages */}
        {!isConnected && (
          <div className="flex items-center justify-center p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
            <svg
              className="w-4 h-4 mr-1.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 16V8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12 16V16.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Connect your wallet to execute flash loans
          </div>
        )}

        {isConnected && !isCorrectNetwork && (
          <div className="flex items-center justify-center p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
            <svg
              className="w-4 h-4 mr-1.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 16V8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12 16V16.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Please switch to Ethereum Mainnet to continue
          </div>
        )}
      </div>
    </div>
  );
}
