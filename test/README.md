# Testing Suite

<div align="center">
  <!-- <img src="../frontend/public/test_icon.png" alt="Test Icon" width="50" /> -->
  <h3><em>Ensuring reliability through comprehensive testing</em></h3>
</div>

## Overview

This directory contains test suites for verifying the functionality, security, and performance of the Flash system. The tests cover smart contracts, integration scenarios, and frontend components.

---

## Test Categories

<table>
  <tr>
    <td width="33%" align="center">
      <!-- <img width="40" src="../frontend/public/contract_icon.png"/> -->
      <br/>
      <strong>Contract Tests</strong><br/>
      <small>Solidity unit testing</small>
    </td>
    <td width="33%" align="center">
      <!-- <img width="40" src="../frontend/public/integration_icon.png"/> -->
      <br/>
      <strong>Integration Tests</strong><br/>
      <small>Cross-component testing</small>
    </td>
    <td width="33%" align="center">
      <!-- <img width="40" src="../frontend/public/frontend_icon.png"/> -->
      <br/>
      <strong>Frontend Tests</strong><br/>
      <small>UI component testing</small>
    </td>
  </tr>
</table>

## Contract Tests

Verifies that individual smart contracts function correctly in isolation.

### Files

- `FlashLoan.test.js` — Tests the core flash loan contract functionality
- `UniswapInteractor.test.js` — Tests Uniswap integration functions
- `SushiSwapInteractor.test.js` — Tests SushiSwap integration functions
- `MockFlashLoanSimpleReceiver.sol` — A simple contract used in tests to simulate receiving a flash loan callback from Aave.

### Key Test Scenarios

- Flash loan borrowing and repayment (successful)
- Router approval and revocation
- Attempting trades with unapproved routers (should fail)
- Standard arbitrage execution with positive profit (buy high WETH/USDC, sell low WETH/USDC)
- Failed arbitrage due to insufficient profit margin
- Failed arbitrage due to slippage parameter being too tight
- Error handling and specific revert conditions (e.g., InvalidRouter, NotOwner)
- Gas efficiency measurements for core operations

## Integration Tests

Confirms that contracts work together properly in real-world scenarios, often using a forked environment.

### Files

- `Arbitrage.test.js` — Tests full arbitrage workflows using multiple DEXs
- `NetworkCompatibility.test.js` — Tests behavior across different forked networks (if applicable)

### Key Test Scenarios

- Complete USDC -> WETH -> USDC arbitrage flow using approved routers
- Verification of correct profit calculation against known price differences
- Cross-DEX interaction scenarios (e.g., Uniswap V2 -> SushiSwap)
- Token approval and allowance handling within the flow
- Edge case token pairs and amounts (if applicable beyond USDC/WETH)
- Fee calculation and profit margins across the entire transaction

## Frontend Tests

Ensures the UI components function correctly and provide accurate information.

### Files

- Located in `/frontend/test/`
- Component tests for UI elements
- Hook tests for custom React hooks
- End-to-end tests for critical user flows

## Running Tests

### Prerequisites

- Node.js 16+
- Ganache running locally (preferably using the mainnet fork script)
- Truffle installed globally (`npm install -g truffle`)

### Contract and Integration Tests

```bash
# Terminal 1: Start Ganache with Mainnet fork using persistent DB
# (Ensure .env is populated)
export $(grep -v '^#' .env | xargs)
npm run ganache:mainnet:persistent

# Terminal 2: Run all tests
# (Assumes contracts are deployed via migrations or test setup)
truffle test
```

### Specific Test Files

```bash
# Run a specific test file
truffle test ./test/FlashLoan.test.js

# Run tests with a specific describe block or test name
truffle test ./test/Arbitrage.test.js --grep "profitable arbitrage"
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Test Coverage

<table>
  <tr>
    <td width="25%">
      <div align="center">
        <h1>94%</h1>
        <p>FlashLoan.sol</p>
      </div>
    </td>
    <td width="25%">
      <div align="center">
        <h1>87%</h1>
        <p>UniswapInteractor.sol</p>
      </div>
    </td>
    <td width="25%">
      <div align="center">
        <h1>89%</h1>
        <p>SushiSwapInteractor.sol</p>
      </div>
    </td>
    <td width="25%">
      <div align="center">
        <h1>76%</h1>
        <p>Frontend Components</p>
      </div>
    </td>
  </tr>
</table>

## Continuous Integration

Tests are automatically run in CI environment on:

- Pull requests to main branch
- Daily scheduled runs
- Version tags

## Writing New Tests

### Contract Test Template

```javascript
const FlashLoan = artifacts.require("FlashLoan");

contract("FlashLoan", (accounts) => {
  let flashLoan;
  const owner = accounts[0];

  beforeEach(async () => {
    flashLoan = await FlashLoan.new(addressProviderMock);
  });

  it("should perform expected behavior", async () => {
    // Test implementation
    const result = await flashLoan.someFunction();
    assert.equal(result, expectedValue);
  });
});
```

### Frontend Test Example

```javascript
import { render, screen } from "@testing-library/react";
import Component from "./Component";

describe("Component", () => {
  it("renders correctly", () => {
    render(<Component />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

## Test Environment

- Contract tests run against Truffle's built-in Ganache or the specified Ganache instance.
- **Mainnet Fork** (`mainnet_fork` network or `ganache:mainnet:persistent` script) is heavily used for realistic integration testing.
- Mocks (`MockFlashLoanSimpleReceiver`) are used for external dependencies like the Aave callback.
- Time-based tests use Truffle's time manipulation utilities.
