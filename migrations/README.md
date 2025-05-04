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
        <li>Approves DEX routers for arbitrage operations</li>
        <li>Configures network-specific settings</li>
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

<div align="center">
  <table>
    <tr>
      <th>Environment</th>
      <th>Command</th>
    </tr>
    <tr>
      <td>Local Development</td>
      <td><code>truffle migrate --network development</code></td>
    </tr>
    <tr>
      <td>Development Fork</td>
      <td><code>truffle migrate --network development_fork</code></td>
    </tr>
    <tr>
      <td>Sepolia Testnet</td>
      <td><code>truffle migrate --network sepolia</code></td>
    </tr>
  </table>
</div>

### Forked Network Deployment

For the most realistic testing environment, we recommend using a forked network:

```bash
# Terminal 1: Start Ganache with mainnet fork
npm run ganache:mainnet:persistent

# Terminal 2: Deploy contracts
truffle migrate --network development_fork
```

## Technical Implementation

### Deployment Workflow

1. **Network Detection**
   - Scripts automatically identify the target network
   - Environment-specific configuration is loaded from constants.json

2. **Contract Deployment**
   - Migrations.sol is deployed first
   - FlashLoan.sol is deployed with the appropriate Aave provider address
   - Router approvals are configured for the network's DEXs

3. **Verification**
   - Contract addresses are logged to the console
   - Successful deployment is confirmed
   - Approved routers are verified

### Advanced Features

- **Network-Specific Addresses**: Deploys with correct contract addresses for each network
- **Deployment Skipping**: Automatically skips unsupported networks
- **Gas Optimization**: Configures appropriate gas limits and prices
- **Error Handling**: Detailed error messages for failed deployments

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
