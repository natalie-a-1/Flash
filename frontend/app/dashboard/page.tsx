"use client";

import { useWeb3 } from "@/components/web3/Web3Provider";
import ArbitrageOpportunities from "@/components/ArbitrageOpportunities";
import FlashLoanOptions from "@/components/FlashLoanOptions";
import QuickStats from "@/components/TransactionFees";
import DevelopmentTools from "@/components/DevelopmentTools";
import { NETWORK_IDS } from "@/lib/web3/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Dashboard component for displaying arbitrage opportunities and flash loan options.
 * Handles wallet connection status and network checks.
 */
export default function Dashboard() {
  // Destructure necessary values from the Web3 context
  const { isConnected, isCorrectNetwork, connectWallet, networkId } = useWeb3();
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
      // Only redirect if mounted and not connected
      if (mounted && !isConnected) { // Check mounted explicitly
         console.log("Dashboard: Not connected after mount, redirecting...");
         router.push("/");
      }
    }, 500); 

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, mounted, router]); // Add mounted to dependency array

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-4 space-y-3">
                    {/* Skeleton for Dev Tools */} 
                     <div className="h-28 bg-yellow-900/10 rounded-xl"></div> 
                    {/* Skeleton for Arbitrage Opps */}
                    <div className="h-96 bg-white/10 rounded-xl"></div>
                     {/* Skeleton for Quick Stats */}
                    <div className="h-48 bg-white/10 rounded-xl"></div>
                </div>
                <div className="lg:col-span-8">
                     {/* Skeleton for Flash Loan Options */}
                    <div className="h-[500px] bg-white/10 rounded-xl"></div>
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
  if (isLoading && !isConnected) {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
            {/* ... Loading Spinner ... */}
              <svg
                className="w-8 h-8 text-blue-500 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            <p className="text-white/70 mt-4">Loading dashboard...</p>
            </div>
        </main>
    );
  }

  /**
   * Fallback UI if not connected (should typically be handled by redirect).
   */
  // This state might be briefly visible before redirect kicks in
  if (!isConnected) {
      return (
            <main className="min-h-screen flex items-center justify-center">
                 <div className="max-w-md w-full px-4 text-center">
                  <h2 className="text-2xl font-semibold mb-4">Wallet Not Connected</h2>
                  <p className="text-white/70 mb-6">
                    Redirecting to connect page...
                  </p>
                 {/* Optional: Add a manual connect button if redirect fails */}
                </div>
            </main>
        );
  }

  /**
   * Main dashboard UI rendering.
   */
  return (
    <main className="container mx-auto px-3 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4">
          <div className="space-y-3">
            {/* Conditionally render DevelopmentTools only on Local Fork */} 
            {networkId === NETWORK_IDS.LOCALHOST && (
              <DevelopmentTools />
            )}
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
