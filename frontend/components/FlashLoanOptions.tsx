"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { ethers } from "ethers";
import { executeAaveFlashLoan, isRouterApproved, debugFlashLoanState } from "@/lib/web3/aave";
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

  // Add state for transaction status
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Add state to toggle debug mode
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [uniswapApproved, setUniswapApproved] = useState<boolean | null>(null);
  const [sushiswapApproved, setSushiswapApproved] = useState<boolean | null>(null);

  // Fetch DEX prices on initial load and when connection changes
  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      fetchDEXPrices();
    }
  }, [isConnected, isCorrectNetwork]);

  // Add new useEffect to check router approvals
  useEffect(() => {
    const checkRouterApprovals = async () => {
      if (!isConnected || !isCorrectNetwork || !window.flashLoanContract) {
        setUniswapApproved(null);
        setSushiswapApproved(null);
        return;
      }

      try {
        console.log("Checking router approvals on component mount...");
        const [uniApproved, sushiApproved] = await Promise.all([
          isRouterApproved(MAINNET_ADDRESSES.UNISWAP_V2_ROUTER),
          isRouterApproved(MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER)
        ]);
        
        console.log("Router approval status:", {
          uniswap: uniApproved,
          sushiswap: sushiApproved
        });
        
        setUniswapApproved(uniApproved);
        setSushiswapApproved(sushiApproved);
      } catch (error) {
        console.error("Error checking router approvals:", error);
      }
    };
    
    checkRouterApprovals();
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

    // Reset transaction state
    setTxHash(null);
    setTxStatus('idle');
    setDebugInfo(null);

    console.group("🔄 Flash Loan Request");
    console.log("Initial request data:", {
      account,
      networkId,
      tokenAddress: selectedToken.address,
      tokenSymbol: selectedToken.symbol,
      loanAmount,
      slippage
    });

    const selectedReserve = reserves[selectedToken.address];

    if (!selectedReserve || !selectedReserve.flashLoanEnabled) {
      const errorMsg = `${selectedToken.symbol} is not available for flash loans at this time`;
      console.error(errorMsg);
      setError(errorMsg);
      console.groupEnd();
      return;
    }

    if (!window.flashLoanContract) {
      const errorMsg = "Flash Loan contract is not deployed on this network.";
      console.error(errorMsg);
      alert(
        "Flash Loan contract is not deployed on this network. This is a demo mode that only shows flash loan limits without the ability to execute loans.",
      );
      console.groupEnd();
      return;
    }

    // Log contract address and ABI for debugging
    console.log("Flash Loan Contract Address:", window.flashLoanContract.address);
    
    try {
      console.log("Checking contract interface...");
      const functions = Object.keys(window.flashLoanContract.interface.functions);
      console.log("Available contract functions:", functions);
    } catch (error) {
      console.warn("Could not get contract interface:", error);
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

    console.log("Execution DEX prices:", executionDexPrices);

    // Get Dynamic Parameters based on *FILTERED* prices
    const bestPath = executionDexPrices ? findBestArbitragePath(executionDexPrices) : null;
    const buyExchange: Exchange | null = bestPath?.buy || null;
    const sellExchange: Exchange | null = bestPath?.sell || null;

    console.log("Arbitrage path:", {
      found: !!bestPath,
      buyExchange: buyExchange?.name,
      sellExchange: sellExchange?.name,
    });

    if (!buyExchange || !sellExchange) {
        const errorMsg = "Could not determine executable arbitrage path (Uniswap V2 / SushiSwap). No prices available or profitable path found between them.";
        console.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        console.groupEnd();
        return;
    }

    // Intermediate token is WETH for USDC/WETH pair
    const intermediateToken = MAINNET_ADDRESSES.WETH; // Assuming USDC/WETH arbitrage

    // Convert slippage string to basis points (BPS)
    const slippageNum = parseFloat(slippage) || 0;
    const slippageBps = Math.round(slippageNum * 100); // e.g., 0.5% = 50 BPS

    console.log("Calculated parameters:", {
      slippageNum,
      slippageBps,
      sourceRouter: buyExchange.router,
      targetRouter: sellExchange.router,
      intermediateToken
    });

    // Validate slippage
    if (slippageBps <= 0 || slippageBps > 10000) { // 10000 BPS = 100%
        const errorMsg = "Invalid slippage tolerance. Must be between 0% and 100%.";
        console.error(errorMsg);
        setError(errorMsg);
        console.groupEnd();
        return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setTxStatus('pending');

      // Check router approvals first
      console.log("Checking router approvals...");
      const sourceRouterApproved = await isRouterApproved(buyExchange.router);
      const targetRouterApproved = await isRouterApproved(sellExchange.router);

      console.log("Router approval status:", {
        sourceRouter: {
          name: buyExchange.name,
          address: buyExchange.router,
          approved: sourceRouterApproved
        },
        targetRouter: {
          name: sellExchange.name,
          address: sellExchange.router,
          approved: targetRouterApproved
        }
      });

      if (!sourceRouterApproved || !targetRouterApproved) {
        let errorMsg = "Router approval required: ";
        if (!sourceRouterApproved) errorMsg += `${buyExchange.name} router is not approved. `;
        if (!targetRouterApproved) errorMsg += `${sellExchange.name} router is not approved. `;
        errorMsg += "Please contact the contract owner to approve these routers.";
        console.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        setTxStatus('error');
        console.groupEnd();
        return;
      }

      // Prepare amount
      const amountInWei = ethers.utils.parseUnits(
        loanAmount,
        selectedToken.decimals,
      );

      console.log("Amount details:", {
        inputAmount: loanAmount,
        decimals: selectedToken.decimals,
        amountInWei: amountInWei.toString()
      });

      // Debug: Hardcode to small amount for testing if needed
      // const testAmount = "1000000"; // 1 USDC (6 decimals)
      // console.log("⚠️ DEBUG: Overriding with test amount:", testAmount);
      // const amountInWei = testAmount;

      const availableLiquidityBN = ethers.utils.parseUnits(
        selectedReserve.availableLiquidity,
        selectedToken.decimals,
      );

      console.log("Liquidity check:", {
        requested: amountInWei.toString(),
        available: availableLiquidityBN.toString(),
        hasEnough: amountInWei.lte(availableLiquidityBN)
      });

      if (amountInWei.gt(availableLiquidityBN)) {
        // Use formatMaxAmount to display available liquidity with USD value
        const availableDisplay = formatMaxAmount(
          selectedReserve,
          selectedToken,
        );
        const errorMsg = `Requested amount exceeds available liquidity (${availableDisplay})`;
        console.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        setTxStatus('error');
        console.groupEnd();
        return;
      }

      // Log provider and network info
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const network = await provider.getNetwork();
        console.log("Network info:", {
          chainId: network.chainId,
          name: network.name
        });
        
        const block = await provider.getBlock("latest");
        console.log("Latest block:", {
          number: block.number,
          timestamp: block.timestamp,
          gasLimit: block.gasLimit.toString()
        });
        
        // Save debug info
        setDebugInfo({
          network,
          block: {
            number: block.number,
            timestamp: block.timestamp,
          },
          token: {
            address: selectedToken.address,
            symbol: selectedToken.symbol,
            decimals: selectedToken.decimals,
          },
          parameters: {
            amount: amountInWei.toString(),
            sourceRouter: buyExchange.router,
            targetRouter: sellExchange.router,
            intermediateToken,
            slippageBps,
          }
        });
      } catch (error) {
        console.warn("Error getting network info:", error);
      }

      // Execute with dynamic parameters derived from filtered prices
      console.log("Executing flash loan...");
      const success = await executeAaveFlashLoan(
        web3, 
        selectedToken,
        amountInWei.toString(),
        buyExchange.router, // Use .router
        sellExchange.router, // Use .router
        intermediateToken, 
        slippageBps,
      );

      console.log("Flash loan execution result:", success);
      setTxStatus(success ? 'success' : 'error');

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
      setTxStatus('error');
      let errorMessage = "Failed to execute flash loan.";

      // Try to extract as much info as possible for debugging
      console.group("📊 Error Details");
      if (error instanceof Error) {
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        
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
        console.log("Error object message:", errMsg);
        
        if (errMsg.includes("user rejected")) {
          errorMessage = "Transaction was rejected in your wallet.";
        } else if (errMsg.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas fees.";
        } else {
          errorMessage += " " + errMsg;
        }
      }
      
      // Log any additional properties on the error object
      if (error && typeof error === 'object') {
        const errorKeys = Object.keys(error as object);
        console.log("Error object keys:", errorKeys);
        
        // Try to extract common ethers.js error properties
        if ('code' in (error as any)) console.log("Error code:", (error as any).code);
        if ('reason' in (error as any)) console.log("Error reason:", (error as any).reason);
        if ('error' in (error as any)) console.log("Nested error:", (error as any).error);
        if ('transaction' in (error as any)) console.log("Transaction:", {
          hash: (error as any).transaction?.hash,
          from: (error as any).transaction?.from,
          to: (error as any).transaction?.to,
        });
      }
      console.groupEnd();
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.groupEnd(); // End Flash Loan Request group
    }
  };

  /**
   * Trigger debug checks manually without executing a flash loan
   */
  const runDebugChecks = async () => {
    if (!isConnected || !isCorrectNetwork || !selectedToken)
      return;
      
    setIsLoading(true);
    try {
      console.group("🛠️ Manual Debug Check");
      
      const intermediateToken = MAINNET_ADDRESSES.WETH;
      
      // Get router addresses directly from constants
      const sourceRouter = MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER;
      const targetRouter = MAINNET_ADDRESSES.UNISWAP_V2_ROUTER;
      
      console.log("Running debug checks with parameters:", {
        tokenAddress: selectedToken.address,
        sourceRouter,
        targetRouter,
      });
      
      await debugFlashLoanState(
        selectedToken.address,
        sourceRouter,
        targetRouter
      );
      
      // Check router approvals
      try {
        const [uniApproved, sushiApproved] = await Promise.all([
          isRouterApproved(MAINNET_ADDRESSES.UNISWAP_V2_ROUTER),
          isRouterApproved(MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER)
        ]);
        
        setUniswapApproved(uniApproved);
        setSushiswapApproved(sushiApproved);
      } catch (error) {
        console.error("Error checking router approvals:", error);
      }
      
      // Check network info
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const network = await provider.getNetwork();
        console.log("Network info:", {
          chainId: network.chainId,
          name: network.name
        });
        
        const block = await provider.getBlock("latest");
        console.log("Latest block:", {
          number: block.number,
          timestamp: block.timestamp,
          gasLimit: block.gasLimit.toString()
        });
        
        // Get gas price
        const gasPrice = await provider.getGasPrice();
        console.log("Gas price:", ethers.utils.formatUnits(gasPrice, 'gwei'), "gwei");
        
        // Get account balance
        const signer = provider.getSigner();
        const account = await signer.getAddress();
        const balance = await provider.getBalance(account);
        console.log("Account ETH balance:", ethers.utils.formatEther(balance), "ETH");
      } catch (error) {
        console.error("Error getting network info:", error);
      }
      
      console.groupEnd();
    } catch (error) {
      console.error("Debug check error:", error);
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

        {/* Toggle Debug Mode button */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="text-xs text-gray-400 hover:text-white flex items-center"
          >
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 8V8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {debugMode ? "Hide debug info" : "Show debug info"}
          </button>
        </div>
        
        {/* Debug Panel */}
        {debugMode && (
          <div className="mt-3 p-3 bg-slate-900/80 border border-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-300">Debug Panel</h3>
              <button
                onClick={runDebugChecks}
                disabled={isLoading || !isConnected}
                className={`text-xs px-2 py-1 rounded ${isLoading ? "bg-gray-700 text-gray-500" : "bg-blue-800 text-blue-200 hover:bg-blue-700"}`}
              >
                {isLoading ? "Running..." : "Run Debug Checks"}
              </button>
            </div>
            
            {txStatus !== 'idle' && (
              <div className={`mb-2 p-2 rounded text-xs ${
                txStatus === 'pending' ? 'bg-amber-900/20 text-amber-400' :
                txStatus === 'success' ? 'bg-green-900/20 text-green-400' :
                'bg-red-900/20 text-red-400'
              }`}>
                Transaction Status: <span className="font-medium">{txStatus.toUpperCase()}</span>
                {txHash && (
                  <div className="mt-1 truncate">
                    Hash: <span className="font-mono">{txHash}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                <span className="text-gray-500">Contract:</span> {window.flashLoanContract?.address || "Not loaded"}
              </div>
              
              {debugInfo && (
                <>
                  <div>
                    <span className="text-gray-500">Network:</span> {debugInfo.network?.name} (Chain ID: {debugInfo.network?.chainId})
                  </div>
                  <div>
                    <span className="text-gray-500">Latest block:</span> #{debugInfo.block?.number}
                  </div>
                  <div className="font-mono text-[10px] overflow-auto whitespace-pre bg-slate-900 p-1 rounded">
                    {JSON.stringify(debugInfo.parameters, null, 2)}
                  </div>
                </>
              )}
              
              <div className="mt-2">
                <div className="text-gray-300 mb-1">Router Status:</div>
                <div className="grid grid-cols-2 gap-1">
                  <div className={`p-1 rounded ${uniswapApproved === true ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                    Uniswap: {uniswapApproved === true ? '✓' : '✗'}
                  </div>
                  <div className={`p-1 rounded ${sushiswapApproved === true ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                    SushiSwap: {sushiswapApproved === true ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
