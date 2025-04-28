import Web3 from "web3";
import { ContractJson, Web3Contract } from "@/types/contracts";
import { getNetworkDetails } from "./web3";
import { MAINNET_ADDRESSES } from "./config";

/**
 * Loads a contract instance for the given contract name
 * @param contractName The name of the contract to load
 * @returns A promise that resolves to a Web3Contract instance or null if not found
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
    const networkId = networkDetails.id.toString();

    // Check if the contract is deployed on this network
    if (contractJson.networks && contractJson.networks[networkId]) {
      // Create and return the contract instance using network deployment info
      return createContractInstance(
        contractJson.abi,
        contractJson.networks[networkId].address,
      );
    } else {
      // Contract not deployed on this network
      console.warn(
        `Contract ${contractName} not deployed on network ${networkId}, attempting to use fallback address`
      );
      
      // Try to use a fallback address if available
      if (networkId === "1" && contractName === "FlashLoan") {
        // If on mainnet, provide a fallback address
        const fallbackAddress = await getFallbackContractAddress(contractName, networkId);
        if (fallbackAddress) {
          console.log(`Using fallback address for ${contractName}: ${fallbackAddress}`);
          return createContractInstance(contractJson.abi, fallbackAddress);
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Error loading contract ${contractName}:`, error);
    return null;
  }
}

/**
 * Get a fallback contract address for a given contract name and network
 * This is useful when the contract is not deployed on the current network
 * 
 * @param contractName The name of the contract
 * @param networkId The network ID as a string
 * @returns The fallback address or null if not available
 */
async function getFallbackContractAddress(
  contractName: string,
  networkId: string
): Promise<string | null> {
  // This is a demo fallback mechanism - in a real app, you might fetch from an API or config
  if (contractName === "FlashLoan") {
    if (networkId === "1") {
      // For demo purposes on Mainnet, use the address from config
      return MAINNET_ADDRESSES.FLASH_LOAN;
    }
  }
  return null;
}

/**
 * Creates a new contract instance with the given ABI and address
 * @param abi The contract ABI
 * @param address The contract address
 * @returns A new Web3Contract instance
 */
export function createContractInstance(
  abi: any[],
  address: string,
): Web3Contract {
  const web3 = new Web3(window.ethereum);
  return new web3.eth.Contract(abi, address);
}

/**
 * Manually creates a contract instance with a custom address
 * This is useful for testing or when contracts are deployed outside the normal process
 * 
 * @param contractName The name of the contract JSON file (without .json extension)
 * @param customAddress The custom contract address to use
 * @returns A promise resolving to a Web3Contract instance or null if not found
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
    console.error(`Error creating custom contract instance for ${contractName}:`, error);
    return null;
  }
}
