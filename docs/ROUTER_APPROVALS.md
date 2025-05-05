# Router Approval Process for Flash Loans

This document explains how router approvals work in the Flash Loan project and how to handle them.

## Overview

When executing flash loans with arbitrage between Uniswap and SushiSwap, our Flash Loan contract needs to have permission to use both the Uniswap V2 Router and SushiSwap Router. These permissions are granted through the `setRouterApproval()` function in the Flash Loan contract.

## The Problem

Router approvals are stored in the contract's state. When restarting a Ganache fork for development or testing, these approvals can be lost, leading to errors like:

```
Router approval required: SushiSwap router is not approved. Uniswap V2 router is not approved. Please contact the contract owner to approve these routers.
```

## The Solution

We have implemented automated router approval scripts that run whenever you start a new Ganache fork. These scripts check if the routers are already approved, and if not, they approve them automatically. The scripts also:

1. Verify if the contract exists at the expected address
2. Deploy a new contract if needed
3. Check for errors and provide detailed diagnostic information
4. Update environment variables with the new contract address

## Prerequisites

Before running the router approval scripts, make sure:

1. Your contracts are compiled. The scripts will automatically compile them if needed.
2. You have set the following environment variables in your `.env` file:
   - `NEXT_PUBLIC_MAINNET_RPC_URL`: Your Ethereum mainnet RPC URL
   - `USDC_WHALE_ADDRESS`: The address of a USDC whale account to unlock
   - `FLASH_LOAN_CONTRACT_ADDRESS` (optional): Your deployed flash loan contract address

## Usage

To start your Ganache fork with auto-approved routers:

```bash
npm run fork:with-approvals
```

This starts a Ganache fork and automatically:

1. Compiles contracts if needed
2. Starts Ganache with the specified fork parameters
3. Verifies if the FlashLoan contract exists at the expected address
4. Deploys a new contract if needed
5. Runs the router approval script

## Manual Process

If you prefer to run steps separately:

1. Compile your contracts (if not already compiled):

   ```bash
   npx truffle compile
   ```

2. Start Ganache:

   ```bash
   npm run ganache:mainnet:persistent
   ```

3. Deploy the FlashLoan contract (if needed):

   ```bash
   npm run deploy-flash-loan
   ```

4. Approve the routers:
   ```bash
   npm run approve-routers
   ```

## How It Works

Our automated scripts perform the following steps:

1. **Compile Contracts**: Check if contracts are compiled and compile them if not
2. **Start Ganache**: Launch a Ganache fork with specified parameters
3. **Verify Contract**: Check if the FlashLoan contract exists at the expected address
4. **Deploy Contract**: If the contract doesn't exist, deploy a new one
5. **Update Environment**: Save the contract address to .env file
6. **Check Methods**: Verify that all required methods are available
7. **Approve Routers**: Call the setRouterApproval method for both routers
8. **Verify Approvals**: Confirm that approvals were successful

## Troubleshooting

### "Cannot find module '../../build/contracts/FlashLoan.json'"

This error occurs when the contract artifacts don't exist. Fix it by:

1. Ensuring contracts are compiled:
   ```bash
   npx truffle compile
   ```
2. Verifying the correct contract name in the artifacts directory. Our main contract is named `FlashLoan.json` not `FlashLoanContract.json`.

### "No contract found at address"

This happens when the contract doesn't exist at the address specified. The script will automatically attempt to deploy a new contract.

If you want to deploy manually:

```bash
npm run deploy-flash-loan
```

### "Error: The account is not the contract owner"

This happens when the first account in your Ganache instance doesn't match the contract owner. To fix:

1. Make sure you're using the same mnemonic or account that was used to deploy the contract
2. Verify the contract address in `test/demo/approveRouters.js` matches your deployment
3. If necessary, modify the script to use the correct account index

### "Error executing the approval transaction"

This could be due to:

- Insufficient gas
- Network issues
- Contract state inconsistencies

Try restarting Ganache completely and running the approval script again.

## Technical Details

The router approval process is implemented in these files:

- `test/demo/approveRouters.js` - Core script that approves routers
- `test/demo/deployFlashLoan.js` - Script to deploy the FlashLoan contract if needed
- `scripts/start-fork-with-approvals.js` - Node.js script that combines starting Ganache with deployment and approvals

The approval process uses the `setRouterApproval` function in the Flash Loan contract to grant permission to the Uniswap and SushiSwap router addresses.
