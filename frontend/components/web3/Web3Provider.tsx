"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getWeb3,
  getAccounts,
  isMainnetNetwork,
  switchToMainnet,
  MetaMaskEthereumProvider
} from "@/lib/web3/web3";
import Web3 from "web3";
import { NETWORK_IDS, NETWORK_NAMES } from "@/lib/web3/config";
import { loadContract } from "@/lib/web3/contracts";
import { ethers } from "ethers";

// Define global window.flashLoanContract property
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
    flashLoanContract?: ethers.Contract | null;
  }
}

// Define context type
interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  networkId: number | null;
  networkName: string | null;
  connectWallet: () => Promise<void>;
  switchNetwork: () => Promise<boolean>;
}

// Create context with default values
const Web3Context = createContext<Web3ContextType>({
  web3: null,
  account: null,
  isConnected: false,
  isCorrectNetwork: false,
  networkId: null,
  networkName: null,
  connectWallet: async () => {},
  switchNetwork: async () => false,
});

// Hook to use the Web3 context
export const useWeb3 = () => useContext(Web3Context);

// Web3Provider component
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);

  // Initialize FlashLoan contract
  const initializeFlashLoanContract = async () => {
    try {
      // Load the contract instance using web3.js
      const flashLoanContract = await loadContract("FlashLoan");
      
      if (flashLoanContract) {
        // Contract was found on the current network
        // Convert to ethers.js contract for compatibility with our aave.ts
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Create ethers contract with the same ABI and address
        const address = flashLoanContract.options.address;
        if (!address) {
          console.error("FlashLoan contract address is undefined");
          return null;
        }
        
        // Get ABI from the contract instance safely
        const abi = Array.isArray(flashLoanContract.options.jsonInterface) 
          ? flashLoanContract.options.jsonInterface 
          : [];
        
        // Create and set the global contract instance
        window.flashLoanContract = new ethers.Contract(address, abi, signer);
        
        console.log("FlashLoan contract initialized:", address);
        return true;
      } else {
        // Contract was not found on the current network, but we can still fetch flash loan limits
        console.log("FlashLoan contract not found on this network - using read-only mode");
        
        // Set window.flashLoanContract to null indicating we're in read-only mode
        window.flashLoanContract = null;
        
        // Still return true to continue with the app
        return true;
      }
    } catch (error) {
      console.error("Error initializing FlashLoan contract:", error);
      
      // Even if there's an error, we can still show flash loan limits
      window.flashLoanContract = null;
      return true;
    }
  };

  // Update network information
  const updateNetworkInfo = async (web3Instance: Web3) => {
    try {
      const networkId = Number(await web3Instance.eth.net.getId());
      setNetworkId(networkId);

      // Get network name from our config or default to "Unknown Network"
      const name = NETWORK_NAMES[networkId] || `Unknown Network (${networkId})`;
      setNetworkName(name);

      // Check if we're on Ethereum Mainnet
      const onMainnetNetwork = networkId === NETWORK_IDS.MAINNET;
      setIsCorrectNetwork(onMainnetNetwork);
      
      // Initialize the FlashLoan contract if on correct network
      if (onMainnetNetwork) {
        await initializeFlashLoanContract();
      }
    } catch (error) {
      console.error("Error getting network info", error);
    }
  };

  // Function to switch to Ethereum Mainnet
  const switchNetwork = async (): Promise<boolean> => {
    try {
      const result = await switchToMainnet();
      if (result && web3) {
        await updateNetworkInfo(web3);
      }
      return result;
    } catch (error) {
      console.error("Error switching network", error);
      return false;
    }
  };

  // Function to connect to wallet
  const connectWallet = async () => {
    try {
      const web3Instance = await getWeb3();
      setWeb3(web3Instance);

      const accounts = await getAccounts(web3Instance);
      setAccount(accounts[0]);
      setIsConnected(true);

      await updateNetworkInfo(web3Instance);

      // Setup event listeners for account and network changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || null);
        setIsConnected(!!accounts[0]);
      });

      window.ethereum.on("chainChanged", async () => {
        // Reload the page on chain change as recommended by MetaMask
        window.location.reload();
      });
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
    }
  };

  // Auto-connect when component mounts
  useEffect(() => {
    // Removed auto-connect - will only connect when user clicks the button
    // Check if user was previously connected
    const checkPreviousConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const web3Instance = await getWeb3();
          // Only check if accounts exist without requesting new connection
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts && accounts.length > 0) {
            // User was previously connected, restore state
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            setIsConnected(true);
            await updateNetworkInfo(web3Instance);

            // Setup event listeners for account and network changes
            window.ethereum.on("accountsChanged", (accounts: string[]) => {
              setAccount(accounts[0] || null);
              setIsConnected(!!accounts[0]);
            });

            window.ethereum.on("chainChanged", async () => {
              // Reload the page on chain change as recommended by MetaMask
              window.location.reload();
            });
          }
        } catch (error) {
          console.error("Error checking previous connection", error);
        }
      }
    };

    checkPreviousConnection();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        web3,
        account,
        isConnected,
        isCorrectNetwork,
        networkId,
        networkName,
        connectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
