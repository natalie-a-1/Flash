"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "./web3/Web3Provider";

/**
 * Component that checks and displays if the current user is the owner of the FlashLoan contract
 */
export default function ContractOwnerStatus() {
  const { web3, isConnected, account } = useWeb3();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contractOwner, setContractOwner] = useState<string>("");

  useEffect(() => {
    async function checkOwnership() {
      if (!isConnected || !account || !web3) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Load the FlashLoan contract
        const { loadContract } = await import("@/lib/web3/contracts");
        const flashLoanContract = await loadContract("FlashLoan");
        
        if (!flashLoanContract) {
          console.error("FlashLoan contract not found or not deployed on this network");
          setIsLoading(false);
          return;
        }
        
        // Get the contract owner
        const owner: string = await flashLoanContract.methods.getOwner().call();
        setContractOwner(owner);
        
        // Check if current user is owner
        const userAccount: string = account as string;
        setIsOwner(userAccount.toLowerCase() === owner.toLowerCase());
      } catch (error) {
        console.error("Error checking contract ownership:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkOwnership();
  }, [isConnected, account, web3]);

  if (isLoading) {
    return (
      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm animate-pulse">
        Checking contract ownership...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm">
        Please connect your wallet to check contract ownership.
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl text-sm ${
      isOwner 
        ? "bg-green-500/20 border border-green-500/30 text-green-300" 
        : "bg-amber-600/20 border border-amber-600/30 text-amber-300"
    }`}>
      <div className="flex items-center mb-1">
        {isOwner ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Contract Owner</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Not Contract Owner</span>
          </>
        )}
      </div>
      {isOwner ? (
        <p>You are the owner of the FlashLoan contract and can execute flash loans.</p>
      ) : (
        <p>Only the contract owner can execute flash loans. Current owner: {contractOwner.slice(0, 6)}...{contractOwner.slice(-4)}</p>
      )}
    </div>
  );
} 