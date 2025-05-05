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
  const {
    account,
    isConnected,
    isCorrectNetwork,
    networkName,
    connectWallet,
    switchNetwork,
    usdcBalance,
  } = useWeb3();

  const { lastUpdated } = useGlobalData();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTooltip = () => {
    setIsTooltipVisible(!isTooltipVisible);
  };

  const hideTooltip = () => {
    setIsTooltipVisible(false);
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toggleTooltip();
      setTimeout(() => {
        setIsTooltipVisible(false);
      }, 2000);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-3">Your Wallet</h3>

      <div className="mt-3">
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
                <span className="text-white/70 font-medium">Connected</span>
              </div>
            </div>

            <div
              className="flex items-center justify-center bg-slate-700/40 rounded-lg p-2 border border-slate-600/40 cursor-pointer relative hover:bg-slate-700/60 transition-colors"
              onClick={copyAddress}
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-white/60"
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
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-3 w-auto whitespace-nowrap">
                  Address copied!
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-black"></div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">Network</span>
              <div
                className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                  isCorrectNetwork
                    ? "bg-green-400/10 text-green-300"
                    : "bg-red-400/10 text-red-300"
                }`}
              >
                {networkName || "Unknown"}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">USDC Balance</span>
              <div className="bg-blue-400/10 text-blue-300 px-2.5 py-1 rounded-full text-sm font-medium">
                {usdcBalance !== null
                  ? `${parseFloat(usdcBalance).toFixed(2)} USDC`
                  : "Loading..."}
              </div>
            </div>

            {!isCorrectNetwork && (
              <button
                onClick={switchNetwork}
                className="w-full mt-2 bg-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-600 transition-all duration-200"
              >
                Switch to Ethereum Mainnet
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                <span className="text-white/70 font-medium">Disconnected</span>
              </div>
            </div>

            <button
              onClick={connectWallet}
              className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
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
