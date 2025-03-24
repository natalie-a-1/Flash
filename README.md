
<div align="center">
  <img src="logo.png" alt="Flash Loan Arbitrage Logo" width="200" />
    <h1>FLASH</h1>
  <br><br>
  <img src="https://img.shields.io/badge/Solidity-0.8.20-blue.svg" alt="Solidity v0.8.20">
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg" alt="React 18">
  <img src="https://img.shields.io/badge/ethers.js-5.7-2535a0.svg" alt="ethers.js 5.7">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</div>

<br>

A decentralized application (dApp) for executing flash loan arbitrage between Uniswap and SushiSwap on the Ethereum Sepolia Testnet. This project demonstrates how to use Aave's flash loans to profit from token price discrepancies between decentralized exchanges.

> **Note:** This project was originally designed for the Goerli testnet, but has been updated to use the Sepolia testnet since Goerli has been deprecated.

<details>
<summary><strong>📑 Table of Contents</strong></summary>
<br>

- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [Smart Contract Architecture](#smart-contract-architecture)
  - [Frontend Features](#frontend-features)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Project Setup](#project-setup)
- [Running the Application](#running-the-application)
  - [Blockchain Development](#blockchain-development)
  - [Frontend Development](#frontend-development)
- [Testing](#testing)
  - [Smart Contract Testing](#smart-contract-testing)
  - [Integration Testing](#integration-testing)
- [Mock Mode](#mock-mode)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Security Considerations](#security-considerations)
- [License](#license)
- [Disclaimer](#disclaimer)
</details>

---

## Project Overview

This dApp enables users to:
- View real-time token prices from Uniswap and SushiSwap
- Detect arbitrage opportunities between the exchanges
- Execute flash loan arbitrage with a single click
- Monitor transaction status and profit

The project serves as an educational resource for those interested in DeFi, flash loans, and arbitrage trading. It demonstrates smart contract development, blockchain interactions, and frontend integration for a complete Web3 application.

## Technologies Used

- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Flash Loans**: Aave Protocol V3
- **Decentralized Exchanges**: Uniswap V2, SushiSwap
- **Frontend**: React.js, ethers.js (v5)
- **Wallet Integration**: MetaMask, Web3Modal
- **Ethereum Test Network**: Sepolia
- **Blockchain Explorers/Debugging**: Etherscan, Tenderly

## Project Structure

The project is organized into the following directory structure:

```
flash-loan-arbitrage/
├── contracts/                     # Smart contract source files
│   └── FlashLoanArbitrage.sol     # Main contract for flash loan arbitrage
├── test/                          # Smart contract test files
│   └── FlashLoanArbitrage.test.js # Tests for the flash loan contract
├── scripts/                       # Deployment scripts
│   └── deploy.js                  # Script to deploy the contract
├── frontend/                      # React frontend application
│   ├── public/                    # Static assets
│   └── src/
│       ├── components/            # React components
│       │   ├── ArbitrageExecutor.js   # Handles arbitrage execution
│       │   ├── TokenPriceDisplay.js   # Displays token prices
│       │   └── WalletConnect.js       # Manages wallet connection
│       ├── contracts/             # Contract ABIs
│       │   └── FlashLoanArbitrage.json
│       ├── App.js                 # Main application component
│       └── App.css                # Application styles
├── .env                           # Environment variables (not committed to git)
├── .gitignore                     # Git ignore configuration
├── hardhat.config.js              # Hardhat configuration
└── README.md                      # Project documentation
```

## How It Works

### Smart Contract Architecture

The `FlashLoanArbitrage.sol` contract implements a sophisticated arbitrage strategy:

1. **Initiation**: The owner initiates a flash loan from Aave
2. **Execution**: Upon receiving the borrowed funds, the contract:
   - Checks prices on both Uniswap and SushiSwap
   - Executes the first trade on the exchange with better prices
   - Takes the proceeds and trades back on the other exchange
3. **Validation**: Confirms that a profit was made, otherwise reverts
4. **Repayment**: Repays the flash loan with the required fee
5. **Profit**: Keeps any remaining tokens as profit

The contract is designed with security in mind, including:
- Owner-only execution of critical functions
- Checks to ensure profitable trades only
- Integration with trusted DeFi protocols

### Frontend Features

The frontend application provides an intuitive interface for:

- **Wallet Connection**: Easily connect your Ethereum wallet
- **Price Monitoring**: Real-time token price comparison between exchanges
- **Opportunity Detection**: Visual indicators when arbitrage opportunities exist
- **Execution**: One-click arbitrage execution with transaction status
- **Mock Mode**: Testing interface without real blockchain interactions

## Installation & Setup

### Prerequisites

Before starting, ensure you have the following installed:

- Node.js (v16 or later)
- npm (v7 or later)
- MetaMask browser extension
- An Ethereum wallet with Sepolia test ETH

### Environment Configuration

1. Create a `.env` file in the root directory with the following variables:

```env
# RPC URL for Sepolia testnet
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-api-key

# Private key for your Ethereum wallet (use a test wallet, not your main one!)
PRIVATE_KEY=your-private-key-without-0x-prefix

# API Key for Etherscan verification (optional)
ETHERSCAN_API_KEY=your-etherscan-api-key

# Address of Aave Lending Pool Address Provider on Sepolia
AAVE_LENDING_POOL_ADDRESS=0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
```

> **Security Warning**: Never commit your `.env` file to version control. It contains sensitive information.

### Project Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/flash-loan-arbitrage.git
cd flash-loan-arbitrage
```

2. Install backend dependencies:

```bash
npm install
```

3. Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Running the Application

### Blockchain Development

1. Compile the smart contracts:

```bash
npx hardhat compile
```

2. Deploy to a local Hardhat node (for development):

```bash
# Start local Hardhat node that forks Sepolia
npx hardhat node

# In a new terminal, deploy to local node
npx hardhat run scripts/deploy.js --network localhost
```

3. Deploy to Sepolia testnet:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. Update the contract address in the frontend:
   - Open `frontend/src/App.js`
   - Update the `FLASH_LOAN_ARBITRAGE_ADDRESS` constant with your deployed contract address

### Frontend Development

1. Start the React development server:

```bash
cd frontend
npm start
```

2. Access the application at `http://localhost:3000`

## Testing

### Smart Contract Testing

Run the Hardhat tests:

```bash
npx hardhat test
```

The test suite includes:
- Deployment tests (contract creation, owner assignment)
- Permission tests (owner-only function restriction)

> **Note**: The test suite doesn't include actual flash loan execution tests as these would require forking the mainnet and mocking external contract calls.

### Integration Testing

For testing the full application flow:

1. Use the included mock mode (enabled by default in `App.js`)
2. Or run against a local Hardhat node:

```bash
# Start local node with forking
npx hardhat node

# Deploy your contract to the local node
npx hardhat run scripts/deploy.js --network localhost

# Update FLASH_LOAN_ARBITRAGE_ADDRESS in App.js with your local deployment address
# Set MOCK_MODE to false in App.js
```

## Mock Mode

The application includes a mock mode for testing without blockchain interactions:

- Mock mode is enabled by default (`MOCK_MODE = true` in `App.js`)
- It simulates token prices, arbitrage opportunities, and executions
- Perfect for UI testing and demonstrations without needing real tokens or connections
- Look for the "MOCK MODE" badge in the application header when active

To disable mock mode and use real blockchain data:
1. Set `MOCK_MODE = false` in `App.js`
2. Ensure you have the proper contract deployed
3. Connect your wallet to the appropriate network

## Known Limitations

The current implementation has several limitations to be aware of:

1. **Network Support**: Currently only works on the Sepolia testnet
2. **Token Pairs**: Limited to the configured token pair (WETH/USDC)
3. **Gas Optimization**: Not fully optimized for gas efficiency
4. **Error Handling**: Limited error handling for complex failure scenarios
5. **Frontend UI**: Basic UI that could be improved for better UX
6. **Local Testing**: Flash loan tests require a complex setup to test locally
7. **Version Dependencies**: Uses ethers.js v5, which is not the latest version

## Future Improvements

Areas for future development:

1. **Multi-Pair Support**: Add support for multiple token pairs
2. **Enhanced UI/UX**: Improve the interface with more detailed statistics
3. **Improved Testing**: Add integration tests with forked mainnet
4. **Gas Optimization**: Optimize contract code for lower gas consumption
5. **Advanced Arbitrage**: Implement more sophisticated arbitrage strategies
6. **Dashboard**: Add historical profit tracking and analytics
7. **Library Updates**: Update to the latest ethers.js version
8. **Price Impact Analysis**: Include analysis of price impact for larger trades

## Security Considerations

This project is for educational purposes only. In a production environment, consider:

- Professional security audits
- Rate limiting and frontrunning protection
- Gas price optimization
- MEV protection
- Additional error handling
- Upgraded smart contract patterns

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Disclaimer

This application is for demonstration and educational purposes only. It is not financial advice, and should not be used for real financial transactions. Use at your own risk.

The creators of this project are not responsible for any losses incurred through the use of this software. DeFi markets involve significant risk, and flash loans in particular require deep understanding of smart contract security and DeFi mechanics.