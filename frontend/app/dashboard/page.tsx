"use client";

import { useWeb3 } from "@/components/web3/Web3Provider";
import ArbitrageOpportunities from "@/components/ArbitrageOpportunities";
import FlashLoanOptions from "@/components/FlashLoanOptions";
import WalletConnection from "@/components/web3/WalletConnection";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const router = useRouter();

  // If user is not connected, redirect to home
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Flash Loan Dashboard</h1>
          <p className="text-slate-300">Monitor arbitrage opportunities and execute flash loans</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="md:col-span-1">
            <WalletConnection />
            
            <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
              <h2 className="text-2xl font-medium text-white mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/70 text-sm">Network Status</p>
                  <p className="text-white font-medium">{isCorrectNetwork ? "Sepolia Testnet" : "Wrong Network"}</p>
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