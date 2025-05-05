import Web3 from "web3";
import { ContractJson, Web3Contract } from "@/types/contracts";
import { getNetworkDetails } from "./web3";
import { MAINNET_ADDRESSES } from "./config";

/**
 * Loads a contract instance for the given contract name.
 *
 * This function attempts to dynamically import the contract's JSON file,
 * retrieve the current network ID, and check if the contract is deployed
 * on the current network. If the contract is not deployed, it attempts to
 * use a fallback address if available.
 *
 * @param {string} contractName - The name of the contract to load.
 * @returns {Promise<Web3Contract | null>} A promise that resolves to a Web3Contract instance or null if not found.
 */
export async function loadContract(
  contractName: string,
): Promise<Web3Contract | null> {
  try {
    // Dynamically import the contract JSON
    const contractJson: ContractJson = await import(
      `@/contracts/${contractName}.json`
    );

    // Get the current network ID
    const networkDetails = await getNetworkDetails();
    let networkId = networkDetails.id.toString();
    console.log(
      `[loadContract] Network ID detected by frontend (eth_chainId): ${networkId}`,
    );

    // Handle Ganache fork reporting network ID 1 during migration
    // while MetaMask reports 1337 for the running instance.
    let artifactNetworkKey = networkId;
    if (networkId === "1337") {
      console.log(
        `[loadContract] Detected local fork (1337), attempting to load artifact using key '1'`,
      );
      artifactNetworkKey = "1"; // Truffle saved artifact under network ID 1 for forks
    }

    console.log(
      `[loadContract] contractJson.networks object:`,
      contractJson.networks,
    );
    console.log(
      `[loadContract] Looking for key '${artifactNetworkKey}' in networks object...`,
    );
    console.log(
      `[loadContract] contractJson.networks[${artifactNetworkKey}] entry:`,
      contractJson.networks
        ? contractJson.networks[artifactNetworkKey]
        : "N/A (networks obj missing)",
    );

    // For FlashLoan contracts on localhost, fetch the latest deployed address from the API
    if (contractName === "FlashLoan" && networkId === "1337") {
      try {
        console.log(
          "[loadContract] FlashLoan contract on localhost detected, fetching current address from API...",
        );
        const response = await fetch("/api/get-contract-address");
        const data = await response.json();

        if (data.contractAddress) {
          console.log(
            `[loadContract] Successfully fetched current contract address from API: ${data.contractAddress}`,
          );
          // Create and return the contract instance with the fetched address
          return createContractInstance(contractJson.abi, data.contractAddress);
        } else {
          console.error(
            "[loadContract] API returned no contract address:",
            data,
          );
        }
      } catch (error) {
        console.error(
          "[loadContract] Error fetching contract address from API:",
          error,
        );
        // Continue with normal flow if API fetch fails
      }
    }

    // Check if the contract is deployed on this network (using the adjusted key)
    if (contractJson.networks && contractJson.networks[artifactNetworkKey]) {
      console.log(
        `[loadContract] Found network entry for key '${artifactNetworkKey}'. Address: ${contractJson.networks[artifactNetworkKey].address}`,
      );
      // Create and return the contract instance using network deployment info
      return createContractInstance(
        contractJson.abi,
        contractJson.networks[artifactNetworkKey].address,
      );
    } else {
      // Contract not deployed on this network
      console.warn(
        `[loadContract] Contract ${contractName} not found in artifact for effective key '${artifactNetworkKey}' (detected network: ${networkId}). networks obj exists: ${!!contractJson.networks}`,
        `Attempting to use fallback address`,
      );

      // Try to use a fallback address if available
      if (contractName === "FlashLoan") {
        // No fallback address provided for FlashLoan; ensure it's deployed on this network
        return null;
      }

      return null;
    }
  } catch (error) {
    console.error(`Error loading contract ${contractName}:`, error);
    return null;
  }
}

/**
 * Retrieves a fallback contract address for a given contract name and network.
 *
 * This function is useful when the contract is not deployed on the current network.
 * It provides a mechanism to use a predefined address as a fallback.
 *
 * @param {string} contractName - The name of the contract.
 * @param {string} networkId - The network ID as a string.
 * @returns {Promise<string | null>} The fallback address or null if not available.
 */
async function getFallbackContractAddress(
  contractName: string,
  networkId: string,
): Promise<string | null> {
  // This is a demo fallback mechanism - in a real app, you might fetch from an API or config
  if (contractName === "FlashLoan") {
    if (networkId === "1") {
      // TODO: Add the actual FlashLoan address to MAINNET_ADDRESSES
      // For now, return a placeholder address to avoid errors
      return "0x0000000000000000000000000000000000000000";
    }
  }
  return null;
}

/**
 * Creates a new contract instance with the given ABI and address.
 *
 * This function initializes a new Web3 contract instance using the provided
 * ABI and contract address.
 *
 * @param {any[]} abi - The contract ABI.
 * @param {string} address - The contract address.
 * @returns {Web3Contract} A new Web3Contract instance.
 */
export function createContractInstance(
  abi: any[],
  address: string,
): Web3Contract {
  const web3 = new Web3(window.ethereum);
  return new web3.eth.Contract(abi, address);
}

/**
 * Manually creates a contract instance with a custom address.
 *
 * This function is useful for testing or when contracts are deployed outside
 * the normal process. It allows the creation of a contract instance using a
 * custom address.
 *
 * @param {string} contractName - The name of the contract JSON file (without .json extension).
 * @param {string} customAddress - The custom contract address to use.
 * @returns {Promise<Web3Contract | null>} A promise resolving to a Web3Contract instance or null if not found.
 */
export async function createCustomContractInstance(
  contractName: string,
  customAddress: string,
): Promise<Web3Contract | null> {
  try {
    // Dynamically import the contract JSON
    const contractJson: ContractJson = await import(
      `@/contracts/${contractName}.json`
    );

    // Create and return the contract instance with the custom address
    return createContractInstance(contractJson.abi, customAddress);
  } catch (error) {
    console.error(
      `Error creating custom contract instance for ${contractName}:`,
      error,
    );
    return null;
  }
}
