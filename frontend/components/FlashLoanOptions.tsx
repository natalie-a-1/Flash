"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { formatTokenAmount } from "@/lib/web3/utils";
import { ethers } from "ethers";
// Comment out old import
// import { fetchAaveFlashLoanLimits, executeAaveFlashLoan } from "@/lib/web3/aave";
import { executeAaveFlashLoan } from "@/lib/web3/aave"; // Keep execute function
import { 
  UiPoolDataProvider, 
  ChainId 
} from '@aave/contract-helpers';
import * as markets from '@bgd-labs/aave-address-book';
import { TokenInfo } from "@/types/aave"; // Keep TokenInfo if needed
import { TOKENS } from "@/lib/constants/tokens";
import { getEthersV5Provider } from "@/lib/web3/web3"; // Import the v5 provider getter
// import ContractOwnerStatus from "./ContractOwnerStatus";

// Define a type for the reserves data from getReservesHumanized
// Make problematic fields optional for now to avoid lint errors
interface HumanizedReserveData {
  symbol: string;
  underlyingAsset: string;
  name: string;
  decimals: number;
  availableLiquidity: string; // Humanized string like "1234.56"
  availableLiquidityUSD?: string; // Optional
  totalLiquidity?: string; // Optional
  totalLiquidityUSD?: string; // Optional
  totalDebt?: string; // Optional
  totalDebtUSD?: string; // Optional
  priceInMarketReferenceCurrency?: string; // Optional
  priceOracle?: string; // Optional
  variableBorrowRate?: string; // Optional
  variableBorrowAPY?: string; // Optional
  stableBorrowRate?: string; // Optional
  stableBorrowAPY?: string; // Optional
  supplyRate?: string; // Optional
  supplyAPY?: string; // Optional
  // Reserve configuration
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  isSiloedBorrowing?: boolean; // Optional
  // Borrowing configuration
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  reserveFactor?: string; // Optional
  // Reserve cap
  borrowCap?: string; // Optional
  supplyCap?: string; // Optional
  debtCeiling?: string; // Optional
  debtCeilingDecimals?: number; // Optional
  // Incentives configuration
  aIncentivesData?: Array<any>; 
  vIncentivesData?: Array<any>;
  sIncentivesData?: Array<any>;
  // Other flags
  usageAsCollateralEnabled: boolean;
  eModeCategoryId?: number; // Optional
  liquidationThreshold?: string; // Optional
  liquidationBonus?: string; // Optional
  unbacked?: string; // Optional
  baseLTVasCollateral?: string; // Optional
  reserveLiquidationThreshold?: string; // Optional
  reserveLiquidationBonus?: string; // Optional
  isolationModeTotalDebtUSD?: string; // Optional
  isIsolated?: boolean; // Optional
  flashLoanEnabled: boolean;
  accruedToTreasury?: string; // Optional
}

