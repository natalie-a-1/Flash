import Web3 from "web3";
import { Contract, providers } from "ethers";
import { 
  TokenInfo, 
  FlashLoanLimitsResponse,
  ReserveState,
  ReserveInfo
} from "@/types/aave";
import { MAINNET_ADDRESSES } from "@/lib/web3/config";
import { MetaMaskEthereumProvider } from "./web3";

// Extend Window interface to include flashLoanContract
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
    flashLoanContract?: Contract | null;
  }
}

// Token addresses
const USDC_ADDRESS = MAINNET_ADDRESSES.USDC; // USDC on Ethereum Mainnet
const WETH_ADDRESS = MAINNET_ADDRESSES.WETH; // WETH on Ethereum Mainnet

// Types
interface ReserveConfiguration {
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  isFlashLoanEnabled: boolean;
}

// Define TypeScript interface matching the getReserveData output structure
interface AaveReserveConfigurationMap {
  data: string; // uint256 represented as string
}

/**
 * Interface for Aave reserve data returned from the UiPoolDataProviderV3
 */
interface AaveReserveData {
  underlyingAsset: string;
  name: string;
  symbol: string;
  decimals: string;
  baseLTVasCollateral: string;
  reserveLiquidationThreshold: string;
  reserveLiquidationBonus: string;
  reserveFactor: string;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  liquidityIndex: string;
  variableBorrowIndex: string;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  lastUpdateTimestamp: number;
  aTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  interestRateStrategyAddress: string;
  availableLiquidity: string;
  totalPrincipalStableDebt: string;
  averageStableRate: string;
  stableDebtLastUpdateTimestamp: string;
  totalScaledVariableDebt: string;
  priceInMarketReferenceCurrency: string;
  priceOracle: string;
  variableRateSlope1: string;
  variableRateSlope2: string;
  stableRateSlope1: string;
  stableRateSlope2: string;
  isPaused: boolean;
  accruedToTreasury: string;
  unbacked: string;
  isolationModeTotalDebt: string;
  flashLoanEnabled: boolean;
}

// --- Define Types for UiPoolDataProviderV3 ---

// Interface matching the AggregatedReserveData struct 
interface UiAggregatedReserveData {
  underlyingAsset: string; 
  symbol: string; 
  availableLiquidity: string; 
  decimals: number; 
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  flashLoanEnabled: boolean;
  aTokenAddress: string;
}

// Define TypeScript interfaces for the getReserveData return types
interface ReserveDataElement {
  unbacked: string;
  accruedToTreasuryScaled: string;
  totalAToken: string;
  totalStableDebt: string;
  totalVariableDebt: string;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  averageStableBorrowRate: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  lastUpdateTimestamp: string;
}

interface ReserveConfigDataElement {
  usageAsCollateralEnabled: string;
  borrowingEnabled: string;
  stableBorrowRateEnabled: string;
  isActive: string;
  isFrozen: string;
  isPaused: string;
  flashLoanEnabled: string;
}

interface TokenDataElement {
  symbol: string;
  name: string;
  decimals: string;
  tokenAddress?: string;
}

