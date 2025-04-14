// Contract deployment network information
export interface ContractNetwork {
  events: Record<string, unknown>;
  links: Record<string, unknown>;
  address: string;
  transactionHash: string;
}

// Contract JSON structure
export interface ContractJson {
  contractName: string;
  abi: any[];
  metadata: string;
  bytecode: string;
  deployedBytecode: string;
  sourceMap: string;
  deployedSourceMap: string;
  source: string;
  sourcePath: string;
  ast: any;
  compiler: {
    name: string;
    version: string;
  };
  networks: {
    [key: string]: ContractNetwork;
  };
  schemaVersion: string;
  updatedAt: string;
}

// We'll use this type when we need to refer to Web3 contract instances
export type Web3Contract = any; 