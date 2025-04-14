# Smart Contract Tests

This directory contains tests for the Flash Blockchain smart contracts.

## Running Tests

```bash
# Run all tests
npm test

# Run a specific test
npx truffle test ./test/specific_test.js
```

## Test Structure

Tests are written using Mocha and Chai with Truffle's testing framework. A typical test file has this structure:

```javascript
const ContractName = artifacts.require("ContractName");

contract("ContractName", (accounts) => {
  let contractInstance;
  const owner = accounts[0];
  const user1 = accounts[1];
  
  // Set up before each test
  beforeEach(async () => {
    contractInstance = await ContractName.new({ from: owner });
  });
  
  it("should perform expected behavior", async () => {
    // Setup
    const initialValue = await contractInstance.getValue();
    
    // Action
    await contractInstance.setValue(newValue, { from: owner });
    
    // Assertion
    const updatedValue = await contractInstance.getValue();
    assert.equal(updatedValue, newValue, "Value was not set correctly");
  });
});
```

## Best Practices

1. Test each function in isolation
2. Test both success and failure cases (e.g., permissions, input validation)
3. Test contract interactions
4. Use `beforeEach` to reset contract state between tests
5. Use meaningful assertion messages 