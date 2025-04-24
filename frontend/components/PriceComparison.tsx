"use client";

import { useState, useEffect, useMemo } from "react";
import { ethers, BrowserProvider } from "ethers";
import { useWeb3 } from "./web3/Web3Provider";
import { NETWORK_IDS } from "../lib/web3/config";

// Sepolia Addresses
const UNISWAP_V2_ROUTER_ADDRESS = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
const SUSHISWAP_V2_ROUTER_ADDRESS = "0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791";
const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

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
  // Get web3 instance and network info from context
  const { web3, networkId, isCorrectNetwork, isConnected } = useWeb3();

  // Create an ethers provider from the web3 instance
  const ethersProvider = useMemo(() => {
    if (web3?.currentProvider) {
      // Use the provider from the Web3 instance
      // Make sure the provider conforms to EIP-1193
      return new BrowserProvider(web3.currentProvider as any);
    }
    return null;
  }, [web3]);

  const [uniUsdcToWethRate, setUniUsdcToWethRate] = useState<string | null>(null);
  const [sushiWethToUsdcRate, setSushiWethToUsdcRate] = useState<string | null>(null);
  const [uniWethToUsdcRate, setUniWethToUsdcRate] = useState<string | null>(null);
  const [sushiUsdcToWethRate, setSushiUsdcToWethRate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      // Ensure ethers provider exists and we are connected to the correct network (Sepolia)
      if (!ethersProvider || !isConnected || !isCorrectNetwork) {
        setUniUsdcToWethRate(null);
        setSushiWethToUsdcRate(null);
        setUniWethToUsdcRate(null);
        setSushiUsdcToWethRate(null);
        if (!isConnected) {
           setError("Please connect your wallet.");
        } else if (!isCorrectNetwork) {
           setError("Connect to Sepolia network to see prices.");
        } else {
           setError("Web3 provider not available."); // Should ideally not happen if connected
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the created ethersProvider
        const uniRouter = new ethers.Contract(
          UNISWAP_V2_ROUTER_ADDRESS,
          ROUTER_ABI,
          ethersProvider,
        );
        const sushiRouter = new ethers.Contract(
          SUSHISWAP_V2_ROUTER_ADDRESS,
          ROUTER_ABI,
          ethersProvider,
        );

        // --- Get Rates ---

        // 1. Uniswap: 1 USDC -> ? WETH
        const amountInUsdc = ethers.parseUnits("1", USDC_DECIMALS);
        const pathUsdcToWeth = [USDC_ADDRESS, WETH_ADDRESS];
        const amountsOutUniUsdcWeth = await uniRouter.getAmountsOut(
          amountInUsdc,
          pathUsdcToWeth,
        );
        console.log("Raw Uniswap USDC->WETH amounts:", amountsOutUniUsdcWeth);
        const wethPerUsdcUni = ethers.formatUnits(
          amountsOutUniUsdcWeth[1],
          WETH_DECIMALS,
        );
        setUniUsdcToWethRate(parseFloat(wethPerUsdcUni).toFixed(8));

        // 2. SushiSwap: 1 WETH -> ? USDC
        const amountInWeth = ethers.parseUnits("1", WETH_DECIMALS);
        const pathWethToUsdc = [WETH_ADDRESS, USDC_ADDRESS];
        const amountsOutSushiWethUsdc = await sushiRouter.getAmountsOut(
          amountInWeth,
          pathWethToUsdc,
        );
        console.log("Raw SushiSwap WETH->USDC amounts:", amountsOutSushiWethUsdc);
        const usdcPerWethSushi = ethers.formatUnits(
          amountsOutSushiWethUsdc[1],
          USDC_DECIMALS,
        );
        setSushiWethToUsdcRate(parseFloat(usdcPerWethSushi).toFixed(2));

        // 3. Uniswap: 1 WETH -> ? USDC
        const amountsOutUniWethUsdc = await uniRouter.getAmountsOut(
            amountInWeth,
            pathWethToUsdc
        );
        console.log("Raw Uniswap WETH->USDC amounts:", amountsOutUniWethUsdc);
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
        console.log("Raw SushiSwap USDC->WETH amounts:", amountsOutSushiUsdcWeth);
        const wethPerUsdcSushi = ethers.formatUnits(
            amountsOutSushiUsdcWeth[1],
            WETH_DECIMALS
        );
        setSushiUsdcToWethRate(parseFloat(wethPerUsdcSushi).toFixed(8));


      } catch (err: any) {
        console.error("Error fetching prices:", err);
        // Check for common reverted errors (e.g., insufficient liquidity)
        const reason = err.reason || err.message || "Unknown error";
        setError(`Failed to fetch prices: ${reason}. Ensure RPC is working.`);
        setUniUsdcToWethRate(null);
        setSushiWethToUsdcRate(null);
        setUniWethToUsdcRate(null);
        setSushiUsdcToWethRate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    // Refresh periodically only if connected and on correct network
    let intervalId: NodeJS.Timeout | null = null;
    if (ethersProvider && isConnected && isCorrectNetwork) {
        intervalId = setInterval(fetchPrices, 30000); // Fetch every 30 seconds
    }

    return () => {
        if (intervalId) clearInterval(intervalId); // Cleanup interval on component unmount or dependency change
    };

  }, [ethersProvider, isConnected, isCorrectNetwork]); // Rerun effect if these change

  const renderRate = (label: string, rate: string | null) => {
    if (isLoading && !rate) return <span className="text-gray-500 animate-pulse">...</span>;
    if (!rate && (!isConnected || !isCorrectNetwork)) return <span className="text-gray-400">-</span>;
    if (!rate && error && !isLoading) return <span className="text-red-500">Error</span>;
    if (!rate) return <span className="text-gray-400">-</span>; // Default placeholder
    return <span>{rate}</span>;
  };

  // Determine overall status message
  let statusMessage = <></>;
  if (!isConnected) {
    statusMessage = (
      <p className="text-xs text-orange-600 mt-3">
        Please connect your wallet to view rates.
      </p>
    );
  } else if (!isCorrectNetwork) {
    statusMessage = (
      <p className="text-xs text-orange-600 mt-3">
        Please switch your wallet to the Sepolia network.
      </p>
    );
  } else if (isLoading) {
    statusMessage = (
      <p className="text-xs text-gray-500 mt-3 animate-pulse">Fetching latest rates...</p>
    );
  } else if (error) {
    statusMessage = (
      <p className="text-xs text-red-600 mt-3">
        Error fetching rates. Check console.
      </p>
    );
  } else if (uniUsdcToWethRate && sushiWethToUsdcRate) { // Check if rates are loaded
     statusMessage = <p className="text-xs text-green-600 mt-3">Rates updated.</p>;
  }


  return (
    <div className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-50">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Live Sepolia DEX Rates (USDC/WETH)
      </h3>
      {/* Only show specific error message if not loading and not connection/network issue */}
      {error && !isLoading && isConnected && isCorrectNetwork &&(
        <p className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="font-medium text-gray-600">Uniswap V2:</div>
        <div className="font-medium text-gray-600">SushiSwap V2:</div>

        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 USDC =&gt;</span> {renderRate("Uni USDC->WETH", uniUsdcToWethRate)} <span>WETH</span>
        </div>
        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 USDC =&gt;</span> {renderRate("Sushi USDC->WETH", sushiUsdcToWethRate)} <span>WETH</span>
        </div>

        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 WETH =&gt;</span> {renderRate("Uni WETH->USDC", uniWethToUsdcRate)} <span>USDC</span>
        </div>
        <div className="text-gray-800 flex items-center space-x-1">
          <span>1 WETH =&gt;</span> {renderRate("Sushi WETH->USDC", sushiWethToUsdcRate)} <span>USDC</span>
        </div>
      </div>
      {statusMessage}
    </div>
  );
};

export default PriceComparison;