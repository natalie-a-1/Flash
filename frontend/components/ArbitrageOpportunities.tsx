"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";
import { formatTokenAmount, calculateArbitragePercentage, isArbitrageOpportunity } from "@/lib/web3/utils";
import { SEPOLIA_ADDRESSES } from "@/lib/web3/config";

// Exchange objects with name, router address, and icon
const EXCHANGES = [
  {
    name: "Uniswap V2",
    router: SEPOLIA_ADDRESSES.UNISWAP_V2_ROUTER,
    icon: "🦄"
  },
  {
    name: "SushiSwap",
    router: SEPOLIA_ADDRESSES.SUSHISWAP_V2_ROUTER,
    icon: "🍣"
  }
];

// Token pairs for arbitrage
const PAIRS = [
  {
    name: "USDC/WETH",
    tokens: [SEPOLIA_ADDRESSES.USDC, SEPOLIA_ADDRESSES.WETH],
    baseSymbol: "USDC",
    quoteSymbol: "WETH"
  }
];

export default function ArbitrageOpportunities() {
  const { web3, isConnected, isCorrectNetwork } = useWeb3();
  
  const [prices, setPrices] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Function to fetch price data (mock implementation)
  const fetchPrices = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - In a real app, you would query the actual DEX routers
      // The structure is: prices[pairName][exchangeName] = priceValue
      const mockPrices: Record<string, Record<string, number>> = {
        "USDC/WETH": {
          "Uniswap V2": 0.000512, // 1 USDC = 0.000512 WETH
          "SushiSwap": 0.000517,  // 1 USDC = 0.000517 WETH
        }
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add some randomness to the mock prices to simulate market movement
      for (const pair in mockPrices) {
        for (const exchange in mockPrices[pair]) {
          // Add +/- 0.5% random variation
          const variation = 1 + (Math.random() * 0.01 - 0.005);
          mockPrices[pair][exchange] *= variation;
        }
      }
      
      setPrices(mockPrices);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching prices:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Client-side only
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Setup polling for price updates - only on client side
  useEffect(() => {
    if (!mounted) return;
    
    if (isConnected && isCorrectNetwork) {
      // Fetch initial data
      fetchPrices();
      
      // Setup interval for regular updates
      const interval = setInterval(fetchPrices, 15000); // Update every 15 seconds
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      // Clear any existing interval if not connected
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isConnected, isCorrectNetwork, mounted]);
  
  // Format the time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return "Never";
    
    const now = new Date();
    const seconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (seconds < 60) {
      return `${seconds} sec ago`;
    } else {
      return `${Math.floor(seconds / 60)} min ago`;
    }
  };
  
  // Determine the best path for arbitrage
  const findBestArbitragePath = (pair: string) => {
    if (!prices[pair]) return null;
    
    const exchanges = Object.keys(prices[pair]);
    if (exchanges.length < 2) return null;
    
    let bestDiff = 0;
    let bestPath = null;
    
    // Compare all possible exchange combinations
    for (let i = 0; i < exchanges.length; i++) {
      for (let j = 0; j < exchanges.length; j++) {
        if (i === j) continue;
        
        const buyExchange = exchanges[i];
        const sellExchange = exchanges[j];
        const buyPrice = prices[pair][buyExchange];
        const sellPrice = prices[pair][sellExchange];
        
        const diff = calculateArbitragePercentage(buyPrice, sellPrice);
        
        if (diff > bestDiff && diff > 0.5) { // Only consider opportunities above 0.5%
          bestDiff = diff;
          bestPath = {
            buy: buyExchange,
            sell: sellExchange,
            percentage: diff
          };
        }
      }
    }
    
    return bestPath;
  };
  
  // Show skeleton during server rendering
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
            Updated: {isLoading ? "Updating..." : getTimeSinceUpdate()}
          </span>
        </div>
      </div>
      
      {!isConnected ? (
        <div className="text-center py-10 text-white/60">
          <p>Connect your wallet to view arbitrage opportunities</p>
        </div>
      ) : !isCorrectNetwork ? (
        <div className="text-center py-10 text-white/60">
          <p>Please switch to Sepolia network</p>
        </div>
      ) : (
        <div className="space-y-4">
          {PAIRS.map((pair) => {
            const pairPrices = prices[pair.name];
            const bestPath = findBestArbitragePath(pair.name);
            
            return (
              <div key={pair.name} className="border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-white/5 py-3 px-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{pair.name}</span>
                    {bestPath && (
                      <span className={`text-sm rounded-full px-3 py-1 ${
                        bestPath.percentage >= 1 ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {bestPath.percentage.toFixed(2)}% opportunity
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
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
                    <div className="space-y-3">
                      {EXCHANGES.map((exchange) => {
                        const price = pairPrices?.[exchange.name] || 0;
                        const isBestBuy = bestPath?.buy === exchange.name;
                        const isBestSell = bestPath?.sell === exchange.name;
                        
                        return (
                          <div key={exchange.name} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{exchange.icon}</span>
                              <span className="text-white/70">{exchange.name}</span>
                            </div>
                            <div className={`font-mono ${
                              isBestBuy ? "text-red-400" : isBestSell ? "text-green-400" : "text-white"
                            }`}>
                              {price ? formatTokenAmount(price, 6) : "N/A"}
                              
                              {isBestBuy && (
                                <span className="ml-2 text-xs">BUY</span>
                              )}
                              {isBestSell && (
                                <span className="ml-2 text-xs">SELL</span>
                              )}
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
                          1. Buy on <span className="font-medium text-cyan-400">{bestPath.buy}</span> at lower price
                        </div>
                        <div className="text-sm text-white">
                          2. Sell on <span className="font-medium text-cyan-400">{bestPath.sell}</span> at higher price
                        </div>
                        <div className="text-sm text-white mt-1">
                          Potential profit: <span className="font-medium text-green-400">{bestPath.percentage.toFixed(2)}%</span>
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