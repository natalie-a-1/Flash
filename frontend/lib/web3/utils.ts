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
 * Formats a token amount for display with the specified number of decimal places
 * @param amount The amount to format
 * @param decimals The number of decimal places to display (default: 2)
 * @returns Formatted amount as a string
 */
export function formatTokenAmount(amount: string | number, decimals: number = 2): string {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(amountNum)) return '0';
  
  // Check if the amount is very small
  if (amountNum > 0 && amountNum < 0.0001) {
    return '<0.0001';
  }
  
  return amountNum.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
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