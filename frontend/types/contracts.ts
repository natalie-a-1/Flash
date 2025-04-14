import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

// Contract deployment network information
export interface ContractNetwork {
  events: Record<string, unknown>;
  links: Record<string, unknown>;
  address: string;
  transactionHash: string;
}

// Type for the contract JSON file structure
export interface ContractJson {
  abi: AbiItem[];
  networks: {
    [networkId: string]: {
      address: string;
    };
  };
}

// Type for a Web3 contract instance
export type Web3Contract = Contract<AbiItem[]>; 