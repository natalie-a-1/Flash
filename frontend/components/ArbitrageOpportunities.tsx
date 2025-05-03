"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";
import { TokenPairPrices, Exchange } from "@/types/arbitrage";
import { getTimeElapsed } from "@/lib/utils/timeUtils";
import {
  fetchDexPrices,
  findBestArbitragePath,
} from "@/lib/services/priceService";
import { ethers } from "ethers";
import { formatTokenAmount } from "@/lib/web3/utils";

/**
 * ArbitrageOpportunities component displays potential arbitrage opportunities
 * by fetching and analyzing token pair prices from various decentralized exchanges (DEXs).
 * Allows user selection of DEXs for profit calculation.
 */
export default function ArbitrageOpportunities() {
  // Destructure necessary values from the Web3 context
  const { web3, isConnected, isCorrectNetwork } = useWeb3();

  // State variables to manage component data and UI state
  const [prices, setPrices] = useState<TokenPairPrices>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  /**
   * Fetches price data from DEXs using the ethers Web3Provider.
   * Updates the component state with the fetched prices or logs an error if fetching fails.
   */
  const fetchPrices = async () => {
    if (!window.ethereum || !isConnected || !isCorrectNetwork) {
      console.log(
        "Cannot fetch prices: Wallet not connected or not on Ethereum Mainnet.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setPrices({});

    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any,
      );
      const fetchedPrices = await fetchDexPrices(
        provider,
        EXCHANGES as Exchange[],
        PAIRS,
      );
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
      const interval = setInterval(fetchPrices, 60_000); // every minute
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
      <div className="rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-lg p-3 shadow-xl border border-white/10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <div className="w-6 h-6 mr-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-full flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8.5H14.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 16.5H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.5 16.5H14.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 12.03V16.11C22 19.62 19.62 22 16.11 22H7.89C4.38 22 2 19.62 2 16.11V7.89C2 4.38 4.38 2 7.89 2H14.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 7V2M17.5 4.5H22.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            Arbitrage Opportunities
          </h2>
          <div className="h-4 w-20 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-28 bg-white/5 rounded-xl w-full"></div>
          <div className="h-28 bg-white/5 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  /**
   * Main rendering logic for the ArbitrageOpportunities component.
   * Displays arbitrage opportunities or prompts the user to connect their wallet or switch networks.
   */
  return (
    <div className="rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-lg p-4 shadow-xl border border-white/10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <div className="w-6 h-6 mr-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-full flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8.5H14.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 16.5H8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.5 16.5H14.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 12.03V16.11C22 19.62 19.62 22 16.11 22H7.89C4.38 22 2 19.62 2 16.11V7.89C2 4.38 4.38 2 7.89 2H14.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 7V2M17.5 4.5H22.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          Arbitrage Opportunities
        </h2>
        <div className="flex items-center bg-white/5 px-2 py-1 rounded-lg border border-white/10">
          <button
            onClick={fetchPrices}
            disabled={isLoading || !isConnected || !isCorrectNetwork}
            className={`mr-1.5 p-1 rounded-lg transition-all ${
              isLoading || !isConnected || !isCorrectNetwork
                ? "bg-gray-700/50 text-white/50 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30"
            }`}
            aria-label="Refresh prices"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
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
          <span className="text-xs text-white/70 font-medium">
            {isLoading ? "Updating..." : getTimeElapsed(lastUpdated)}
          </span>
        </div>
      </div>

      {!isConnected ? (
        <div className="flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl text-white/70 text-xs">
          <svg
            className="w-4 h-4 mr-2 text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 16V8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 16V16.01"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          Connect wallet to view arbitrage opportunities
        </div>
      ) : !isCorrectNetwork ? (
        <div className="flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl text-white/70 text-xs">
          <svg
            className="w-4 h-4 mr-2 text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 16V8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 16V16.01"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          Please switch to Ethereum Mainnet
        </div>
      ) : (
        <div className="space-y-3">
          {PAIRS.map((pair) => {
            const pairPrices = prices[pair.name] || {};
            const bestPath = findBestArbitragePath(pairPrices);

            return (
              <div
                key={pair.name}
                className="border border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40"
              >
                <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 py-1.5 px-2.5 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-medium">
                      {pair.name}
                    </span>
                    {bestPath && bestPath.percentage > 0 && (
                      <span
                        className={`text-xs rounded-lg px-2 py-0.5 ${
                          bestPath.percentage >= 1
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        Profit: {bestPath.percentage.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="text-xs text-white/80 mb-2 flex items-center">
                    <div className="w-1 h-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 mr-1.5"></div>
                    <span className="font-medium">
                      {pair.quoteSymbol} per 1 {pair.baseSymbol}
                    </span>
                  </div>

                  {isLoading ? (
                    <div className="space-y-2 p-1.5">
                      {EXCHANGES.map((exchange, index) => (
                        <div
                          key={exchange.name + index}
                          className="flex justify-between items-center p-1.5 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center">
                            <span className="text-sm mr-1.5">
                              {exchange.icon}
                            </span>
                            <span className="text-white/70 text-xs">
                              {exchange.name}
                            </span>
                          </div>
                          <div className="w-16 h-3 bg-white/10 animate-pulse rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2 mb-4">
                      {EXCHANGES.map((exchange) => {
                        if (
                          exchange.name === "Balancer V2" ||
                          exchange.name === "Curve USDC/ETH"
                        ) {
                          return null;
                        }

                        const price = pairPrices[exchange.name] ?? 0;
                        const isBestBuy = bestPath?.buy === exchange.name;
                        const isBestSell = bestPath?.sell === exchange.name;
                        return (
                          <div
                            key={exchange.name}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              isBestBuy
                                ? "bg-green-900/20 border-green-600/30"
                                : isBestSell
                                  ? "bg-amber-900/20 border-amber-600/30"
                                  : "bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-sm mr-1.5">
                                {exchange.icon}
                              </span>
                              <span
                                className={`text-xs ${isBestBuy || isBestSell ? "text-white" : "text-white/80"}`}
                              >
                                {exchange.name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {(isBestBuy || isBestSell) && (
                                <span
                                  className={`mr-1.5 px-1.5 py-0.5 text-xs rounded ${
                                    isBestBuy
                                      ? "bg-green-500/30 text-green-300 border border-green-500/40"
                                      : "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                                  }`}
                                >
                                  {isBestBuy ? "BEST BUY" : "BEST SELL"}
                                </span>
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  isBestBuy
                                    ? "text-green-300"
                                    : isBestSell
                                      ? "text-amber-300"
                                      : "text-white"
                                }`}
                              >
                                {formatTokenAmount(
                                  price,
                                  8,
                                  pair.quoteSymbol,
                                  false,
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
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
