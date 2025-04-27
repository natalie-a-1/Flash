// Types for the price data
export interface ExchangePrices {
  [exchangeName: string]: number;
}

export interface TokenPairPrices {
  [pairName: string]: ExchangePrices;
}

// Type for the arbitrage path
export interface ArbitragePath {
  buy: string;
  sell: string;
  percentage: number;
}

// Type for exchange definition
export interface Exchange {
  name: string;
  router: string;
  icon: string;
}

// Type for token pair definition
export interface TokenPair {
  name: string;
  tokens: string[];
  baseSymbol: string;
  quoteSymbol: string;
} 