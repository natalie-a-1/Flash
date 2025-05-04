# Migrations

<div align="center">
  <!-- <img src="../frontend/public/deployment_icon.png" alt="Deployment" width="60" /> -->
  <h3><em>Smart contract deployment made simple</em></h3>
</div>

---

## Overview

This directory contains Truffle migration scripts for deploying and configuring the Flash system across various networks. These scripts automate the process of contract deployment, initialization, and router approvals.

<!-- <div align="center">
  <img src="../frontend/public/deployment_flow.png" alt="Deployment Flow" width="80%" />
</div> -->

## Migration Files

<table>
  <tr>
    <td width="30%">
      <div align="center">
        <h3>1_initial_migration.js</h3>
        <span>✓</span>
      </div>
    </td>
    <td width="70%">
      <strong>Purpose:</strong> Initializes Truffle's migration tracking system.<br/><br/>
      <strong>Implementation:</strong>
      <ul>
        <li>Deploys the <code>Migrations.sol</code> contract</li>
        <li>Enables Truffle to track deployment history</li>
        <li>Required as the first migration step</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="30%">
      <div align="center">
        <h3>2_deploy_flashloan.js</h3>
        <span>✓</span>
      </div>
    </td>
    <td width="70%">
      <strong>Purpose:</strong> Deploys and configures the Flash Loan system.<br/><br/>
      <strong>Implementation:</strong>
      <ul>
        <li>Deploys the main <code>FlashLoan.sol</code> contract</li>
        <li>Approves DEX routers (e.g., Uniswap V2, SushiSwap) for arbitrage operations based on network</li>
        <li>Configures network-specific settings (Aave Pool Provider)</li>
      </ul>
    </td>
  </tr>
</table>

## Network Support

The migration system intelligently adapts to different deployment environments. The network matrix below shows current support status:

<table>
  <tr>
    <th>Network</th>
    <th>Status</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Local Development</td>
    <td><span style="color:#34c759">✓</span></td>
    <td>Standard Ganache instance for local testing</td>
  </tr>
  <tr>
    <td>Development Fork</td>
    <td><span style="color:#34c759">✓</span></td>
    <td>Ganache forking Sepolia for realistic testing</td>
  </tr>
  <tr>
    <td>Mainnet Fork</td>
    <td><span style="color:#34c759">✓</span></td>
    <td>Ganache forking Ethereum mainnet for production testing</td>
  </tr>
  <tr>
    <td>Sepolia Testnet</td>
    <td><span style="color:#34c759">✓</span></td>
    <td>Ethereum testnet for public testing</td>
  </tr>
  <tr>
    <td>Ethereum Mainnet</td>
    <td><span style="color:#ff9f0a">⚠</span></td>
    <td>Production environment (configured but not recommended without audit)</td>
  </tr>
  <tr>
    <td>Polygon Mumbai</td>
    <td><span style="color:#ff3b30">×</span></td>
    <td>Support planned in future updates</td>
  </tr>
</table>

## Deployment Guide

### Prerequisites

<table>
  <tr>
    <!-- <td width="60px" align="center">
      <img src="../frontend/public/node_icon.png" alt="Node.js" width="40" />
    </td> -->
    <td>
      <strong>Node.js 16+</strong><br/>
      <small>JavaScript runtime environment</small>
    </td>
  </tr>
  <tr>
    <!-- <td width="60px" align="center">
      <img src="../frontend/public/truffle_icon.png" alt="Truffle" width="40" />
    </td> -->
    <td>
      <strong>Truffle</strong><br/>
      <small>Smart contract deployment framework</small>
    </td>
  </tr>
  <tr>
    <!-- <td width="60px" align="center">
      <img src="../frontend/public/ganache_icon.png" alt="Ganache" width="40" />
    </td> -->
    <td>
      <strong>Ganache</strong><br/>
      <small>Local Ethereum blockchain for testing</small>
    </td>
  </tr>
  <tr>
    <!-- <td width="60px" align="center">
      <img src="../frontend/public/eth_icon.png" alt="ETH" width="40" />
    </td> -->
    <td>
      <strong>ETH for gas</strong><br/>
      <small>Required for testnet/mainnet deployments</small>
    </td>
  </tr>
</table>

