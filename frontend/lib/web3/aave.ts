import Web3 from "web3";
import { ethers } from "ethers";
import { 
  ReserveData, 
  TokenInfo, 
  FlashLoanLimitsResponse 
} from "@/types/aave";
import { SEPOLIA_ADDRESSES } from "@/lib/web3/config";

// Aave Pool Data Provider ABI - only what we need for getLiquidityLimits
const POOL_DATA_PROVIDER_ABI = [
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
          {
            "internalType": "address",
            "name": "underlyingAsset",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "decimals",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseLTVasCollateral",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "reserveLiquidationThreshold",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "reserveLiquidationBonus",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "reserveFactor",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "usageAsCollateralEnabled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "borrowingEnabled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isFrozen",
            "type": "bool"
          },
          {
            "internalType": "uint128",
            "name": "liquidityIndex",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "variableBorrowIndex",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "liquidityRate",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "variableBorrowRate",
            "type": "uint128"
          },
          {
            "internalType": "uint40",
            "name": "lastUpdateTimestamp",
            "type": "uint40"
          },
          {
            "internalType": "address",
            "name": "aTokenAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "variableDebtTokenAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "interestRateStrategyAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "availableLiquidity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalScaledVariableDebt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInMarketReferenceCurrency",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "priceOracle",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "variableRateSlope1",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "variableRateSlope2",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseVariableBorrowRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "optimalUsageRatio",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isPaused",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isSiloedBorrowing",
            "type": "bool"
          },
          {
            "internalType": "uint128",
            "name": "accruedToTreasury",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "unbacked",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "isolationModeTotalDebt",
            "type": "uint128"
          },
          {
            "internalType": "bool",
            "name": "flashLoanEnabled",
            "type": "bool"
          }
        ],
        "internalType": "struct IUiPoolDataProviderV3.AggregatedReserveData[]",
        "name": "",
        "type": "tuple[]"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "marketReferenceCurrencyUnit",
            "type": "uint256"
          },
          {
            "internalType": "int256",
            "name": "marketReferenceCurrencyPriceInUsd",
            "type": "int256"
          },
          {
            "internalType": "int256",
            "name": "networkBaseTokenPriceInUsd",
            "type": "int256"
          },
          {
            "internalType": "uint8",
            "name": "networkBaseTokenPriceDecimals",
            "type": "uint8"
          }
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

// Aave Sepolia addresses - imported from config
const AAVE_ADDRESSES = {
  POOL_ADDRESSES_PROVIDER: SEPOLIA_ADDRESSES.AAVE_POOL_PROVIDER,
  UI_POOL_DATA_PROVIDER: SEPOLIA_ADDRESSES.AAVE_UI_POOL_DATA_PROVIDER
};

// Debug constants to help identify token address matching issues
const DEBUG = {
  LOWERCASE_TOKENS: true, // Set to true to lowercase all token addresses for comparison
  LOG_RESERVE_DATA: true, // Set to true to log reserve data for debugging
  LOG_MATCHING_ATTEMPTS: true // Set to true to log token matching attempts
};

/**
 * Fetches flash loan limits from Aave for the specified tokens
 * 
 * @param web3 - Web3 instance
 * @param tokens - Array of token information objects
 * @returns Record of token addresses to their available flash loan liquidity
 */
export async function fetchAaveFlashLoanLimits(
  web3: Web3,
  tokens: TokenInfo[]
): Promise<FlashLoanLimitsResponse> {
  if (!web3) {
    throw new Error("Web3 not initialized");
  }

  console.log("Fetching flash loan limits for tokens:", tokens.map(t => `${t.symbol} (${t.address})`).join(', '));

  // Create contract instance for the UI Pool Data Provider using ethers.js
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const ethersSigner = await provider.getSigner();
    
    console.log("Connected to network:", await provider.getNetwork());
    
    const dataProviderContract = new ethers.Contract(
      AAVE_ADDRESSES.UI_POOL_DATA_PROVIDER,
      POOL_DATA_PROVIDER_ABI,
      ethersSigner
    );
    
    // Process the reserves data to find our tokens
    const tokenAvailability: FlashLoanLimitsResponse = {};
    
    try {
      console.log("Calling getReservesData with provider address:", AAVE_ADDRESSES.POOL_ADDRESSES_PROVIDER);
      
      // Get reserves data from Aave
      const [reservesData] = await dataProviderContract.getReservesData(
        AAVE_ADDRESSES.POOL_ADDRESSES_PROVIDER
      );
      
      console.log(`Received ${reservesData.length} reserves from Aave`);
      
      if (DEBUG.LOG_RESERVE_DATA) {
        console.log("Reserves data summary:");
        reservesData.forEach((reserve: any, index: number) => {
          console.log(`${index + 1}: ${reserve.symbol} (${reserve.underlyingAsset}), 
            Active: ${reserve.isActive}, 
            Paused: ${reserve.isPaused}, 
            Flash loans: ${reserve.flashLoanEnabled}, 
            Liquidity: ${reserve.availableLiquidity.toString()}`);
        });
      }
      
      // Process each reserve to find our tokens
      for (const reserve of reservesData) {
        // Normalize addresses for comparison if debug option is enabled
        const tokenAddress = DEBUG.LOWERCASE_TOKENS ? 
          reserve.underlyingAsset.toLowerCase() : 
          reserve.underlyingAsset;
        
        // Only add tokens that are in our tokens list and have flash loans enabled
        const matchingToken = tokens.find(t => {
          const compareAddress = DEBUG.LOWERCASE_TOKENS ? 
            t.address.toLowerCase() : 
            t.address;
          
          const isMatch = compareAddress === tokenAddress;
          
          if (DEBUG.LOG_MATCHING_ATTEMPTS) {
            console.log(`Comparing ${t.symbol} (${compareAddress}) with reserve (${tokenAddress}) => ${isMatch ? 'MATCH' : 'NO MATCH'}`);
          }
          
          return isMatch;
        });
        
        if (matchingToken && reserve.flashLoanEnabled && reserve.isActive && !reserve.isPaused) {
          // Store the available liquidity for flash loans
          tokenAvailability[matchingToken.address] = reserve.availableLiquidity.toString();
          console.log(`Found matching token ${matchingToken.symbol} with ${reserve.availableLiquidity.toString()} available liquidity`);
        }
      }
    } catch (error) {
      console.error("Error fetching flash loan limits:", error);
      console.error("Call stack:", new Error().stack);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
    
    // For any tokens in our list that weren't found, set a default of 0
    tokens.forEach(token => {
      if (!tokenAvailability[token.address]) {
        console.warn(`Token ${token.symbol} (${token.address}) not found in Aave reserves or not eligible for flash loans`);
        tokenAvailability[token.address] = "0";
      }
    });
    
    return tokenAvailability;
  } catch (error) {
    console.error("Error in fetchAaveFlashLoanLimits:", error);
    console.error("Call stack:", new Error().stack);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    
    // Return empty object with zeros for all tokens in case of error
    const fallbackLimits: FlashLoanLimitsResponse = {};
    tokens.forEach(token => {
      fallbackLimits[token.address] = "0";
    });
    return fallbackLimits;
  }
}

