# Migration Scripts

This directory contains Truffle migration scripts that deploy smart contracts to the blockchain.

## Existing Migrations

- `1_initial_migration.js` - Deploys the Migrations contract used by Truffle to track deployments

## How Migrations Work

1. Files are executed in numerical order (prefixed by number)
2. Each migration deploys one or more contracts
3. Truffle tracks which migrations have been run to avoid duplicate deployments
4. Migration state is stored in the Migrations contract on-chain

## Creating New Migrations

When creating a new migration:

1. Name it with the next sequential number (e.g., `2_deploy_flash_token.js`)
2. Follow this template:

```javascript
const ContractName = artifacts.require("ContractName");

module.exports = function (deployer) {
  deployer.deploy(ContractName);
};
```

3. For contracts with constructor arguments:

```javascript
const ContractName = artifacts.require("ContractName");

module.exports = function (deployer) {
  deployer.deploy(ContractName, arg1, arg2);
};
```

## Running Migrations

- Local development: `npm run migrate`
- Sepolia testnet: `npm run migrate:sepolia`
