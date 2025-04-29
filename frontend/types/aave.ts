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
 * Reserve state enum representing possible states of an Aave reserve
 */
export enum ReserveState {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  PAUSED = 'PAUSED',
  NOT_LISTED = 'NOT_LISTED',
  UNAVAILABLE = 'UNAVAILABLE',
  ERROR = 'ERROR'
}

/**
 * Information about a reserve's state (active, frozen, etc.)
 */
export interface ReserveStateInfo {
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  isFlashLoanEnabled: boolean;
}

/**
 * Enhanced reserve data with additional state and UI information
 */
export interface ReserveInfo {
  tokenAddress: string;
  tokenSymbol: string;
  availableLiquidity: string;
  reserveState: ReserveStateInfo;
  aTokenAddress?: string;
  message?: string; // User-friendly message explaining the state
}

/**
 * Response from fetching flash loan limits
 */
export interface FlashLoanLimitsResponse {
  [tokenAddress: string]: ReserveInfo;
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

/**
 * A single reserve's humanized data from Aave's UiPoolDataProvider.getReservesHumanized()
 */
export interface HumanizedReserveData {
  symbol: string;
  underlyingAsset: string;
  name: string;
  decimals: number;
  availableLiquidity: string;
  liquidityRate?: string;
  availableLiquidityUSD?: string;
  totalLiquidity?: string;
  totalLiquidityUSD?: string;
  totalDebt?: string;
  totalDebtUSD?: string;
  priceInMarketReferenceCurrency?: string;
  priceOracle?: string;
  variableBorrowRate?: string;
  variableBorrowAPY?: string;
  stableBorrowRate?: string;
  stableBorrowAPY?: string;
  supplyRate?: string;
  supplyAPY?: string;
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  isSiloedBorrowing?: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  reserveFactor?: string;
  borrowCap?: string;
  supplyCap?: string;
  debtCeiling?: string;
  debtCeilingDecimals?: number;
  aIncentivesData?: any[];
  vIncentivesData?: any[];
  sIncentivesData?: any[];
  usageAsCollateralEnabled: boolean;
  eModeCategoryId?: number;
  liquidationThreshold?: string;
  liquidationBonus?: string;
  unbacked?: string;
  baseLTVasCollateral?: string;
  reserveLiquidationThreshold?: string;
  reserveLiquidationBonus?: string;
  isolationModeTotalDebtUSD?: string;
  isIsolated?: boolean;
  flashLoanEnabled: boolean;
  accruedToTreasury?: string;
} 