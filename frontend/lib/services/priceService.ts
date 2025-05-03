import { Contract, ethers } from "ethers";
import {
  TokenPairPrices,
  TokenPair,
  Exchange,
  ArbitragePath,
  ExchangePrices,
} from "@/types/arbitrage";
import {
  ROUTER_ABI,
  QUOTER_ABI,
  BALANCER_VAULT_ABI,
  CURVE_GET_DY_ABI,
  USDC_DECIMALS,
  WETH_DECIMALS,
} from "@/lib/constants/dex";

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
  pairs: TokenPair[],
): Promise<TokenPairPrices> {
  const fetchedPrices: TokenPairPrices = {};

  for (const pair of pairs) {
    const pairName = pair.name;
    fetchedPrices[pairName] = {};

    const [tokenInAddress, tokenOutAddress] = pair.tokens;
    // Determine decimals for base (input) and quote (output) tokens
    const decimalsIn =
      pair.baseSymbol === "USDC" ? USDC_DECIMALS : WETH_DECIMALS;
    const decimalsOut =
      pair.quoteSymbol === "USDC" ? USDC_DECIMALS : WETH_DECIMALS;
    // Amount of input token (Increase from 1 to 100 units of base)
    const baseAmount = "100";
    const amountIn = ethers.utils.parseUnits(baseAmount, decimalsIn);

    for (const exchange of exchanges) {
      const { name, router, type, feeTier, poolId } = exchange;

      // --- TEMPORARILY COMMENT OUT BALANCER AND CURVE ---
      if (name === "Balancer V2" || name === "Curve USDC/ETH") {
        console.log(`Temporarily skipping ${name} price fetch.`);
        fetchedPrices[pairName][name] = 0; // Set price to 0
        continue; // Skip to the next exchange
      }
      // --- END TEMPORARY COMMENT OUT ---

      // Skip if router is not a valid Ethereum address
      if (!ethers.utils.isAddress(router)) {
        console.warn(
          `Invalid router address for ${name}, skipping price fetch.`,
          router,
        );
        fetchedPrices[pairName][name] = 0;
        continue;
      }
      try {
        console.log(`Fetching ${name} price for ${pairName}...`);
        let outAmount: ethers.BigNumber;

        if (type === "v3") {
          // Uniswap V3 Quoter
          const quoter = new Contract(router, QUOTER_ABI, provider);
          outAmount = await quoter.quoteExactInputSingle(
            tokenInAddress,
            tokenOutAddress,
            feeTier!,
            amountIn,
            0,
          );
        } else if (type === "balancer") {
          // Skip Balancer if poolId is not a valid hex bytes32
          if (poolId && typeof poolId === "string" && poolId.startsWith("0x")) {
            const vault = new Contract(router, BALANCER_VAULT_ABI, provider);
            const swaps = [
              {
                poolId: poolId,
                assetInIndex: 0,
                assetOutIndex: 1,
                amount: amountIn,
                userData: "0x",
              },
            ];
            const assets = [tokenInAddress, tokenOutAddress];
            const funds = {
              sender: ethers.constants.AddressZero,
              recipient: ethers.constants.AddressZero,
              fromInternalBalance: false,
              toInternalBalance: false,
            };
            const result: ethers.BigNumber[] = await vault.queryBatchSwap(
              0,
              swaps,
              assets,
              funds,
            );
            outAmount = result[1].lt(0) ? result[1].mul(-1) : result[1];
          } else {
            console.warn(
              `Skipping Balancer swap for ${pairName} on ${name}: invalid poolId`,
              poolId,
            );
            outAmount = ethers.constants.Zero;
          }
        } else if (type === "curve_get_dy") {
          // Curve Pool using get_dy(i, j, dx)
          // For USDC/ETH pool: USDC=0, WETH=1
          const curve = new Contract(router, CURVE_GET_DY_ABI, provider);
          // Call get_dy with int128 indices (represented as numbers)
          outAmount = await curve.get_dy(0, 1, amountIn); // i=0 (USDC), j=1 (WETH)
        } else {
          // Default: Uniswap/Sushi V2
          const routerContract = new Contract(router, ROUTER_ABI, provider);
          const amountsOut: ethers.BigNumber[] =
            await routerContract.getAmountsOut(amountIn, [
              tokenInAddress,
              tokenOutAddress,
            ]);
          outAmount = amountsOut[1];
        }

        // Format output amount using correct output token decimals
        // Divide by the baseAmount used for the query to get the price per 1 unit
        const price =
          parseFloat(ethers.utils.formatUnits(outAmount, decimalsOut)) /
          parseFloat(baseAmount);
        console.log(`${name} price for ${pairName}: ${price}`);
        fetchedPrices[pairName][name] = price;
      } catch (error: any) {
        console.error(`Error fetching ${name} price for ${pairName}:`);
        // Log specific revert reason if available
        if (error.reason) {
          console.error("  Revert Reason:", error.reason);
        }
        // Log the full error object for more details
        console.error("  Full Error:", error);
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
export function findBestArbitragePath(prices: ExchangePrices): ArbitragePath {
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
  sellPrice: number,
): number {
  if (buyPrice <= 0) return 0;
  const percentageDifference = ((sellPrice - buyPrice) / buyPrice) * 100;
  return parseFloat(percentageDifference.toFixed(2));
}
