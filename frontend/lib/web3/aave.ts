import Web3 from "web3";
import { ethers } from "ethers";
import { TokenInfo } from "@/types/aave";
// Remove unused import MAINNET_ADDRESSES as routers will be passed in
// import { MAINNET_ADDRESSES } from "@/lib/web3/config";

/**
 * Debug function to check contract state and approvals before executing flash loan
 *
 * @param tokenAddress The address of the token to be borrowed
 * @param sourceRouter Source router address
 * @param targetRouter Target router address
 * @returns Promise<void>
 */
export async function debugFlashLoanState(
  tokenAddress: string,
  sourceRouter: string,
  targetRouter: string,
): Promise<void> {
  if (!window.flashLoanContract || !window.ethereum) {
    console.error("DEBUG: Flash loan contract or ethereum not available");
    return;
  }

  try {
    console.group("📊 Flash Loan Pre-execution Debug");

    // Check contract details
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contractAddress = window.flashLoanContract.address;
    console.log("Contract address:", contractAddress);

    // Check contract ETH balance
    const contractBalance = await provider.getBalance(contractAddress);
    console.log(
      "Contract ETH balance:",
      ethers.utils.formatEther(contractBalance),
      "ETH",
    );

    // Check if account is contract owner
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    console.log("Current account:", account);

    try {
      const owner = await window.flashLoanContract.getOwner();
      console.log("Contract owner:", owner);
      console.log(
        "Is current account the owner:",
        owner.toLowerCase() === account.toLowerCase(),
      );
    } catch (error) {
      console.error("Error getting contract owner:", error);
    }

    // Check router approvals
    try {
      const sourceRouterApproved =
        await window.flashLoanContract.isRouterApproved(sourceRouter);
      const targetRouterApproved =
        await window.flashLoanContract.isRouterApproved(targetRouter);
      console.log("Router approvals:", {
        sourceRouter,
        sourceRouterApproved,
        targetRouter,
        targetRouterApproved,
      });
    } catch (error) {
      console.error("Error checking router approvals:", error);
    }

    // Check pool address
    try {
      const poolAddress = await window.flashLoanContract.ADDRESSES_PROVIDER();
      console.log("Addresses provider:", poolAddress);
    } catch (error) {
      console.error("Error getting pool provider address:", error);
    }

    // Check token ERC20 details if possible
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
          "function balanceOf(address) view returns (uint256)",
        ],
        provider,
      );

      const [name, symbol, decimals, contractBalance] = await Promise.all([
        tokenContract.name().catch(() => "Unknown"),
        tokenContract.symbol().catch(() => "???"),
        tokenContract.decimals().catch(() => 18),
        tokenContract.balanceOf(contractAddress).catch(() => "0"),
      ]);

      console.log("Token details:", {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        contractBalance: contractBalance.toString(),
      });
    } catch (error) {
      console.error("Error getting token details:", error);
    }

    console.groupEnd();
  } catch (error) {
    console.error("Error in debugFlashLoanState:", error);
    console.groupEnd();
  }
}

/**
 * Checks if a router address is approved in the FlashLoan contract
 *
 * @param {string} routerAddress - The address of the router to check
 * @returns {Promise<boolean>} True if the router is approved, false otherwise
 */
export async function isRouterApproved(
  routerAddress: string,
): Promise<boolean> {
  if (!window.flashLoanContract) {
    throw new Error("FlashLoan contract not loaded");
  }

  try {
    return await window.flashLoanContract.isRouterApproved(routerAddress);
  } catch (error) {
    console.error("Error checking router approval:", error);
    return false;
  }
}

/**
 * Executes a flash loan via Aave.
 *
 * This function calls the deployed FlashLoan contract to request a flash loan.
 *
 * @param {Web3} web3 - An instance of the Web3 library.
 * @param {TokenInfo} token - Token information for the flash loan (e.g., USDC).
 * @param {string} amount - The amount to borrow in wei.
 * @param {string} sourceRouter - Address of the DEX router for the first swap.
 * @param {string} targetRouter - Address of the DEX router for the second swap.
 * @param {string} intermediateToken - Address of the intermediate token (e.g., WETH).
 * @param {number} slippageBps - Slippage tolerance in basis points.
 * @returns {Promise<boolean>} True if the transaction succeeds, false otherwise.
 */
