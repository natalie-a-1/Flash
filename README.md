# Flash Blockchain Project

A blockchain development project built on Ethereum.

## Project Structure

This repository is organized into two main parts:

- **Blockchain Backend**: Smart contracts, migrations, and Truffle configuration
- **Frontend Application**: Next.js application in the `/frontend` directory

## Quick Start

```bash
# Install main dependencies
npm install

# Start development blockchain
npm run ganache

# Compile contracts
npm run compile

# Deploy to development network
npm run migrate

# Start frontend development server
cd frontend && npm run dev
```

## Blockchain Backend

### Prerequisites

- Node.js ≥ 16.0.0
- npm
- MetaMask browser extension

### Project Structure

- `contracts/` - Smart contracts written in Solidity
- `migrations/` - Deployment scripts
- `test/` - Test files for smart contracts
- `build/` - Compiled contract artifacts

### Available Scripts

- `npm run dev` - Start Truffle console
- `npm test` - Run tests for smart contracts
- `npm run ganache` - Start local blockchain
- `npm run compile` - Compile smart contracts
- `npm run migrate` - Deploy contracts to development network
- `npm run migrate:sepolia` - Deploy contracts to Sepolia testnet
- `npm run copy-contracts` - Copy contract ABIs to frontend
- `npm run postmigrate` - Automatically copies contracts after migration

## Frontend Development

The frontend is built with Next.js, React, and Tailwind CSS. See the [frontend README](./frontend/README.md) for more details.

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

## Deployment

### Local Development

1. Start Ganache: `npm run ganache`
2. Deploy contracts: `npm run migrate`
3. Start frontend: `cd frontend && npm run dev`

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
