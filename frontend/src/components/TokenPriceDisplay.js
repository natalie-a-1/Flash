/**
 * @file TokenPriceDisplay.js
 * @description Component for displaying and comparing token prices across DEXes
 * 
 * This component fetches and displays token prices from Uniswap and SushiSwap,
 * compares them to detect arbitrage opportunities, and notifies parent components
 * when such opportunities are found. It supports both real blockchain data and mock data.
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Uniswap V2 Router ABI (only the functions we need)
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
];

// Token ABI (only the functions we need)
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

/**
 * Component for displaying token prices from different exchanges and detecting arbitrage opportunities
 * 
 * @param {Object} props - Component props
 * @param {Object} props.provider - Ethers.js provider for blockchain interaction
 * @param {string} props.uniswapRouterAddress - Address of the Uniswap router contract
 * @param {string} props.sushiswapRouterAddress - Address of the SushiSwap router contract
 * @param {string} props.tokenA - Address of the first token in the trading pair
 * @param {string} props.tokenB - Address of the second token in the trading pair
 * @param {Function} props.onArbitrageOpportunityChange - Callback for arbitrage opportunity changes
 * @param {boolean} props.mockMode - Whether to use mock data instead of blockchain data
 * @param {Object} props.mockData - Mock data for testing without blockchain interactions
 * @returns {JSX.Element} Rendered component
 */
const TokenPriceDisplay = ({ 
  provider, 
  uniswapRouterAddress, 
  sushiswapRouterAddress,
  tokenA,
  tokenB,
  onArbitrageOpportunityChange,
  mockMode = false,
  mockData = null
}) => {
  // Component state
  const [uniswapPrice, setUniswapPrice] = useState(mockMode ? mockData.uniswapPrice : null);
  const [sushiswapPrice, setSushiswapPrice] = useState(mockMode ? mockData.sushiswapPrice : null);
  const [arbitrageOpportunity, setArbitrageOpportunity] = useState(mockMode ? mockData.hasArbitrageOpportunity : false);
  const [arbitrageProfit, setArbitrageProfit] = useState(mockMode ? mockData.arbitrageProfit : 0);
  const [tokenASymbol, setTokenASymbol] = useState(mockMode ? mockData.tokenASymbol : '');
  const [tokenBSymbol, setTokenBSymbol] = useState(mockMode ? mockData.tokenBSymbol : '');
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Amount in for price calculation (1 token with 18 decimals)
  const amountIn = ethers.utils.parseEther("1");

  // Effect for fetching token symbols
  useEffect(() => {
    if (mockMode) {
      // If in mock mode, use the mock data
      setTokenASymbol(mockData.tokenASymbol);
      setTokenBSymbol(mockData.tokenBSymbol);
      
      // Notify parent component about the mock arbitrage opportunity
      if (onArbitrageOpportunityChange) {
        onArbitrageOpportunityChange(
          mockData.hasArbitrageOpportunity,
          mockData.tokenASymbol,
          mockData.tokenBSymbol
        );
      }
      return;
    }

    /**
     * Fetches token symbols from the blockchain
     */
    const fetchTokenSymbols = async () => {
      if (!provider || !tokenA || !tokenB) return;

      try {
        const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, provider);
        const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, provider);
        
        const symbolA = await tokenAContract.symbol();
        const symbolB = await tokenBContract.symbol();
        
        setTokenASymbol(symbolA);
        setTokenBSymbol(symbolB);
      } catch (error) {
        console.error("Error fetching token symbols:", error);
      }
    };

    fetchTokenSymbols();
  }, [provider, tokenA, tokenB, mockMode, mockData, onArbitrageOpportunityChange]);

  // Effect for fetching and comparing token prices
  useEffect(() => {
    if (mockMode) {
      // In mock mode, we don't need to fetch prices
      return;
    }

    /**
     * Fetches token prices from Uniswap and SushiSwap and looks for arbitrage opportunities
     */
    const fetchPrices = async () => {
      if (!provider || !uniswapRouterAddress || !sushiswapRouterAddress || !tokenA || !tokenB) {
        return;
      }

      try {
        // Create contract instances
        const uniswapRouter = new ethers.Contract(uniswapRouterAddress, ROUTER_ABI, provider);
        const sushiswapRouter = new ethers.Contract(sushiswapRouterAddress, ROUTER_ABI, provider);

        // Create the path for token swaps
        const path = [tokenA, tokenB];

        // Get amounts out from Uniswap
        const uniswapAmountsOut = await uniswapRouter.getAmountsOut(amountIn, path);
        const uniswapAmountOut = uniswapAmountsOut[1];
        
        // Get amounts out from Sushiswap
        const sushiswapAmountsOut = await sushiswapRouter.getAmountsOut(amountIn, path);
        const sushiswapAmountOut = sushiswapAmountsOut[1];

        // Format prices
        const uniswapPriceFormatted = ethers.utils.formatEther(uniswapAmountOut);
        const sushiswapPriceFormatted = ethers.utils.formatEther(sushiswapAmountOut);
        
        setUniswapPrice(uniswapPriceFormatted);
        setSushiswapPrice(sushiswapPriceFormatted);

        // Check for arbitrage opportunity
        const priceDifference = Math.abs(
          Number(uniswapPriceFormatted) - Number(sushiswapPriceFormatted)
        );
        
        const hasOpportunity = priceDifference > 0.01; // 1% price difference threshold
        setArbitrageOpportunity(hasOpportunity);
        
        if (hasOpportunity) {
          // Simple profit calculation (doesn't account for gas or flash loan fees)
          setArbitrageProfit(priceDifference);
        } else {
          setArbitrageProfit(0);
        }

        // Notify the parent component about the arbitrage opportunity
        if (onArbitrageOpportunityChange) {
          onArbitrageOpportunityChange(hasOpportunity, tokenASymbol, tokenBSymbol);
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    fetchPrices();
    
    // Set up a timer to refresh prices every 30 seconds
    const intervalId = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [provider, uniswapRouterAddress, sushiswapRouterAddress, tokenA, tokenB, refreshCounter, amountIn, 
      tokenASymbol, tokenBSymbol, mockMode, onArbitrageOpportunityChange]);

  // Display loading state while fetching prices
  if (!mockMode && (!uniswapPrice || !sushiswapPrice)) {
    return <div className="loading">Loading prices...</div>;
  }

  return (
    <div className="price-display">
      <h2>Exchange Prices: {tokenASymbol} → {tokenBSymbol}</h2>
      {mockMode && <div className="mock-data-notice">Using mock data for demonstration</div>}
      <div className="prices">
        <div className="price-card">
          <h3>Uniswap</h3>
          <p className="price">1 {tokenASymbol} = {parseFloat(uniswapPrice).toFixed(6)} {tokenBSymbol}</p>
        </div>
        <div className="price-card">
          <h3>SushiSwap</h3>
          <p className="price">1 {tokenASymbol} = {parseFloat(sushiswapPrice).toFixed(6)} {tokenBSymbol}</p>
        </div>
      </div>
      
      <div className={`arbitrage-opportunity ${arbitrageOpportunity ? 'active' : ''}`}>
        {arbitrageOpportunity ? (
          <>
            <h3>Arbitrage Opportunity Detected!</h3>
            <p>Potential profit: {parseFloat(arbitrageProfit).toFixed(6)} {tokenBSymbol} per {tokenASymbol}</p>
          </>
        ) : (
          <h3>No significant arbitrage opportunity at the moment</h3>
        )}
      </div>
    </div>
  );
};

export default TokenPriceDisplay; 