"use client";

import { useWeb3 } from "@/components/web3/Web3Provider";
import ArbitrageOpportunities from "@/components/ArbitrageOpportunities";
import FlashLoanOptions from "@/components/FlashLoanOptions";
import QuickStats from "@/components/TransactionFees";
import WalletConnection from "@/components/web3/WalletConnection";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Dashboard component for displaying arbitrage opportunities and flash loan options.
 * Handles wallet connection status and network checks.
 */
export default function Dashboard() {
  // Destructure necessary values from the Web3 context
  const { isConnected, isCorrectNetwork, connectWallet } = useWeb3();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  /**
   * useEffect hook for client-side rendering and authentication check.
   * Redirects to the home page if the wallet is not connected.
   */
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

  /**
   * Render a skeleton layout during server-side rendering.
   * Provides a consistent structure while the component is mounting.
   */
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

  /**
   * Display a loading state initially while data is being fetched or processed.
   */
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

  /**
   * Fallback UI to prompt the user to connect their wallet if not connected.
   * This should not be shown due to the redirect, but serves as a backup.
   */
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

  /**
   * Main dashboard UI rendering.
   * Displays wallet connection status, network status, and arbitrage opportunities.
   */
  return (
    <main className="container mx-auto px-3 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4">
          <div className="space-y-3">
            <ArbitrageOpportunities />
            <QuickStats />
          </div>
        </div>
        <div className="lg:col-span-8">
          <FlashLoanOptions />
        </div>
      </div>
    </main>
  );
} 