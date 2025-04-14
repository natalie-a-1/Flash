# Flash Blockchain Project Architecture

This document explains the overall architecture and design of the Flash Blockchain project.

## Project Overview

Flash is a blockchain project built on Ethereum that includes:
1. A set of smart contracts written in Solidity
2. A web frontend built with Next.js

## Directory Structure

```
flash/
├── contracts/             # Solidity smart contracts
├── migrations/            # Truffle deployment scripts
├── test/                  # Smart contract tests
├── build/                 # Compiled contract artifacts (generated)
├── frontend/              # Next.js frontend application
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── contracts/         # Contract ABIs (copied from build/)
│   └── public/            # Static assets
├── truffle-config.js      # Truffle configuration
├── copy-contracts.js      # Script to copy contracts to frontend
└── .env                   # Environment variables
```

## Backend Architecture

The backend is built using the Truffle development framework and consists of:

- **Smart Contracts**: Solidity contracts in the `contracts/` directory
- **Migrations**: Scripts to deploy contracts in the `migrations/` directory
- **Tests**: Contract tests in the `test/` directory

### Smart Contract Deployment Flow

1. Contracts are written in Solidity
2. Compiled with Truffle (`npm run compile`)
3. Deployed to a blockchain network (`npm run migrate`)
4. ABIs are copied to the frontend (`npm run copy-contracts`)

## Frontend Architecture

The frontend is built using Next.js, React, and Tailwind CSS:

- **App Router**: Pages and routes using Next.js App Router
- **Components**: Reusable React components
- **Web3 Integration**: Utilities for connecting to Ethereum via MetaMask
- **TypeScript**: Type definitions for improved development experience

### Web3 Integration Flow

1. Connect to MetaMask via the Web3Provider component
2. Load contract instances using ABIs in the `contracts/` directory
3. Interact with smart contracts through the loaded instances

## Data Flow

```
User (Browser) ←→ Frontend (Next.js) ←→ Web3.js/ethers.js ←→ MetaMask ←→ Ethereum Network ←→ Smart Contracts
```

## Code Organization Principles

1. **Separation of Concerns**: Smart contract logic separated from UI
2. **Type Safety**: TypeScript throughout the frontend
3. **Reusability**: Shared components and utilities
4. **Configuration Management**: Environment variables for network details

## Deployment Strategy

- **Development**: Local Ganache blockchain
- **Testing**: Sepolia testnet
- **Production**: Ethereum mainnet (future) 