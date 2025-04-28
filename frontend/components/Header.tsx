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
  const { isConnected, isCorrectNetwork, account, connectWallet } = useWeb3();

  return (
    <header className="backdrop-blur-lg bg-black/20 border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            {/* Link to the dashboard if connected, otherwise to the home page */}
            <Link 
              href={isConnected ? "/dashboard" : "/"} 
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
            >
              Flash
            </Link>
            
            {/* Beta tag for the application */}
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-900/50 text-indigo-300 rounded ml-2">
              BETA
            </span>
          </div>
          
          <div className="flex items-center">
            {isConnected ? (
              <div className="flex items-center">
                {/* Indicator for network status */}
                <div className={`h-2 w-2 rounded-full mr-2 ${isCorrectNetwork ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                {/* Display the connected account address */}
                <span className="text-xs text-white/80 hidden md:inline-block">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>
            ) : (
              // Button to connect the wallet
              <button
                onClick={connectWallet}
                className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors px-3 py-1.5 rounded-full"
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