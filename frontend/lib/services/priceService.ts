import { Contract, ethers } from "ethers";
import {
  TokenPairPrices,
  TokenPair,
  Exchange,
  ArbitragePath,
  ExchangePrices,
} from "@/types/arbitrage";
import { ROUTER_ABI, USDC_DECIMALS, WETH_DECIMALS } from "@/lib/constants/dex";

/**
 * Fetches price data from decentralized exchanges (DEXs) for specified token pairs.
 * 
 * @param provider - The ethers Web3Provider connected to the user's wallet.
 * @param exchanges - Array of exchanges to fetch prices from.
 * @param pairs - Array of token pairs to fetch prices for.
 * @returns An object containing price data for each pair and exchange.
 */
export async function fetchDexPrices(
  provider: ethers.providers.Provider,
  exchanges: Exchange[],
  pairs: TokenPair[]
): Promise<TokenPairPrices> {
  const fetchedPrices: TokenPairPrices = {};

  // Create contract instances for each DEX router
  const routerContracts = exchanges.map((exchange) => ({
    name: exchange.name,
    contract: new Contract(exchange.router, ROUTER_ABI, provider),
  }));

  // Fetch prices for each token pair
  for (const pair of pairs) {
    const pairName = pair.name;
    fetchedPrices[pairName] = {};

    const [tokenInAddress, tokenOutAddress] = pair.tokens;
    // Define the amount of input token (1 USDC)
    const amountIn = ethers.utils.parseUnits("1", USDC_DECIMALS);
    const path = [tokenInAddress, tokenOutAddress];

    for (const { name, contract } of routerContracts) {
      try {
        console.log(`Fetching ${name} price for ${pairName}...`);
        const amountsOut: ethers.BigNumber[] = await contract.getAmountsOut(
          amountIn,
          path
        );
        const price = parseFloat(
          ethers.utils.formatUnits(amountsOut[1], WETH_DECIMALS)
        );
        console.log(`${name} price for ${pairName}: ${price}`);
        fetchedPrices[pairName][name] = price;
      } catch (error) {
        console.error(`Error fetching ${name} price for ${pairName}:`, error);
        fetchedPrices[pairName][name] = 0;
      }
    }
  }

  return fetchedPrices;
}

/**
 * Determines the best arbitrage path between exchanges for a given token pair.
 * 
 * @param prices - Prices for the token pair on different exchanges.
 * @returns The best arbitrage path or null if no opportunity exists.
 */
export function findBestArbitragePath(
  prices: ExchangePrices
): ArbitragePath {
  // Always buy WETH on the cheapest exchange and sell on the most expensive
  const validPrices = Object.entries(prices).filter(([, price]) => price > 0);
  if (validPrices.length < 2) {
    const exchangeNames = Object.keys(prices);
    return { buy: exchangeNames[0], sell: exchangeNames[0], percentage: 0 };
  }
  // Initialize with the first valid entry
  let [buyExchange, buyPrice] = validPrices[0];
  let [sellExchange, sellPrice] = validPrices[0];
  for (const [ex, price] of validPrices) {
    if (price < buyPrice) {
      buyExchange = ex;
      buyPrice = price;
    }
    if (price > sellPrice) {
      sellExchange = ex;
      sellPrice = price;
    }
  }
  const percentage = calculateArbitragePercentage(buyPrice, sellPrice);
  return { buy: buyExchange, sell: sellExchange, percentage };
}

/**
 * Calculates the arbitrage opportunity percentage.
 * 
 * @param buyPrice - Price to buy the token.
 * @param sellPrice - Price to sell the token.
 * @returns Percentage profit/loss as a number (e.g., 1.5 for 1.5%).
 */
export function calculateArbitragePercentage(
  buyPrice: number,
  sellPrice: number
): number {
  if (buyPrice <= 0) return 0;
  const percentageDifference = ((sellPrice - buyPrice) / buyPrice) * 100;
  return parseFloat(percentageDifference.toFixed(2));
}