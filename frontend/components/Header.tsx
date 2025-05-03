"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3 } from "./web3/Web3Provider";

/**
 * Header component for the application.
 * Displays the application name, connection status, and navigation links.
 *
 * @returns {JSX.Element} The rendered header component.
 */
export default function Header() {
  // Get the current pathname from the Next.js router
  const pathname = usePathname();

  // Destructure necessary values from the Web3 context
  const { isConnected, isCorrectNetwork, account, connectWallet, networkName } =
    useWeb3();

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

          <div className="flex items-center">
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
                {/* Display the network name */}
                <span className="text-xs ml-2 px-2 py-1 rounded-full bg-white/10 text-white/70 hidden md:inline-block">
                  {networkName || "Unknown Network"}
                </span>
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
