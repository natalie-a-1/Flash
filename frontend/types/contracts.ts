import { Contract } from "web3-eth-contract";
import { AbiItem } from "web3-utils";

/**
 * Interface representing the network-specific deployment details of a contract.
 */
export interface ContractNetwork {
  /** A record of event names to their respective details. */
  events: Record<string, unknown>;
  /** A record of link names to their respective details. */
  links: Record<string, unknown>;
  /** The address where the contract is deployed on the network. */
  address: string;
  /** The transaction hash of the contract deployment. */
  transactionHash: string;
}

/**
 * Interface representing the structure of a contract JSON file.
 */
export interface ContractJson {
  /** The ABI (Application Binary Interface) of the contract. */
  abi: AbiItem[];
  /** A mapping of network IDs to their respective deployment details. */
  networks: {
    [networkId: string]: {
      /** The address where the contract is deployed on the specific network. */
      address: string;
    };
  };
}

/**
 * Type representing a Web3 contract instance.
 */
export type Web3Contract = Contract<AbiItem[]>;
