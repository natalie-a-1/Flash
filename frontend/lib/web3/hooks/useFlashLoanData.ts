import { useState, useEffect } from "react";
import { useWeb3 } from "@/components/web3/Web3Provider";
import { getEthersV5Provider } from "@/lib/web3/web3";
import { fetchFlashLoanReserves, fetchFlashLoanFees } from "@/lib/services/aaveService";
import { HumanizedReserveData } from "@/types/aave";
import { FlashLoanFees } from "@/types/flashloan";

/**
 * Custom hook to fetch Aave flash loan reserves and premium fee configuration.
 */
export function useFlashLoanData() {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const [reserves, setReserves] = useState<Record<string, HumanizedReserveData>>({});
  const [flashLoanFees, setFlashLoanFees] = useState<FlashLoanFees | null>(null);
  const [loadingReserves, setLoadingReserves] = useState<boolean>(true);
  const [loadingFees, setLoadingFees] = useState<boolean>(true);
  const [errorReserves, setErrorReserves] = useState<string | null>(null);
  const [errorFees, setErrorFees] = useState<string | null>(null);

  const reload = async () => {
    if (!isConnected || !isCorrectNetwork) {
      setLoadingReserves(false);
      setLoadingFees(false);
      return;
    }
    const provider = getEthersV5Provider();
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
    reload();
  }, [isConnected, isCorrectNetwork]);

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