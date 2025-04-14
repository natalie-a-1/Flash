import Web3 from 'web3';
import { ContractJson, Web3Contract } from '@/types';

/**
 * Load a contract instance using its name
 * @param web3 - Web3 instance
 * @param contractName - Name of the contract to load
 * @returns Contract instance
 */
export const loadContract = async (web3: Web3, contractName: string): Promise<Web3Contract> => {
  try {
    // Dynamically import the contract ABI
    const contractJson: ContractJson = await import(`../contracts/${contractName}.json`);
    
    // Get the current network ID
    const networkId = await web3.eth.net.getId();
    const networkIdStr = networkId.toString();
    
    // Get the contract deployment info for the current network
    const deployedNetwork = contractJson.networks[networkIdStr];
    
    if (!deployedNetwork) {
      throw new Error(`Contract ${contractName} not deployed on network ${networkId}`);
    }
    
    // Create a new contract instance
    const instance = new web3.eth.Contract(
      contractJson.abi,
      deployedNetwork.address
    );
    
    return instance;
  } catch (error) {
    console.error(`Error loading contract ${contractName}:`, error);
    throw error;
  }
};

/**
 * Helper to manually create a contract instance with an ABI and address
 * @param web3 - Web3 instance
 * @param abi - Contract ABI
 * @param address - Contract address
 * @returns Contract instance
 */
export const createContractInstance = (web3: Web3, abi: any[], address: string): Web3Contract => {
  return new web3.eth.Contract(abi, address);
}; 