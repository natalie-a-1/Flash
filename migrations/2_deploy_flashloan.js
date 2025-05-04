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
  const instance = await FlashLoan.deployed();

  // Approve routers
  console.log("Approving Uniswap and SushiSwap routers...");
  await instance.setRouterApproval(UNISWAP_V2_ROUTER, true);
  await instance.setRouterApproval(SUSHISWAP_V2_ROUTER, true);
  console.log("Router approval complete.");
};
