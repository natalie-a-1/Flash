# Flash Loan Arbitrage dApp

A decentralized application (dApp) for executing flash loan arbitrage between Uniswap and SushiSwap on the Ethereum Goerli Testnet. This project demonstrates how to use Aave's flash loans to profit from token price discrepancies between decentralized exchanges.

## Project Overview

This dApp enables users to:
- View real-time token prices from Uniswap and SushiSwap
- Detect arbitrage opportunities between the exchanges
- Execute flash loan arbitrage with a single click
- Monitor transaction status and profit

## Technologies Used

- **Smart Contracts**: Solidity, Hardhat
- **Flash Loans**: Aave Protocol
- **Decentralized Exchanges**: Uniswap V2, SushiSwap
- **Frontend**: React.js, ethers.js
- **Wallet Integration**: MetaMask
- **Ethereum Test Network**: Goerli
- **Blockchain Explorers/Debugging**: Etherscan, Tenderly

## Project Structure

```
project-root/
├── contracts/               # Smart contract source files
│   └── FlashLoanArbitrage.sol
├── test/                    # Smart contract test files
│   └── FlashLoanArbitrage.test.js
├── scripts/                 # Deployment scripts
│   └── deploy.js
├── frontend/                # React frontend application
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ArbitrageExecutor.js
│       │   ├── TokenPriceDisplay.js
│       │   └── WalletConnect.js
│       ├── contracts/
│       │   └── FlashLoanArbitrage.json
│       ├── App.js
│       └── App.css
├── .env                     # Environment variables (not committed to git)
├── hardhat.config.js        # Hardhat configuration
└── README.md                # Project documentation
```

## How It Works

### Smart Contract Architecture

The `FlashLoanArbitrage.sol` contract:
1. Borrows tokens via Aave's flash loan functionality
2. Checks prices on both Uniswap and SushiSwap
3. Executes trades on the exchange with the better price
4. Repays the flash loan with a fee
5. Keeps the profit, if any

### Frontend Features

- Wallet connection via MetaMask
- Real-time token price display
- Visual indication of arbitrage opportunities
- One-click arbitrage execution
- Transaction monitoring

## Getting Started

### Prerequisites

- Node.js and npm
- MetaMask wallet with Goerli ETH
- Infura or Alchemy API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/flash-loan-arbitrage.git
cd flash-loan-arbitrage
```

2. Install dependencies:
```bash
npm install
cd frontend
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
GOERLI_RPC_URL=https://goerli.infura.io/v3/your-api-key
PRIVATE_KEY=your-private-key
ETHERSCAN_API_KEY=your-etherscan-api-key
AAVE_LENDING_POOL_ADDRESS=0x4bd5643ac6f66a5237E18bfA7d47cF22f1c9F210
```

### Deployment

1. Deploy the contract to Goerli testnet:
```bash
npx hardhat run scripts/deploy.js --network goerli
```

2. Update the contract address in the frontend:
   - Open `frontend/src/App.js`
   - Replace `YOUR_DEPLOYED_CONTRACT_ADDRESS` with your deployed contract address

3. Start the React development server:
```bash
cd frontend
npm start
```

### Using the dApp

1. Connect your MetaMask wallet (ensure it's connected to Goerli testnet)
2. The app will display current token prices on Uniswap and SushiSwap
3. If an arbitrage opportunity is detected, the "Execute Arbitrage" button will be enabled
4. Click the button to execute the flash loan arbitrage
5. Monitor the transaction status and profit

## Testing

Run the tests with:
```bash
npx hardhat test
```

## Security Considerations

This project is for educational purposes only. In a production environment, consider:
- Professional security audits
- Rate limiting
- Gas optimization
- MEV protection
- Additional error handling

## License

This project is licensed under the MIT License.

## Disclaimer

This application is for demonstration purposes only. It is not financial advice, and should not be used for real financial transactions. Use at your own risk.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.