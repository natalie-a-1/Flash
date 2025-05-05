"use client";

import { useWeb3 } from "./Web3Provider";
import { truncateAddress } from "@/lib/web3/utils";
import { useState, useEffect } from "react";
import { useGlobalData } from "./GlobalDataProvider";

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

  // Get global data (now managing auto-updates)
  const { lastUpdated } = useGlobalData();

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
   * Show or hide the tooltip
   */
  const toggleTooltip = () => {
    setIsTooltipVisible(!isTooltipVisible);
  };

  /**
   * Hide the tooltip when mouse leaves
   */
  const hideTooltip = () => {
    setIsTooltipVisible(false);
  };

  /**
   * Copy the wallet address to clipboard and show tooltip
   */
  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toggleTooltip();
      setTimeout(() => {
        setIsTooltipVisible(false);
      }, 2000);
    }
  };

  // Only render on the client-side
  if (!mounted) return null;

  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/60 shadow-xl">
      <h3 className="text-lg font-semibold text-white">Your Wallet</h3>

      <div className="mt-4">
        {isConnected ? (
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
              <span className="text-white/70 font-medium">Connected</span>
            </div>
          </div>

          {/* Wallet Address */}
          <div
            className="flex items-center justify-center bg-slate-700/50 rounded-lg p-2 border border-slate-600/50 cursor-pointer relative hover:bg-slate-700/70 transition-colors"
            onClick={copyAddress}
            onMouseLeave={hideTooltip}
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-white/70"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 00-.707 1.707L7 4.414v1.586H5.414l-.707-.707A1 1 0 003 6v11a1 1 0 001 1h11a1 1 0 001-1V6a1 1 0 00-1.707-.707L13.586 6H12V4.414l.707-.707A1 1 0 0011 2H7zm2 6h2v2H9V8zm8-2v11H3V6h1v2h12V6h1zm-3-2V4H8v2h6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-mono text-xs text-white">
                {account ? truncateAddress(account) : ""}
              </span>
            </div>
            {isTooltipVisible && (
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-4 w-auto whitespace-nowrap border border-slate-700">
                Address copied!
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-black border-t border-l border-slate-700"></div>
              </div>
            )}
          </div>

          {/* Network Connection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-white/70">Network</span>
            </div>
            <div
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                isCorrectNetwork
                  ? "bg-green-400/20 text-green-300"
                  : "bg-red-400/20 text-red-300"
              }`}
            >
              {networkName || "Unknown"}
            </div>
          </div>

          {/* USDC Balance Display - Auto-updating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-white/70">USDC Balance</span>
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
    </div>
  );
}
