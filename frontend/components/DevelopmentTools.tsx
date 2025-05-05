"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { NETWORK_IDS } from "@/lib/web3/config";
import { ethers } from "ethers";
import { truncateAddress } from "@/lib/web3/utils";
import FlashLoanExecutionTracker from "./FlashLoanExecutionTracker";
import { useGlobalData } from "./web3/GlobalDataProvider";

/**
 * DevelopmentTools component provides UI buttons to interact with local blockchain
 * functionalities such as seeding a wallet, skewing prices, and funding a wallet.
 */
export default function DevelopmentTools() {
  const { web3, account, isConnected, networkId, usdcBalance, refreshBalance } = useWeb3();
  const { manualRefresh } = useGlobalData();
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
  const [ethBalance, setEthBalance] = useState<string>("0");
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);

  // Simple mount effect - only fetch data once on initial load
  useEffect(() => {
    setMounted(true);
    fetchContractAddress();
    fetchEthBalance();
  }, []);

  // Fetch contract address
  const fetchContractAddress = async () => {
    setLoadingContract(true);
    try {
      const response = await fetch('/api/get-contract-address');
      const data = await response.json();
      
      if (data.contractAddress) {
        setContractAddress(data.contractAddress);
      } else if (data.error) {
        console.error("Error fetching contract address:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch contract address:", error);
    } finally {
      setLoadingContract(false);
    }
  };

  // Fetch ETH balance
  const fetchEthBalance = async () => {
    if (web3 && account) {
      try {
        const balance = await web3.eth.getBalance(account);
        const formatted = web3.utils.fromWei(balance, "ether");
        setEthBalance(parseFloat(formatted).toFixed(4));
      } catch (error) {
        console.error("Error fetching ETH balance:", error);
      }
    }
  };

  // Update balances when account changes or after funding wallet
  useEffect(() => {
    fetchEthBalance();
  }, [web3, account, fundSuccess]);

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
      
      // Auto-refresh data after seeding
      fetchEthBalance();
      // Use the global refresh instead of individual refresh
      manualRefresh();

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
      setSkewSuccess("Price skew script executed successfully.");

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
      const localNodeProvider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545"
      );
      const nodeSigner = localNodeProvider.getSigner(0);
      const nodeSignerAddress = await nodeSigner.getAddress();
      const amountToSend = ethers.utils.parseEther("1.0");

      console.log(`Funding attempt:`);
      console.log(`   Sending From (Node Account 0): ${nodeSignerAddress}`);
      console.log(`   Sending To (MetaMask Account):   ${account}`);
      console.log(`   Amount: ${ethers.utils.formatEther(amountToSend)} ETH`);

      if (nodeSignerAddress.toLowerCase() === account.toLowerCase()) {
          throw new Error("Refusing to send ETH to the same account (Account 0).");
      }

      const tx = await nodeSigner.sendTransaction({
        to: account,
        value: amountToSend,
      });

      console.log("Funding transaction sent:", tx.hash);
      setFundSuccess(`Funding transaction sent: ${tx.hash}. Waiting for confirmation...`);

      await tx.wait();
      console.log("Funding transaction confirmed.");
      setFundSuccess("Wallet funded successfully with 1 ETH!");
      
      // Auto-refresh data after funding
      fetchEthBalance();
      // Use the global refresh instead of individual refresh
      manualRefresh();
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

  const StatusIndicator = ({ success, error }: { success: string | null, error: string | null }) => {
    if (!success && !error) return null;
    
    return (
      <div className={`mt-1 text-[10px] font-medium rounded px-1.5 py-1 transition-all duration-300 ${
        success 
          ? "bg-green-900/20 text-green-300 border border-green-500/30" 
          : "bg-red-900/20 text-red-300 border border-red-500/30"
      }`}>
        <div className="flex items-center">
          {success && (
            <>
              <svg className="w-2.5 h-2.5 mr-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>{success}</span>
            </>
          )}
          {error && (
            <>
              <svg className="w-2.5 h-2.5 mr-1 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span className="break-words">{error}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-lg p-4 shadow-xl border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
          <div className="w-5 h-5 mr-1.5 bg-gradient-to-br from-amber-500 to-orange-400 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.63-6.837.688-.688a1.875 1.875 0 1 0-2.652-2.652L10.582 7.5m5.63 6.837-5.63 6.837m0-11.317 2.651-3.03m0 0L7.5 10.582l-1.598-1.597a1.875 1.875 0 1 0-2.652 2.651l1.597 1.598"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          Dev Tools
          <span className="text-[10px] text-slate-400 font-light italic ml-2">
            Local fork only
          </span>
        </h2>

        <div className="mb-4 bg-slate-700/50 rounded-lg border border-slate-600/50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">FlashLoan Contract:</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            {loadingContract ? (
              <span className="text-gray-400 text-[11px] animate-pulse">Loading contract address...</span>
            ) : contractAddress ? (
              <a 
                href={`https://etherscan.io/address/${contractAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-mono bg-slate-800 rounded px-1.5 py-1 text-blue-300 hover:text-blue-200 transition-colors"
              >
                {contractAddress}
              </a>
            ) : (
              <span className="text-[11px] text-red-400">Contract address not found</span>
            )}
            {contractAddress && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(contractAddress);
                  alert("Contract address copied to clipboard!");
                }}
                className="text-[10px] text-gray-400 hover:text-gray-300 bg-slate-700/50 px-1.5 py-0.5 rounded ml-2"
                title="Copy to clipboard"
              >
                Copy
              </button>
            )}
          </div>
          {window.flashLoanContract ? (
            <div className="mt-1 bg-green-900/20 text-green-300 text-[10px] font-medium rounded px-1.5 py-1 border border-green-500/30">
              ✓ Contract loaded and initialized successfully
            </div>
          ) : (
            <div className="mt-1 bg-red-900/20 text-red-300 text-[10px] font-medium rounded px-1.5 py-1 border border-red-500/30">
              ✕ Contract not initialized - try refreshing the page
            </div>
          )}
        </div>

        <div className="mb-4 bg-slate-700/50 rounded-lg border border-slate-600/50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Token Balances:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center bg-slate-800 rounded p-1.5">
              <div className="w-5 h-5 mr-1.5 bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white">Ξ</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400">ETH Balance</span>
                <span className="text-xs font-medium text-white">
                  {ethBalance} ETH
                </span>
              </div>
            </div>
            <div className="flex items-center bg-slate-800 rounded p-1.5">
              <div className="w-5 h-5 mr-1.5 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white">$</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400">USDC Balance</span>
                <span className="text-xs font-medium text-white">
                  {usdcBalance ? parseFloat(usdcBalance).toFixed(2) : "0.00"} USDC
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-gray-300 mb-1.5">Your Account:</div>
          <div className="text-xs bg-slate-700/50 rounded-lg px-2.5 py-1.5 border border-slate-600/50">
            {account ? (
              <div className="font-mono text-gray-300">{truncateAddress(account)}</div>
            ) : (
              <div className="text-gray-400">Not connected</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={handleSeedWallet}
            disabled={isSeeding}
            className={`w-full flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors
              bg-gradient-to-br from-amber-600/80 to-orange-700/80 hover:from-amber-600 hover:to-orange-700
              text-amber-100 font-medium
              ${isSeeding ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <span className="text-[10px] mb-0.5">
              {isSeeding ? "Seeding..." : "Seed Wallet"}
            </span>
          </button>

          <button
            onClick={handleSkewPrices}
            disabled={isSkewing}
            className={`w-full flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors
              bg-gradient-to-br from-blue-600/80 to-blue-700/80 hover:from-blue-600 hover:to-blue-700 
              text-blue-100 font-medium
              ${isSkewing ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <span className="text-[10px] mb-0.5">
              {isSkewing ? "Skewing..." : "Skew Prices"}
            </span>
          </button>

          <button
            onClick={handleFundWallet}
            disabled={isFunding}
            className={`w-full flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors
              bg-gradient-to-br from-emerald-600/80 to-emerald-700/80 hover:from-emerald-600 hover:to-emerald-700 
              text-emerald-100 font-medium
              ${isFunding ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <span className="text-[10px] mb-0.5">
              {isFunding ? "Funding..." : "Fund Wallet"}
            </span>
          </button>
        </div>

        <div className="mt-2">
          <StatusIndicator success={seedSuccess} error={seedError} />
          <StatusIndicator success={skewSuccess} error={skewError} />
          <StatusIndicator success={fundSuccess} error={fundError} />
        </div>
      </div>
      
      <FlashLoanExecutionTracker />
    </div>
  );
} 