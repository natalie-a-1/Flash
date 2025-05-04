// Add import for TokenInfo from Aave types
import { TokenInfo } from "@/types/aave";

/**
 * Represents the price data for different exchanges.
 *
 * This interface maps exchange names to their respective price values.
 */
export interface ExchangePrices {
  [exchangeName: string]: number;
}

/**
 * Represents the price data for token pairs across multiple exchanges.
 *
 * This interface maps token pair names to their corresponding exchange prices.
 */
export interface TokenPairPrices {
  [pairName: string]: ExchangePrices;
}

/**
 * Represents an arbitrage path between two exchanges.
 *
 * This interface defines the structure for an arbitrage opportunity, including
 * the buy and sell exchanges and the percentage profit.
 */
export interface ArbitragePath {
  buy: Exchange | null; // The full Exchange object to buy from, or null if none found
  sell: Exchange | null; // The full Exchange object to sell to, or null if none found
  percentage: number; // The percentage profit from the arbitrage
}

export type ExchangeType =
  | "v2"
  | "v3"
  | "balancer"
  | "curve"
  | "curve_tricrypto"
  | "curve_get_dy";

/**
 * Represents an exchange definition.
 *
 * This interface defines the structure for an exchange, including its name,
 * router address, and icon.
 */
export interface Exchange {
  name: string; // The name of the exchange
  router: string; // Renamed from routerAddress - Contract address of the DEX router
  icon: string; // The icon representing the exchange
  feePct: number; // Standard trading fee percentage (e.g., 0.3 for 0.3%)
  // routerAddress: string; // REMOVED - Replaced by 'router'

  // Optional metadata for different DEX versions and pool parameters
  type?: ExchangeType; // Allow different DEX logic
  feeTier?: number; // Fee tier for Uniswap V3 pools (e.g., 500 for 0.05%)
  poolId?: string; // Pool ID for Balancer V2 single-hop swaps
}

/**
 * Represents a token pair definition.
 *
 * This interface defines the structure for a token pair, including its name,
 * the tokens involved, and their base and quote symbols.
 */
export interface TokenPair {
  name: string; // The name of the token pair
  tokens: string[]; // The list of tokens in the pair
  baseSymbol: string; // The base symbol of the token pair
  quoteSymbol: string; // The quote symbol of the token pair
}

// Update props for the ArbitrageProfitCalculator component
export interface ArbitrageProfitCalculatorProps {
  loanAmount: string;
  selectedToken: TokenInfo;
  flashLoanBps: number; // flash-loan premium in basis points
  dexPrices: ExchangePrices | null; // Pass prices from parent
}
