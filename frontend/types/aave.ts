/**
 * Represents reserve data from Aave protocol
 */
export interface ReserveData {
  underlyingAsset: string;
  name: string;
  symbol: string;
  decimals: string;
  isActive: boolean;
  isPaused: boolean;
  flashLoanEnabled: boolean;
  availableLiquidity: string;
  [key: string]: any;
}

/**
 * Represents token information for UI display and interaction
 */
export interface TokenInfo {
  symbol: string;
  address: string;
  icon: string;
  color: string;
  decimals: number;
}

/**
 * Response from fetching flash loan limits
 */
export interface FlashLoanLimitsResponse {
  [tokenAddress: string]: string;
}

/**
 * Flash loan parameters 
 */
export interface FlashLoanParams {
  tokenAddress: string;
  amount: string;
  recipient?: string;
}

/**
 * Flash loan execution result
 */
export interface FlashLoanResult {
  success: boolean;
  txHash?: string;
  error?: string;
} 