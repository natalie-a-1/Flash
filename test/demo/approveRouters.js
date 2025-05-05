/**
 * Router Approval Script for Flash Loan Contract
 * 
 * This script automatically approves the Uniswap V2 and SushiSwap routers
 * for use with the Flash Loan contract after restarting a Ganache fork.
 */

require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Constants - these are the mainnet addresses 
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const SUSHISWAP_V2_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";

// Connect to local Ganache
const web3 = new Web3('http://localhost:8545');

// Find the correct contract artifact
function findContractArtifact() {
  console.log('🔍 Scanning for correct contract artifact...');
  const buildDir = path.resolve(__dirname, '../../build/contracts');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ ERROR: build/contracts directory not found. Please compile contracts first.');
    process.exit(1);
  }
  
  // List all contract artifacts
  const files = fs.readdirSync(buildDir);
  console.log(`📋 Found ${files.length} contract artifacts in build directory`);
  
  // Try these contract names in order of likelihood
  const possibleNames = ['FlashLoan.json', 'FlashLoanContract.json', 'FlashLoanReceiver.json'];
  
  // First try the most likely names
  for (const name of possibleNames) {
    if (files.includes(name)) {
      console.log(`✅ Found contract artifact: ${name}`);
      return require(path.join(buildDir, name));
    }
  }
  
  // If not found, try to detect by checking each contract for the approvedRouters method
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    try {
      const artifact = require(path.join(buildDir, file));
      
      // Check if contract has approvedRouters or setRouterApproval methods
      const hasApprovedRouters = artifact.abi.some(
        item => item.name === 'approvedRouters' && item.type === 'function'
      );
      
      const hasSetRouterApproval = artifact.abi.some(
        item => item.name === 'setRouterApproval' && item.type === 'function'
      );
      
      if (hasApprovedRouters && hasSetRouterApproval) {
        console.log(`✅ Found matching contract by method signature: ${file}`);
        return artifact;
      }
    } catch (err) {
      console.log(`⚠️ Error reading ${file}: ${err.message}`);
      continue;
    }
  }
  
  console.error('❌ ERROR: Could not find appropriate contract artifact with router approval methods.');
  process.exit(1);
}

// Find deployed contract address
async function findDeployedContractAddress(FlashLoanArtifact) {
  console.log('🔍 Looking for deployed contract address...');
  
  // Try environment variable first
  const envAddress = process.env.FLASH_LOAN_CONTRACT_ADDRESS;
  if (envAddress) {
    console.log(`📌 Using contract address from environment variable: ${envAddress}`);
    return envAddress;
  }
  
  // Try to find the contract from deployment artifacts
  try {
    const networkId = await web3.eth.net.getId();
    console.log(`🌐 Connected to network with ID: ${networkId}`);
    
    const deployedNetwork = FlashLoanArtifact.networks[networkId];
    if (deployedNetwork && deployedNetwork.address) {
      console.log(`📌 Found contract address from deployment artifacts: ${deployedNetwork.address}`);
      return deployedNetwork.address;
    }
  } catch (error) {
    console.error('⚠️ Error getting network or checking artifact:', error.message);
  }
  
  // Fallback to hardcoded address
  const hardcodedAddress = "0xF9a393Baab3C575c2B31166636082AB58a3dae62";
  console.log(`📌 Using hardcoded contract address: ${hardcodedAddress}`);
  return hardcodedAddress;
}

// Test contract connection
async function testContractConnection(contractInstance) {
  console.log('🧪 Testing contract connection...');
  
  try {
    // Try to get the contract code at this address
    const code = await web3.eth.getCode(contractInstance.options.address);
    if (code === '0x' || code === '0x0') {
      console.error('❌ ERROR: No contract found at address:', contractInstance.options.address);
      return false;
    }
    
    console.log(`✅ Contract code exists at ${contractInstance.options.address}`);
    return true;
  } catch (error) {
    console.error('❌ ERROR: Failed to get contract code:', error.message);
    return false;
  }
}

// Verify contract methods
async function verifyContractMethods(contractInstance) {
  console.log('🔍 Verifying contract methods...');
  
  // Log all methods
  const methods = contractInstance.methods;
  console.log('📝 Available contract methods:');
  Object.keys(methods).forEach(method => {
    if (typeof methods[method] === 'function' && !method.startsWith('0x')) {
      console.log(`  - ${method}`);
    }
  });
  
  // Check required methods
  const requiredMethods = ['getOwner', 'approvedRouters', 'setRouterApproval'];
  for (const method of requiredMethods) {
    if (!methods[method]) {
      console.error(`❌ ERROR: Required method '${method}' not found on contract`);
      return false;
    }
  }
  
  console.log('✅ All required methods are available on the contract');
  return true;
}

// Try to test each method separately
async function testGetOwner(contractInstance) {
  try {
    console.log('🧪 Testing getOwner() method...');
    const owner = await contractInstance.methods.getOwner().call();
    console.log(`✅ getOwner() succeeded! Owner: ${owner}`);
    return owner;
  } catch (error) {
    console.error('❌ ERROR: getOwner() call failed:', error.message);
    
    // Try alternative owner retrieval methods
    try {
      console.log('🔄 Trying alternative owner() method...');
      const altOwner = await contractInstance.methods.owner().call();
      console.log(`✅ owner() succeeded! Owner: ${altOwner}`);
      return altOwner;
    } catch (altError) {
      console.error('❌ ERROR: owner() call also failed:', altError.message);
    }
    
    return null;
  }
}

