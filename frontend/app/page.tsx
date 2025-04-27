"use client";

import { useWeb3 } from "@/components/web3/Web3Provider";
import { FAUCETS } from "@/lib/web3/config";
import Link from "next/link";
import PriceComparison from '@/components/PriceComparison';

export default function Home() {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    networkName,
    connectWallet,
    switchNetwork,
  } = useWeb3();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Flash Blockchain
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Explore flash loan arbitrage opportunities between DEXes using Aave V3
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Card */}
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-semibold mb-6">Connection Status</h2>

            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-green-500/20 text-green-400 p-3 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Connected to Wallet</span>
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Account</span>
                    <span className="font-mono">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Network</span>
                    <span className={isCorrectNetwork ? "text-green-400" : "text-amber-400"}>
                      {networkName}
                    </span>
                  </div>
                </div>

                {!isCorrectNetwork && (
                  <button
                    onClick={switchNetwork}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg"
                  >
                    Switch to Sepolia
                  </button>
                )}

                {isCorrectNetwork && (
                  <Link 
                    href="/dashboard" 
                    className="w-full block py-3 text-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
                  >
                    Launch Dashboard
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 p-3 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">Wallet Not Connected</span>
                </div>
                
                <button
                  onClick={connectWallet}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            {/* Faucet Links */}
            {isConnected && isCorrectNetwork && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Sepolia Faucets</h3>
                <p className="text-sm text-white/70 mb-3">
                  Need test ETH? Get some from these faucets:
                </p>
                <div className="space-y-2">
                  {FAUCETS[11155111].map((faucet, index) => (
                    <a
                      key={index}
                      href={faucet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-all"
                    >
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {faucet.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-semibold mb-6">About Flash Loans</h2>
            
            <div className="space-y-4 text-white/80">
              <p>
                Flash loans allow you to borrow assets without upfront collateral, provided the borrowed amount plus fees are returned within the same transaction.
              </p>
              
              <h3 className="text-lg font-medium text-white mt-6 mb-2">How It Works</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Borrow assets from Aave using a flash loan</li>
                <li>Execute arbitrage between Uniswap and SushiSwap</li>
                <li>Return the borrowed amount plus fees to Aave</li>
                <li>Keep the profit from the arbitrage</li>
              </ol>
              
              <h3 className="text-lg font-medium text-white mt-6 mb-2">Getting Started</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Connect your wallet to Sepolia testnet</li>
                <li>Get test ETH from a faucet</li>
                <li>Visit the dashboard to monitor arbitrage opportunities</li>
                <li>Execute flash loans when profitable opportunities arise</li>
              </ul>
            </div>

            {isConnected && isCorrectNetwork && (
              <div className="mt-6">
                <Link 
                  href="/dashboard" 
                  className="w-full block py-3 text-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg"
                >
                  Explore Opportunities
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Price Comparison */}
        <div className="max-w-4xl mx-auto mt-12">
          <PriceComparison />
        </div>
      </div>
    </main>
  );
}