/**
 * Checks if routers are approved and approves them if needed
 * 
 * @param userAccount - User's Ethereum address
 * @returns Promise resolving to true if routers are approved
 */
async function checkAndApproveRouters(userAccount: string): Promise<boolean> {
  try {
    // Load the FlashLoan contract
    const { loadContract } = await import("./contracts");
    const flashLoanContract = await loadContract("FlashLoan");
    
    if (!flashLoanContract) {
      console.error("FlashLoan contract not found or not deployed on this network");
      return false;
    }
    
    // Get router addresses from config
    const { SEPOLIA_ADDRESSES } = await import("./config");
    const sourceRouter = SEPOLIA_ADDRESSES.UNISWAP_V2_ROUTER;
    const targetRouter = SEPOLIA_ADDRESSES.SUSHISWAP_V2_ROUTER;
    
    // Check if routers are approved
    const isSourceApproved = await flashLoanContract.methods.isRouterApproved(sourceRouter).call();
    const isTargetApproved = await flashLoanContract.methods.isRouterApproved(targetRouter).call();
    
    console.log(`Router approval status - Uniswap: ${isSourceApproved}, SushiSwap: ${isTargetApproved}`);
    
    // Approve routers if needed
    if (!isSourceApproved) {
      console.log("Approving Uniswap router...");
      await flashLoanContract.methods.setRouterApproval(sourceRouter, true).send({ from: userAccount });
    }
    
    if (!isTargetApproved) {
      console.log("Approving SushiSwap router...");
      await flashLoanContract.methods.setRouterApproval(targetRouter, true).send({ from: userAccount });
    }
    
    return true;
  } catch (error) {
    console.error("Error checking/approving routers:", error);
    return false;
  }
}

/**
 * Executes a flash loan through the Aave protocol by calling our deployed FlashLoan contract
 * 
 * @param tokenAddress - Address of the token to borrow
 * @param amount - Amount to borrow in smallest token units
 * @returns Promise resolving to the transaction details
 */
export async function executeAaveFlashLoan(
  tokenAddress: string,
  amount: string
): Promise<boolean> {
  try {
    console.log(`Executing flash loan for ${amount} of token ${tokenAddress}`);
    
    // Load the FlashLoan contract
    const { loadContract } = await import("./contracts");
    const flashLoanContract = await loadContract("FlashLoan");
    
    if (!flashLoanContract) {
      console.error("FlashLoan contract not found or not deployed on this network");
      return false;
    }
    
    // Get the current user's account
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    const userAccount = accounts[0];
    
    // Check and approve routers if needed
    const routersApproved = await checkAndApproveRouters(userAccount);
    if (!routersApproved) {
      throw new Error("Failed to approve routers. You must be the contract owner to approve routers.");
    }
    
    // Get router addresses from config
    const { SEPOLIA_ADDRESSES } = await import("./config");
    
    // For this example, we'll use WETH as the intermediate token
    // Source router is Uniswap, target router is SushiSwap
    const sourceRouter = SEPOLIA_ADDRESSES.UNISWAP_V2_ROUTER;
    const targetRouter = SEPOLIA_ADDRESSES.SUSHISWAP_V2_ROUTER;
    const intermediateToken = SEPOLIA_ADDRESSES.WETH;
    
    // Call the contract's requestFlashLoan function
    const tx = await flashLoanContract.methods.requestFlashLoan(
      tokenAddress,
      amount,
      sourceRouter,
      targetRouter,
      intermediateToken
    ).send({ from: userAccount });
    
    console.log("Flash loan transaction:", tx);
    return true;
  } catch (error) {
    console.error("Error executing flash loan:", error);
    return false;
  }
} 