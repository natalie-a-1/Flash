"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { formatTokenAmount, formatCurrencyAmount } from "@/lib/web3/utils";
import { ethers } from "ethers";
import { executeAaveFlashLoan } from "@/lib/web3/aave"; // Import execute function
import { UiPoolDataProvider, ChainId } from '@aave/contract-helpers';
import * as markets from '@bgd-labs/aave-address-book';
import { TokenInfo, HumanizedReserveData } from "@/types/aave"; // Import types
import { TOKENS } from "@/lib/constants/tokens";
import { getEthersV5Provider } from "@/lib/web3/web3"; // Import the v5 provider getter

/**
 * FlashLoanOptions component provides the interface for executing flash loans.
 * It manages state for reserves, selected token, loan amount, and error handling.
 */
export default function FlashLoanOptions() {
  const { web3, isConnected, isCorrectNetwork, account } = useWeb3();

  // State variables
  const [reserves, setReserves] = useState<Record<string, HumanizedReserveData>>({});
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(TOKENS[0]);
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTokenData, setLoadingTokenData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches flash loan limits from Aave for the available tokens using @aave/contract-helpers.
   */
  const getFlashLoanLimits = async () => {
    const provider = getEthersV5Provider();

    if (!isConnected || !isCorrectNetwork || !provider) {
      setLoadingTokenData(false);
      setError("Connect wallet, switch to Ethereum Mainnet, and ensure MetaMask is available to see liquidity");
      return;
    }

    setLoadingTokenData(true);
    setError(null);

    try {
      const uiPoolDataProvider = new UiPoolDataProvider({
        uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
        provider,
        chainId: ChainId.mainnet,
      });

      // fetch humanized reserve data
      const { reservesData }: { reservesData: any[] } = await uiPoolDataProvider.getReservesHumanized({
        lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
      });

      if (reservesData && reservesData.length > 0) {
        console.log("Sample reserveData item structure:", reservesData);
      }

      const reservesMap: Record<string, HumanizedReserveData> = {};
      reservesData.forEach(reserve => {
        const tokenInfo = TOKENS.find(t => t.address.toLowerCase() === reserve.underlyingAsset?.toLowerCase());
        if (tokenInfo) {
          reservesMap[tokenInfo.address] = { ...reserve, decimals: tokenInfo.decimals };
        }
      });

      setReserves(reservesMap);

      const hasData = TOKENS.some(token => {
        const reserve = reservesMap[token.address];
        return reserve && reserve.isActive && reserve.flashLoanEnabled && parseFloat(reserve.availableLiquidity) > 0;
      });

      if (!hasData) {
        setError("No active reserves with liquidity available for flash loans on Aave V3 Ethereum Mainnet for tracked tokens.");
      }
    } catch (error) {
      console.error("Error fetching Aave V3 reserves data:", error);
      setError("Failed to fetch Aave liquidity data. Please check your connection and try again.");
      setReserves({});
    } finally {
      setLoadingTokenData(false);
    }
  };

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
        const availableDisplay = formatMaxAmount(selectedToken.address);
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

  /**
   * Effect to fetch flash loan limits when connection or network changes.
   */
  useEffect(() => {
    getFlashLoanLimits();
  }, [isConnected, isCorrectNetwork]);

  /**
   * Gets the selected token's reserve info.
   */
  const getSelectedReserve = (): HumanizedReserveData | undefined => {
    return reserves[selectedToken.address];
  };

  /**
   * Formats the maximum available amount (convert from raw wei) for display.
   */
  const formatMaxAmount = (address: string): string => {
    const reserve = reserves[address];
    if (!reserve) return "0";
    const token = TOKENS.find(t => t.address === address);
    if (!token) return "0";
    if (!reserve.isActive || !reserve.flashLoanEnabled) {
      return "Unavailable";
    }
    // Convert raw string (wei) to human-readable value
    const humanAmount = ethers.utils.formatUnits(reserve.availableLiquidity, token.decimals);
    // Format token display with compact notation
    const tokenDisplay = formatTokenAmount(humanAmount, 4, token.symbol, true);
    // If USD amount is provided, format directly
    if (reserve.availableLiquidityUSD) {
      const usdDisplay = formatCurrencyAmount(reserve.availableLiquidityUSD, 'USD', 2, true);
      return `${tokenDisplay} (${usdDisplay})`;
    }
    return tokenDisplay;
  };

  /**
   * Gets the status style for a token based on its state.
   */
  const getStatusStyle = (address: string): string => {
    const reserve = reserves[address];
    if (!reserve) return "bg-gray-500/20";

    if (reserve.isActive && reserve.flashLoanEnabled) {
      return parseFloat(reserve.availableLiquidity) === 0 ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300";
    } else if (reserve.isFrozen) {
      return "bg-blue-500/20 text-blue-300";
    } else if (reserve.isPaused) {
      return "bg-yellow-500/20 text-yellow-300";
    } else {
      return "bg-red-500/20 text-red-300";
    }
  };

  /**
   * Sets the input field to the maximum available amount.
   */
  const setMaxAmount = (): void => {
    const reserve = reserves[selectedToken.address];
    if (!reserve || !reserve.isActive || !reserve.flashLoanEnabled || parseFloat(reserve.availableLiquidity) === 0) return;

    setLoanAmount(reserve.availableLiquidity);
  };

  // Prepare reserve and computed interest rates
  const reserve = getSelectedReserve();
  const supplyAPYVal = reserve?.liquidityRate
    ? parseFloat(reserve.liquidityRate) / 1e25
    : 0;
  const variableBorrowAPYVal = reserve?.variableBorrowRate
    ? parseFloat(reserve.variableBorrowRate) / 1e25
    : 0;
  const stableBorrowAPYVal = reserve?.stableBorrowRate
    ? parseFloat(reserve.stableBorrowRate) / 1e25
    : 0;

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-medium text-white mb-4">Flash Loan Options</h2>
      {/* Aave Flash Loan Status Information */}
      {Object.values(reserves).some(reserve =>
        !reserve ||
        reserve.isActive === false ||
        !reserve.flashLoanEnabled ||
        reserve.isFrozen ||
        reserve.isPaused
      ) && (
        <div className="mb-6 p-3 bg-blue-600/20 border border-blue-600/30 rounded-xl text-blue-300 text-sm">
          <div className="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Aave Flash Loan Availability</span>
          </div>
          <p>Some tokens may show as "UNAVAILABLE" for flash loans. This means:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>The token may not be supported by Aave V3 on Ethereum Mainnet</li>
            <li>Flash loans might be disabled for that specific token</li>
            <li>The reserves could be paused or frozen by Aave governance</li>
            <li>The reserve might not be active</li>
          </ul>
          <p className="mt-2">Please check the <a href="https://app.aave.com/" target="_blank" rel="noopener noreferrer" className="underline">Aave app</a> for the latest reserve status.</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-white/70 text-sm mb-2">Select Token</label>
          <div className="grid grid-cols-2 gap-3">
            {TOKENS.map((token) => {
              const reserve = reserves[token.address];
              const isActiveAndEnabled = reserve?.isActive && reserve?.flashLoanEnabled;

              return (
                <button
                  key={token.address}
                  onClick={() => setSelectedToken(token)}
                  className={`flex items-center p-3 rounded-xl border transition-all ${
                    selectedToken.address === token.address
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : `${token.color} border-white/30 shadow-lg`
                  }`}
                  aria-label={`Select ${token.symbol}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${token.color}`}>
                    {token.icon}
                  </div>
                  <div className="ml-3 text-left flex-1">
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-xs text-white/60 flex justify-between items-center">
                      {loadingTokenData ? (
                        <span className="inline-block w-16 bg-white/10 animate-pulse rounded h-3"></span>
                      ) : (
                        <span>Max: {formatMaxAmount(token.address)}</span>
                      )}

                      {reserve && !loadingTokenData && (
                        <span className={`text-xs px-1.5 py-0.5 ml-2 rounded ${getStatusStyle(token.address)}`}>
                          {isActiveAndEnabled ? "Active" : reserve.isFrozen ? "FROZEN" :
                           reserve.isPaused ? "PAUSED" : "UNAVAILABLE"}
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
        <div>
          <div className="flex justify-between mb-2">
            <label htmlFor="loan-amount" className="text-white/70 text-sm">Amount</label>
            <button
              onClick={setMaxAmount}
              className="text-cyan-400 text-xs hover:underline"
              disabled={loadingTokenData || !getSelectedReserve()?.flashLoanEnabled}
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

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-xl text-red-300 text-sm">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={getFlashLoanLimits}
                className="text-cyan-400 text-xs hover:underline flex items-center"
                disabled={loadingTokenData}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Data Loading Indicator */}
        {loadingTokenData && (
          <div className="flex items-center justify-center py-3 text-cyan-300 text-sm">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Aave liquidity data...
          </div>
        )}

        {/* Selected Token Additional Info */}
        {getSelectedReserve() && !loadingTokenData && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm">
            <h3 className="text-white/80 font-medium mb-2">Reserve Information</h3>
            <div className="space-y-1 text-white/60">
              <div className="flex justify-between">
                <span>Available Liquidity:</span>
                <span className="text-white/90 font-medium">
                  {formatMaxAmount(selectedToken.address)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reserve Status:</span>
                <span className={`${getStatusStyle(selectedToken.address)} px-2 py-0.5 rounded text-xs`}>
                  {getSelectedReserve()!.isActive ? "ACTIVE" :
                   getSelectedReserve()!.isFrozen ? "FROZEN" :
                   getSelectedReserve()!.isPaused ? "PAUSED" : "INACTIVE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Flash Loans:</span>
                <span className={getSelectedReserve()!.flashLoanEnabled ? "text-green-400" : "text-red-400"}>
                  {getSelectedReserve()!.flashLoanEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Interest Rates */}
        {reserve && !loadingTokenData && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm">
            <h3 className="text-white/80 font-medium mb-2">Interest Rates</h3>
            <div className="space-y-1 text-white/60">
              <div className="flex justify-between">
                <span>Supply APY:</span>
                <span className="font-medium text-white">
                  {`${supplyAPYVal.toFixed(2)}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Variable Borrow APY:</span>
                <span className="font-medium text-white">
                  {`${variableBorrowAPYVal.toFixed(2)}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Stable Borrow APY:</span>
                <span className="font-medium text-white">
                  {`${stableBorrowAPYVal.toFixed(2)}%`}
                </span>
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
            loadingTokenData ||
            error !== null ||
            !getSelectedReserve()?.flashLoanEnabled
          }
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
            !isConnected ||
            !isCorrectNetwork ||
            !loanAmount ||
            isLoading ||
            loadingTokenData ||
            error !== null ||
            !getSelectedReserve()?.flashLoanEnabled
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
          <p className="text-amber-400 text-xs text-center">Please switch to Ethereum Mainnet</p>
        )}
      </div>
    </div>
  );
} 