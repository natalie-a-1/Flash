const FlashLoan = artifacts.require("FlashLoan");
const constants = require("../constants.json"); // Load addresses

/**
 * Deploys the FlashLoan contract and approves routers on supported networks.
 */
module.exports = async function (deployer, network, accounts) {
  // Only deploy on Sepolia, its dev forks, or Mainnet fork
  const supported = ["sepolia", "development_fork", "development", "mainnet_fork"];
  if (!supported.includes(network)) {
    console.log(`\nSkipping FlashLoan on network: ${network}`);
    return;
  }

  // Determine which set of addresses to use
  // USE MAINNET addresses if network is 'development' (local fork) or 'mainnet_fork'
  const env = (network === "development" || network === "mainnet_fork") ? "mainnet" : "sepolia";
  const { POOL_PROVIDER, UNISWAP_V2_ROUTER, SUSHISWAP_V2_ROUTER } = constants[env];

  console.log(`\nDeploying FlashLoan to ${network} (using ${env} addresses)`);
  console.log(`Pool Provider: ${POOL_PROVIDER}`);

  // Deploy contract
  await deployer.deploy(FlashLoan, POOL_PROVIDER);
  const flashLoanInstance = await FlashLoan.deployed();
  console.log(`FlashLoan contract deployed at: ${flashLoanInstance.address}`);

  // === REMOVED: Verify Pool Address ===
  /* try {
    console.log("Attempting to verify Pool address accessibility...");
    const poolAddress = await flashLoanInstance.verifyPoolAddressIsAccessible();
    console.log(`SUCCESS: Pool address verified and accessible: ${poolAddress}`);
  } catch (error) {
    console.error("ERROR: Failed to verify Pool address after deployment.");
    console.error("This likely means the ADDRESSES_PROVIDER is invalid or getPool() failed on the fork.");
    console.error(error);
    throw new Error("Pool verification failed"); // Halt migration
  } */
  // === END REMOVED ===

  // Approve routers
  console.log("Approving Uniswap and SushiSwap routers...");
  await flashLoanInstance.setRouterApproval(UNISWAP_V2_ROUTER, true);
  await flashLoanInstance.setRouterApproval(SUSHISWAP_V2_ROUTER, true);
  console.log("Router approval complete.");
};
