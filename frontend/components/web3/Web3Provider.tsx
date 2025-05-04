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

// USDC Token address on Ethereum Mainnet
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
// ERC20 ABI simplified to just what we need for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

// Define global window.flashLoanContract property
declare global {
  interface Window {
    ethereum: MetaMaskEthereumProvider;
    ethers: typeof ethers;
    flashLoanContract?: ethers.Contract | null;
  }
}

// Add ethers to window object for global access
if (typeof window !== 'undefined') {
  window.ethers = ethers;
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
  usdcBalance: string | null; // USDC balance with proper formatting
  refreshBalance: () => Promise<void>; // Function to refresh the USDC balance
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
  usdcBalance: null,
  refreshBalance: async () => {},
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
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

  /**
   * Fetch the USDC balance for the connected account
   */
  const fetchUsdcBalance = async () => {
    if (!web3 || !account) {
      setUsdcBalance(null);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      
      // Get decimals and balance
      const decimals = await usdcContract.decimals();
      const balance = await usdcContract.balanceOf(account);
      
      // Format balance with correct decimals (USDC has 6 decimals)
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      setUsdcBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      setUsdcBalance(null);
    }
  };

  /**
   * Public function to refresh the USDC balance
   */
  const refreshBalance = async () => {
    await fetchUsdcBalance();
  };

  /**
   * Initialize the FlashLoan contract if available on the network.
   * Sets the contract in the global window object for access.
   */
  const initializeFlashLoanContract = async () => {
    console.log("Attempting to initialize FlashLoan contract...");
    try {
      console.log("Calling loadContract('FlashLoan')...");
      const flashLoanContract = await loadContract("FlashLoan");
      console.log("loadContract result:", flashLoanContract ? 'Contract loaded' : 'Contract NOT loaded');

      if (flashLoanContract) {
        console.log("Creating ethers provider...");
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as any,
        );
        console.log("Getting signer...");
        const signer = provider.getSigner();

        const address = flashLoanContract.options.address;
        console.log("Contract address from artifact:", address);
        if (!address) {
          console.error("FlashLoan contract address is undefined in artifact for this network");
          window.flashLoanContract = null;
          return false;
        }

        const abi = Array.isArray(flashLoanContract.options.jsonInterface)
          ? flashLoanContract.options.jsonInterface
          : [];
        console.log("ABI retrieved, attempting to create ethers.Contract...");

        window.flashLoanContract = new ethers.Contract(address, abi, signer);
        console.log("FlashLoan contract successfully initialized and assigned to window:", window.flashLoanContract);
        return true;
      } else {
        console.warn(
          "FlashLoan contract not found by loadContract for this network - using read-only mode",
        );
        window.flashLoanContract = null;
        return false;
      }
    } catch (error) {
      console.error("CRITICAL ERROR initializing FlashLoan contract:", error);
      window.flashLoanContract = null;
      return false;
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
      console.log(`Network ID: ${chainId}, Name: ${name}, Supported: ${supported}`);

      if (supported) {
        console.log("Network supported, calling initializeFlashLoanContract...");
        const initSuccess = await initializeFlashLoanContract();
        console.log(`initializeFlashLoanContract finished. Success: ${initSuccess}`);
        await fetchUsdcBalance();
      } else {
        console.log("Network not supported, skipping contract initialization.");
        window.flashLoanContract = null;
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

      console.log("Fetching USDC balance...");
      await fetchUsdcBalance();
      console.log("USDC balance fetched.");

      console.log("Setting up event listeners...");
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        console.log("accountsChanged event fired:", accounts);
        setAccount(accounts[0] || null);
        setIsConnected(!!accounts[0]);
        await fetchUsdcBalance();
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
            await fetchUsdcBalance();

            window.ethereum.on("accountsChanged", async (accounts: string[]) => {
              setAccount(accounts[0] || null);
              setIsConnected(!!accounts[0]);
              await fetchUsdcBalance();
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
        usdcBalance,
        refreshBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
