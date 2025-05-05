/**
 * Deploy Flash Loan Contract Script
 *
 * This script deploys a new instance of the Flash Loan contract
 * to ensure we have a valid contract address to work with.
 */

require("dotenv").config();
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

// Connect to local Ganache
const web3 = new Web3("http://localhost:8545");

// Aave V3 Pool Addresses Provider for Mainnet
const AAVE_ADDRESSES_PROVIDER = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";

// Get the contract artifact
function getFlashLoanArtifact() {
  console.log("🔍 Looking for FlashLoan contract artifact...");
  const buildDir = path.resolve(__dirname, "../../build/contracts");

  if (!fs.existsSync(buildDir)) {
    console.error(
      "❌ ERROR: build/contracts directory not found. Please compile contracts first.",
    );
    process.exit(1);
  }

  const flashLoanPath = path.join(buildDir, "FlashLoan.json");
  if (!fs.existsSync(flashLoanPath)) {
    console.error(
      "❌ ERROR: FlashLoan.json not found. Please compile the contracts first.",
    );
    process.exit(1);
  }

  console.log("✅ Found FlashLoan contract artifact");
  return require(flashLoanPath);
}

// Update the .env file with the new contract address
function updateEnvFile(contractAddress) {
  console.log("📝 Updating .env file with new contract address...");
  const envPath = path.resolve(__dirname, "../../.env");

  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  // Check if FLASH_LOAN_CONTRACT_ADDRESS is already in the file
  if (envContent.includes("FLASH_LOAN_CONTRACT_ADDRESS=")) {
    // Replace existing value
    envContent = envContent.replace(
      /FLASH_LOAN_CONTRACT_ADDRESS=.*/,
      `FLASH_LOAN_CONTRACT_ADDRESS=${contractAddress}`,
    );
  } else {
    // Add new variable
    envContent += `\nFLASH_LOAN_CONTRACT_ADDRESS=${contractAddress}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file updated successfully");
}

async function deployFlashLoan() {
  try {
    console.log("🚀 Starting FlashLoan contract deployment...");

    // Get the contract artifact
    const FlashLoanArtifact = getFlashLoanArtifact();

    // Get accounts from Ganache
    const accounts = await web3.eth.getAccounts();
    const deployerAccount = accounts[0]; // First account is typically the contract deployer
    console.log(`👤 Using deployer account: ${deployerAccount}`);

    // Create contract instance
    const flashLoanContract = new web3.eth.Contract(FlashLoanArtifact.abi);

    // Deploy the contract with the required constructor parameter
    console.log(
      `📦 Deploying FlashLoan contract with Aave Addresses Provider: ${AAVE_ADDRESSES_PROVIDER}`,
    );
    const deployTx = flashLoanContract.deploy({
      data: FlashLoanArtifact.bytecode,
      arguments: [AAVE_ADDRESSES_PROVIDER], // Pass the Aave Addresses Provider address
    });

    // Estimate gas
    let estimatedGas;
    try {
      estimatedGas = await deployTx.estimateGas({
        from: deployerAccount,
      });
      console.log(`⛽ Estimated gas for deployment: ${estimatedGas}`);
    } catch (error) {
      console.error("❌ ERROR: Gas estimation failed:", error.message);
      estimatedGas = 5000000; // Fallback to a reasonable estimate
      console.log(`⛽ Using fallback gas estimate: ${estimatedGas}`);
    }

    // Deploy with extra gas buffer
    console.log("🔄 Sending deployment transaction...");
    const deployedContract = await deployTx.send({
      from: deployerAccount,
      gas: Math.floor(estimatedGas * 1.2), // Add 20% buffer
    });

    const contractAddress = deployedContract.options.address;
    console.log(`✅ FlashLoan contract deployed at: ${contractAddress}`);

    // Check contract bytecode to verify deployment
    const deployedCode = await web3.eth.getCode(contractAddress);
    if (deployedCode === "0x" || deployedCode === "0x0") {
      console.error(
        "❌ ERROR: Contract deployment verification failed. No code at address.",
      );
      return { success: false };
    }

    // Update .env file with the new contract address
    updateEnvFile(contractAddress);

    // Check if owner is set properly
    try {
      console.log("👷 Checking if contract owner is set properly...");
      const owner = await deployedContract.methods.getOwner().call();
      console.log(`👤 Contract owner is set to: ${owner}`);
      if (owner.toLowerCase() !== deployerAccount.toLowerCase()) {
        console.warn(
          `⚠️ WARNING: Owner (${owner}) is not the deployer (${deployerAccount})`,
        );
      }
    } catch (error) {
      console.error("❌ ERROR checking contract owner:", error.message);
    }

    // Set up router approvals
    try {
      console.log("🔑 Setting up router approvals...");

      // Uniswap V2 Router
      const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
      console.log(`🔄 Approving Uniswap V2 Router (${uniswapRouter})`);
      await deployedContract.methods
        .setRouterApproval(uniswapRouter, true)
        .send({ from: deployerAccount, gas: 200000 });

      // SushiSwap Router
      const sushiswapRouter = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
      console.log(`🔄 Approving SushiSwap Router (${sushiswapRouter})`);
      await deployedContract.methods
        .setRouterApproval(sushiswapRouter, true)
        .send({ from: deployerAccount, gas: 200000 });

      console.log("✅ Router approvals set successfully");
    } catch (error) {
      console.error("❌ ERROR setting router approvals:", error.message);
    }

    console.log("🎉 FlashLoan contract deployment completed successfully!");
    console.log(`📌 Contract address: ${contractAddress}`);
    console.log(`💼 Owner account: ${deployerAccount}`);

    // Return the contract address and deployer for further processing
    return {
      contractAddress,
      deployerAccount,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in contract deployment:", error);
    return { success: false };
  }
}

// Execute if this script is run directly
if (require.main === module) {
  deployFlashLoan()
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { deployFlashLoan };
