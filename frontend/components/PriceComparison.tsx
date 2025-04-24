"use client";

import { useState, useEffect, useMemo } from "react";
import { ethers, BrowserProvider, JsonRpcProvider } from "ethers";
import { useWeb3 } from "./web3/Web3Provider";
import { NETWORK_IDS } from "../lib/web3/config";

// --- Mainnet Addresses ---
// Read RPC URL from environment variable (must be prefixed with NEXT_PUBLIC_)
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
console.log('Using Mainnet RPC URL:', MAINNET_RPC_URL);
const UNISWAP_V2_ROUTER_MAINNET = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const SUSHISWAP_V2_ROUTER_MAINNET = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH_MAINNET = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

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
  // Get wallet connection info from context (for UI messages)
  const { isConnected, isCorrectNetwork } = useWeb3();

  // Create a separate, read-only provider for Mainnet
  const mainnetProvider = useMemo(() => {
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
  }, []);

  const [uniUsdcToWethRate, setUniUsdcToWethRate] = useState<string | null>(null);
  const [sushiWethToUsdcRate, setSushiWethToUsdcRate] = useState<string | null>(null);
  const [uniWethToUsdcRate, setUniWethToUsdcRate] = useState<string | null>(null);
  const [sushiUsdcToWethRate, setSushiUsdcToWethRate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    // Run effect only when mainnetProvider is available (should only run once unless RPC fails)
  }, [mainnetProvider]);

  const renderRate = (label: string, rate: string | null) => {
    if (isLoading && !rate) return <span className="text-gray-500 animate-pulse">...</span>;
    // Don't show error state based on wallet connection for mainnet rates
    if (!rate && error && !isLoading) return <span className="text-red-500">Error</span>;
    if (!rate) return <span className="text-gray-400">-</span>; // Default placeholder
    return <span>{rate}</span>;
  };

  // Determine overall status message based on *wallet* connection (for dApp interaction)
  let walletStatusMessage = <></>;
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

  return (
    <div className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-50">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Live <span className='font-bold text-blue-600'>Mainnet</span> DEX Rates (USDC/WETH)
      </h3>
      {/* Show mainnet fetch error */}
      {error && !isLoading && (
        <p className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="font-medium text-gray-600">Uniswap V2:</div>
        <div className="font-medium text-gray-600">SushiSwap V2:</div>

        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 USDC =&gt;</span> {renderRate('Uni USDC->WETH', uniUsdcToWethRate)} <span>WETH</span>
        </div>
        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 USDC =&gt;</span> {renderRate('Sushi USDC->WETH', sushiUsdcToWethRate)} <span>WETH</span>
        </div>

        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 WETH =&gt;</span> {renderRate('Uni WETH->USDC', uniWethToUsdcRate)} <span>USDC</span>
        </div>
        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 WETH =&gt;</span> {renderRate('Sushi WETH->USDC', sushiWethToUsdcRate)} <span>USDC</span>
        </div>
      </div>
       {/* Status of the mainnet data fetching */}
       {isLoading ? (
         <p className="text-xs text-gray-500 mt-3 animate-pulse">Fetching mainnet rates...</p>
       ) : error ? (
         <p className="text-xs text-red-600 mt-3">Error fetching mainnet rates.</p>
       ) : (
         <p className="text-xs text-green-600 mt-3">Mainnet rates updated.</p>
       )}
       {/* Show wallet status separately */}
       {walletStatusMessage}
    </div>
  );
};

export default PriceComparison;