import Web3 from 'web3';
import { ethers } from 'ethers';
import { NETWORK_IDS } from './config';
import { MetaMaskEthereumProvider } from '@/types';

// Define global ethereum type
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
  }
}

/**
 * Initialize web3 with MetaMask provider
 * @returns Web3 instance
 */
export const getWeb3 = async () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3 = new Web3(window.ethereum);
      return web3;
    } catch (error) {
      throw new Error('User denied account access');
    }
  } else {
    throw new Error('Please install MetaMask');
  }
};

/**
 * Initialize ethers with MetaMask provider
 * @returns Ethers provider
 */
export const getEthersProvider = () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    return new ethers.BrowserProvider(window.ethereum);
  } else {
    throw new Error('Please install MetaMask');
  }
};

/**
 * Get network details
 * @param web3 - Web3 instance
 * @returns Network ID
 */
export const getNetworkDetails = async (web3: Web3) => {
  const networkId = await web3.eth.net.getId();
  return { networkId };
};

/**
 * Get connected accounts
 * @param web3 - Web3 instance
 * @returns Array of accounts
 */
export const getAccounts = async (web3: Web3) => {
  return await web3.eth.getAccounts();
};

/**
 * Check if connected to Sepolia network
 * @param web3 - Web3 instance
 * @returns Boolean indicating if on Sepolia
 */
export const isSepoliaNetwork = async (web3: Web3) => {
  const networkId = await web3.eth.net.getId();
  return Number(networkId) === NETWORK_IDS.SEPOLIA;
};

/**
 * Request network change to Sepolia
 */
export const switchToSepolia = async () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_IDS.SEPOLIA.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${NETWORK_IDS.SEPOLIA.toString(16)}`,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Sepolia network', addError);
          return false;
        }
      }
      console.error('Error switching to Sepolia network', error);
      return false;
    }
  }
  return false;
}; 