"use client";

import { useState, useEffect } from 'react';
import { isRouterApproved } from '@/lib/web3/aave';
import { useWeb3 } from '../web3/Web3Provider';
import { MAINNET_ADDRESSES } from '@/lib/web3/config';

interface RouterApprovalStatusProps {
  className?: string;
}

export default function RouterApprovalStatus({ className = '' }: RouterApprovalStatusProps) {
  // Always return null to prevent this component from displaying in the frontend
  return null;
  
  // Original component code is kept but not executed
  /* 
  const { isConnected, account } = useWeb3();
  const [owner, setOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [uniswapApproved, setUniswapApproved] = useState<boolean | null>(null);
  const [sushiswapApproved, setSushiswapApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const routers = [
    { name: 'Uniswap V2', address: MAINNET_ADDRESSES.UNISWAP_V2_ROUTER, setter: setUniswapApproved, state: uniswapApproved },
    { name: 'SushiSwap', address: MAINNET_ADDRESSES.SUSHISWAP_V2_ROUTER, setter: setSushiswapApproved, state: sushiswapApproved }
  ];

  // Check if the current account is the contract owner
  useEffect(() => {
    const checkOwnership = async () => {
      if (!window.flashLoanContract || !isConnected || !account) {
        setIsOwner(false);
        return;
      }
      
      try {
        const contractOwner = await window.flashLoanContract.getOwner();
        setOwner(contractOwner);
        setIsOwner(contractOwner.toLowerCase() === account.toLowerCase());
      } catch (error) {
        console.error("Error checking contract ownership:", error);
        setIsOwner(false);
      }
    };
    
    checkOwnership();
  }, [isConnected, account]);

  // Check approval status for routers
  useEffect(() => {
    const checkApprovals = async () => {
      if (!window.flashLoanContract || !isConnected) {
        setUniswapApproved(null);
        setSushiswapApproved(null);
        return;
      }
      
      setLoading(true);
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
    
    checkApprovals();
  }, [isConnected]);

  // Function to approve a router (owner only)
  const approveRouter = async (routerAddress: string, routerName: string) => {
    if (!window.flashLoanContract || !isOwner) {
      setError("Only the contract owner can approve routers");
      return;
    }
    
    setApproving(routerName);
    setError(null);
    try {
      const tx = await window.flashLoanContract.setRouterApproval(routerAddress, true);
      await tx.wait();
      
      // Update approval state
      if (routerName === 'Uniswap V2') {
        setUniswapApproved(true);
      } else if (routerName === 'SushiSwap') {
        setSushiswapApproved(true);
      }
    } catch (error) {
      console.error(`Error approving ${routerName} router:`, error);
      setError(`Failed to approve ${routerName} router`);
    } finally {
      setApproving(null);
    }
  };

  if (!isConnected || !window.flashLoanContract) {
    return null;
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-4 mt-4 ${className}`}>
      <h3 className="text-lg font-medium text-white mb-3">Router Approval Status</h3>
      
      {loading ? (
        <div className="text-gray-400">Checking router approvals...</div>
      ) : (
        <>
          <div className="space-y-2">
            {routers.map((router) => (
              <div key={router.address} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-300">{router.name} Router:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    router.state === true ? 'bg-green-500/20 text-green-400' : 
                    router.state === false ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {router.state === true ? 'Approved' : 
                     router.state === false ? 'Not Approved' : 'Unknown'}
                  </span>
                </div>
                
                {isOwner && router.state === false && (
                  <button
                    onClick={() => approveRouter(router.address, router.name)}
                    disabled={!!approving}
                    className={`px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors 
                      ${approving === router.name ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {approving === router.name ? 'Approving...' : 'Approve'}
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {error && (
            <div className="mt-2 text-red-400 text-sm">{error}</div>
          )}
          
          {!isOwner && owner && (
            <div className="mt-3 text-amber-400 text-sm">
              Note: Only the contract owner can approve routers.
              <div className="text-xs text-gray-400 mt-1">
                Owner address: {owner}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
  */
} 