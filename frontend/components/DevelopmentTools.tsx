"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { NETWORK_IDS } from "@/lib/web3/config";
import { ethers } from "ethers";
import { truncateAddress } from "@/lib/web3/utils";
import FlashLoanExecutionTracker from "./FlashLoanExecutionTracker";

/**
 * DevelopmentTools component provides UI buttons to interact with local blockchain
 * functionalities such as seeding a wallet, skewing prices, and funding a wallet.
 */
export default function DevelopmentTools() {
  const { web3, account, isConnected, networkId, usdcBalance, refreshBalance } = useWeb3();
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch ETH balance when account changes or on refresh
  useEffect(() => {
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

    fetchEthBalance();
  }, [web3, account, fundSuccess]);

  /**
   * Refresh token balances
   */
  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    try {
      if (web3 && account) {
        // Refresh ETH balance
        const balance = await web3.eth.getBalance(account);
        const formatted = web3.utils.fromWei(balance, "ether");
        setEthBalance(parseFloat(formatted).toFixed(4));
      }
      
      // Refresh USDC balance via Web3Provider
      await refreshBalance();
    } catch (error) {
      console.error("Error refreshing balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handles the wallet seeding process by calling the backend API.
   * Resets error and success states before execution.
   */
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
      
      // Refresh token balances after seeding
      handleRefreshBalances();

    } catch (err: any) {
      console.error("Failed to run seed wallet script:", err);
      setSeedError(`Seed Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  /**
   * Handles the price skewing process by calling the backend API.
   * Resets error and success states before execution.
   */
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

  /**
   * Handles the wallet funding process by sending ETH from a local node account.
   * Validates connection and account status before proceeding.
   */
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
      
      // Refresh token balances after funding
      handleRefreshBalances();
    } catch (error: any) {
      console.error("Failed to fund wallet:", error);
      setFundError(error.message || "Failed to fund wallet.");
    } finally {
      setIsFunding(false);
    }
  };

  // Render nothing if the component is not mounted, not connected, or not on the localhost network
  if (!mounted || !isConnected || networkId !== NETWORK_IDS.LOCALHOST) {
    return null;
  }

  // Status indicator component
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

        {/* Wallet Balances Section */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-purple-500/30 group mb-3">
          <div className="flex items-center mb-2">
            <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-1 mr-2 shadow-md group-hover:shadow-purple-500/20 transition-all">
              <span className="text-white flex items-center justify-center w-3.5 h-3.5">💰</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-white/80 text-xs font-medium">Wallet Balances</p>
                <span className="text-xs px-1 py-0 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px]">
                  {truncateAddress(account || "")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-1 mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-slate-700/50 px-2 py-1 rounded-md flex items-center">
                <span className="text-white/80 text-xs mr-1.5">ETH:</span>
                <span className="text-white text-xs font-medium">{ethBalance}</span>
              </div>
              <div className="bg-slate-700/50 px-2 py-1 rounded-md flex items-center">
                <span className="text-white/80 text-xs mr-1.5">USDC:</span>
                <span className="text-white text-xs font-medium">
                  {usdcBalance !== null ? Number(usdcBalance).toFixed(2) : 'Loading...'}
                </span>
              </div>
            </div>
            <button
              onClick={handleRefreshBalances}
              disabled={isRefreshing || isSeeding || isSkewing || isFunding}
              className={`text-white text-xs py-1 px-2 rounded transition-all ${
                isRefreshing || isSeeding || isSkewing || isFunding
                  ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  : "bg-purple-500/80 hover:bg-purple-600 hover:shadow-sm"
              }`}
            >
              {isRefreshing ? (
                <div className="flex justify-center items-center">
                  <svg className="animate-spin h-3 w-3 mr-1 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Refreshing...</span>
                </div>
              ) : (
                <span>Refresh</span>
              )}
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Seed Wallet Button */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-blue-500/30 group">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1 mr-2 shadow-md group-hover:shadow-blue-500/20 transition-all">
                <span className="text-white flex items-center justify-center w-3.5 h-3.5">🌱</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-white/80 text-xs font-medium">Seed Wallet</p>
                  <span className="text-xs px-1 py-0 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px]">
                    100k USDC
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <button
                    onClick={handleSeedWallet}
                    disabled={isSeeding || isSkewing || isFunding || isRefreshing}
                    className={`text-white text-xs font-medium py-1 px-2 rounded transition-all 
                      ${isSeeding || isSkewing || isFunding || isRefreshing
                        ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                        : "bg-blue-500/80 hover:bg-blue-600 hover:shadow-sm"}`}
                  >
                    {isSeeding ? (
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin h-3 w-3 mr-1 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Seeding...</span>
                      </div>
                    ) : (
                      <span>Execute</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <StatusIndicator success={seedSuccess} error={seedError} />
          </div>

          {/* Skew Prices Button */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-amber-500/30 group">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-1 mr-2 shadow-md group-hover:shadow-amber-500/20 transition-all">
                <span className="text-white flex items-center justify-center w-3.5 h-3.5">📈</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-white/80 text-xs font-medium">Skew Prices</p>
                  <span className="text-xs px-1 py-0 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px]">
                    Modify Rates
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <button
                    onClick={handleSkewPrices}
                    disabled={isSeeding || isSkewing || isFunding || isRefreshing}
                    className={`text-white text-xs font-medium py-1 px-2 rounded transition-all 
                      ${isSeeding || isSkewing || isFunding || isRefreshing
                        ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                        : "bg-amber-500/80 hover:bg-amber-600 hover:shadow-sm"}`}
                  >
                    {isSkewing ? (
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin h-3 w-3 mr-1 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Skewing...</span>
                      </div>
                    ) : (
                      <span>Execute</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <StatusIndicator success={skewSuccess} error={skewError} />
          </div>

          {/* Fund Wallet Button */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-2 border border-white/10 transition-all hover:border-emerald-500/30 group">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-1 mr-2 shadow-md group-hover:shadow-emerald-500/20 transition-all">
                <span className="text-white flex items-center justify-center w-3.5 h-3.5">⛽</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-white/80 text-xs font-medium">Fund Wallet</p>
                  <span className="text-xs px-1 py-0 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px]">
                    1 ETH
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <button
                    onClick={handleFundWallet}
                    disabled={isSeeding || isSkewing || isFunding || isRefreshing || !account}
                    className={`text-white text-xs font-medium py-1 px-2 rounded transition-all 
                      ${isSeeding || isSkewing || isFunding || isRefreshing || !account
                        ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-500/80 hover:bg-emerald-600 hover:shadow-sm"}`}
                  >
                    {isFunding ? (
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin h-3 w-3 mr-1 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Funding...</span>
                      </div>
                    ) : (
                      <span>Execute</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <StatusIndicator success={fundSuccess} error={fundError} />
          </div>
        </div>
      </div>
      
      {/* Add Flash Loan Execution Tracker */}
      <FlashLoanExecutionTracker />
    </div>
  );
} 