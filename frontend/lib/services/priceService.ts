import { ethers, Contract, BrowserProvider, formatUnits, parseUnits } from "ethers";
import { TokenPairPrices, TokenPair, Exchange, ArbitragePath, ExchangePrices } from "@/types/arbitrage";
import { ROUTER_ABI, USDC_DECIMALS, WETH_DECIMALS } from "@/lib/constants/dex";

/**
 * Fetches price data from DEXs for specified token pairs
 * @param provider The ethers browser provider connected to the user's wallet
 * @param exchanges Array of exchanges to fetch prices from
 * @param pairs Array of token pairs to fetch prices for
 * @returns Object containing price data for each pair and exchange
 */
export async function fetchDexPrices(
  provider: BrowserProvider,
  exchanges: Exchange[],
  pairs: TokenPair[]
): Promise<TokenPairPrices> {
  const fetchedPrices: TokenPairPrices = {};

  // Create contract instances for each DEX router
  const routerContracts = exchanges.map(exchange => ({
    name: exchange.name,
    contract: new Contract(exchange.router, ROUTER_ABI, provider)
  }));

  // Fetch prices for each pair
  for (const pair of pairs) {
    const pairName = pair.name;
    fetchedPrices[pairName] = {};
    
    const [tokenInAddress, tokenOutAddress] = pair.tokens;
    
    // Amount of input token (1 unit)
    const amountIn = parseUnits("1", USDC_DECIMALS);
    
    // Path for swapping (tokenIn -> tokenOut)
    const path = [tokenInAddress, tokenOutAddress];
    
    // Fetch prices from all exchanges
    for (const { name, contract } of routerContracts) {
      try {
        console.log(`Fetching ${name} price for ${pairName}...`);
        const amountsOut = await contract.getAmountsOut(amountIn, path);
        const price = parseFloat(formatUnits(amountsOut[1], WETH_DECIMALS));
        console.log(`${name} price for ${pairName}: ${price}`);
        fetchedPrices[pairName][name] = price;
      } catch (error) {
        console.error(`Error fetching ${name} price for ${pairName}:`, error);
        fetchedPrices[pairName][name] = 0; // Indicate error with 0 price
      }
    }
  }
  
  return fetchedPrices;
}

/**
 * Determines the best arbitrage path between exchanges for a given pair
 * @param prices Prices for the pair on different exchanges
 * @returns The best arbitrage path or null if no opportunity exists
 */
export function findBestArbitragePath(prices: ExchangePrices): ArbitragePath | null {
  const exchangeNames = Object.keys(prices);
  if (exchangeNames.length < 2) return null;

  // Filter out exchanges with 0 price (indicating fetch error)
  const validPrices = Object.entries(prices)
    .filter(([_, price]) => price > 0);

  if (validPrices.length < 2) return null;

  let bestDiff = 0;
  let bestPath: ArbitragePath | null = null;
  
  // Compare all possible exchange combinations with valid prices
  for (let i = 0; i < validPrices.length; i++) {
    for (let j = 0; j < validPrices.length; j++) {
      if (i === j) continue;
      
      const [buyExchange, buyPrice] = validPrices[i];
      const [sellExchange, sellPrice] = validPrices[j];
      
      // Calculate percentage difference
      const diff = calculateArbitragePercentage(
        Number(buyPrice), 
        Number(sellPrice)
      );
      
      // We only care if sellPrice is meaningfully higher than buyPrice
      if (Number(sellPrice) > Number(buyPrice) && diff > 0.1) { // Use a threshold (e.g., 0.1%) to filter noise
        if (diff > bestDiff) {
          bestDiff = diff;
          bestPath = {
            buy: buyExchange,
            sell: sellExchange,
            percentage: diff,
          };
        }
      }
    }
  }
  
  return bestPath;
}

/**
 * Calculates the arbitrage opportunity percentage
 * @param buyPrice Price to buy the token
 * @param sellPrice Price to sell the token
 * @returns Percentage profit/loss as a number (e.g., 1.5 for 1.5%)
 */
export function calculateArbitragePercentage(buyPrice: number, sellPrice: number): number {
  if (buyPrice <= 0) return 0;
  
  const percentageDifference = ((sellPrice - buyPrice) / buyPrice) * 100;
  return parseFloat(percentageDifference.toFixed(2));
} 