// Simplified ABI for the UI Pool Data Provider - focusing on what we need for flash loans
const UI_POOL_DATA_PROVIDER_ABI = [
  {
    "inputs": [
      {
        "internalType": "contract IPoolAddressesProvider",
        "name": "provider",
        "type": "address"
      }
    ],
    "name": "getReservesData",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "underlyingAsset", "type": "address" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "symbol", "type": "string" },
          { "internalType": "uint256", "name": "decimals", "type": "uint256" },
          { "internalType": "uint256", "name": "baseLTVasCollateral", "type": "uint256" },
          { "internalType": "uint256", "name": "reserveLiquidationThreshold", "type": "uint256" },
          { "internalType": "uint256", "name": "reserveLiquidationBonus", "type": "uint256" },
          { "internalType": "uint256", "name": "reserveFactor", "type": "uint256" },
          { "internalType": "bool", "name": "usageAsCollateralEnabled", "type": "bool" },
          { "internalType": "bool", "name": "borrowingEnabled", "type": "bool" },
          { "internalType": "bool", "name": "stableBorrowRateEnabled", "type": "bool" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "bool", "name": "isFrozen", "type": "bool" },
          { "internalType": "uint128", "name": "liquidityIndex", "type": "uint128" },
          { "internalType": "uint128", "name": "variableBorrowIndex", "type": "uint128" },
          { "internalType": "uint128", "name": "liquidityRate", "type": "uint128" },
          { "internalType": "uint128", "name": "variableBorrowRate", "type": "uint128" },
          { "internalType": "uint128", "name": "stableBorrowRate", "type": "uint128" },
          { "internalType": "uint40", "name": "lastUpdateTimestamp", "type": "uint40" },
          { "internalType": "address", "name": "aTokenAddress", "type": "address" },
          { "internalType": "address", "name": "stableDebtTokenAddress", "type": "address" },
          { "internalType": "address", "name": "variableDebtTokenAddress", "type": "address" },
          { "internalType": "address", "name": "interestRateStrategyAddress", "type": "address" },
          { "internalType": "uint256", "name": "availableLiquidity", "type": "uint256" },
          { "internalType": "uint256", "name": "totalPrincipalStableDebt", "type": "uint256" },
          { "internalType": "uint256", "name": "averageStableRate", "type": "uint256" },
          { "internalType": "uint256", "name": "stableDebtLastUpdateTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "totalScaledVariableDebt", "type": "uint256" },
          { "internalType": "uint256", "name": "priceInMarketReferenceCurrency", "type": "uint256" },
          { "internalType": "address", "name": "priceOracle", "type": "address" },
          { "internalType": "uint256", "name": "variableRateSlope1", "type": "uint256" },
          { "internalType": "uint256", "name": "variableRateSlope2", "type": "uint256" },
          { "internalType": "uint256", "name": "stableRateSlope1", "type": "uint256" },
          { "internalType": "uint256", "name": "stableRateSlope2", "type": "uint256" },
          { "internalType": "bool", "name": "isPaused", "type": "bool" },
          { "internalType": "uint128", "name": "accruedToTreasury", "type": "uint128" },
          { "internalType": "uint128", "name": "unbacked", "type": "uint128" },
          { "internalType": "uint128", "name": "isolationModeTotalDebt", "type": "uint128" },
          { "internalType": "bool", "name": "flashLoanEnabled", "type": "bool" }
        ],
        "internalType": "struct IUiPoolDataProviderV3.AggregatedReserveData[]",
        "name": "",
        "type": "tuple[]"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "marketReferenceCurrencyUnit", "type": "uint256" },
          { "internalType": "int256", "name": "marketReferenceCurrencyPriceInUsd", "type": "int256" },
          { "internalType": "int256", "name": "networkBaseTokenPriceInUsd", "type": "int256" },
          { "internalType": "uint8", "name": "networkBaseTokenPriceDecimals", "type": "uint8" }
        ],
        "internalType": "struct IUiPoolDataProviderV3.BaseCurrencyInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Helper function to decode reserve configuration data from Aave
 * @param configData The configuration data from getReserveData
 */
function decodeReserveConfiguration(configData: bigint): { isActive: boolean; isFrozen: boolean; isPaused: boolean; isFlashLoanEnabled: boolean } {
  const config = BigInt(configData);
  
  // Bitmask positions (adjust if necessary based on exact ABI version)
  const LTV_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000');
  const LIQUIDATION_THRESHOLD_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFF');
  const LIQUIDATION_BONUS_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFFFFFF');
  const DECIMALS_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00FFFFFFFFFFFF');
  const ACTIVE_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFF');
  const FROZEN_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFDFFFFFFFFFFFFFFFF');
  const BORROWING_ENABLED_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFFFFFFFFFFFFFFFF');
  const STABLE_BORROWING_ENABLED_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFFFFFFFFFFFFFFF');
  const PAUSED_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFF');
  const FLASHLOAN_ENABLED_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFDFFFFFFFFFFFFFFFFFFFFFF');
  const VISIBLE_ON_RESERVE_LIST_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFFFFFFFFFFFFFFFFFFFFFFFF');
  const BORROWABLE_IN_ISOLATION_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFFFFFFFFFFFFFFFFFFFFF');
  const SILOED_BORROWING_MASK = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');

  // Extract flags using bitwise operations
  const isActive = (config & ~ACTIVE_MASK) === BigInt(0);
  const isFrozen = (config & ~FROZEN_MASK) !== BigInt(0);
  const isPaused = (config & ~PAUSED_MASK) !== BigInt(0);
  const isFlashLoanEnabled = (config & ~FLASHLOAN_ENABLED_MASK) !== BigInt(0);

  return { isActive, isFrozen, isPaused, isFlashLoanEnabled };
}

/**
 * Fetches flash loan limits from Aave V3 using the UiPoolDataProviderV3 contract.
 * 
 * @param web3 Web3 instance connected to the desired network (Mainnet).
 * @param tokens An array of TokenInfo objects for which to fetch data.
 * @returns A promise resolving to FlashLoanLimitsResponse.
 */
