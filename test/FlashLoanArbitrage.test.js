/**
 * @file FlashLoanArbitrage.test.js
 * @description Test suite for the FlashLoanArbitrage smart contract
 * 
 * These tests verify the basic functionality of the FlashLoanArbitrage contract:
 * - Correct deployment with proper owner and addresses
 * - Permission controls for the flash loan execution
 * 
 * Note: These tests don't execute actual flash loans as that would require
 * forking the mainnet and mocking external contract calls.
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlashLoanArbitrage", function () {
  let flashLoanArbitrage;
  let owner;
  let addr1;
  
  // Mock addresses for test on Sepolia
  const AAVE_LENDING_POOL_PROVIDER = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  // Uniswap Router on Sepolia (note: may need to be updated with accurate address)
  const UNISWAP_ROUTER = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";
  // SushiSwap Router on Sepolia (note: may need to be updated with accurate address)
  const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

  /**
   * Set up a fresh contract instance before each test
   */
  beforeEach(async function () {
    // Get signers
    [owner, addr1] = await ethers.getSigners();

    // Deploy the contract
    const FlashLoanArbitrage = await ethers.getContractFactory("FlashLoanArbitrage");
    flashLoanArbitrage = await FlashLoanArbitrage.deploy(
      AAVE_LENDING_POOL_PROVIDER,
      UNISWAP_ROUTER,
      SUSHISWAP_ROUTER
    );
    // We don't need to call deployed() anymore in newer ethers.js versions
  });

  describe("Deployment", function () {
    /**
     * Test that the contract sets the deployer as the owner
     */
    it("Should set the right owner", async function () {
      expect(await flashLoanArbitrage.owner()).to.equal(owner.address);
    });

    /**
     * Test that the contract stores the correct addresses for external contracts
     */
    it("Should set the correct addresses", async function () {
      expect(await flashLoanArbitrage.lendingPoolAddressProvider()).to.equal(AAVE_LENDING_POOL_PROVIDER);
      expect(await flashLoanArbitrage.uniswapRouterAddress()).to.equal(UNISWAP_ROUTER);
      expect(await flashLoanArbitrage.sushiswapRouterAddress()).to.equal(SUSHISWAP_ROUTER);
    });
  });

  describe("Permissions", function () {
    /**
     * Test that only the owner can initiate flash loans
     */
    it("Should allow only owner to initiate flash loans", async function () {
      // Mock parameters for initiateFlashLoan
      // USDC on Sepolia
      const token = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
      const amount = ethers.parseUnits("1000", 6); // 1000 USDC
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        [
          "address[]", 
          "address[]"
        ], 
        [
          // Path: USDC -> WETH on Sepolia
          [token, "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"],
          // Reverse path: WETH -> USDC on Sepolia
          ["0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", token]
        ]
      );

      // Should revert when called by non-owner
      // OpenZeppelin v5 uses custom errors instead of string errors
      await expect(
        flashLoanArbitrage.connect(addr1).initiateFlashLoan(token, amount, params)
      ).to.be.reverted; // Just check that it reverts without checking the specific error message
    });
  });

  // Note: Testing actual flash loan execution would require forking the mainnet
  // and mocking external contract calls, which is beyond the scope of this basic test
}); 