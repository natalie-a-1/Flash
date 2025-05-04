# Smart Contracts

<div align="center">
  <h1>📄</h1>
  <h3><em>Secure, efficient blockchain execution</em></h3>
</div>

---

## 🏗️ Architecture

Flash uses a modular contract system to execute flash loan arbitrage with maximum efficiency and security. Each contract serves a specific role in the ecosystem, promoting separation of concerns and maintainability.

```mermaid
flowchart TD
    subgraph Core["Core Components"]
        direction LR
        FL["FlashLoan.sol💸 Main Contract"] --> |uses| UI["UniswapInteractor.sol
        🦄 Uniswap Interface"]
        FL --> |uses| SI["SushiSwapInteractor.sol
        🍣 SushiSwap Interface"]
        FL --> |implementation| FLRB["FlashLoanReceiverBase
        🏦 Aave Base Contract"]
    end

    subgraph Interfaces["External Interfaces"]
        IWETH["IWETH.sol
        🔄 Wrapped ETH"]
        IUniR["IUniswapV2Router02.sol
        🛣️ Routing"]
        ISushiR["ISushiSwapV2Router02.sol
        🛣️ Routing"]
        IUniP["IUniswapV2Pair.sol
        💱 Trading Pairs"]
    end

    subgraph Test["Testing"]
        MFLR["MockFlashLoanSimpleReceiver.sol
        🧪 Test Implementation"]
    end

    FL --> Interfaces
    UI --> Interfaces
    SI --> Interfaces
    MFLR --> FL
```

## 📝 Core Contracts

### FlashLoan.sol

<div style="display: flex; justify-content: space-between; align-items: center;">
  <div>
    <strong>Purpose:</strong> Executes profitable arbitrage trades using borrowed capital from Aave V3.
  </div>
</div>

**Features:**

- 🛠️ Configurable arbitrage paths between supported DEXs
- 🔧 Explicit router approval for enhanced security
- 🧩 Dynamic strategy configuration potential
- 🛡️ Precise slippage controls to prevent sandwich attacks
- 💰 Tiered fee system potential (if implemented)
- 📊 Comprehensive event emission for transaction tracking (including approvals)
- ⚡ Gas-optimized for maximum capital efficiency
- Inherits `Ownable` for access control
- Uses `SafeERC20` for secure token interactions

**Usage:**

```solidity
// Request a flash loan for arbitrage
flashLoan.requestFlashLoan(
    assetAddress,          // Token to borrow
    amountToBorrow,        // Amount to borrow
    uniswapRouterAddress,  // First DEX router
    sushiSwapRouterAddress,// Second DEX router
    wethAddress,           // Intermediate token
    slippageBps            // Slippage tolerance in basis points
);
```

### UniswapInteractor.sol

Provides a standardized interface for interacting with Uniswap V2 exchanges.

**Features:**

- 🔄 Clean abstraction for token swapping operations
- 🔍 Accurate price discovery methods
- ⚠️ Robust error handling with detailed error events
- ⛽ Gas-efficient execution paths

### SushiSwapInteractor.sol

Specialized contract for SushiSwap operations, with enhanced safety features.

**Features:**

- 🔒 Safe token approval mechanisms
- 🚨 Custom error types for precise error reporting
- 👑 Owner-controlled withdrawal functions
- ✅ Comprehensive validation checks
- Inherits `Ownable`
- Uses `SafeERC20`

### MockFlashLoanSimpleReceiver.sol

A simplified implementation for testing flash loan functionality.

**Features:**

- 🧪 Implements Aave's FlashLoanSimpleReceiverBase
- 🔬 Minimal viable implementation for isolated testing
- 📣 Event emission for verification

## 🔄 Interfaces

Located in the `interfaces/` directory, these contracts standardize interaction with external protocols:

| Interface                  | Purpose                         | Protocol   |
| -------------------------- | ------------------------------- | ---------- |
| `IUniswapV2Router02.sol`   | 🛣️ Token swapping and liquidity | Uniswap V2 |
| `ISushiSwapV2Router02.sol` | 🛣️ Token swapping and liquidity | SushiSwap  |
| `IUniswapV2Pair.sol`       | 💱 Direct pair interactions     | Uniswap V2 |
| `IWETH.sol`                | 🔄 Wrapped Ether operations     | WETH       |

