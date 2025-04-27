"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3 } from "./web3/Web3Provider";

export default function Header() {
  const pathname = usePathname();
  const { isConnected, isCorrectNetwork, account } = useWeb3();

  return (
    <header className="backdrop-blur-lg bg-black/20 border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <Link 
              href="/" 
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
            >
              Flash Blockchain
            </Link>
            
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-900/50 text-indigo-300 rounded ml-2">
              BETA
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`text-sm ${pathname === '/' ? 'text-white font-medium' : 'text-white/70 hover:text-white'}`}
            >
              Home
            </Link>
            
            <Link 
              href="/dashboard" 
              className={`text-sm ${pathname === '/dashboard' ? 'text-white font-medium' : 'text-white/70 hover:text-white'}`}
            >
              Dashboard
            </Link>
          </nav>
          
          <div className="flex items-center">
            {isConnected ? (
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${isCorrectNetwork ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                <span className="text-xs text-white/80 hidden md:inline-block">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="text-xs text-amber-400">Not Connected</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 