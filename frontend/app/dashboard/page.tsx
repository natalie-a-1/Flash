"use client";

import { useWeb3 } from "@/components/web3/Web3Provider";
import ArbitrageOpportunities from "@/components/ArbitrageOpportunities";
import FlashLoanOptions from "@/components/FlashLoanOptions";
import WalletConnection from "@/components/web3/WalletConnection";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { isConnected, isCorrectNetwork, connectWallet } = useWeb3();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Effect for client-side rendering and auth check
  useEffect(() => {
    setMounted(true);
    
    // Small timeout to prevent flickering during hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      if (!isConnected) {
        router.push("/");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  // During server rendering, return a skeleton with the same structure
  if (!mounted) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Skeleton for dashboard layout */}
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-1/4 mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="h-64 bg-white/10 rounded-2xl mb-6"></div>
                <div className="h-64 bg-white/10 rounded-2xl"></div>
              </div>
              <div className="md:col-span-2">
                <div className="h-96 bg-white/10 rounded-2xl mb-6"></div>
                <div className="h-64 bg-white/10 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show loading state initially
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-white/70 mt-4">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // If not connected, this should never show as the redirect should happen
  // But as a fallback, show a prompt to connect
  if (!isConnected) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <h2 className="text-2xl font-semibold mb-4">Wallet Not Connected</h2>
          <p className="text-white/70 mb-6">You need to connect your wallet to access the dashboard</p>
          <div className="flex justify-center">
            <button 
              onClick={connectWallet}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-300 mb-8">Monitor arbitrage opportunities and execute flash loans</p>

        {!isCorrectNetwork && (
          <div className="mb-8 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg p-4 flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Please switch to Ethereum Mainnet</p>
              <p className="text-sm text-amber-400/80">Some features may not work correctly on the current network</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="md:col-span-1">
            <WalletConnection />
            
            <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
              <h2 className="text-2xl font-medium text-white mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/70 text-sm">Network Status</p>
                  <p className="text-white font-medium">{isCorrectNetwork ? "Ethereum Mainnet" : "Wrong Network"}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/70 text-sm">Best Opportunity</p>
                  <p className="text-cyan-400 font-medium">USDC/WETH: +0.72%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/70 text-sm">Gas Price (Gwei)</p>
                  <p className="text-white font-medium">12.5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="md:col-span-2 space-y-6">
            <ArbitrageOpportunities />
            <FlashLoanOptions />
          </div>
        </div>
      </div>
    </main>
  );
} 