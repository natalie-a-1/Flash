const FlashLoan = artifacts.require("FlashLoan");

// Sepolia Addresses
const AAVE_POOL_PROVIDER_SEPOLIA = "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A";
const UNISWAP_V2_ROUTER_SEPOLIA = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
const SUSHISWAP_V2_ROUTER_SEPOLIA = "0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791";
const USDC_SEPOLIA = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
const WETH_SEPOLIA = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

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
    console.log(
      `Using Uniswap Router (Sepolia): ${UNISWAP_V2_ROUTER_SEPOLIA}`
    );
    console.log(
      `Using SushiSwap Router (Sepolia): ${SUSHISWAP_V2_ROUTER_SEPOLIA}`
    );
    console.log(`Using USDC (Sepolia): ${USDC_SEPOLIA}`);
    console.log(`Using WETH (Sepolia): ${WETH_SEPOLIA}`);
    console.log(`Deployer account: ${accounts[0]}`);

    deployer
      .deploy(
        FlashLoan, 
        AAVE_POOL_PROVIDER_SEPOLIA, 
        UNISWAP_V2_ROUTER_SEPOLIA, 
        SUSHISWAP_V2_ROUTER_SEPOLIA,
        USDC_SEPOLIA,
        WETH_SEPOLIA
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