export async function executeAaveFlashLoan(
  web3: Web3, // web3 instance might not be strictly needed if window.flashLoanContract is already configured with signer
  token: TokenInfo,
  amount: string,
  sourceRouter: string,
  targetRouter: string,
  intermediateToken: string,
  slippageBps: number,
): Promise<boolean> {
  if (!window.flashLoanContract) {
    throw new Error("FlashLoan contract not loaded");
  }
  const flashLoanContract = window.flashLoanContract;
  // Remove hardcoded values
  // const { UNISWAP_V2_ROUTER, SUSHISWAP_V2_ROUTER, WETH } = MAINNET_ADDRESSES;
  // const slippageBps = 50; // Use passed value

  console.group("🚀 Executing Flash Loan");
  console.log("Loan Parameters:", {
    asset: token.address,
    symbol: token.symbol,
    amount,
    humanReadableAmount: Number(amount) / Math.pow(10, token.decimals),
    sourceRouter,
    targetRouter,
    intermediateToken,
    slippageBps,
  });

  // Run debug checks before proceeding
  await debugFlashLoanState(token.address, sourceRouter, targetRouter);

  try {
    console.log(
      "Preparing transaction with contract:",
      flashLoanContract.address,
    );

    // Get current gas price and estimate gas for the transaction
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const gasPrice = await provider.getGasPrice();
    console.log(
      "Current gas price:",
      ethers.utils.formatUnits(gasPrice, "gwei"),
      "gwei",
    );

    // Get network information
    const network = await provider.getNetwork();
    console.log("Network:", { chainId: network.chainId, name: network.name });

    let gasEstimate;
    try {
      gasEstimate = await flashLoanContract.estimateGas.requestFlashLoan(
        token.address,
        amount,
        sourceRouter,
        targetRouter,
        intermediateToken,
        slippageBps,
        { value: 0 },
      );
      console.log("Estimated gas limit:", gasEstimate.toString());
    } catch (gasError) {
      console.warn(
        "Gas estimation failed (this often happens, but tx may still succeed):",
        gasError,
      );
      console.log("Using default gas limit instead");
      // We'll proceed without gas estimation and let ethers use its default
    }

    // Prepare transaction options
    const txOptions = {
      value: 0,
      gasLimit: gasEstimate ? gasEstimate.mul(120).div(100) : 500000, // Add 20% buffer if we have an estimate
    };
    console.log("Transaction options:", txOptions);

    // Call requestFlashLoan with dynamic parameters
    console.log("Sending transaction...");
    const txResponse = await flashLoanContract.requestFlashLoan(
      token.address, // _asset
      amount, // _amount
      sourceRouter, // _sourceRouter
      targetRouter, // _targetRouter
      intermediateToken, // _intermediateToken
      slippageBps, // _slippageBps
      txOptions,
    );
    console.log("Flash loan transaction sent:", txResponse.hash);

    // Wait for transaction confirmation
    console.log("Waiting for transaction confirmation...");
    const txReceipt = await txResponse.wait();
    console.log("Transaction confirmed! Receipt:", {
      blockNumber: txReceipt.blockNumber,
      gasUsed: txReceipt.gasUsed.toString(),
      status: txReceipt.status,
      logs: txReceipt.logs.length,
    });

    if (txReceipt.status === 1) {
      console.log("✅ Flash loan executed successfully!");
      console.groupEnd();
      return true;
    } else {
      console.error("❌ Transaction failed with status 0");
      console.groupEnd();
      return false;
    }
  } catch (error: any) {
    console.error("❌ Flash loan execution failed:", error);

    // Detailed error extraction
    console.group("🔍 Error Details");

    // Try to extract error from transaction
    if (error.transaction) {
      console.log("Failed transaction details:", {
        to: error.transaction.to,
        from: error.transaction.from,
        data: error.transaction.data?.substring(0, 100) + "...", // Truncate data
        value: error.transaction.value?.toString(),
        gasLimit: error.transaction.gasLimit?.toString(),
      });
    }

    // Try to extract error from receipt
    if (error.receipt) {
      console.log("Transaction receipt:", {
        status: error.receipt.status,
        gasUsed: error.receipt.gasUsed?.toString(),
        blockNumber: error.receipt.blockNumber,
        logs: error.receipt.logs?.length || 0,
      });
    }

    // --- Improved Error Reason Extraction ---
    let revertReason = "Flash loan execution failed.";
    if (error.reason) {
      revertReason = error.reason;
      console.log("Error reason:", error.reason);
    } else if (error.data?.message) {
      revertReason = error.data.message;
      console.log("Error data message:", error.data.message);
    } else if (error.message) {
      // Try to extract reason from common patterns
      const match = error.message.match(/revert(?:ed)?:? (.*)/i);
      if (match && match[1]) {
        revertReason = match[1].trim();
      } else {
        revertReason = error.message;
      }
      console.log("Error message:", error.message);
    } else if (error.error?.message) {
      revertReason = error.error.message;
      console.log("Nested error message:", error.error.message);
    }

    // Try to extract error code
    if (error.code) {
      console.log("Error code:", error.code);
    }

    // Remove VM Exception prefix if present
    if (
      revertReason.startsWith(
        "VM Exception while processing transaction: revert",
      )
    ) {
      revertReason = revertReason
        .substring("VM Exception while processing transaction: revert".length)
        .trim();
      if (revertReason.startsWith("-")) {
        revertReason = revertReason.substring(1).trim();
      }
    }

    if (revertReason === "")
      revertReason = "Transaction reverted with no specific reason.";
    console.log("Extracted Revert Reason:", revertReason);

    // Try to get any extra info from error object
    console.log("Raw error object keys:", Object.keys(error));
    if (error.data) console.log("Error data:", error.data);

    console.groupEnd(); // End error details group
    console.groupEnd(); // End executing flash loan group

    return false;
  }
}
