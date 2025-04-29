"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";
import { TokenPairPrices } from "@/types/arbitrage";
import { getTimeElapsed } from "@/lib/utils/timeUtils";
import { fetchDexPrices, findBestArbitragePath } from "@/lib/services/priceService";
import { ethers } from "ethers";
import { formatTokenAmount } from "@/lib/web3/utils";

/**
 * ArbitrageOpportunities component displays potential arbitrage opportunities
 * by fetching and analyzing token pair prices from various decentralized exchanges (DEXs).
 */
export default function ArbitrageOpportunities() {
  // Destructure necessary values from the Web3 context
  const { web3, isConnected, isCorrectNetwork } = useWeb3();

  // State variables to manage component data and UI state
  const [prices, setPrices] = useState<TokenPairPrices>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  /**
   * Fetches price data from DEXs using the ethers Web3Provider.
   * Updates the component state with the fetched prices or logs an error if fetching fails.
   */
  const fetchPrices = async () => {
    if (!window.ethereum || !isConnected || !isCorrectNetwork) {
      console.log("Cannot fetch prices: Wallet not connected or not on Ethereum Mainnet.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setPrices({});

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const fetchedPrices = await fetchDexPrices(provider, EXCHANGES, PAIRS);
      setPrices(fetchedPrices);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching prices:", error);
      setPrices({});
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sets the mounted flag to true for client-side rendering.
   * Ensures that client-side logic is executed only after the component is mounted.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Sets up polling for price updates every 15 seconds if the wallet is connected
   * and on the correct network. Clears the interval when the component is unmounted.
   */
  useEffect(() => {
    if (!mounted) return;

    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    if (isConnected && isCorrectNetwork) {
      fetchPrices();
      const interval = setInterval(fetchPrices, 15000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else {
      setPrices({});
      setLastUpdated(null);
      setIsLoading(false);
    }
  }, [isConnected, isCorrectNetwork, mounted]);

  /**
   * Renders a skeleton layout during server-side rendering to prevent hydration mismatch.
   * Displays a consistent structure while the component is mounting.
   */
  if (!mounted) {
    return (
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium text-white">Arbitrage Opportunities</h2>
          <div className="h-6 w-24 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-white/5 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  /**
   * Main rendering logic for the ArbitrageOpportunities component.
   * Displays arbitrage opportunities or prompts the user to connect their wallet or switch networks.
   */
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-6 shadow-xl border border-white/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-medium text-white">Arbitrage Opportunities</h2>
        <div className="flex items-center">
          <button
            onClick={fetchPrices}
            disabled={isLoading || !isConnected || !isCorrectNetwork}
            className={`mr-2 p-2 rounded-full transition-all ${
              isLoading || !isConnected || !isCorrectNetwork
                ? "bg-gray-700 text-white/50 cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <span className="text-xs text-white/60">
            Updated: {isLoading ? "Updating..." : getTimeElapsed(lastUpdated)}
          </span>
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-10 text-white/60">
          <p>Connect your wallet to view arbitrage opportunities</p>
        </div>
      ) : !isCorrectNetwork ? (
        <div className="text-center py-10 text-white/60">
          <p>Please switch to Ethereum Mainnet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {PAIRS.map((pair) => {
            const pairPrices = prices[pair.name] || {};
            const bestPath = pairPrices ? findBestArbitragePath(pairPrices) : null;

            return (
              <div key={pair.name} className="border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-white/5 py-3 px-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{pair.name}</span>
                    {bestPath && (
                      <span
                        className={`text-sm rounded-full px-3 py-1 ${
                          bestPath.percentage >= 1
                            ? "bg-green-500/20 text-green-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {bestPath.percentage.toFixed(2)}% opportunity
                      </span>
                    )}
                  </div>
                </div>

                {bestPath && (
                  <div className="flex items-center space-x-4 px-4 py-2 bg-white/5 border-b border-white/10">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Buy on {bestPath.buy}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                      Sell on {bestPath.sell}
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <div className="text-sm text-white/70 mb-3">
                    Prices shown as <span className="font-medium">WETH per 1 USDC</span> (higher is better for selling WETH)
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      {EXCHANGES.map((exchange) => (
                        <div key={exchange.name} className="flex justify-between">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{exchange.icon}</span>
                            <span className="text-white/70">{exchange.name}</span>
                          </div>
                          <div className="w-24 h-5 bg-white/10 animate-pulse rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4">
                      {EXCHANGES.map((exchange) => {
                        const price = pairPrices[exchange.name] ?? 0;
                        const isBestBuy = bestPath?.buy === exchange.name;
                        const isBestSell = bestPath?.sell === exchange.name;
                        return (
                          <div key={exchange.name} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{exchange.icon}</span>
                              <span className="text-white">{exchange.name}</span>
                            </div>
                            <div className="flex items-center">
                              {isBestBuy && (
                                <span className="mr-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                  Best for Buying {pair.quoteSymbol}
                                </span>
                              )}
                              {isBestSell && (
                                <span className="mr-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                  Best for Selling {pair.quoteSymbol}
                                </span>
                              )}
                              <span
                                className={`font-medium ${
                                  isBestBuy
                                    ? "text-green-400"
                                    : isBestSell
                                    ? "text-amber-400"
                                    : "text-white"
                                }`}
                              >
                                {formatTokenAmount(price, 8, pair.quoteSymbol, false)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {bestPath && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="bg-white/5 rounded-lg p-3">
                        <h3 className="text-sm text-white/70 mb-2">Suggested Strategy</h3>
                        <div className="text-sm text-white">
                          1. Buy WETH on{" "}
                          <span className="font-medium text-green-400">{bestPath.buy}</span> (Lower price = costs less USDC)
                        </div>
                        <div className="text-sm text-white">
                          2. Sell WETH on{" "}
                          <span className="font-medium text-amber-400">{bestPath.sell}</span> (Higher price = gets more USDC)
                        </div>
                        <div className="text-sm text-white mt-1">
                          Potential profit:{" "}
                          <span className="font-medium text-green-400">
                            {bestPath.percentage.toFixed(2)}%
                          </span>
                          <span className="text-white/50 text-xs ml-2">(before gas fees)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}