### Environment Setup

Create a `.env` file in the project root with the following variables:

```
# Wallet configuration
MNEMONIC=your_wallet_mnemonic

# Network RPC endpoints
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### Deployment Commands

**Important:** Ensure you have run `npm install` in the root directory.

<div align="center">
  <table>
    <tr>
      <th>Environment</th>
      <th>Command (from root directory)</th>
    </tr>
    <tr>
      <td>Local Development (Standard Ganache)</td>
      <td><code>truffle migrate --network development</code></td>
    </tr>
    <tr>
      <td>Mainnet Fork (Recommended for Testing)</td>
      <td>See section below</td>
    </tr>
    <tr>
      <td>Sepolia Testnet</td>
      <td><code>truffle migrate --network sepolia</code></td>
    </tr>
     <tr>
      <td>Mainnet (Use with caution!)</td>
      <td><code>truffle migrate --network mainnet</code></td>
    </tr>
  </table>
</div>

### Forked Network Deployment (Mainnet Fork)

This is the recommended approach for realistic testing.

```bash
# Terminal 1: Start Ganache with mainnet fork
# (Ensure .env is populated with MAINNET_RPC_URL. Command now includes --chain.chainId 1337)
export $(grep -v '^#' .env | xargs)
npm run ganache:mainnet:persistent

# Terminal 2: Deploy contracts
# (Uses gas settings from truffle-config.js. Use --reset for fresh deployments)
npx truffle migrate --network mainnet_fork --reset

# Terminal 3 (If running UI): Copy ABIs to frontend
node copy-contracts.js
```

**Notes:**
- The `mainnet_fork` network in `truffle-config.js` is configured with specific gas limits and `network_id: "*"`.
- The `ganache:mainnet:persistent` script uses `--chain.chainId 1337` to ensure MetaMask/frontend detect the correct ID (1337), while Truffle saves deployment artifacts under network ID `1` (the ID Ganache reports for the forked network). The frontend logic handles this mismatch.
- If you modify contracts, use `truffle migrate --network mainnet_fork --reset` to ensure a clean deployment.

## Technical Implementation

### Deployment Workflow

1. **Network Detection**: Scripts identify the target network (`development`, `mainnet_fork`, `sepolia`, etc.).
2. **Configuration Loading**: Network-specific addresses (Aave Pool Provider, DEX Routers) are loaded from `constants.json`.
3. **Contract Deployment**: `Migrations.sol` followed by `FlashLoan.sol` (linked to the correct Aave Pool Provider).
4. **Router Approval**: `2_deploy_flashloan.js` calls `approveRouter` on the deployed `FlashLoan` contract for the network's Uniswap V2 and SushiSwap routers.
5. **Verification**: Contract addresses and approved routers are logged.

### Advanced Features

- **Network-Specific Addresses**: Deploys with correct external contract addresses.
- **Gas Optimization**: Gas settings in `truffle-config.js` are tuned per network (higher limits/prices for mainnet/fork).
- **Error Handling**: Detailed error messages for failed deployments.

## Troubleshooting

<table>
  <tr>
    <th width="40%">Issue</th>
    <th width="60%">Solution</th>
  </tr>
  <tr>
    <td>Transaction Underpriced</td>
    <td>Increase gas price in truffle-config.js for the target network</td>
  </tr>
  <tr>
    <td>Network Connection Error</td>
    <td>Verify RPC URL in .env file and check network connectivity</td>
  </tr>
  <tr>
    <td>Insufficient Funds</td>
    <td>Ensure deployment wallet has sufficient ETH for gas</td>
  </tr>
  <tr>
    <td>Contract Size Error</td>
    <td>Optimize contract or increase gas limit in truffle-config.js</td>
  </tr>
</table>

## Extending Migrations

To add support for new contracts or networks:

1. Create sequentially numbered migration files (e.g., `3_deploy_new_contract.js`)
2. Follow the established pattern for network detection and deployment
3. Add new network configurations to `truffle-config.js` as needed
4. Update `constants.json` with network-specific addresses

<!-- <div align="center">
  <img src="../frontend/public/rocket_icon.png" alt="Launch" width="30" />
  <p><em>Ready for launch</em></p>
</div> -->

## License

[MIT](../LICENSE)
