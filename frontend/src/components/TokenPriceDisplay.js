/**
 * @file TokenPriceDisplay.js
 * @description Component for displaying and comparing token prices across DEXes
 * 
 * This component fetches and displays token prices from Uniswap and SushiSwap,
 * compares them to detect arbitrage opportunities, and notifies parent components
 * when such opportunities are found. It supports both real blockchain data and mock data.
 */

import React, { useState, useEffect, useCallback } from 'react';
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

// Factory ABI (for swap events)
const FACTORY_ABI = [
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

// Pair ABI (for swap events)
const PAIR_ABI = [
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"
];

// Uniswap V2 Factory address (Sepolia testnet)
const UNISWAP_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

// SushiSwap Factory address (Sepolia testnet)
const SUSHISWAP_FACTORY_ADDRESS = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";

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
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [uniswapPair, setUniswapPair] = useState(null);
  const [sushiswapPair, setSushiswapPair] = useState(null);
  const [isLoading, setIsLoading] = useState(!mockMode);

  // Amount in for price calculation (1 token with 18 decimals)
  const amountIn = ethers.utils.parseEther("1");
  
  // Set up a WebSocket provider if available
  const [wsProvider, setWsProvider] = useState(null);
  
  useEffect(() => {
    if (mockMode || !provider) return;
    
    // Try to create a WebSocket provider
    try {
      // Check if the provider has a connection URL (like Infura or Alchemy)
      const network = provider.network;
      if (network && network.name !== 'unknown') {
        // Try to get the connection info from the current provider
        const connectionInfo = provider.connection;
        if (connectionInfo && connectionInfo.url && connectionInfo.url.startsWith('http')) {
          // Replace http with wss for WebSocket connection
          const wsUrl = connectionInfo.url.replace('http', 'ws');
          const newWsProvider = new ethers.providers.WebSocketProvider(wsUrl);
          setWsProvider(newWsProvider);
          
          return () => {
            if (newWsProvider && newWsProvider._websocket) {
              newWsProvider._websocket.close();
            }
          };
        }
      }
    } catch (error) {
      console.warn("Could not set up WebSocket provider:", error);
    }
  }, [provider, mockMode]);

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

  // Function to find liquidity pair addresses
  const findPairAddresses = useCallback(async () => {
    if (!provider || !tokenA || !tokenB) return;
    
    try {
      const uniswapFactory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, FACTORY_ABI, provider);
      const sushiswapFactory = new ethers.Contract(SUSHISWAP_FACTORY_ADDRESS, FACTORY_ABI, provider);
      
      // Find pair addresses - this is needed to listen to swap events
      // Note: In a production app, you'd use the getPair function from the factory
      // Here we're using a simpler approach for demonstration
      // Create a filter for PairCreated events with our tokens
      const filter = {
        topics: [
          ethers.utils.id("PairCreated(address,address,address,uint256)"),
          [
            ethers.utils.hexZeroPad(tokenA.toLowerCase(), 32),
            ethers.utils.hexZeroPad(tokenB.toLowerCase(), 32)
          ],
          [
            ethers.utils.hexZeroPad(tokenA.toLowerCase(), 32),
            ethers.utils.hexZeroPad(tokenB.toLowerCase(), 32)
          ]
        ]
      };
      
      // Query for past events
      const uniswapEvents = await uniswapFactory.queryFilter(filter);
      const sushiswapEvents = await sushiswapFactory.queryFilter(filter);
      
      if (uniswapEvents.length > 0) {
        setUniswapPair(uniswapEvents[0].args.pair);
      }
      
      if (sushiswapEvents.length > 0) {
        setSushiswapPair(sushiswapEvents[0].args.pair);
      }
    } catch (error) {
      console.error("Error finding pair addresses:", error);
    }
  }, [provider, tokenA, tokenB]);

  // Fetch prices function
  const fetchPrices = useCallback(async () => {
    if (!provider || !uniswapRouterAddress || !sushiswapRouterAddress || !tokenA || !tokenB) {
      return;
    }

    setIsLoading(true);
    try {
      // Check if connected to the correct network (Sepolia)
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111) {
        console.error(`Wrong network detected: ${network.name || network.chainId}. Please switch to Sepolia.`);
        setUniswapPrice("0");
        setSushiswapPrice("0");
        setArbitrageOpportunity(false);
        setArbitrageProfit(0);
        setIsLoading(false);
        return;
      }

      console.log("Attempting to fetch prices from Sepolia testnet...");
      console.log(`Uniswap Router: ${uniswapRouterAddress}`);
      console.log(`Sushiswap Router: ${sushiswapRouterAddress}`);
      console.log(`Token A: ${tokenA}`);
      console.log(`Token B: ${tokenB}`);

      // Create contract instances
      const uniswapRouter = new ethers.Contract(uniswapRouterAddress, ROUTER_ABI, provider);
      const sushiswapRouter = new ethers.Contract(sushiswapRouterAddress, ROUTER_ABI, provider);

      // Create the path for token swaps
      const path = [tokenA, tokenB];

      let uniswapPriceFormatted = "0";
      let sushiswapPriceFormatted = "0";
      
      // Get amounts out from Uniswap with error handling
      try {
        console.log("Fetching price from Uniswap...");
        const uniswapAmountsOut = await uniswapRouter.getAmountsOut(amountIn, path);
        const uniswapAmountOut = uniswapAmountsOut[1];
        uniswapPriceFormatted = ethers.utils.formatEther(uniswapAmountOut);
        console.log("Uniswap price successfully fetched:", uniswapPriceFormatted);
      } catch (uniswapError) {
        console.warn("Error fetching Uniswap price:", uniswapError.message);
        console.log("This might be because:");
        console.log("1. The Uniswap router address is incorrect on Sepolia");
        console.log("2. There is no liquidity for this token pair on Uniswap Sepolia");
        console.log("3. One or both token addresses are incorrect");
        // Continue with default value
      }
      
      // Get amounts out from Sushiswap with error handling
      try {
        console.log("Fetching price from Sushiswap...");
        const sushiswapAmountsOut = await sushiswapRouter.getAmountsOut(amountIn, path);
        const sushiswapAmountOut = sushiswapAmountsOut[1];
        sushiswapPriceFormatted = ethers.utils.formatEther(sushiswapAmountOut);
        console.log("Sushiswap price successfully fetched:", sushiswapPriceFormatted);
      } catch (sushiswapError) {
        console.warn("Error fetching Sushiswap price:", sushiswapError.message);
        console.log("This might be because:");
        console.log("1. The Sushiswap router address is incorrect on Sepolia");
        console.log("2. There is no liquidity for this token pair on Sushiswap Sepolia");
        console.log("3. One or both token addresses are incorrect");
        // Continue with default value
      }

      // Only proceed if at least one price was fetched successfully
      if (uniswapPriceFormatted !== "0" || sushiswapPriceFormatted !== "0") {
        setUniswapPrice(uniswapPriceFormatted);
        setSushiswapPrice(sushiswapPriceFormatted);
        setLastUpdated(new Date());
  
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
      } else {
        console.warn("Failed to fetch prices from both exchanges");
        console.log("Recommendation: Check the router addresses and token pairs in App.js");
        console.log("Consider using tokens with known liquidity on Sepolia testnet");
        console.log("Or continue using mock mode for demonstration purposes");
      }
    } catch (error) {
      console.error("Error in price fetching process:", error);
      // Reset UI in case of error to prevent getting stuck
      setUniswapPrice("0");
      setSushiswapPrice("0");
    } finally {
      setIsLoading(false);
    }
  }, [provider, uniswapRouterAddress, sushiswapRouterAddress, tokenA, tokenB, amountIn, tokenASymbol, tokenBSymbol, onArbitrageOpportunityChange]);

  // Effect for finding pair addresses
  useEffect(() => {
    if (mockMode) return;
    findPairAddresses();
  }, [mockMode, findPairAddresses]);

  // Effect for setting up event listeners
  useEffect(() => {
    if (mockMode) return;
    
    // Listen for swap events on the pairs
    const setupSwapListeners = async () => {
      const activeProvider = wsProvider || provider;
      if (!activeProvider) return;
      
      // Set up listeners if we have the pair addresses
      if (uniswapPair) {
        const uniswapPairContract = new ethers.Contract(uniswapPair, PAIR_ABI, activeProvider);
        uniswapPairContract.on('Swap', () => {
          console.log('Uniswap swap detected, updating prices...');
          fetchPrices();
        });
      }
      
      if (sushiswapPair) {
        const sushiswapPairContract = new ethers.Contract(sushiswapPair, PAIR_ABI, activeProvider);
        sushiswapPairContract.on('Swap', () => {
          console.log('Sushiswap swap detected, updating prices...');
          fetchPrices();
        });
      }
      
      return () => {
        if (uniswapPair) {
          const uniswapPairContract = new ethers.Contract(uniswapPair, PAIR_ABI, activeProvider);
          uniswapPairContract.removeAllListeners('Swap');
        }
        
        if (sushiswapPair) {
          const sushiswapPairContract = new ethers.Contract(sushiswapPair, PAIR_ABI, activeProvider);
          sushiswapPairContract.removeAllListeners('Swap');
        }
      };
    };
    
    setupSwapListeners();
  }, [mockMode, provider, wsProvider, uniswapPair, sushiswapPair, fetchPrices]);

  // Effect for initial price fetch and polling
  useEffect(() => {
    if (mockMode) {
      // In mock mode, we don't need to fetch prices
      return;
    }

    // Initial fetch
    fetchPrices();
    
    // Set up a timer to refresh prices every 10 seconds as a fallback
    // This ensures we get updates even if we miss some events
    const intervalId = setInterval(() => {
      fetchPrices();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [mockMode, fetchPrices]);

  return (
    <div className="price-display">
      <h2>Exchange Prices: {tokenASymbol} → {tokenBSymbol}</h2>
      {mockMode && <div className="mock-data-notice">Using mock data for demonstration</div>}
      <div className="prices">
        <div className="price-card">
          <h3>Uniswap</h3>
          <p className="price">
            1 {tokenASymbol} = {uniswapPrice && uniswapPrice !== "0" 
              ? parseFloat(uniswapPrice).toFixed(6) 
              : "No data available"} {uniswapPrice && uniswapPrice !== "0" ? tokenBSymbol : ""}
          </p>
        </div>
        <div className="price-card">
          <h3>SushiSwap</h3>
          <p className="price">
            1 {tokenASymbol} = {sushiswapPrice && sushiswapPrice !== "0" 
              ? parseFloat(sushiswapPrice).toFixed(6) 
              : "No data available"} {sushiswapPrice && sushiswapPrice !== "0" ? tokenBSymbol : ""}
          </p>
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
      
      <div className="update-info">
        {isLoading ? (
          <p>Updating prices...</p>
        ) : (
          <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
        )}
        <button 
          className="refresh-button" 
          onClick={() => fetchPrices()}
          disabled={isLoading}
        >
          Refresh Now
        </button>
        {!mockMode && (uniswapPrice === "0" && sushiswapPrice === "0") && (
          <div className="wallet-error" style={{marginTop: "15px"}}>
            <p>No price data available from exchanges. Possible reasons:</p>
            <ul style={{textAlign: "left", margin: "10px auto", maxWidth: "450px"}}>
              <li>The selected tokens don't have liquidity on Sepolia testnet</li>
              <li>The exchange router addresses are incorrect for Sepolia</li>
              <li>There might be network issues with Sepolia testnet</li>
            </ul>
            <p>Check browser console for detailed error messages.</p>
            <p>Consider using mock mode for demonstration:</p>
            <code>Set MOCK_MODE = true in App.js</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenPriceDisplay; 