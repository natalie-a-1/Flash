# Frontend Tests

This directory contains automated tests for the Flash Blockchain frontend application. The tests ensure proper functionality of Web3 integration, MetaMask connectivity, and network interactions.

## Quick Start

```bash
# Run all tests
npm test

# Run a specific test file
npm test test/web3.test.ts
```

## Test Structure

```
test/
├── setup.ts           # Test environment configuration
├── web3.test.ts       # Web3 integration tests
└── README.md         # This documentation
```

### Test Files

- `setup.ts`: Configures the test environment with:
  - JSDOM for browser simulation
  - Mocked MetaMask provider
  - Global type definitions
  - Test utility functions

- `web3.test.ts`: Tests Web3 functionality:
  - MetaMask connection
  - Network detection
  - Account management
  - Network switching

## Available Tests

### Web3 Integration Tests
1. **getWeb3**
   - Verifies Web3 initialization with MetaMask
   - Checks provider existence

2. **getEthersProvider**
   - Validates ethers.js provider setup
   - Ensures MetaMask compatibility

3. **getNetworkDetails**
   - Tests network ID retrieval
   - Validates Sepolia testnet detection

4. **getAccounts**
   - Verifies account access
   - Validates Ethereum address format

5. **isSepoliaNetwork**
   - Tests network detection logic
   - Confirms Sepolia network identification

6. **switchToSepolia**
   - Validates network switching functionality
   - Tests MetaMask network change requests

## Adding New Tests

1. Create a new test file:
   ```typescript
   // example.test.ts
   import { expect } from 'chai';
   
   describe('Your Feature', () => {
     it('should do something specific', () => {
       // Your test code
     });
   });
   ```

2. Follow these conventions:
   - Use descriptive `describe` and `it` blocks
   - Write clear assertions with Chai
   - Handle async operations properly
   - Mock external dependencies as needed

## Test Environment

### Technologies Used
- **Mocha**: Test runner
- **Chai**: Assertion library
- **JSDOM**: Browser environment simulation
- **TypeScript**: Type safety and modern JavaScript features

### MetaMask Mocking
The test environment includes a mocked MetaMask provider that simulates:
- Account connections
- Network detection and switching
- Event handling
- RPC method responses

## Continuous Integration

Tests run automatically on GitHub Actions:
- On push to main branch
- On pull request creation
- Using Node.js 16.x and 18.x environments

## Best Practices

1. **Writing Tests**
   - One assertion per test when possible
   - Clear, descriptive test names
   - Proper setup and teardown
   - Isolated test cases

2. **Running Tests**
   - Run tests before committing
   - Ensure all tests pass locally
   - Check test coverage regularly

3. **Maintaining Tests**
   - Keep tests up to date with code changes
   - Remove obsolete tests
   - Update mocks when APIs change

## Troubleshooting

Common issues and solutions:

1. **Test Timeouts**
   - Increase timeout in mocha config
   - Check for hanging promises
   - Verify async/await usage

2. **Mock Issues**
   - Update mock methods in setup.ts
   - Check MetaMask API changes
   - Verify RPC method signatures

3. **Type Errors**
   - Ensure types are properly imported
   - Update type definitions
   - Check TypeScript configuration 