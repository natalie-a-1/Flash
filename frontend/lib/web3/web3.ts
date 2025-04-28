import { ethers } from "ethers";
import Web3 from "web3";
import { NETWORK_IDS, RPC_URLS } from "./config";

// Define MetaMask provider type
export interface MetaMaskEthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (params: any) => void) => void;
  removeListener: (event: string, callback: (params: any) => void) => void;
}

// Declare global window.ethereum type
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
  }
}

// Get Web3 instance
export const getWeb3 = async (): Promise<Web3> => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new Web3(window.ethereum);
  }
  throw new Error("MetaMask is not installed");
};

// Get ethers v5 provider
export const getEthersV5Provider = (): ethers.providers.Web3Provider | null => {
  if (typeof window !== "undefined" && window.ethereum) {
    // Use the ethers v5 provider
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  console.error("MetaMask is not installed or window.ethereum is not available.");
  return null;
};

// Get network details
export const getNetworkDetails = async (): Promise<{
  id: number;
  name: string;
}> => {
  if (typeof window !== "undefined" && window.ethereum) {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return {
      id: parseInt(chainId, 16),
      name: `Chain ${parseInt(chainId, 16)}`,
    };
  }
  throw new Error("MetaMask is not installed");
};

// Get accounts
export const getAccounts = async (web3: Web3): Promise<string[]> => {
  if (typeof window !== "undefined" && window.ethereum) {
    // This will prompt the MetaMask popup if not connected
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }
  return await web3.eth.getAccounts();
};

// Check if on Ethereum Mainnet network
export const isMainnetNetwork = async (): Promise<boolean> => {
  const { id } = await getNetworkDetails();
  return id === NETWORK_IDS.MAINNET;
};

// Switch to Ethereum Mainnet network
export const switchToMainnet = async (): Promise<boolean> => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${NETWORK_IDS.MAINNET.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      // (Should not happen for mainnet as it's the default network)
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${NETWORK_IDS.MAINNET.toString(16)}`,
                chainName: "Ethereum Mainnet",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [RPC_URLS[NETWORK_IDS.MAINNET]],
                blockExplorerUrls: ["https://etherscan.io/"],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Ethereum Mainnet network", addError);
          return false;
        }
      }
      console.error("Error switching to Ethereum Mainnet network", error);
      return false;
    }
  }
  return false;
};