export async function fetchAaveFlashLoanLimits(
  web3: Web3,
  tokens: TokenInfo[]
): Promise<FlashLoanLimitsResponse> {
  
  const results: FlashLoanLimitsResponse = {};
  const uiPoolDataProviderAddress = MAINNET_ADDRESSES.AAVE_UI_POOL_DATA_PROVIDER;
  const poolAddressesProvider = MAINNET_ADDRESSES.AAVE_POOL_ADDRESSES_PROVIDER;

  if (!uiPoolDataProviderAddress || !poolAddressesProvider) {
    console.error("Aave V3 UI Pool Data Provider or Pool Addresses Provider address for Mainnet is not defined in config.");
    throw new Error("Aave V3 UI Pool Data Provider or Pool Addresses Provider address for Mainnet is not defined.");
  }

  try {
    // Instantiate the UiPoolDataProvider contract
    const uiPoolDataProviderContract = new web3.eth.Contract(
      UI_POOL_DATA_PROVIDER_ABI, 
      uiPoolDataProviderAddress
    );

    // Call getReservesData to get all reserves at once
    // The API returns an array containing two elements: [reservesData, baseCurrencyInfo]
    const result = await uiPoolDataProviderContract.methods
      .getReservesData(poolAddressesProvider)
      .call();
    
    // DEBUG - Log the structure of the response
    console.log('Aave API response structure:', {
      resultType: typeof result,
      isArray: Array.isArray(result),
      length: Array.isArray(result) ? result.length : 0,
      first10Keys: result && typeof result === 'object' ? Object.keys(result).slice(0, 10) : []
    });
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('First element type:', typeof result[0]);
      console.log('First element is array:', Array.isArray(result[0]));
      
      if (Array.isArray(result[0]) && (result[0] as any).length > 0) {
        console.log('First reserve sample:', {
          underlyingAsset: (result[0][0] as any)?.underlyingAsset,
          symbol: (result[0][0] as any)?.symbol,
          flashLoanEnabled: (result[0][0] as any)?.flashLoanEnabled
        });
      }
    }
    
    // Check that result is properly structured
    if (!result || !Array.isArray(result) || result.length < 1) {
      throw new Error("Invalid response format from Aave UI Pool Data Provider");
    }
    
    // First element of result contains the reserves array
    const reservesData = result[0] as AaveReserveData[];
    
    // Create a map for quick lookup by underlying asset address
    const reservesMap: { [address: string]: AaveReserveData } = {};
    
    // Process reserves data 
    if (Array.isArray(reservesData)) {
      reservesData.forEach((reserve: AaveReserveData) => {
        if (reserve && reserve.underlyingAsset) {
          const tokenAddress = reserve.underlyingAsset.toLowerCase();
          reservesMap[tokenAddress] = reserve;
        }
      });
    }

    // Process each token to create results
    for (const token of tokens) {
      const tokenAddress = token.address.toLowerCase();
      const reserveData = reservesMap[tokenAddress];
      
      if (reserveData) {
        // Use reserve data from the map
        results[tokenAddress] = {
          tokenAddress: tokenAddress,
          tokenSymbol: token.symbol,
          availableLiquidity: reserveData.availableLiquidity || '0',
          reserveState: {
            isActive: reserveData.isActive || false,
            isFrozen: reserveData.isFrozen || false,
            isPaused: reserveData.isPaused || false,
            isFlashLoanEnabled: reserveData.flashLoanEnabled || false,
          }
        };
      } else {
        // Reserve data not found
        results[tokenAddress] = {
          tokenAddress: tokenAddress,
          tokenSymbol: token.symbol,
          availableLiquidity: "0",
          reserveState: {
            isActive: false,
            isFrozen: false,
            isPaused: false,
            isFlashLoanEnabled: false,
          }
        };
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching Aave flash loan limits:', error);
    // Return default empty values
    const defaultResults: FlashLoanLimitsResponse = {};
    for (const token of tokens) {
      defaultResults[token.address.toLowerCase()] = {
        tokenAddress: token.address.toLowerCase(),
        tokenSymbol: token.symbol,
        availableLiquidity: "0",
        reserveState: {
          isActive: false,
          isFrozen: false,
          isPaused: false,
          isFlashLoanEnabled: false,
        },
      };
    }
    return defaultResults;
  }
}

/**
 * Executes a flash loan using the Aave protocol
 * 
 * @param web3 Web3 instance connected to the desired network (Mainnet).
 * @param token The TokenInfo object for the token to be borrowed.
 * @param amount The amount to be borrowed.
 * @returns A promise resolving to the transaction receipt.
 */
export async function executeAaveFlashLoan(
  web3: Web3,
  token: TokenInfo,
  amount: string
): Promise<providers.TransactionReceipt> {
  // Implementation of executeAaveFlashLoan function
  throw new Error("Method not implemented");
}