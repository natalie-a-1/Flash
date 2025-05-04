"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3 } from "./web3/Web3Provider";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NETWORK_IDS, NETWORK_NAMES, RPC_URLS } from "@/lib/web3/config";
import { switchToMainnet, getNetworkDetails } from "@/lib/web3/web3";

/**
 * Header component for the application.
 * Displays the application name, connection status, and network selection dropdown.
 *
 * @returns {JSX.Element} The rendered header component.
 */
export default function Header() {
  // Get the current pathname from the Next.js router
  const pathname = usePathname();

  // Destructure necessary values from the Web3 context
  const { isConnected, isCorrectNetwork, account, connectWallet, networkName } =
    useWeb3();

  // Network switch state
  const [isFork, setIsFork] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // For the dropdown portal
  const [isBrowser, setIsBrowser] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialize browser state for client-side rendering
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Initialize state and subscribe to chain changes
  useEffect(() => {
    const updateNetwork = async () => {
      const { id } = await getNetworkDetails();
      console.log("Current network ID:", id);
      setIsFork(id === NETWORK_IDS.LOCALHOST);
    };

    if (isConnected) {
      updateNetwork();

      const handleChainChanged = (chainIdHex: string) => {
        const id = parseInt(chainIdHex, 16);
        console.log("Chain changed to:", id);
        setIsFork(id === NETWORK_IDS.LOCALHOST);
      };

      window.ethereum?.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [isConnected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Switch network function
  const switchNetwork = async (toLocalhost: boolean) => {
    console.log(
      "Attempting to switch to:",
      toLocalhost ? "localhost" : "mainnet",
    );

    if (!window.ethereum) {
      alert("MetaMask is not installed");
      return;
    }

    setIsDropdownOpen(false); // Close dropdown immediately

    try {
      if (toLocalhost) {
        // Switch to local fork (localhost)
        const chainIdHex = `0x${NETWORK_IDS.LOCALHOST.toString(16)}`;
        console.log("Switching to chain ID:", chainIdHex);

        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
          });
          console.log("Switch request sent successfully");
        } catch (error: any) {
          console.error("Switch chain error:", error);
          // If network not added, add it
          if (error.code === 4902) {
            console.log("Network not added, adding it now");
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chainIdHex,
                  chainName: NETWORK_NAMES[NETWORK_IDS.LOCALHOST],
                  rpcUrls: [RPC_URLS[NETWORK_IDS.LOCALHOST]],
                  nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            });
            console.log("Network added successfully");
          } else {
            throw error;
          }
        }
      } else {
        // Switch back to Ethereum Mainnet
        console.log("Switching to mainnet");
        await switchToMainnet();
        console.log("Mainnet switch request sent");
      }
    } catch (err: any) {
      console.error("Network switching error:", err);
      // MetaMask may throw an internal error code when the chain actually changed
      if (
        err.code === -32603 ||
        (err.message && err.message.includes("change in selected network"))
      ) {
        // Suppress this error; chainChanged event will update the UI
        console.log("Ignoring expected MetaMask error");
        return;
      }
      alert(`Failed to switch network: ${err.message || err}`);
    }
  };

  // Simplified dropdown rendering directly in component (no portal)
  return (
    <header className="backdrop-blur-lg bg-black/20 border-b border-white/10">
      <div className="container mx-auto px-3 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            {/* Link to the dashboard if connected, otherwise to the home page */}
            <Link
              href={isConnected ? "/dashboard" : "/"}
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
            >
              Flash
            </Link>

            {/* Beta tag for the application */}
            <span className="px-1 py-0.5 text-[10px] font-semibold bg-indigo-900/50 text-indigo-300 rounded ml-1">
              BETA
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {isConnected ? (
              <div className="flex items-center">
                {/* Indicator for network status */}
                <div
                  className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isCorrectNetwork ? "bg-green-400" : "bg-amber-400"}`}
                ></div>

                {/* Display the connected account address */}
                <span className="text-xs text-white/80 hidden md:inline-block">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>

                {/* Network Switch - Simplified */}
                <div className="relative ml-2">
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/70 shadow-sm transition-all hover:border-slate-600/70">
                    <button
                      onClick={() => switchNetwork(false)}
                      className={`text-xs font-medium ${!isFork ? "text-cyan-400" : "text-slate-400"} px-2 py-0.5 rounded hover:bg-slate-700/50`}
                    >
                      Mainnet
                    </button>

                    <div className="h-3 w-px bg-slate-600/50"></div>

                    <button
                      onClick={() => switchNetwork(true)}
                      className={`text-xs font-medium ${isFork ? "text-cyan-400" : "text-slate-400"} px-2 py-0.5 rounded hover:bg-slate-700/50`}
                    >
                      Local
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Button to connect the wallet
              <button
                onClick={connectWallet}
                className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors px-2 py-1 rounded-full"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