async function testRouterApproval(contractInstance, routerAddress) {
  try {
    console.log(`🧪 Testing approvedRouters(${routerAddress.substring(0, 10)}...) method...`);
    const isApproved = await contractInstance.methods.approvedRouters(routerAddress).call();
    console.log(`✅ approvedRouters() call succeeded! Approved: ${isApproved}`);
    return true;
  } catch (error) {
    console.error('❌ ERROR: approvedRouters() call failed:', error.message);
    
    // Try alternative method
    try {
      console.log('🔄 Trying alternative isRouterApproved method...');
      const isApproved = await contractInstance.methods.isRouterApproved(routerAddress).call();
      console.log(`✅ isRouterApproved() call succeeded! Approved: ${isApproved}`);
      return true;
    } catch (altError) {
      console.error('❌ ERROR: isRouterApproved() call also failed:', altError.message);
      return false;
    }
  }
}

async function approveRouters() {
  try {
    console.log('📊 Starting router approval script...');
    
    // Get the correct contract artifact
    const FlashLoanArtifact = findContractArtifact();
    
    // Get accounts from Ganache
    const accounts = await web3.eth.getAccounts();
    const deployerAccount = accounts[0]; // First account is typically the contract deployer
    console.log(`👤 Using deployer account: ${deployerAccount}`);
    
    // Get the contract address
    const contractAddress = await findDeployedContractAddress(FlashLoanArtifact);
    
    // Connect to the Flash Loan contract
    console.log(`🔗 Connecting to Flash Loan contract at ${contractAddress}`);
    const flashLoanContract = new web3.eth.Contract(
      FlashLoanArtifact.abi,
      contractAddress
    );
    
    // Test the contract connection
    const connectionValid = await testContractConnection(flashLoanContract);
    if (!connectionValid) {
      console.error('❌ ERROR: Cannot proceed due to contract connection issues.');
      return false;
    }
    
    // Verify contract methods
    const methodsValid = await verifyContractMethods(flashLoanContract);
    if (!methodsValid) {
      console.error('❌ ERROR: Cannot proceed due to missing contract methods.');
      return false;
    }
    
    // Test the getOwner method
    const contractOwner = await testGetOwner(flashLoanContract);
    if (!contractOwner) {
      console.error('❌ ERROR: Cannot retrieve contract owner, approvals will not work.');
      return false;
    }
    
    // Check if deployer is the owner
    if (contractOwner.toLowerCase() !== deployerAccount.toLowerCase()) {
      console.error(`❌ ERROR: The account ${deployerAccount} is not the contract owner!`);
      console.error(`❌ Only the contract owner ${contractOwner} can approve routers.`);
      console.error('❌ Make sure the contract deployer account is available in your Ganache instance.');
      
      // Try to suggest an account to use
      if (accounts.some(acc => acc.toLowerCase() === contractOwner.toLowerCase())) {
        const ownerIndex = accounts.findIndex(acc => acc.toLowerCase() === contractOwner.toLowerCase());
        console.log(`💡 TIP: Use account #${ownerIndex} (${contractOwner}) for approval instead.`);
      } else {
        console.log(`💡 TIP: Add the owner address to Ganache's unlocked accounts.`);
      }
      
      return false;
    }
    
    // Test router approval method
    const canCallApproval = await testRouterApproval(flashLoanContract, UNISWAP_V2_ROUTER);
    if (!canCallApproval) {
      console.error('❌ ERROR: Cannot check router approval status.');
      return false;
    }
    
    // Check current approval status
    console.log('🔍 Checking current router approvals...');
    let methodToUse = 'approvedRouters';
    
    try {
      const uniApproved = await flashLoanContract.methods[methodToUse](UNISWAP_V2_ROUTER).call();
      const sushiApproved = await flashLoanContract.methods[methodToUse](SUSHISWAP_V2_ROUTER).call();
      
      console.log(`📝 Current status: Uniswap V2 Router approved: ${uniApproved}, SushiSwap Router approved: ${sushiApproved}`);
      
      // Approve routers if needed
      if (!uniApproved) {
        console.log('🔄 Approving Uniswap V2 Router...');
        const tx = await flashLoanContract.methods.setRouterApproval(UNISWAP_V2_ROUTER, true)
          .send({ from: deployerAccount, gas: 200000 });
        console.log('✅ Uniswap V2 Router approved successfully!', tx.transactionHash);
      } else {
        console.log('✅ Uniswap V2 Router already approved.');
      }
      
      if (!sushiApproved) {
        console.log('🔄 Approving SushiSwap Router...');
        const tx = await flashLoanContract.methods.setRouterApproval(SUSHISWAP_V2_ROUTER, true)
          .send({ from: deployerAccount, gas: 200000 });
        console.log('✅ SushiSwap Router approved successfully!', tx.transactionHash);
      } else {
        console.log('✅ SushiSwap Router already approved.');
      }
      
      // Verify the approvals
      const uniApprovedAfter = await flashLoanContract.methods[methodToUse](UNISWAP_V2_ROUTER).call();
      const sushiApprovedAfter = await flashLoanContract.methods[methodToUse](SUSHISWAP_V2_ROUTER).call();
      
      console.log(`\n📝 Final status: Uniswap V2 Router approved: ${uniApprovedAfter}, SushiSwap Router approved: ${sushiApprovedAfter}`);
      
      if (uniApprovedAfter && sushiApprovedAfter) {
        console.log('🎉 Router approval script completed successfully!');
        return true;
      } else {
        console.error('❌ Some routers could not be approved.');
        return false;
      }
    } catch (error) {
      console.error(`❌ ERROR: Failed to perform router approvals:`, error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error in router approval script:', error);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  approveRouters()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { approveRouters }; 