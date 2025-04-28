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
  buy: string;       // The exchange to buy from
  sell: string;      // The exchange to sell to
  percentage: number; // The percentage profit from the arbitrage
}

/**
 * Represents an exchange definition.
 * 
 * This interface defines the structure for an exchange, including its name,
 * router address, and icon.
 */
export interface Exchange {
  name: string;   // The name of the exchange
  router: string; // The router address of the exchange
  icon: string;   // The icon representing the exchange
}

/**
 * Represents a token pair definition.
 * 
 * This interface defines the structure for a token pair, including its name,
 * the tokens involved, and their base and quote symbols.
 */
export interface TokenPair {
  name: string;        // The name of the token pair
  tokens: string[];    // The list of tokens in the pair
  baseSymbol: string;  // The base symbol of the token pair
  quoteSymbol: string; // The quote symbol of the token pair
} 