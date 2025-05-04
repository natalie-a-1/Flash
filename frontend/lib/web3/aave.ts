import Web3 from "web3";
import { TokenInfo } from "@/types/aave";
import { MAINNET_ADDRESSES } from "@/lib/web3/config";

/**
 * Executes a flash loan via Aave.
 *
 * This function calls the deployed FlashLoan contract to request a flash loan
 * on supported networks (Mainnet and Mainnet Fork).
 *
 * @param {Web3} web3 - An instance of the Web3 library.
 * @param {TokenInfo} token - Token information for the flash loan.
 * @param {string} amount - The amount to borrow in wei.
 * @returns {Promise<boolean>} True if the transaction succeeds, false otherwise.
 */
export async function executeAaveFlashLoan(
  web3: Web3,
  token: TokenInfo,
  amount: string,
): Promise<boolean> {
  if (!window.flashLoanContract) {
    throw new Error("FlashLoan contract not loaded");
  }
  const flashLoanContract = window.flashLoanContract;
  const {
    UNISWAP_V2_ROUTER,
    SUSHISWAP_V2_ROUTER,
    WETH,
  } = MAINNET_ADDRESSES;
  const slippageBps = 50; // default 0.5% slippage tolerance

  try {
    // requestFlashLoan(_asset, _amount, _sourceRouter, _targetRouter, _intermediateToken, _slippageBps)
    const txResponse = await flashLoanContract.requestFlashLoan(
      token.address,
      amount,
      UNISWAP_V2_ROUTER,
      SUSHISWAP_V2_ROUTER,
      WETH,
      slippageBps,
      { value: 0 },
    );
    await txResponse.wait();
    return true;
  } catch (error) {
    console.error("Flash loan execution failed:", error);
    return false;
  }
}
