/**
 * @file WalletConnect.js
 * @description Component for connecting to Ethereum wallets
 * 
 * This component provides UI and functionality for users to connect their
 * Ethereum wallets (like MetaMask) to the application. It handles the wallet
 * connection process, displays connection status, and maintains connection state.
 */

import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';

/**
 * WalletConnect component for handling Ethereum wallet connections
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onConnect - Callback function to handle successful connections
 * @returns {JSX.Element} Rendered component
 */
const WalletConnect = ({ onConnect }) => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [error, setError] = useState('');
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // Configuration options for wallet providers
  const providerOptions = {
    // Add wallet providers here if needed
  };

  // Initialize Web3Modal with options
  const web3Modal = new Web3Modal({
    network: "sepolia", // default network - updated to Sepolia
    cacheProvider: true,
    providerOptions
  });
  
  // Sepolia network parameters
  const sepoliaChainParams = {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  };

  /**
   * Switches the connected wallet to Sepolia network
   */
  const switchToSepolia = async () => {
    if (!provider) return;
    
    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
      });
    } catch (switchError) {
      // If the chain doesn't exist, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [sepoliaChainParams],
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          setError('Could not add Sepolia network to your wallet. Please add it manually.');
        }
      } else {
        console.error('Error switching to Sepolia:', switchError);
        setError('Could not switch to Sepolia. Please switch networks manually in your wallet.');
      }
    }
  };

  /**
   * Connect to the user's Ethereum wallet
   * 
   * Opens a modal for the user to select their wallet provider,
   * establishes the connection, and sets up event listeners.
   */
  const connectWallet = async () => {
    try {
      setError(''); // Clear any previous errors
      setIsWrongNetwork(false);
      // Open modal to select wallet provider
      const instance = await web3Modal.connect();
      
      // Create ethers provider and get signer
      const ethersProvider = new ethers.providers.Web3Provider(instance);
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      
      // Get network info
      const network = await ethersProvider.getNetwork();
      const networkNames = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        11155111: 'Sepolia Testnet',
        42: 'Kovan Testnet',
        31337: 'Hardhat Local Node'
      };
      
      const currentNetworkName = networkNames[network.chainId] || `Chain ID: ${network.chainId}`;
      setNetworkName(currentNetworkName);
      
      // Check if on the correct network (Sepolia)
      if (network.chainId !== 11155111) {
        setError(`Connected to ${currentNetworkName}. Please switch to Sepolia Testnet.`);
        setIsWrongNetwork(true);
      }
      
      setAccount(address);
      setProvider(ethersProvider);
      setIsConnected(true);
      
      // Pass provider and account up to parent component
      onConnect(ethersProvider, address);
      
      // Subscribe to provider events
      instance.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onConnect(ethersProvider, accounts[0]);
        } else {
          setIsConnected(false);
        }
      });
      
      instance.on("chainChanged", () => {
        window.location.reload();
      });
      
      instance.on("disconnect", () => {
        setIsConnected(false);
      });
      
    } catch (error) {
      console.error("Could not connect wallet:", error);
      setError(`Connection error: ${error.message || 'Could not connect to wallet'}`);
    }
  };
  
  /**
   * Disconnect the currently connected wallet
   * 
   * Clears the cached provider and resets connection state.
   */
  const disconnectWallet = async () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider();
      setAccount('');
      setProvider(null);
      setIsConnected(false);
      setError('');
      setIsWrongNetwork(false);
    }
  };
  
  // Auto connect if provider is cached
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);
  
  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <div className="account-info">
            <span className={`network-badge ${error ? 'network-error' : ''}`}>{networkName}</span>
            <span className="account-address">
              {account.substr(0, 6)}...{account.substr(-4)}
            </span>
          </div>
          <button 
            className="disconnect-button" 
            onClick={disconnectWallet}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          className="connect-button" 
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}
      
      {error && (
        <div className="wallet-error">
          {error}
          {isWrongNetwork && (
            <button 
              className="switch-network-button" 
              onClick={switchToSepolia}
            >
              Switch to Sepolia
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 