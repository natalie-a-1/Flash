# Flash Loan Arbitrage Contracts

This directory contains smart contracts for a flash loan arbitrage system leveraging Aave V3, Uniswap, and SushiSwap.

## Overview

This system enables users to perform arbitrage trades between decentralized exchanges using Aave V3 flash loans. The contracts handle the entire process of borrowing tokens, executing trades, and repaying the loan with a profit margin.

## Core Contracts

### FlashLoan.sol

The main contract that implements Aave V3 flash loan functionality for arbitrage between different decentralized exchanges.

**Features:**
- Configurable arbitrage paths and strategies
- Support for multiple DEX routers
- Slippage protection
- Fee management system (first 3 flash loans are free, then requires a fee)
- Comprehensive event emission for tracking

### UniswapInteractor.sol

A contract that provides standardized interfaces for interacting with Uniswap V2 exchanges.

**Features:**
- Token swapping functionality
- Price discovery methods
- Error handling and event emission

### SushiSwapInteractor.sol

Similar to the UniswapInteractor but designed specifically for SushiSwap exchanges.

**Features:**
- Safe token approvals
- Comprehensive error handling
- Token and Ether withdrawal functions
- Owner-restricted operations

### MockFlashLoanSimpleReceiver.sol

A simplified test implementation for flash loan receipt and repayment.

**Features:**
- Implements the Aave V3 FlashLoanSimpleReceiverBase
- Test-ready implementation for flash loan execution

## Interfaces

Located in the `interfaces/` directory:

- **IUniswapV2Router02.sol**: Interface for interacting with Uniswap V2 Router
- **ISushiSwapV2Router02.sol**: Interface for interacting with SushiSwap V2 Router
- **IUniswapV2Pair.sol**: Interface for interacting with Uniswap V2 Pairs
- **IWETH.sol**: Interface for Wrapped Ether (WETH)

## Tools & Technologies

- **Solidity**: ^0.8.10
- **Aave V3**: For flash loan functionality
- **OpenZeppelin**: For standard contracts and security utilities
- **Uniswap V2**: For token swapping and price discovery
- **SushiSwap**: Alternative DEX for arbitrage opportunities

## Prerequisites

- Aave V3 deployed on your target network
- Uniswap V2 and SushiSwap deployed on your target network
- ERC20 tokens for testing and execution

## Contract Usage

### Flash Loan Arbitrage

1. Deploy the FlashLoan contract with the Aave V3 Pool Addresses Provider
2. Approve routers for the flash loan contract
3. Call `requestFlashLoan` with:
   - Asset address to borrow
   - Amount to borrow
   - Source and target router addresses
   - Intermediate token address
   - Slippage tolerance

### Standalone DEX Interaction

The UniswapInteractor and SushiSwapInteractor can be used independently:

1. Deploy the respective contract
2. Transfer tokens to the contract (for DEX interactors)
3. Call the swap functions with appropriate parameters

## Security Considerations

- Contracts use SafeERC20 where appropriate
- Custom error types for clear error reporting
- Strict access control via ownership patterns
- Protection against slippage and deadline expiration
- Comprehensive validation of inputs

## Development Status

All contracts are functional but should be thoroughly tested before production use.
