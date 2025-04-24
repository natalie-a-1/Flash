const FlashLoan = artifacts.require("FlashLoan");
const constants = require("../constants.json"); // Load addresses

// Sepolia Addresses from constants file
const AAVE_POOL_PROVIDER_SEPOLIA = "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A"; // Aave provider address remains specific here for now
const { WETH, USDC, UNISWAP_V2_ROUTER, SUSHISWAP_V2_ROUTER } =
  constants.sepolia;

module.exports = function (deployer, network, accounts) {
  // Only deploy if the network is Sepolia or a development fork (which mimics Sepolia)
  // Add any other networks where this specific deployment makes sense
  if (
    network === "sepolia" ||
    network === "development_fork" ||
    network === "development"
  ) {
    console.log(`\nDeploying FlashLoan contract to network: ${network}`);
    console.log(
      `Using Aave Pool Provider (Sepolia): ${AAVE_POOL_PROVIDER_SEPOLIA}`,
    );
    console.log(`Using Uniswap Router (Sepolia): ${UNISWAP_V2_ROUTER}`);
    console.log(`Using SushiSwap Router (Sepolia): ${SUSHISWAP_V2_ROUTER}`);
    console.log(`Using USDC (Sepolia): ${USDC}`);
    console.log(`Using WETH (Sepolia): ${WETH}`);
    console.log(`Deployer account: ${accounts[0]}`);

    deployer
      .deploy(
        FlashLoan,
        AAVE_POOL_PROVIDER_SEPOLIA,
        UNISWAP_V2_ROUTER,
        SUSHISWAP_V2_ROUTER,
        USDC,
        WETH,
      )
      .then(() => {
        console.log(`FlashLoan contract deployed successfully to ${network}.`);
      })
      .catch((error) => {
        console.error(
          `Failed to deploy FlashLoan contract to ${network}:`,
          error,
        );
      });
  } else {
    console.log(
      `\nSkipping FlashLoan deployment on network: ${network} (intended for Sepolia/fork only)`,
    );
  }
};
