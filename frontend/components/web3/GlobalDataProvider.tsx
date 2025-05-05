"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3 } from "./Web3Provider";
import { useFlashLoanData } from "@/lib/web3/hooks/useFlashLoanData";
import { ethers } from "ethers";
import { fetchDexPrices } from "@/lib/services/priceService";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";
import { TokenPairPrices } from "@/types/arbitrage";

// Define the context structure
interface GlobalDataContextType {
  lastUpdated: Date | null;
  dexPrices: TokenPairPrices;
  isLoading: boolean;
  error: string | null;
  manualRefresh: () => Promise<void>; // Add manual refresh function
}

// Create context with default values
const GlobalDataContext = createContext<GlobalDataContextType>({
  lastUpdated: null,
  dexPrices: {},
  isLoading: false,
  error: null,
  manualRefresh: async () => {}, // Default empty function
});

// Custom hook to use the global data context
export const useGlobalData = () => useContext(GlobalDataContext);

export const GlobalDataProvider = ({ children }: { children: ReactNode }) => {
  const { web3, isConnected, isCorrectNetwork, account, refreshBalance } = useWeb3();
  const { reload: reloadFlashLoanData } = useFlashLoanData();
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dexPrices, setDexPrices] = useState<TokenPairPrices>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch all data
  const fetchAllData = async () => {
    if (!isConnected || !isCorrectNetwork) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Update USDC balance
      refreshBalance();

      // 2. Update flash loan data
      reloadFlashLoanData();

      // 3. Fetch DEX prices
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const fetchedPrices = await fetchDexPrices(
          provider,
          EXCHANGES,
          PAIRS
        );
        setDexPrices(fetchedPrices);
      } catch (priceError) {
        console.error("Error fetching DEX prices:", priceError);
        // Don't block the entire update for price errors
      }

      // 4. Fetch ETH balance if account exists
      if (web3 && account) {
        try {
          const ethBalance = await web3.eth.getBalance(account);
          // We're just fetching it here, components will access it via web3 context
        } catch (balanceError) {
          console.error("Error fetching ETH balance:", balanceError);
        }
      }

      // Update timestamp on successful update
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error updating global data:", err);
      setError("Failed to update data. Will retry automatically.");
    } finally {
      setIsLoading(false);
    }
  };

  // Public function to manually trigger a data refresh
  const manualRefresh = async () => {
    await fetchAllData();
  };

  // Set up global auto-update interval
  useEffect(() => {
    // Initial fetch
    fetchAllData();
    
    // Set up interval for regular updates
    const updateInterval = setInterval(() => {
      fetchAllData();
    }, 10000); // Every 10 seconds as requested
    
    return () => clearInterval(updateInterval);
  }, [isConnected, isCorrectNetwork, account]);

  return (
    <GlobalDataContext.Provider
      value={{
        lastUpdated,
        dexPrices,
        isLoading,
        error,
        manualRefresh
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

export default GlobalDataProvider; 