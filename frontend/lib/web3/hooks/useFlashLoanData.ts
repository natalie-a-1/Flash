import { useState, useEffect } from "react";
import { useWeb3 } from "@/components/web3/Web3Provider";
import {
  fetchFlashLoanReserves,
  fetchFlashLoanFees,
} from "@/lib/services/aaveService";
import { HumanizedReserveData } from "@/types/aave";
import { FlashLoanFees } from "@/types/flashloan";
import { NETWORK_IDS, RPC_URLS } from "@/lib/web3/config";
import { ethers } from "ethers";

/**
 * Custom hook to fetch Aave flash loan reserves and premium fee configuration.
 *
 * @returns {Object} An object containing:
 * - reserves: A record of flash loan reserves data.
 * - flashLoanFees: The flash loan fee configuration.
 * - loadingReserves: Boolean indicating if reserves data is loading.
 * - loadingFees: Boolean indicating if fees data is loading.
 * - errorReserves: Error message related to reserves fetching, if any.
 * - errorFees: Error message related to fees fetching, if any.
 * - reload: Function to manually reload the data.
 */
export function useFlashLoanData() {
  const { isConnected, isCorrectNetwork, networkId } = useWeb3();
  const [reserves, setReserves] = useState<
    Record<string, HumanizedReserveData>
  >({});
  const [flashLoanFees, setFlashLoanFees] = useState<FlashLoanFees | null>(
    null,
  );
  const [loadingReserves, setLoadingReserves] = useState<boolean>(true);
  const [loadingFees, setLoadingFees] = useState<boolean>(true);
  const [errorReserves, setErrorReserves] = useState<string | null>(null);
  const [errorFees, setErrorFees] = useState<string | null>(null);

  /**
   * Reloads the flash loan data by fetching reserves and fees.
   * Sets loading states and handles errors appropriately.
   */
  const reload = async () => {
    if (!isConnected || !isCorrectNetwork) {
      setLoadingReserves(false);
      setLoadingFees(false);
      return;
    }
    // Always use a public mainnet RPC for reading Aave data
    const provider = new ethers.providers.JsonRpcProvider(
      RPC_URLS[NETWORK_IDS.MAINNET],
    );
    if (!provider) {
      setErrorReserves("Provider not available");
      setErrorFees("Provider not available");
      setLoadingReserves(false);
      setLoadingFees(false);
      return;
    }

    // Fetch reserves
    setLoadingReserves(true);
    setErrorReserves(null);
    try {
      const data = await fetchFlashLoanReserves(provider);
      setReserves(data);
    } catch (e) {
      console.error("Error fetching flash loan reserves:", e);
      setErrorReserves("Failed to fetch flash loan reserves");
      setReserves({});
    } finally {
      setLoadingReserves(false);
    }

    // Fetch fees
    setLoadingFees(true);
    setErrorFees(null);
    try {
      const feesData = await fetchFlashLoanFees(provider);
      setFlashLoanFees(feesData);
    } catch (e) {
      console.error("Error fetching flash loan fees:", e);
      setErrorFees("Failed to fetch flash loan fees");
      setFlashLoanFees(null);
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    // Re-fetch whenever connection state or active chain changes
    reload();
  }, [isConnected, isCorrectNetwork, networkId]);

  return {
    reserves,
    flashLoanFees,
    loadingReserves,
    loadingFees,
    errorReserves,
    errorFees,
    reload,
  };
}
