/**
 * @file ArbitrageExecutor.js
 * @description Component for executing flash loan arbitrage transactions
 * 
 * This component provides the UI and functionality for executing flash loan
 * arbitrage transactions when profitable opportunities are detected. It handles
 * transaction submission, monitoring, and result display. Supports mock mode for
 * testing without real blockchain interactions.
 */

import React, { useState } from 'react';
import { ethers } from 'ethers';

// Import ABI for FlashLoanArbitrage contract
import FlashLoanArbitrageABI from '../contracts/FlashLoanArbitrage.json';

/**
 * Component for executing flash loan arbitrage transactions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.provider - Ethers.js provider for blockchain interaction
 * @param {string} props.account - Connected wallet address
 * @param {string} props.contractAddress - Address of the FlashLoanArbitrage contract
 * @param {string} props.tokenA - Address of the first token in the trading pair
 * @param {string} props.tokenB - Address of the second token in the trading pair
 * @param {string} props.tokenASymbol - Symbol of token A
 * @param {string} props.tokenBSymbol - Symbol of token B
 * @param {boolean} props.hasOpportunity - Whether an arbitrage opportunity exists
 * @param {boolean} props.mockMode - Whether to use mock mode
 * @returns {JSX.Element} Rendered component
 */
const ArbitrageExecutor = ({ 
  provider, 
  account, 
  contractAddress, 
  tokenA, 
  tokenB,
  tokenASymbol,
  tokenBSymbol,
  hasOpportunity,
  mockMode = false
}) => {
  // Component state
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profit, setProfit] = useState(null);

  /**
   * Execute the flash loan arbitrage transaction
   * In mock mode, simulates the process without blockchain interaction
   * In real mode, interacts with the FlashLoanArbitrage contract
   */
  const executeArbitrage = async () => {
    if (mockMode) {
      // In mock mode, simulate the execution process
      setIsExecuting(true);
      setError('');
      setSuccess(false);
      setProfit(null);
      setTxHash('');

      // Simulate network delay
      setTimeout(() => {
        // Simulate a successful transaction
        setTxHash('0x' + Math.random().toString(16).substr(2, 64));
        
        // Simulate success after some delay
        setTimeout(() => {
          setSuccess(true);
          setProfit('30.50');
          setIsExecuting(false);
        }, 2000);
      }, 1500);
      
      return;
    }
    
    if (!provider || !account || !contractAddress || !tokenA || !tokenB) {
      setError('Missing required information to execute arbitrage');
      return;
    }

    setIsExecuting(true);
    setError('');
    setSuccess(false);
    setProfit(null);
    setTxHash('');

    try {
      // Get signer from provider
      const signer = provider.getSigner();
      
      // Create contract instance
      const flashLoanArbitrage = new ethers.Contract(
        contractAddress,
        FlashLoanArbitrageABI.abi,
        signer
      );

      // Amount to borrow in flash loan (e.g., 10,000 units of TokenA)
      const flashLoanAmount = ethers.utils.parseEther('10000');
      
      // Create paths for the arbitrage
      const path = [tokenA, tokenB];
      const reversePath = [tokenB, tokenA];
      
      // Encode parameters for the flash loan
      const params = ethers.utils.defaultAbiCoder.encode(
        ['address[]', 'address[]'],
        [path, reversePath]
      );

      // Execute the transaction
      const tx = await flashLoanArbitrage.initiateFlashLoan(
        tokenA,
        flashLoanAmount,
        params,
        { gasLimit: 3000000 } // Set a generous gas limit
      );

      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Check for success and get profit from event logs
      if (receipt.status === 1) {
        // Find ArbitrageExecuted event in the logs
        const arbitrageEvent = receipt.events?.find(
          (event) => event.event === 'ArbitrageExecuted'
        );
        
        if (arbitrageEvent && arbitrageEvent.args) {
          const profitAmount = ethers.utils.formatEther(arbitrageEvent.args.profit);
          setProfit(profitAmount);
        }
        
        setSuccess(true);
      } else {
        setError('Transaction failed');
      }
    } catch (err) {
      console.error('Error executing arbitrage:', err);
      setError(err.message || 'Failed to execute arbitrage');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="arbitrage-executor">
      <h2>Execute Flash Loan Arbitrage</h2>
      
      {mockMode && <div className="mock-data-notice">Using mock execution (no real transactions)</div>}
      
      <div className="arbitrage-info">
        <p>Trading pair: {tokenASymbol || 'Token A'} / {tokenBSymbol || 'Token B'}</p>
        <p>Flash Loan Contract: {contractAddress ? `${contractAddress.substr(0, 6)}...${contractAddress.substr(-4)}` : 'Not connected'}</p>
        <p>Status: {hasOpportunity ? 
          <span className="opportunity-active">Arbitrage opportunity detected!</span> : 
          <span className="opportunity-inactive">No significant arbitrage opportunity</span>
        }</p>
      </div>
      
      <button 
        className={`execute-button ${hasOpportunity ? 'active' : 'disabled'}`}
        onClick={executeArbitrage}
        disabled={!hasOpportunity || isExecuting || (!mockMode && !account)}
      >
        {isExecuting ? 'Executing...' : 'Execute Arbitrage'}
      </button>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {txHash && (
        <div className="transaction-info">
          <p>Transaction hash: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            {txHash.substr(0, 10)}...{txHash.substr(-8)}
          </a></p>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <h3>Arbitrage Successful!</h3>
          {profit && <p>Profit: {profit} {tokenASymbol}</p>}
        </div>
      )}
    </div>
  );
};

export default ArbitrageExecutor; 