## 🛠️ Technical Stack

<div align="center">
  <table>
    <tr>
      <td width="25%" align="center">
        <h3>⚙️</h3>
        <strong>Solidity</strong><br/>
        <small>^0.8.10</small>
      </td>
      <td width="25%" align="center">
        <h3>🏦</h3>
        <strong>Aave V3</strong><br/>
        <small>Flash Loans</small>
      </td>
      <td width="25%" align="center">
        <h3>🦄</h3>
        <strong>Uniswap V2</strong><br/>
        <small>Exchange</small>
      </td>
      <td width="25%" align="center">
        <h3>🛡️</h3>
        <strong>OpenZeppelin</strong><br/>
        <small>Security</small>
      </td>
    </tr>
  </table>
</div>

## 💸 Flash Loan Execution Flow (USDC -> WETH -> USDC Example)

```mermaid
sequenceDiagram
    actor User
    participant FL as FlashLoan Contract
    participant Aave as Aave V3 Pool
    participant DexBuy as Higher Price DEX (High WETH/USDC)
    participant DexSell as Lower Price DEX (Low WETH/USDC)

    User->>FL: requestFlashLoan()
    FL->>Aave: flashLoanSimple() // Request USDC Loan
    Aave-->>FL: Transfer borrowed USDC
    Aave->>FL: executeOperation() // Callback

    Note over FL: Check parameters & router approvals

    FL->>DexBuy: swapExactTokensForTokens() // Buy WETH with USDC
    DexBuy-->>FL: Return WETH

    FL->>DexSell: swapExactTokensForTokens() // Sell WETH for USDC
    DexSell-->>FL: Return USDC

    Note over FL: Verify profit margin (USDC out > USDC in + premium)

    FL->>Aave: Approve repayment
    FL-->>Aave: Return loan USDC + premium
    Note over FL: Keep profit (remaining USDC)
```

**Logic:** For a USDC -> WETH -> USDC arbitrage, the goal is to buy WETH where it costs the *least* USDC (i.e., where the WETH/USDC price is *highest*) and sell it where it yields the *most* USDC (i.e., where the WETH/USDC price is *lowest*). The difference must cover the flash loan premium and gas fees.

## 🔐 Security Considerations

Flash implements multiple layers of security:

- ✅ **Router Approval**: Explicit approval required for DEX routers.
- 🔒 **SafeERC20** for protected token transfers
- ⚠️ **Custom error types** for precise revert reasons
- 👑 **Ownership controls** via `Ownable` for administrative functions
- 🛡️ **Slippage protection** against price manipulation
- ⏱️ **Deadline parameters** to prevent stale transactions
- ✅ **Comprehensive input validation** to prevent exploits

## 📋 Prerequisites

To work with these contracts, you'll need:

- 🏦 Aave V3 pool on your target network
- 🦄 Uniswap V2 and SushiSwap deployments
- 🪙 ERC20 tokens for testing and execution
- 🛠️ Ethereum development environment (Truffle/Hardhat)

## 📊 Development Status

```mermaid
flowchart LR
    subgraph Status["Contract Status"]
        direction TB
        FL["FlashLoan.sol"] --- Tested["✅ Fully Tested"]
        UI["UniswapInteractor.sol"] --- Tested
        SI["SushiSwapInteractor.sol"] --- Tested
        MFLR["MockReceiver.sol"] --- Tested
    end

    subgraph Environments["Testing Environments"]
        Local["✅ Local"]
        Fork["✅ Mainnet Fork"]
        Testnet["✅ Testnet"]
        Mainnet["⚠️ Requires Audit"]
    end

    Status --> Environments
```

All core contracts are functionally complete and tested on local and forked environments, but should undergo formal audit before mainnet deployment.

<div align="center">
  <h3>🔒</h3>
  <p><em>Security is our highest priority</em></p>
</div>
