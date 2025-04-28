import Web3 from "web3";
import { ethers } from "ethers";
import { 
  ReserveData, 
  TokenInfo, 
  FlashLoanLimitsResponse 
} from "@/types/aave";
import { MAINNET_ADDRESSES } from "@/lib/web3/config";
import { MetaMaskEthereumProvider } from "./web3";

// Extend Window interface to include flashLoanContract
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
    flashLoanContract?: ethers.Contract | null;
  }
}

// Aave Pool ABI - only what we need for availableLiquidity
const AAVE_POOL_ABI = [
  {
    "inputs": [],
    "name": "getReservesList",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      }
    ],
    "name": "getReserveData",
    "outputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "data",
                "type": "uint256"
              }
            ],
            "internalType": "struct DataTypes.ReserveConfigurationMap",
            "name": "configuration",
            "type": "tuple"
          },
          {
            "internalType": "uint128",
            "name": "liquidityIndex",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "currentLiquidityRate",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "variableBorrowIndex",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "currentVariableBorrowRate",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "currentStableBorrowRate",
            "type": "uint128"
          },
          {
            "internalType": "uint40",
            "name": "lastUpdateTimestamp",
            "type": "uint40"
          },
          {
            "internalType": "uint16",
            "name": "id",
            "type": "uint16"
          },
          {
            "internalType": "address",
            "name": "aTokenAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "stableDebtTokenAddress",
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
          }
        ],
        "internalType": "struct DataTypes.ReserveData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for ERC20 token to get token balances
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// Aave Mainnet addresses - imported from config
const AAVE_ADDRESSES = {
  POOL_ADDRESSES_PROVIDER: MAINNET_ADDRESSES.AAVE_POOL_PROVIDER,
  UI_POOL_DATA_PROVIDER: MAINNET_ADDRESSES.AAVE_UI_POOL_DATA_PROVIDER,
  POOL: MAINNET_ADDRESSES.POOL
};

/**
 * Fetches flash loan limits from Aave for the specified tokens
 * 
 * This function queries the Aave Pool contract directly using getReserveData
 * to get accurate information about available liquidity for flash loans.
 * 
 * @param web3 - Web3 instance (not used in the updated method)
 * @param tokens - Array of token information objects
 * @returns Record of token addresses to their available flash loan liquidity
 */
export async function fetchAaveFlashLoanLimits(
  web3: Web3,
  tokens: TokenInfo[]
): Promise<FlashLoanLimitsResponse> {
  // Response object to return
  const response: FlashLoanLimitsResponse = {};
  
  try {
    // Use ethers.js directly for more reliable contract interactions
    // Create a provider using the window.ethereum provider
    if (!window.ethereum) {
      console.error("MetaMask or similar provider not found");
      return {};
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Create a contract instance for the Aave Pool
    const aavePool = new ethers.Contract(
      AAVE_ADDRESSES.POOL,
      AAVE_POOL_ABI,
      provider
    );
    
    // For each token, get the reserve data from Aave Pool
    for (const token of tokens) {
      try {
        // Get reserve data from Aave Pool
        const reserveData = await aavePool.getReserveData(token.address);
        
        // Get aToken contract address from reserve data
        const aTokenAddress = reserveData.aTokenAddress;
        
        // Create aToken contract instance
        const aTokenContract = new ethers.Contract(
          aTokenAddress,
          ERC20_ABI,
          provider
        );
        
        // Get the underlying token contract
        const tokenContract = new ethers.Contract(
          token.address,
          ERC20_ABI,
          provider
        );
        
        // Get total aToken supply (represents total deposited assets)
        const aTokenTotalSupply = await aTokenContract.totalSupply();
        
        // Get total underlying token balance in the pool
        const poolTokenBalance = await tokenContract.balanceOf(AAVE_ADDRESSES.POOL);
        
        // Calculate available liquidity: total underlying token balance in the pool
        // This is the amount available for flash loans
        const availableLiquidity = poolTokenBalance;
        
        console.log(`Aave liquidity for ${token.symbol}:`, availableLiquidity.toString());
        
        // Store the result in our response object
        response[token.address] = availableLiquidity.toString();
      } catch (tokenError) {
        console.error(`Error fetching liquidity for ${token.symbol}:`, tokenError);
      }
    }
    
    console.log("Aave flash loan limits:", response);
    return response;
  } catch (error) {
    console.error("Error fetching Aave flash loan limits:", error);
    return {};
  }
}

/**
 * Checks if routers are approved for spending tokens and approves if needed
 * 
 * @param userAccount - User's Ethereum address
 * @returns Boolean indicating success
 */
async function checkAndApproveRouters(userAccount: string): Promise<boolean> {
  try {
    // For now, just log the check but later we can implement actual checking
    console.log("Checking router approvals for account:", userAccount);
    return true;
  } catch (error) {
    console.error("Error checking router approvals:", error);
    return false;
  }
}

/**
 * Executes a flash loan using the Aave protocol
 * 
 * @param tokenAddress - Address of the token to borrow
 * @param amount - Amount to borrow in token units (wei, etc.)
 * @returns Boolean indicating success
 */
export async function executeAaveFlashLoan(
  tokenAddress: string,
  amount: string
): Promise<boolean> {
  try {
    // Connect to Ethereum using ethers.js
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAccount = await signer.getAddress();
    
    // Check and approve routers if needed
    await checkAndApproveRouters(userAccount);
    
    // Get deployed FlashLoan contract from backend
    const flashLoanContract = window.flashLoanContract;
    if (!flashLoanContract) {
      throw new Error("Flash loan contract not loaded");
    }
    
    // Request the flash loan
    // The contract function may vary depending on your implementation
    const tx = await flashLoanContract.requestFlashLoan(
      tokenAddress,
      amount,
      { gasLimit: 5000000 }
    );
    
    // Wait for transaction to be mined
    await tx.wait();
    
    console.log("Flash loan executed successfully:", tx.hash);
    return true;
  } catch (error) {
    console.error("Error executing flash loan:", error);
    return false;
  }
}