"use client";

import { useWeb3 } from "./Web3Provider";
import { truncateAddress } from "@/lib/web3/utils";
import { useState, useEffect } from "react";

/**
 * WalletConnection component handles the display and interaction
 * for connecting a user's wallet. It shows the connection status,
 * network information, and provides options to connect or switch networks.
 */
export default function WalletConnection() {
  // Destructure necessary values from the Web3 context
  const {
    web3,
    account,
    isConnected,
    isCorrectNetwork,
    networkName,
    networkId,
    connectWallet,
    switchNetwork,
    usdcBalance,
    refreshBalance,
  } = useWeb3();

  // State to manage tooltip visibility
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  // State to track if the component is mounted
  const [mounted, setMounted] = useState(false);

  /**
   * useEffect hook to set the mounted state to true
   * when the component is mounted. This ensures that
   * client-side logic is executed only after mounting.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Refresh the USDC balance when the refresh button is clicked
   */
  const handleRefreshBalance = async () => {
    await refreshBalance();
  };

  /**
   * Render a skeleton layout during server-side rendering.
   * This prevents hydration mismatch by providing a consistent
   * structure while the component is mounting.
   */
  if (!mounted) {
    return (
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
        <h2 className="text-2xl font-medium text-white mb-4">
          Wallet Connection
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-white/10 rounded w-1/3"></div>
            <div className="h-5 bg-white/10 rounded-full w-1/4"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-5 bg-white/10 rounded w-1/4"></div>
            <div className="h-5 bg-white/10 rounded-full w-1/3"></div>
          </div>
          <div className="h-10 bg-white/10 rounded-lg w-full mt-2"></div>
        </div>
      </div>
    );
  }

  /**
   * Main rendering logic for the WalletConnection component.
   * Displays connection status, network information, and provides
   * buttons for connecting or switching networks.
   */
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-medium text-white mb-4">
        Wallet Connection
      </h2>

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
              <span className="text-white font-medium">Connected</span>
            </div>
            <div
              className="text-white/80 bg-white/10 py-1 px-3 rounded-full text-sm flex items-center"
              onMouseEnter={() => setIsTooltipVisible(true)}
              onMouseLeave={() => setIsTooltipVisible(false)}
              style={{ position: "relative" }}
            >
              {truncateAddress(account || "")}
              {isTooltipVisible && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded py-1 px-3 whitespace-nowrap">
                  {account}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/70">Network</span>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isCorrectNetwork
                  ? "bg-emerald-400/20 text-emerald-400"
                  : "bg-amber-400/20 text-amber-400"
              }`}
            >
              {networkName}
            </div>
          </div>

          {/* USDC Balance Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-white/70">USDC Balance</span>
              <button 
                onClick={handleRefreshBalance}
                className="text-blue-400 hover:text-blue-300"
                title="Refresh Balance"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="bg-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
              {usdcBalance !== null ? `${parseFloat(usdcBalance).toFixed(2)} USDC` : 'Loading...'}
            </div>
          </div>

          {!isCorrectNetwork && (
            <button
              onClick={switchNetwork}
              className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/30"
            >
              Switch to Ethereum Mainnet
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <span className="text-white/70 font-medium">Disconnected</span>
            </div>
          </div>

          <button
            onClick={connectWallet}
            className="w-full mt-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 20V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
