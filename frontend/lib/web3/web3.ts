import { ethers } from "ethers";
import Web3 from "web3";
import { NETWORK_IDS, RPC_URLS } from "./config";

/**
 * Interface for MetaMask Ethereum provider.
 * Provides methods for interacting with the Ethereum blockchain.
 */
export interface MetaMaskEthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (params: any) => void) => void;
  removeListener: (event: string, callback: (params: any) => void) => void;
}

/**
 * Extends the global Window interface to include the Ethereum provider.
 */
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
  }
}

/**
 * Retrieves a Web3 instance connected to the Ethereum provider.
 *
 * @returns {Promise<Web3>} A promise that resolves to a Web3 instance.
 * @throws Will throw an error if MetaMask is not installed.
 */
export const getWeb3 = async (): Promise<Web3> => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new Web3(window.ethereum);
  }
  throw new Error("MetaMask is not installed");
};

/**
 * Retrieves an ethers.js Web3Provider instance.
 *
 * @returns {ethers.providers.Web3Provider | null} An ethers.js Web3Provider instance or null if unavailable.
 */
export const getEthersV5Provider = (): ethers.providers.Web3Provider | null => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  console.error(
    "MetaMask is not installed or window.ethereum is not available.",
  );
  return null;
};

/**
 * Fetches the current network details including ID and name.
 *
 * @returns {Promise<{ id: number; name: string; }>} A promise that resolves to an object containing network ID and name.
 * @throws Will throw an error if MetaMask is not installed.
 */
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

/**
 * Retrieves the list of accounts connected to the Web3 instance.
 *
 * @param {Web3} web3 - An instance of the Web3 library.
 * @returns {Promise<string[]>} A promise that resolves to an array of account addresses.
 */
export const getAccounts = async (web3: Web3): Promise<string[]> => {
  if (typeof window !== "undefined" && window.ethereum) {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }
  return await web3.eth.getAccounts();
};

/**
 * Checks if the current network is the Ethereum Mainnet.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if on Mainnet, false otherwise.
 */
export const isMainnetNetwork = async (): Promise<boolean> => {
  const { id } = await getNetworkDetails();
  return id === NETWORK_IDS.MAINNET;
};

/**
 * Switches the network to Ethereum Mainnet.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if the switch is successful, false otherwise.
 */
export const switchToMainnet = async (): Promise<boolean> => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${NETWORK_IDS.MAINNET.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
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
