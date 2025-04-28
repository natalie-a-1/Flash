/**
 * Utility functions for web3 interactions.
 * 
 * This module provides utility functions to assist with common web3-related tasks,
 * such as formatting Ethereum addresses and token amounts for display.
 */

/**
 * Truncates an Ethereum address for display purposes.
 * 
 * This function shortens an Ethereum address by displaying only the specified number
 * of characters at the start and end, with ellipses in between.
 * 
 * @param {string} address - The full Ethereum address to be truncated.
 * @param {number} [startChars=6] - The number of characters to display at the start of the address.
 * @param {number} [endChars=4] - The number of characters to display at the end of the address.
 * @returns {string} The truncated address in the format "0x1234...5678".
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
 * Formats a token amount for display with appropriate symbols and formatting.
 * 
 * This function formats a given token amount, optionally appending a currency symbol
 * and using compact notation for large numbers (e.g., thousands, millions, billions).
 * 
 * @param {string | number} amount - The amount to format, either as a string or number.
 * @param {number} [decimals=4] - The number of decimal places to display.
 * @param {string} [symbol] - An optional currency symbol to append to the formatted amount.
 * @param {boolean} [compact=true] - Whether to use compact notation (K, M, B) for large numbers.
 * @returns {string} The formatted string with the optional symbol.
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

// Removed duplicate calculateArbitragePercentage as it's specific to priceService
// export function calculateArbitragePercentage(
//   buyPrice: number,
//   sellPrice: number
// ): number {
//   if (buyPrice <= 0) return 0;
//   const percentageDifference = ((sellPrice - buyPrice) / buyPrice) * 100;
//   return parseFloat(percentageDifference.toFixed(2));
// } 