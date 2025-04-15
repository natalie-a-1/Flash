import Web3 from "web3";
import { ContractJson, Web3Contract } from "@/types/contracts";
import { getNetworkDetails } from "./web3";

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
    if (!contractJson.networks[networkId]) {
      console.warn(
        `Contract ${contractName} not deployed on network ${networkId}`,
      );
      return null;
    }

    // Create and return the contract instance
    return createContractInstance(
      contractJson.abi,
      contractJson.networks[networkId].address,
    );
  } catch (error) {
    console.error(`Error loading contract ${contractName}:`, error);
    return null;
  }
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
