/**
 * @file App.js
 * @description Main application component for the Flash Loan Arbitrage dApp
 * 
 * This component serves as the entry point for the application and coordinates
 * the interaction between wallet connection, price display, and arbitrage execution.
 * It includes a mock mode for testing without blockchain interactions.
 */

import React, { useState } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import TokenPriceDisplay from './components/TokenPriceDisplay';
import ArbitrageExecutor from './components/ArbitrageExecutor';

// Enable mock mode for testing without blockchain interactions
const MOCK_MODE = false; // Set to true temporarily while fixing contract addresses

// Contract address on local Hardhat network
const FLASH_LOAN_ARBITRAGE_ADDRESS = "0xB44EA4d12606aaB741bAd2FdA8AA79f5c1849A6F";

// Uniswap V2 Router address on Sepolia
// NOTE: This should be updated to the actual Uniswap router on Sepolia when available
const UNISWAP_ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";

// SushiSwap Router address on Sepolia
// NOTE: This should be updated to the actual Sushiswap router on Sepolia when available
const SUSHISWAP_ROUTER_ADDRESS = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

// Sample ERC20 tokens with known liquidity on Sepolia
// WETH on Sepolia
const TOKEN_A = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
// USDC on Sepolia (or other stable with liquidity)
const TOKEN_B = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Mock data for testing
const MOCK_DATA = {
  tokenASymbol: "WETH",
  tokenBSymbol: "USDC",
  uniswapPrice: "1950.25",
  sushiswapPrice: "1980.75",
  hasArbitrageOpportunity: true,
  arbitrageProfit: "30.50"
};

/**
 * Main application component
 * 
 * Manages the application state including:
 * - Wallet connection status
 * - Arbitrage opportunity detection
 * - Token symbols
 */
function App() {
  // App state
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [hasArbitrageOpportunity, setHasArbitrageOpportunity] = useState(MOCK_MODE ? MOCK_DATA.hasArbitrageOpportunity : false);
  const [tokenASymbol, setTokenASymbol] = useState(MOCK_MODE ? MOCK_DATA.tokenASymbol : '');
  const [tokenBSymbol, setTokenBSymbol] = useState(MOCK_MODE ? MOCK_DATA.tokenBSymbol : '');

  /**
   * Handler for wallet connection events
   * 
   * @param {Object} connectedProvider - The ethers.js provider instance
   * @param {string} connectedAccount - The connected wallet address
   */
  const handleWalletConnect = (connectedProvider, connectedAccount) => {
    setProvider(connectedProvider);
    setAccount(connectedAccount);
  };

  /**
   * Callback for when arbitrage opportunities are detected
   * 
   * @param {boolean} hasOpportunity - Whether an arbitrage opportunity exists
   * @param {string} tokenASymb - Symbol of token A
   * @param {string} tokenBSymb - Symbol of token B
   */
  const handleArbitrageOpportunityChange = (hasOpportunity, tokenASymb, tokenBSymb) => {
    if (!MOCK_MODE) {
      setHasArbitrageOpportunity(hasOpportunity);
      if (tokenASymb) setTokenASymbol(tokenASymb);
      if (tokenBSymb) setTokenBSymbol(tokenBSymb);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Flash Loan Arbitrage dApp</h1>
        <WalletConnect onConnect={handleWalletConnect} />
        {MOCK_MODE && <div className="mock-mode-badge">MOCK MODE</div>}
      </header>

      <main className="App-main">
        {!provider && !MOCK_MODE ? (
          <div className="connect-prompt">
            <p>Please connect your wallet to use this application</p>
          </div>
        ) : (
          <>
            <TokenPriceDisplay 
              provider={provider}
              uniswapRouterAddress={UNISWAP_ROUTER_ADDRESS}
              sushiswapRouterAddress={SUSHISWAP_ROUTER_ADDRESS}
              tokenA={TOKEN_A}
              tokenB={TOKEN_B}
              onArbitrageOpportunityChange={handleArbitrageOpportunityChange}
              mockMode={MOCK_MODE}
              mockData={MOCK_MODE ? MOCK_DATA : null}
            />
            
            <ArbitrageExecutor 
              provider={provider}
              account={account}
              contractAddress={FLASH_LOAN_ARBITRAGE_ADDRESS}
              tokenA={TOKEN_A}
              tokenB={TOKEN_B}
              tokenASymbol={tokenASymbol}
              tokenBSymbol={tokenBSymbol}
              hasOpportunity={hasArbitrageOpportunity}
              mockMode={MOCK_MODE}
            />
          </>
        )}
      </main>

      <footer className="App-footer">
        <p>Flash Loan Arbitrage dApp - Educational Demo Only</p>
        <p>
          <small>
            This application is for demonstration purposes only. 
            Use at your own risk. Not financial advice.
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;
