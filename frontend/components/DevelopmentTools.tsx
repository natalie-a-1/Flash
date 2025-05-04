"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { NETWORK_IDS } from "@/lib/web3/config";
import { ethers } from "ethers";

export default function DevelopmentTools() {
  const { web3, account, isConnected, networkId } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSkewing, setIsSkewing] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [skewError, setSkewError] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [skewSuccess, setSkewSuccess] = useState<string | null>(null);
  const [fundSuccess, setFundSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSeedWallet = async () => {
    setIsSeeding(true);
    setSeedError(null);
    setSeedSuccess(null);
    setSkewError(null);
    setSkewSuccess(null);
    setFundError(null);
    setFundSuccess(null);
    try {
      const response = await fetch('/api/run-seed-wallet', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Seed Wallet API Error:", data);
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      console.log("Seed Wallet Script Output:", data.output);
      if(data.warning) console.warn("Seed Wallet Script Warning:", data.warning);
      setSeedSuccess("Wallet seeding & approvals complete.");

    } catch (err: any) {
      console.error("Failed to run seed wallet script:", err);
      setSeedError(`Seed Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSkewPrices = async () => {
    setIsSkewing(true);
    setSeedError(null);
    setSeedSuccess(null);
    setSkewError(null);
    setSkewSuccess(null);
    setFundError(null);
    setFundSuccess(null);
    try {
      const response = await fetch('/api/run-skew-prices', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Skew Prices API Error:", data);
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      console.log("Skew Prices Script Output:", data.output);
      if(data.warning) console.warn("Skew Prices Script Warning:", data.warning);
      setSkewSuccess("Price skew script executed. Refresh may be needed.");

    } catch (err: any) {
      console.error("Failed to run skew prices script:", err);
      setSkewError(`Skew Error: ${err.message}`);
    } finally {
      setIsSkewing(false);
    }
  };

  const handleFundWallet = async () => {
    if (!web3 || !account) {
      setFundError("Wallet not connected.");
      return;
    }
    setIsFunding(true);
    setFundError(null);
    setFundSuccess(null);
    setSeedError(null);
    setSeedSuccess(null);
    setSkewError(null);
    setSkewSuccess(null);

    try {
      // Create a provider connected directly to the local node
      const localNodeProvider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545"
      );
      // Get the signer for the default account (usually index 0) on the local node
      const nodeSigner = localNodeProvider.getSigner(0);
      const nodeSignerAddress = await nodeSigner.getAddress();
      const amountToSend = ethers.utils.parseEther("1.0"); // Send 1 ETH

      // --- Add Logging Here ---
      console.log(`Funding attempt:`);
      console.log(`   Sending From (Node Account 0): ${nodeSignerAddress}`);
      console.log(`   Sending To (MetaMask Account):   ${account}`);
      console.log(`   Amount: ${ethers.utils.formatEther(amountToSend)} ETH`);
      // ------------------------

      if (nodeSignerAddress.toLowerCase() === account.toLowerCase()) {
          throw new Error("Refusing to send ETH to the same account (Account 0).");
      }

      const tx = await nodeSigner.sendTransaction({
        to: account,
        value: amountToSend,
      });

      console.log("Funding transaction sent:", tx.hash);
      setFundSuccess(`Funding transaction sent: ${tx.hash}. Waiting for confirmation...`);

      await tx.wait(); // Wait for the transaction to be mined
      console.log("Funding transaction confirmed.");
      setFundSuccess("Wallet funded successfully with 1 ETH!");
    } catch (error: any) {
      console.error("Failed to fund wallet:", error);
      setFundError(error.message || "Failed to fund wallet.");
    } finally {
      setIsFunding(false);
    }
  };

  if (!mounted || !isConnected || networkId !== NETWORK_IDS.LOCALHOST) {
    return null;
  }

  return (
    <div className="mb-3 rounded-xl bg-gradient-to-b from-yellow-800/30 to-yellow-900/30 backdrop-blur-sm p-3 shadow-lg border border-yellow-500/30">
      <h3 className="text-base font-semibold text-yellow-300 mb-2 flex items-center">
        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.63-6.837.688-.688a1.875 1.875 0 1 0-2.652-2.652L10.582 7.5m5.63 6.837-5.63 6.837m0-11.317 2.651-3.03m0 0L7.5 10.582l-1.598-1.597a1.875 1.875 0 1 0-2.652 2.651l1.597 1.598" />
        </svg>
        Local Fork Dev Tools
      </h3>
      <div className="space-y-3">
        <div>
            <button
            onClick={handleSeedWallet}
            disabled={isSeeding || isSkewing || isFunding}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                isSeeding || isSkewing || isFunding
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white cursor-pointer shadow-md"
            }`}
            >
            {isSeeding ? (
                <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                    Seeding Wallet...
                </>
            ) : (
                "🌱 Seed Wallet (100k USDC + Approvals)"
            )}
            </button>
             {seedSuccess && <p className="text-green-400 text-xs mt-1 px-1">{seedSuccess}</p>}
             {seedError && <p className="text-red-400 text-xs mt-1 px-1 break-words">{seedError}</p>}
        </div>

        <div>
            <button
            onClick={handleSkewPrices}
            disabled={isSeeding || isSkewing || isFunding}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                isSeeding || isSkewing || isFunding
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white cursor-pointer shadow-md"
            }`}
            >
            {isSkewing ? (
                <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                    Skewing Uniswap Price...
                </>
            ) : (
                "📈 Skew Uniswap Price (USDC->WETH)"
            )}
            </button>
             {skewSuccess && <p className="text-green-400 text-xs mt-1 px-1">{skewSuccess}</p>}
             {skewError && <p className="text-red-400 text-xs mt-1 px-1 break-words">{skewError}</p>}
        </div>

        <div>
            <button
            onClick={handleFundWallet}
            disabled={isSeeding || isSkewing || isFunding || !account}
             className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                isSeeding || isSkewing || isFunding || !account
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white cursor-pointer shadow-md"
            }`}
            >
            {isFunding ? (
                 <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                    Funding Wallet...
                </>
            ) : (
                "⛽ Fund Wallet (0.1 ETH)"
            )}
            </button>
             {fundSuccess && <p className="text-green-400 text-xs mt-1 px-1">{fundSuccess}</p>}
             {fundError && <p className="text-red-400 text-xs mt-1 px-1 break-words">{fundError}</p>}
        </div>

      </div>
    </div>
  );
} 