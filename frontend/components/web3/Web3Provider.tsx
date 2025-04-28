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
      const flashLoanContract = await loadContract("FlashLoan");
      if (flashLoanContract) {
        // Use ethers v5 Web3Provider
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as any
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
          "FlashLoan contract not found on this network - using read-only mode"
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

  // Update network information
  const updateNetworkInfo = async (web3Instance: Web3) => {
    try {
      const netId = Number(await web3Instance.eth.net.getId());
      setNetworkId(netId);

      const name = NETWORK_NAMES[netId] || `Unknown Network (${netId})`;
      setNetworkName(name);

      const onMainnet = netId === NETWORK_IDS.MAINNET;
      setIsCorrectNetwork(onMainnet);

      if (onMainnet) {
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
      setAccount(accounts[0] || null);
      setIsConnected(!!accounts[0]);

      await updateNetworkInfo(web3Instance);

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || null);
        setIsConnected(!!accounts[0]);
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
    }
  };

  // Auto-connect when component mounts
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
