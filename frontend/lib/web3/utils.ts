/**
 * Utility functions for web3 interactions
 */

/**
 * Truncates an Ethereum address for display purposes
 * @param address The full Ethereum address
 * @param startChars Number of characters to show at the start (default: 6)
 * @param endChars Number of characters to show at the end (default: 4)
 * @returns Truncated address in the format "0x1234...5678"
 */
export function truncateAddress(
  address: string, 
  startChars: number = 6, 
  endChars: number = 4
): string {
  if (!address) return '';
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
}

/**
 * Formats token amount for display with appropriate symbols and formatting
 * 
 * @param amount - The amount to format as a string
 * @param decimals - Number of decimal places to display
 * @param symbol - Optional currency symbol to append
 * @param compact - Whether to use compact notation (K, M, B) for large numbers
 * @returns Formatted string with symbol
 */
export function formatTokenAmount(
  amount: string | number, 
  decimals: number = 4,
  symbol?: string,
  compact: boolean = true
): string {
  if (!amount) return symbol ? `0 ${symbol}` : '0';
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle zero case
  if (numericAmount === 0) return symbol ? `0 ${symbol}` : '0';
  
  let formattedAmount: string;
  
  if (compact && numericAmount >= 1000) {
    // For compact notation (e.g., 1.5K, 2.3M)
    if (numericAmount >= 1_000_000_000) {
      // Billions
      formattedAmount = (numericAmount / 1_000_000_000).toFixed(decimals).replace(/\.?0+$/, '');
      formattedAmount = `${formattedAmount}B`;
    } else if (numericAmount >= 1_000_000) {
      // Millions
      formattedAmount = (numericAmount / 1_000_000).toFixed(decimals).replace(/\.?0+$/, '');
      formattedAmount = `${formattedAmount}M`;
    } else {
      // Thousands
      formattedAmount = (numericAmount / 1_000).toFixed(decimals).replace(/\.?0+$/, '');
      formattedAmount = `${formattedAmount}K`;
    }
  } else {
    // Standard notation with thousand separators
    formattedAmount = numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }
  
  return symbol ? `${formattedAmount} ${symbol}` : formattedAmount;
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

/**
 * Checks if there's a potential arbitrage opportunity based on a threshold
 * @param buyPrice Price to buy the token
 * @param sellPrice Price to sell the token
 * @param minThresholdPercent Minimum percentage difference to consider it an opportunity (default: 0.5)
 * @returns True if there's a potential arbitrage opportunity
 */
export function isArbitrageOpportunity(
  buyPrice: number,
  sellPrice: number,
  minThresholdPercent: number = 0.5
): boolean {
  const percentageDifference = calculateArbitragePercentage(buyPrice, sellPrice);
  return percentageDifference >= minThresholdPercent;
} 