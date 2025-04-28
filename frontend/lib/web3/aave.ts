import Web3 from "web3";
import { TokenInfo } from "@/types/aave";

/**
 * Executes a flash loan via Aave.
 * 
 * This is a stub function that simulates the execution of a flash loan.
 * It currently logs a warning message indicating that no transaction is sent
 * and returns a promise that resolves to false.
 * 
 * @param {Web3} web3 - An instance of the Web3 library. Currently unused in this stub.
 * @param {TokenInfo} token - An object containing token information such as address and symbol.
 * @param {string} amount - The amount for the flash loan, specified in wei as a string.
 * @returns {Promise<boolean>} A promise that resolves to false, indicating no transaction is executed.
 */
export async function executeAaveFlashLoan(
  web3: Web3,
  token: TokenInfo,
  amount: string
): Promise<boolean> {
  console.warn("Flash loan execution stub called: no transaction sent.");
  return false;
}