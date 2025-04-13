# Flash Blockchain Project

A blockchain development project built on Ethereum.

## Quick Start

```bash
# Install dependencies
npm install

# Start development blockchain
npm run ganache

# Compile contracts
npm run compile

# Deploy to development network
npm run migrate
```

## Development Setup

### Prerequisites
- Node.js ≥ 16.0.0
- npm

### Project Structure
- `contracts/` - Smart contracts
- `migrations/` - Deployment scripts
- `test/` - Test files

### Available Scripts
- `npm run dev` - Start Truffle console
- `npm test` - Run tests
- `npm run ganache` - Start local blockchain

## Deployment

### Local Development
1. Start Ganache: `npm run ganache`
2. Deploy contracts: `npm run migrate`

### Sepolia Testnet
1. Create `.env` file from `.env.example`
2. Add your mnemonic and Alchemy API key
3. Uncomment Sepolia config in `truffle-config.js`
4. Run: `npm run migrate:sepolia`

## MetaMask Configuration

### Sepolia Network Settings
- **Network Name**: Sepolia Test Network
- **RPC URL**: https://rpc.sepolia.org
- **Chain ID**: 11155111
- **Currency**: ETH
- **Explorer**: https://sepolia.etherscan.io

### Getting Test ETH
Use any Sepolia faucet:
- [Alchemy Faucet](https://sepoliafaucet.com)
- [PK910 Faucet](https://sepolia-faucet.pk910.de)
- [Sepolia Faucet](https://faucet.sepolia.dev) 