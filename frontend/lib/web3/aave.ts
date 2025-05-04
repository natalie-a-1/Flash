import Web3 from "web3";
import { TokenInfo } from "@/types/aave";
// Remove unused import MAINNET_ADDRESSES as routers will be passed in
// import { MAINNET_ADDRESSES } from "@/lib/web3/config";

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

  console.log("Executing Flash Loan with params:", {
    asset: token.address,
    amount,
    sourceRouter,
    targetRouter,
    intermediateToken,
    slippageBps,
  }); // ADDED LOG

  try {
    // Call requestFlashLoan with dynamic parameters
    const txResponse = await flashLoanContract.requestFlashLoan(
      token.address, // _asset
      amount, // _amount
      sourceRouter, // _sourceRouter
      targetRouter, // _targetRouter
      intermediateToken, // _intermediateToken
      slippageBps, // _slippageBps
      { value: 0 }, // No ETH value needed unless contract logic changes
    );
    console.log("Flash loan transaction sent:", txResponse.hash); // ADDED LOG
    await txResponse.wait();
    console.log("Flash loan transaction confirmed."); // ADDED LOG
    return true;
  } catch (error: any) {
    console.error("Flash loan execution failed: ", error);

    // --- Improved Error Reason Extraction ---
    let revertReason = "Flash loan execution failed.";
    if (error.reason) {
      revertReason = error.reason;
    } else if (error.data?.message) {
      revertReason = error.data.message;
    } else if (error.message) {
        // Try to extract reason from common patterns
        const match = error.message.match(/revert(?:ed)?:? (.*)/i);
        if (match && match[1]) {
            revertReason = match[1].trim();
        } else {
            revertReason = error.message;
        }
    } else if (error.error?.message) {
      revertReason = error.error.message;
    } 

    // Remove VM Exception prefix if present
    if (revertReason.startsWith("VM Exception while processing transaction: revert")) {
        revertReason = revertReason.substring("VM Exception while processing transaction: revert".length).trim();
        if (revertReason.startsWith("-")) {
             revertReason = revertReason.substring(1).trim();
        }
    }
    if (revertReason === "") revertReason = "Transaction reverted with no specific reason.";
    console.error("Extracted Revert Reason:", revertReason, "(raw error data:", error.data,")");
    // --- End Improved Error Reason Extraction ---

    // alert(`Flash loan execution failed: ${revertReason}`); // Use extracted reason
    return false;
  }
}
