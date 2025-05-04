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
  switchToMainnet,
  MetaMaskEthereumProvider,
} from "@/lib/web3/web3";
import Web3 from "web3";
import {
  NETWORK_IDS,
  NETWORK_NAMES,
  SUPPORTED_NETWORK_IDS,
} from "@/lib/web3/config";
import { loadContract } from "@/lib/web3/contracts";
import { ethers } from "ethers";

// Define global window.flashLoanContract property
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
    flashLoanContract?: ethers.Contract | null;
  }
}

// Define the structure of the Web3 context
interface Web3ContextType {
  web3: Web3 | null; // Instance of Web3 or null if not connected
  account: string | null; // Current connected account or null
  isConnected: boolean; // Connection status
  isCorrectNetwork: boolean; // Network correctness status
  networkId: number | null; // Current network ID or null
  networkName: string | null; // Current network name or null
  connectWallet: () => Promise<void>; // Function to connect wallet
  switchNetwork: () => Promise<boolean>; // Function to switch network
}

// Create a context with default values
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

// Custom hook to access the Web3 context
export const useWeb3 = () => useContext(Web3Context);

// Web3Provider component to manage Web3 state and provide context
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);

  /**
   * Initialize the FlashLoan contract if available on the network.
   * Sets the contract in the global window object for access.
   */
  const initializeFlashLoanContract = async () => {
    try {
      const flashLoanContract = await loadContract("FlashLoan");
      if (flashLoanContract) {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as any,
        );
        const signer = provider.getSigner();

        const address = flashLoanContract.options.address;
        if (!address) {
          console.error("FlashLoan contract address is undefined");
          return null;
        }

        const abi = Array.isArray(flashLoanContract.options.jsonInterface)
          ? flashLoanContract.options.jsonInterface
          : [];

        window.flashLoanContract = new ethers.Contract(address, abi, signer);
        console.log("FlashLoan contract initialized:", address);
        return true;
      } else {
        console.log(
          "FlashLoan contract not found on this network - using read-only mode",
        );
        window.flashLoanContract = null;
        return true;
      }
    } catch (error) {
      console.error("Error initializing FlashLoan contract:", error);
      window.flashLoanContract = null;
      return true;
    }
  };

  /**
   * Update network information such as network ID and name.
   * Also checks if the current network is the Ethereum Mainnet.
   */
  const updateNetworkInfo = async (web3Instance: Web3) => {
    try {
      // Use chainId (EIP-155) rather than network ID to differentiate mainnet and local fork
      const chainId = Number(await web3Instance.eth.getChainId());
      setNetworkId(chainId);

      const name = NETWORK_NAMES[chainId] || `Unknown Network (${chainId})`;
      setNetworkName(name);

      const supported = SUPPORTED_NETWORK_IDS.includes(chainId);
      setIsCorrectNetwork(supported);

      if (supported) {
        await initializeFlashLoanContract();
      }
    } catch (error) {
      console.error("Error getting network info", error);
    }
  };

  /**
   * Switch to the Ethereum Mainnet.
   * Updates network information upon successful switch.
   */
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

  /**
   * Connect to the user's wallet using Web3.
   * Sets up event listeners for account and network changes.
   */
  const connectWallet = async () => {
    console.log("Attempting to connect wallet...");
    try {
      console.log("Getting Web3 instance...");
      const web3Instance = await getWeb3();
      console.log(
        "Web3 instance obtained:",
        web3Instance ? "Success" : "Failed",
      );
      setWeb3(web3Instance);

      console.log("Getting accounts...");
      const accounts = await getAccounts(web3Instance);
      console.log("Accounts obtained:", accounts);
      setAccount(accounts[0] || null);
      setIsConnected(!!accounts[0]);
      console.log(
        "Account state set:",
        accounts[0] || null,
        "Connected:",
        !!accounts[0],
      );

      console.log("Updating network info...");
      await updateNetworkInfo(web3Instance);
      console.log("Network info updated.");

      console.log("Setting up event listeners...");
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        console.log("accountsChanged event fired:", accounts);
        setAccount(accounts[0] || null);
        setIsConnected(!!accounts[0]);
      });

      window.ethereum.on("chainChanged", () => {
        console.log("chainChanged event fired. Reloading...");
        window.location.reload();
      });
      console.log("Event listeners set up.");
      console.log("Wallet connection successful.");
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
    }
  };

  /**
   * Automatically connect to the wallet if a previous connection exists.
   * This effect runs once when the component mounts.
   */
  useEffect(() => {
    const checkPreviousConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const web3Instance = await getWeb3();
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            setIsConnected(true);
            await updateNetworkInfo(web3Instance);

            window.ethereum.on("accountsChanged", (accounts: string[]) => {
              setAccount(accounts[0] || null);
              setIsConnected(!!accounts[0]);
            });

            window.ethereum.on("chainChanged", () => {
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
