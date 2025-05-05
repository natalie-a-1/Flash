"use client";

import { useState, useEffect } from "react";
import { isRouterApproved } from "@/lib/web3/aave";
import { MAINNET_ADDRESSES } from "@/lib/web3/config";
import { useWeb3 } from "./Web3Provider";

/**
 * RouterApprovalStatus component displays the current status of router approvals
 * and explains why they are needed for flash loan execution.
 */
export default function RouterApprovalStatus() {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const [uniswapApproved, setUniswapApproved] = useState<boolean | null>(null);
  const [sushiswapApproved, setSushiswapApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check router approvals when the component mounts
  useEffect(() => {
    const checkRouterApprovals = async () => {
      if (!isConnected || !isCorrectNetwork || !window.flashLoanContract) {
        setUniswapApproved(null);
        setSushiswapApproved(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const [uniApproved, sushiApproved] = await Promise.all([
          isRouterApproved(MAINNET_ADDRESSES.UNISWAP_V2_ROUTER),
          isRouterApproved(MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER)
        ]);
        
        setUniswapApproved(uniApproved);
        setSushiswapApproved(sushiApproved);
      } catch (error) {
        console.error("Error checking router approvals:", error);
        setError("Failed to check router approvals");
      } finally {
        setLoading(false);
      }
    };
    
    checkRouterApprovals();
  }, [isConnected, isCorrectNetwork]);

  // If not connected or not on the correct network, don't show anything
  if (!isConnected || !isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-2">Router Approval Status</h2>
      
      {loading ? (
        <p className="text-gray-300 text-sm animate-pulse">Checking router approvals...</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Uniswap V2 Router:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                uniswapApproved ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
              }`}>
                {uniswapApproved ? 'Approved' : 'Not Approved'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">SushiSwap Router:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                sushiswapApproved ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
              }`}>
                {sushiswapApproved ? 'Approved' : 'Not Approved'}
              </span>
            </div>
          </div>
          
          {/* Explanation box */}
          <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-800/50 mt-3">
            <h3 className="text-blue-400 text-sm font-semibold mb-1">Why are router approvals needed?</h3>
            <p className="text-gray-300 text-xs leading-relaxed">
              Router approvals allow the Flash Loan contract to interact with DEX routers 
              (Uniswap, SushiSwap) during arbitrage execution. This is a security feature 
              that controls which external contracts can execute trades through the Flash Loan contract.
            </p>
            <p className="text-gray-300 text-xs mt-2 leading-relaxed">
              Approvals are set by the contract owner when the contract is deployed. When using a new 
              local fork, these approvals need to be reset, which the <code className="bg-slate-700 px-1 rounded text-xs">fork:with-approvals</code> script 
              handles automatically.
            </p>
          </div>
        </>
      )}
    </div>
  );
} 