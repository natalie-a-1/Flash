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
  provider: ethers.providers.Web3Provider,
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
): ArbitragePath | null {
  const exchangeNames = Object.keys(prices);
  if (exchangeNames.length < 2) return null;

  // Filter out exchanges with a price of 0 (indicating a fetch error)
  const validPrices = Object.entries(prices).filter(
    ([, price]) => price > 0
  );
  if (validPrices.length < 2) return null;

  let bestDiff = 0;
  let bestPath: ArbitragePath | null = null;

  for (let i = 0; i < validPrices.length; i++) {
    for (let j = 0; j < validPrices.length; j++) {
      if (i === j) continue;
      const [buyExchange, buyPrice] = validPrices[i];
      const [sellExchange, sellPrice] = validPrices[j];
      const diff = calculateArbitragePercentage(
        buyPrice as number,
        sellPrice as number
      );
      if ((sellPrice as number) > (buyPrice as number) && diff > 0.1) {
        if (diff > bestDiff) {
          bestDiff = diff;
          bestPath = { buy: buyExchange, sell: sellExchange, percentage: diff };
        }
      }
    }
  }

  return bestPath;
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