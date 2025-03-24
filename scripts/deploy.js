/**
 * @file deploy.js
 * @description Deployment script for the FlashLoanArbitrage contract
 * 
 * This script deploys the FlashLoanArbitrage smart contract to the specified network
 * with the appropriate contract addresses for Aave, Uniswap, and SushiSwap.
 * It reads the Aave Lending Pool address from environment variables.
 */

const hre = require("hardhat");

/**
 * Main deployment function
 * 
 * Deploys the FlashLoanArbitrage contract with the following parameters:
 * - Aave Lending Pool Address Provider from environment variables
 * - Uniswap V2 Router address on Sepolia
 * - SushiSwap Router address on Sepolia
 */
async function main() {
  // Addresses for Sepolia testnet
  const AAVE_LENDING_POOL_ADDRESS_PROVIDER = process.env.AAVE_LENDING_POOL_ADDRESS;
  // Uniswap V2 Router on Sepolia
  const UNISWAP_ROUTER_ADDRESS = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";
  // SushiSwap Router on Sepolia
  const SUSHISWAP_ROUTER_ADDRESS = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

  console.log("Deploying FlashLoanArbitrage contract...");

  // Deploy the contract
  const FlashLoanArbitrage = await hre.ethers.getContractFactory("FlashLoanArbitrage");
  const flashLoanArbitrage = await FlashLoanArbitrage.deploy(
    AAVE_LENDING_POOL_ADDRESS_PROVIDER,
    UNISWAP_ROUTER_ADDRESS,
    SUSHISWAP_ROUTER_ADDRESS
  );

  // No need to wait for deployment anymore in newer ethers.js versions

  console.log("FlashLoanArbitrage deployed to:", flashLoanArbitrage.target);
  console.log("Deployed with parameters:");
  console.log(" - Aave Lending Pool Address Provider:", AAVE_LENDING_POOL_ADDRESS_PROVIDER);
  console.log(" - Uniswap Router:", UNISWAP_ROUTER_ADDRESS);
  console.log(" - SushiSwap Router:", SUSHISWAP_ROUTER_ADDRESS);
}

// Execute the deployment and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 