// Update state type to use a map with the new structure
export default function FlashLoanOptions() {
  // web3 is the web3.js instance, provider is not directly available here
  const { web3, isConnected, isCorrectNetwork, account } = useWeb3(); 
  
  // State variables
  const [reserves, setReserves] = useState<Record<string, HumanizedReserveData>>({}); // Map address to reserve data
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(TOKENS[0]);
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTokenData, setLoadingTokenData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetches flash loan limits from Aave for the available tokens using @aave/contract-helpers
   */
  const getFlashLoanLimits = async () => {
    // Get the ethers v5 provider
    const provider = getEthersV5Provider();
    
    if (!isConnected || !isCorrectNetwork || !provider) { 
      setLoadingTokenData(false);
      setError("Connect wallet, switch to Ethereum Mainnet, and ensure MetaMask is available to see liquidity");
      return;
    }

    setLoadingTokenData(true);
    setError(null);

    try {
      // Instantiate the UiPoolDataProvider for Aave V3 on Ethereum
      const uiPoolDataProvider = new UiPoolDataProvider({
        uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
        provider, // Use the v5 provider obtained above
        chainId: ChainId.mainnet, 
      });

      // Fetch all reserves, humanized (decimals applied)
      // Use any[] for now and log the structure to define the type accurately later
      const { reservesData }: { reservesData: any[] } = await uiPoolDataProvider.getReservesHumanized({
        lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
      });
      
      // Log structure of the first reserve item for debugging type definition
      if (reservesData && reservesData.length > 0) {
        console.log("Sample reserveData item structure:", reservesData[0]);
      }

      // Map reservesData array to a dictionary keyed by underlyingAsset address
      const reservesMap: Record<string, HumanizedReserveData> = {};
      // Remove the inaccurate type assertion
      reservesData.forEach(reserve => { 
        // Find the corresponding token info from our TOKENS constant
        const tokenInfo = TOKENS.find(t => t.address.toLowerCase() === reserve.underlyingAsset?.toLowerCase()); // Add optional chaining
        if (tokenInfo) {
           // Add decimals property back to the reserve data for easier use later
          reservesMap[tokenInfo.address] = { ...reserve, decimals: tokenInfo.decimals }; 
        }
      });
      
      setReserves(reservesMap);

      // Check if we got any valid data for the TOKENS we care about
      const hasData = TOKENS.some(token => {
        const reserve = reservesMap[token.address];
        // Add checks for potentially optional fields if needed for logic
        return reserve && reserve.isActive && reserve.flashLoanEnabled && parseFloat(reserve.availableLiquidity) > 0; 
      });

      if (!hasData) {
        setError("No active reserves with liquidity available for flash loans on Aave V3 Ethereum Mainnet for tracked tokens.");
      }
    } catch (error) {
      console.error("Error fetching Aave V3 reserves data:", error);
      setError("Failed to fetch Aave liquidity data. Please check your connection and try again.");
      setReserves({}); // Set empty reserves as fallback
    } finally {
      setLoadingTokenData(false);
    }
  };


  /* 
  // --- OLD IMPLEMENTATION ---
  const getFlashLoanLimits = async () => {
    if (!isConnected || !isCorrectNetwork || !web3) {
      setLoadingTokenData(false);
      setError("Connect wallet and switch to Ethereum Mainnet to see available liquidity");
      return;
    }
    
    setLoadingTokenData(true);
    setError(null);
    
    try {
      // Use the service function to fetch flash loan limits
      const tokenReserves = await fetchAaveFlashLoanLimits(web3, TOKENS);
      setReserves(tokenReserves);
      
      // Check if we got any valid data
      const hasData = Object.values(tokenReserves).some(reserve => 
        reserve.reserveState.isActive && 
        reserve.reserveState.isFlashLoanEnabled && 
        reserve.availableLiquidity !== "0"
      );
      
      if (!hasData) {
        setError("No active reserves with liquidity available for flash loans on Aave V3 Ethereum Mainnet");
      }
    } catch (error) {
      console.error("Error fetching flash loan limits:", error);
      setError("Failed to fetch Aave liquidity data. Please check your connection and try again.");
      // Set empty reserves as fallback
      setReserves({});
    } finally {
      setLoadingTokenData(false);
    }
  };
  */
  
  /**
   * Executes a flash loan with the selected token and amount
   */
  const handleFlashLoan = async () => {
    // Need web3 instance for executeAaveFlashLoan
    if (!isConnected || !isCorrectNetwork || !loanAmount || !web3 || !account) return; 
    
    const selectedReserve = reserves[selectedToken.address];
    
    // Check if reserve is available for flash loans
    // Add checks for potentially optional fields if needed for logic
    if (!selectedReserve || !selectedReserve.flashLoanEnabled) { 
      setError(`${selectedToken.symbol} is not available for flash loans at this time`);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we have a deployed contract (this logic might need update if window.flashLoanContract expects v5)
      if (!window.flashLoanContract) { 
        alert("Flash Loan contract is not deployed on this network. This is a demo mode that only shows flash loan limits without the ability to execute loans.");
        setIsLoading(false);
        return;
      }
      
      // Convert user-friendly amount to token units (ethers v5 parseUnits)
      const amountInWei = ethers.utils.parseUnits(loanAmount, selectedToken.decimals);
      
      // Convert availableLiquidity string back to BigNumber for comparison (ethers v5)
      const availableLiquidityBN = ethers.utils.parseUnits(selectedReserve.availableLiquidity, selectedToken.decimals);

      // Check if the requested amount is within available liquidity (ethers v5 comparison)
      if (amountInWei.gt(availableLiquidityBN)) { 
        setError(`Requested amount exceeds available liquidity (${formatTokenAmount(
          selectedReserve.availableLiquidity, // Use the humanized value directly
          selectedToken.symbol === "USDC" ? 2 : 4,
          selectedToken.symbol
        )})`);
        setIsLoading(false);
        return;
      }
      
      // Call the service function to execute the flash loan
      // Use toString() for compatibility with ethers v5
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
      
      // Error handling for ethers v5 error types
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
         // Handle potential non-Error objects with a message property
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
   * Effect to fetch flash loan limits when connection or network changes
   */
  useEffect(() => {
    getFlashLoanLimits();
    // Add dependencies that trigger refetch
  }, [isConnected, isCorrectNetwork]); // Removed provider/web3 as getEthersV5Provider is called inside
  
  /**
   * Gets the selected token's reserve info
   */
  const getSelectedReserve = (): HumanizedReserveData | undefined => {
    return reserves[selectedToken.address];
  };
  
  /**
   * Formats the maximum available amount for display
   */
  const formatMaxAmount = (address: string): string => {
    const reserve = reserves[address];
    
    if (!reserve) return "0";
    
    const token = TOKENS.find(t => t.address === address);
    if (!token) return "0"; // Should not happen if reserves are mapped correctly
    
    // Use flags from the new reserve data structure
    if (!reserve.isActive || !reserve.flashLoanEnabled) { 
      return "Unavailable";
    }
    
    // The availableLiquidity is already humanized
    return formatTokenAmount(
      reserve.availableLiquidity, 
      token.symbol === "USDC" ? 2 : 4,
      token.symbol
    );
  };
  
  /**
   * Gets the status message for a token (Not directly available in HumanizedReserveData, maybe remove or adapt)
   */
  const getStatusMessage = (address: string): string => {
    // Return empty as message isn't in new structure
    return ""; 
  };
  
  /**
   * Gets the status style for a token based on its state
   */
  const getStatusStyle = (address: string): string => {
    const reserve = reserves[address];
    if (!reserve) return "bg-gray-500/20";
    
    // Use flags from the new reserve data structure
    if (reserve.isActive && reserve.flashLoanEnabled) { 
      // Use parseFloat for string comparison
      return parseFloat(reserve.availableLiquidity) === 0 ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"; 
    } else if (reserve.isFrozen) {
      return "bg-blue-500/20 text-blue-300";
    } else if (reserve.isPaused) {
      return "bg-yellow-500/20 text-yellow-300";
    } else { // Not active or flash loans disabled
      return "bg-red-500/20 text-red-300"; 
    }
  };
  
  /**
   * Sets the input field to the maximum available amount
   */
  const setMaxAmount = (): void => {
    const reserve = reserves[selectedToken.address];
    if (!reserve || !reserve.isActive || !reserve.flashLoanEnabled || parseFloat(reserve.availableLiquidity) === 0) return; 
    
    // Use the already humanized availableLiquidity
    setLoanAmount(reserve.availableLiquidity); 
  };
  
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-medium text-white mb-4">Flash Loan Options</h2>
      
      {/* Network Information Banner */}
      <div className="mb-6 p-3 bg-amber-600/20 border border-amber-600/30 rounded-xl text-amber-300 text-sm">
        <div className="flex items-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Ethereum Mainnet Information</span>
        </div>
        <p>This is a demonstration of flash loan arbitrage on the Ethereum Mainnet.</p>
        <p className="mt-1">Note: You must be the owner of the deployed FlashLoan contract to execute flash loans.</p>
        <p className="mt-1">You also need to ensure routers are approved in the contract before executing.</p>
      </div>
      
      {/* Aave Flash Loan Status Information */}
      {/* Update condition based on new reserve data structure */}
      {Object.values(reserves).some(reserve => 
        !reserve || // Check if reserve exists first
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
            {/* Update reasons based on flags */}
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
              // Update condition based on new flags
              const isActiveAndEnabled = reserve?.isActive && reserve?.flashLoanEnabled; 
              
              return (
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
                  <div className="ml-3 text-left flex-1">
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-xs text-white/60 flex justify-between items-center">
                      {loadingTokenData ? (
                        <span className="inline-block w-16 bg-white/10 animate-pulse rounded h-3"></span>
                      ) : (
                        <span>Max: {formatMaxAmount(token.address)}</span>
                      )}
                      
                      {/* Update status display logic */}
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
              // Update disabled condition
              disabled={loadingTokenData || !getSelectedReserve()?.flashLoanEnabled} 
              aria-label="Set maximum amount"
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <input
              id="loan-amount"
              type="text" // Keep as text, validation happens in handleFlashLoan
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
                  {formatTokenAmount(
                    getSelectedReserve()!.availableLiquidity, // Use humanized value
                    selectedToken.symbol === "USDC" ? 2 : 4,
                    selectedToken.symbol,
                    false // Assuming formatTokenAmount can handle humanized input
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reserve Status:</span>
                {/* Use new flags */}
                <span className={`${getStatusStyle(selectedToken.address)} px-2 py-0.5 rounded text-xs`}>
                  {getSelectedReserve()!.isActive ? "ACTIVE" : 
                   getSelectedReserve()!.isFrozen ? "FROZEN" :
                   getSelectedReserve()!.isPaused ? "PAUSED" : "INACTIVE"} 
                </span>
              </div>
              <div className="flex justify-between">
                <span>Flash Loans:</span>
                 {/* Use new flag */}
                <span className={getSelectedReserve()!.flashLoanEnabled ? "text-green-400" : "text-red-400"}>
                  {getSelectedReserve()!.flashLoanEnabled ? "Enabled" : "Disabled"}
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
            error !== null || // Keep error check 
            !getSelectedReserve()?.flashLoanEnabled // Check new flag 
          }
          // Update class logic based on new disabled conditions
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