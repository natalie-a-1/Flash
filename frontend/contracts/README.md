# Contract Artifacts Directory

This directory stores the compiled contract artifacts (ABIs) that are copied from the Truffle build directory.

## How it works

1. When contracts are compiled with `npm run compile`, the JSON artifacts are generated in the `build/contracts` directory
2. After contracts are migrated with `npm run migrate`, the `postmigrate` script automatically runs `npm run copy-contracts`
3. The `copy-contracts.js` script copies the contract artifacts from `build/contracts` to this directory

## Manual copying

You can manually copy the contracts by running:

```bash
npm run copy-contracts
```

## Using the contracts

These contract artifacts are imported by the frontend code to interact with the deployed smart contracts. 