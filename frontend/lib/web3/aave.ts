import Web3 from "web3";
import { TokenInfo } from "@/types/aave";

/**
 * Stub function to execute a flash loan via Aave.
 * Currently it logs a warning and returns false.
 * @param web3 Unused Web3 instance
 * @param token Token info (address, symbol, etc.)
 * @param amount Amount in wei as a string
 * @returns Promise resolving to false
 */
export async function executeAaveFlashLoan(
  web3: Web3,
  token: TokenInfo,
  amount: string
): Promise<boolean> {
  console.warn("Flash loan execution stub called: no transaction sent.");
  return false;
}