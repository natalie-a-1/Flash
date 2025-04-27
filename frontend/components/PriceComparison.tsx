"use client";

import { useState, useEffect, useMemo } from "react";
import { ethers, BrowserProvider, JsonRpcProvider } from "ethers";
import { useWeb3 } from "./web3/Web3Provider";
import { NETWORK_IDS, MAINNET_ADDRESSES } from "../lib/web3/config";

// --- Use imported Mainnet Addresses ---
const {
  WETH: WETH_MAINNET,
  USDC: USDC_MAINNET,
  UNISWAP_V2_ROUTER: UNISWAP_V2_ROUTER_MAINNET,
  SUSHISWAP_V2_ROUTER: SUSHISWAP_V2_ROUTER_MAINNET,
} = MAINNET_ADDRESSES;

// Read RPC URL from environment variable (must be prefixed with NEXT_PUBLIC_)
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
console.log('Using Mainnet RPC URL:', MAINNET_RPC_URL);

// Router ABI
const ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];

// Decimals
const USDC_DECIMALS = 6;
const WETH_DECIMALS = 18;

const PriceComparison = () => {
  // Add mounted state to handle hydration
  const [mounted, setMounted] = useState(false);
  
  // Get wallet connection info from context (for UI messages)
  const { isConnected, isCorrectNetwork } = useWeb3();

  // Create a separate, read-only provider for Mainnet
  const mainnetProvider = useMemo(() => {
    if (!mounted) return null;
    
    if (!MAINNET_RPC_URL) {
      console.error("Error: NEXT_PUBLIC_MAINNET_RPC_URL environment variable not set.");
      return null;
    }
    try {
      return new JsonRpcProvider(MAINNET_RPC_URL);
    } catch (e) {
      console.error('Failed to create mainnet provider:', e);
      return null;
    }
  }, [mounted]);

  const [uniUsdcToWethRate, setUniUsdcToWethRate] = useState<string | null>(null);
  const [sushiWethToUsdcRate, setSushiWethToUsdcRate] = useState<string | null>(null);
  const [uniWethToUsdcRate, setUniWethToUsdcRate] = useState<string | null>(null);
  const [sushiUsdcToWethRate, setSushiUsdcToWethRate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run this effect on the client side after mounting
    if (!mounted) return;
    
    const fetchPrices = async () => {
      // Ensure mainnet provider exists
      if (!mainnetProvider) {
        setError('Mainnet provider setup failed. Cannot fetch mainnet rates.');
        setIsLoading(false);
        return;
      }

      // Reset rates if provider isn't ready (shouldn't happen often with static RPC)
      setUniUsdcToWethRate(null);
      setSushiWethToUsdcRate(null);
      setUniWethToUsdcRate(null);
      setSushiUsdcToWethRate(null);

      setIsLoading(true);
      setError(null);

      try {
        // Use the mainnet provider and addresses
        const uniRouter = new ethers.Contract(
          UNISWAP_V2_ROUTER_MAINNET,
          ROUTER_ABI,
          mainnetProvider // Use mainnet provider
        );
        const sushiRouter = new ethers.Contract(
          SUSHISWAP_V2_ROUTER_MAINNET,
          ROUTER_ABI,
          mainnetProvider // Use mainnet provider
        );

        // --- Get Rates ---

        // 1. Uniswap: 1 USDC -> ? WETH
        const amountInUsdc = ethers.parseUnits('1', USDC_DECIMALS);
        const pathUsdcToWeth = [USDC_MAINNET, WETH_MAINNET]; // Use mainnet tokens
        const amountsOutUniUsdcWeth = await uniRouter.getAmountsOut(
          amountInUsdc,
          pathUsdcToWeth
        );
        // console.log('Raw Mainnet Uni USDC->WETH amounts:', amountsOutUniUsdcWeth); // Keep for debugging if needed
        const wethPerUsdcUni = ethers.formatUnits(
          amountsOutUniUsdcWeth[1],
          WETH_DECIMALS
        );
        setUniUsdcToWethRate(parseFloat(wethPerUsdcUni).toFixed(8));

        // 2. SushiSwap: 1 WETH -> ? USDC
        const amountInWeth = ethers.parseUnits('1', WETH_DECIMALS);
        const pathWethToUsdc = [WETH_MAINNET, USDC_MAINNET]; // Use mainnet tokens
        const amountsOutSushiWethUsdc = await sushiRouter.getAmountsOut(
          amountInWeth,
          pathWethToUsdc
        );
        // console.log('Raw Mainnet Sushi WETH->USDC amounts:', amountsOutSushiWethUsdc);
        const usdcPerWethSushi = ethers.formatUnits(
          amountsOutSushiWethUsdc[1],
          USDC_DECIMALS
        );
        setSushiWethToUsdcRate(parseFloat(usdcPerWethSushi).toFixed(2));

        // 3. Uniswap: 1 WETH -> ? USDC
        const amountsOutUniWethUsdc = await uniRouter.getAmountsOut(
          amountInWeth,
          pathWethToUsdc
        );
        // console.log('Raw Mainnet Uni WETH->USDC amounts:', amountsOutUniWethUsdc);
        const usdcPerWethUni = ethers.formatUnits(
          amountsOutUniWethUsdc[1],
          USDC_DECIMALS
        );
        setUniWethToUsdcRate(parseFloat(usdcPerWethUni).toFixed(2));

        // 4. SushiSwap: 1 USDC -> ? WETH
        const amountsOutSushiUsdcWeth = await sushiRouter.getAmountsOut(
          amountInUsdc,
          pathUsdcToWeth
        );
        // console.log('Raw Mainnet Sushi USDC->WETH amounts:', amountsOutSushiUsdcWeth);
        const wethPerUsdcSushi = ethers.formatUnits(
          amountsOutSushiUsdcWeth[1],
          WETH_DECIMALS
        );
        setSushiUsdcToWethRate(parseFloat(wethPerUsdcSushi).toFixed(8));
      } catch (err: any) {
        console.error('Error fetching mainnet prices:', err);
        const reason = err.reason || err.message || 'Unknown error';
        setError(`Failed to fetch mainnet prices: ${reason}. Check RPC & network.`);
        setUniUsdcToWethRate(null);
        setSushiWethToUsdcRate(null);
        setUniWethToUsdcRate(null);
        setSushiUsdcToWethRate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    // Refresh mainnet prices periodically
    const intervalId = setInterval(fetchPrices, 15000); // Fetch every 15 seconds (more frequent for mainnet)

    return () => {
      clearInterval(intervalId);
    };
    // Run effect only when mainnetProvider is available and component is mounted
  }, [mainnetProvider, mounted]);

  const renderRate = (label: string, rate: string | null) => {
    if (isLoading && !rate) return <span className="text-gray-500 animate-pulse">...</span>;
    // Don't show error state based on wallet connection for mainnet rates
    if (!rate && error && !isLoading) return <span className="text-red-500">Error</span>;
    if (!rate) return <span className="text-gray-400">-</span>; // Default placeholder
    return <span>{rate}</span>;
  };

  // Determine overall status message based on *wallet* connection (for dApp interaction)
  let walletStatusMessage = <></>;
  if (mounted) {
    if (!isConnected) {
      walletStatusMessage = (
        <p className="text-xs text-orange-600 mt-1">
          Connect wallet to Sepolia for dApp features.
        </p>
      );
    } else if (!isCorrectNetwork) {
      walletStatusMessage = (
        <p className="text-xs text-orange-600 mt-1">
          Switch wallet to Sepolia for dApp features.
        </p>
      );
    }
  }

  // Show skeleton UI during server-side rendering and initial mount
  if (!mounted) {
    return (
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 shadow-xl border border-white/20">
        <h3 className="text-xl font-semibold mb-4 text-white">
          Live <span className='font-bold text-cyan-400'>Mainnet</span> DEX Rates (USDC/WETH)
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="font-medium text-white/70">Uniswap V2:</div>
          <div className="font-medium text-white/70">SushiSwap V2:</div>
          
          {/* Loading skeleton for rates */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-white flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
              <div className="w-24 h-4 bg-white/10 animate-pulse rounded"></div>
              <div className="w-20 h-4 bg-white/10 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="w-32 h-4 bg-white/10 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 shadow-xl border border-white/20">
      <h3 className="text-xl font-semibold mb-4 text-white">
        Live <span className='font-bold text-cyan-400'>Mainnet</span> DEX Rates (USDC/WETH)
      </h3>
      {/* Show mainnet fetch error */}
      {error && !isLoading && (
        <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-lg">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="font-medium text-white/70">Uniswap V2:</div>
        <div className="font-medium text-white/70">SushiSwap V2:</div>

        <div className="text-white flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
          <span>1 USDC =&gt;</span> 
          <span className="font-mono text-cyan-400">{renderRate('Uni USDC->WETH', uniUsdcToWethRate)}</span> 
          <span>WETH</span>
        </div>
        <div className="text-white flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
          <span>1 USDC =&gt;</span> 
          <span className="font-mono text-cyan-400">{renderRate('Sushi USDC->WETH', sushiUsdcToWethRate)}</span> 
          <span>WETH</span>
        </div>

        <div className="text-white flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
          <span>1 WETH =&gt;</span> 
          <span className="font-mono text-green-400">{renderRate('Uni WETH->USDC', uniWethToUsdcRate)}</span> 
          <span>USDC</span>
        </div>
        <div className="text-white flex items-center space-x-2 bg-white/5 p-3 rounded-lg">
          <span>1 WETH =&gt;</span> 
          <span className="font-mono text-green-400">{renderRate('Sushi WETH->USDC', sushiWethToUsdcRate)}</span> 
          <span>USDC</span>
        </div>
      </div>
      {/* Status of the mainnet data fetching */}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <div>
          {isLoading ? (
            <p className="text-xs text-white/60 animate-pulse flex items-center">
              <svg className="w-3 h-3 mr-1 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching mainnet rates...
            </p>
          ) : error ? (
            <p className="text-xs text-red-400">Error fetching mainnet rates.</p>
          ) : (
            <p className="text-xs text-green-400">Mainnet rates updated.</p>
          )}
        </div>
        {/* Show wallet status separately */}
        {walletStatusMessage}
      </div>
    </div>
  );
};

export default PriceComparison;