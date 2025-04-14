# Smart Contracts

This directory contains the Solidity smart contracts for the Flash Blockchain project.

## Contract Overview

- `Migrations.sol` - Standard Truffle migrations contract for tracking deployments

## Development

1. Write or modify contracts in this directory
2. Compile them with `npm run compile` from the project root
3. Create migration scripts in the `migrations/` directory
4. Deploy them with `npm run migrate` (local) or `npm run migrate:sepolia` (testnet)

## Solidity Version

The contracts are developed with Solidity 0.8.19 as specified in the Truffle configuration.

## Testing

Tests for these contracts should be placed in the `test/` directory and can be run with:

```bash
npm test
```

## Adding New Contracts

When adding new contracts:

1. Create the Solidity file in this directory
2. Create a migration script in `migrations/`
3. Compile and deploy
4. The contract ABIs will be automatically copied to the frontend 