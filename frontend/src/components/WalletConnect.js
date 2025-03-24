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

  // Configuration options for wallet providers
  const providerOptions = {
    // Add wallet providers here if needed
  };

  // Initialize Web3Modal with options
  const web3Modal = new Web3Modal({
    network: "goerli", // default network
    cacheProvider: true,
    providerOptions
  });

  /**
   * Connect to the user's Ethereum wallet
   * 
   * Opens a modal for the user to select their wallet provider,
   * establishes the connection, and sets up event listeners.
   */
  const connectWallet = async () => {
    try {
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
        42: 'Kovan Testnet'
      };
      
      setNetworkName(networkNames[network.chainId] || `Chain ID: ${network.chainId}`);
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
            <span className="network-badge">{networkName}</span>
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
    </div>
  );
};

export default WalletConnect; 