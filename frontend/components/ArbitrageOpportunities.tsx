"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { EXCHANGES, PAIRS } from "@/lib/constants/dex";
import { NETWORK_IDS } from "@/lib/web3/config";
import { TokenPairPrices, Exchange } from "@/types/arbitrage";
import { useGlobalData } from "./web3/GlobalDataProvider";
import { findBestArbitragePath } from "@/lib/services/priceService";
import { formatTokenAmount } from "@/lib/web3/utils";

/**
 * ArbitrageOpportunities component displays potential arbitrage opportunities
 * by analyzing token pair prices from various decentralized exchanges (DEXs).
 * Uses the GlobalDataProvider for automatic data updates.
 */
export default function ArbitrageOpportunities() {
  // Destructure necessary values from the Web3 context
  const { isConnected, isCorrectNetwork, networkId } = useWeb3();
  
  // Get data from the global provider
  const { dexPrices, isLoading } = useGlobalData();

  // State for component-specific UI
  const [mounted, setMounted] = useState(false);

  /**
   * Sets the mounted flag to true for client-side rendering.
   * Ensures that client-side logic is executed only after the component is mounted.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Determine which exchanges to display based on network ---
  const exchangesToShow = EXCHANGES.filter((exchange) => {
    // Always hide Balancer and Curve for now
    if (exchange.name === "Balancer V2" || exchange.name === "Curve USDC/ETH") {
      return false;
    }

    // If connected to Mainnet, show V2 and V3
    if (networkId === NETWORK_IDS.MAINNET) {
      return true; // All others (V2, V3) are shown
    }

    // If connected to localhost fork, show only V2/Sushi
    if (networkId === NETWORK_IDS.LOCALHOST) {
      return (
        exchange.name === "Uniswap V2" || exchange.name === "SushiSwap"
      );
    }
    
    // Default: If networkId is null or unsupported, potentially show nothing or default set
    // Current logic falls through to showing nothing if not Mainnet or Localhost
    return false; 
  });

  /**
   * Renders a skeleton layout during server-side rendering to prevent hydration mismatch.
   * Displays a consistent structure while the component is mounting.
   */
  if (!mounted) {
    return (
      <div className="rounded-xl bg-slate-800/50 p-3 shadow-lg border border-slate-700/50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-white flex items-center">
            <div className="w-6 h-6 mr-2 bg-amber-500/90 rounded-full flex items-center justify-center">
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
    <div className="rounded-xl bg-slate-800/50 p-4 shadow-lg border border-slate-700/50">
      <h2 className="text-lg font-medium text-white flex items-center mb-3">
        <div className="w-6 h-6 mr-2 bg-amber-500/90 rounded-full flex items-center justify-center">
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

      {!isConnected ? (
        <div className="flex items-center justify-center p-4 bg-slate-700/30 rounded-lg text-white/70 text-sm">
          Connect wallet to view opportunities
        </div>
      ) : !isCorrectNetwork ? (
        <div className="flex items-center justify-center p-4 bg-slate-700/30 rounded-lg text-white/70 text-sm">
          Please switch to Ethereum Mainnet
        </div>
      ) : (
        <div className="space-y-3">
          {PAIRS.map((pair) => {
            const pairPrices = dexPrices[pair.name] || {};

            // Filter prices to include only those from visible exchanges
            const visiblePrices = {};
            exchangesToShow.forEach((exchange) => {
              if (pairPrices.hasOwnProperty(exchange.name)) {
                visiblePrices[exchange.name] = pairPrices[exchange.name];
              }
            });

            // Find the best path using only the visible prices
            const bestPath = findBestArbitragePath(visiblePrices);

            return (
              <div
                key={pair.name}
                className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/30"
              >
                <div className="bg-slate-700/30 py-2 px-3 border-b border-slate-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-medium">
                      {pair.name}
                    </span>
                    {bestPath && bestPath.percentage > 0 && (
                      <span
                        className={`text-xs rounded-lg px-2 py-0.5 ${
                          bestPath.percentage >= 1
                            ? "bg-green-500/10 text-green-300 border border-green-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        Profit: {bestPath.percentage.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <div className="text-xs text-white/70 mb-2">
                    {pair.quoteSymbol} per 1 {pair.baseSymbol}
                  </div>

                  {isLoading ? (
                    <div className="space-y-2">
                      {exchangesToShow.map((exchange, index) => (
                        <div
                          key={exchange.name + index}
                          className="flex justify-between items-center p-2 rounded-lg bg-slate-700/20 border border-slate-700/30"
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
                    <div className="grid gap-2">
                      {exchangesToShow.map((exchange) => {
                        const price = pairPrices[exchange.name] ?? 0;
                        const isBestBuy = bestPath?.buy?.name === exchange.name;
                        const isBestSell = bestPath?.sell?.name === exchange.name;
                        return (
                          <div
                            key={exchange.name}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              isBestBuy
                                ? "bg-green-900/10 border-green-600/20"
                                : isBestSell
                                  ? "bg-amber-900/10 border-amber-600/20"
                                  : "bg-slate-700/20 border-slate-700/30 hover:bg-slate-700/30 transition-colors"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-sm mr-1.5">
                                {exchange.icon}
                              </span>
                              <span
                                className={`text-xs ${isBestBuy || isBestSell ? "text-white" : "text-white/70"}`}
                              >
                                {exchange.name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {(isBestBuy || isBestSell) && (
                                <span
                                  className={`mr-2 px-1.5 py-0.5 text-xs rounded ${
                                    isBestBuy
                                      ? "bg-green-500/20 text-green-300"
                                      : "bg-amber-500/20 text-amber-300"
                                  }`}
                                >
                                  {isBestBuy ? "BUY" : "SELL"}
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
