/**
 * @fileoverview
 * Skews the price of the Uniswap V2 USDC/WETH pool on a local Mainnet fork
 * by performing a large USDC to WETH swap.
 * Assumes the executing account (accounts[0]) has sufficient USDC and has approved the Uniswap V2 router.
 *
 * @requires web3
 * @requires ../../constants.json
 * @requires ../../build/contracts/IERC20.json
 * @requires ../../build/contracts/IUniswapV2Router02.json
 */

// Load environment variables from the root .env file (if needed by the script later)
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const Web3 = require("web3");
const constants = require("../../constants.json");
const IERC20 = require("../../build/contracts/IERC20.json");
const IUniswapV2Router = require("../../build/contracts/IUniswapV2Router02.json");

async function skewPrices() {
  console.log(
    "\n── Running Price Skewing Script ─────────────────────────────",
  );
  const web3 = new Web3("http://127.0.0.1:8545");

  console.log("Waiting for Ganache fork to stabilize...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("Proceeding...");

  const accounts = await web3.eth.getAccounts();
  if (accounts.length === 0) {
    throw new Error("No accounts found. Ensure Ganache fork is running.");
  }
  const me = accounts[0];
  const fixedGasPrice = web3.utils.toWei("20", "gwei");

  console.log(`Executing account (me): ${me}`);

  // --- Contract Instances and Addresses ---
  const USDC_ADDRESS = constants.mainnet.USDC;
  const WETH_ADDRESS = constants.mainnet.WETH;
  const UNISWAP_ROUTER_ADDR = constants.mainnet.UNISWAP_V2_ROUTER;
  const SUSHISWAP_ROUTER_ADDR = constants.mainnet.SUSHISWAP_V2_ROUTER; // Needed for comparison

  const usdc = new web3.eth.Contract(IERC20.abi, USDC_ADDRESS);
  const uniRouter = new web3.eth.Contract(
    IUniswapV2Router.abi,
    UNISWAP_ROUTER_ADDR,
  );
  const sushiRouter = new web3.eth.Contract(
    IUniswapV2Router.abi,
    SUSHISWAP_ROUTER_ADDR,
  );

  // --- Execute Skewing Swap on Uniswap V2 ---
  console.log("\n── 1) Executing Skewing Swap on Uniswap V2 ─────");
  const skewAmountUSDC = web3.utils
    .toBN("50000")
    .mul(web3.utils.toBN("1000000")); // 50,000 USDC
  const pathUsdcToWeth = [USDC_ADDRESS, WETH_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes

  // Check balance before swap
  const myUsdcBalance_bn = web3.utils.toBN(
    await usdc.methods.balanceOf(me).call(),
  );
  console.log(
    `My current USDC balance: ${web3.utils.fromWei(myUsdcBalance_bn, "mwei")} USDC`,
  );

  if (myUsdcBalance_bn.lt(skewAmountUSDC)) {
    throw new Error(
      `Insufficient USDC balance to perform skew. Need ${web3.utils.fromWei(skewAmountUSDC, "mwei")}, have ${web3.utils.fromWei(myUsdcBalance_bn, "mwei")}. Run seed script first?`,
    );
  }

  console.log(
    `Executing Uniswap swap with ${web3.utils.fromWei(skewAmountUSDC, "mwei")} USDC...`,
  );
  try {
    await uniRouter.methods
      .swapExactTokensForTokens(
        skewAmountUSDC.toString(),
        "0", // Accept any amount of WETH output
        pathUsdcToWeth,
        me,
        deadline,
      )
      .send({ from: me, gas: 300000, gasPrice: fixedGasPrice });
    console.log(
      `Swapped ${web3.utils.fromWei(skewAmountUSDC, "mwei")} USDC → WETH on Uniswap`,
    );
  } catch (swapError) {
    console.error("Uniswap swap failed:", swapError);
    throw new Error(`Uniswap skewing swap failed. Check approval and balance.`);
  }

  // --- Log Resulting Prices ---
  console.log("\n── 2) Logging Resulting Pool Prices ────────────");
  const priceQueryAmountIn = web3.utils
    .toBN("1")
    .mul(web3.utils.toBN("1000000")); // 1 USDC

  try {
    console.log("Fetching final price from Uniswap Router...");
    const uniAmountsOut = await uniRouter.methods
      .getAmountsOut(priceQueryAmountIn.toString(), pathUsdcToWeth)
      .call();
    const uniPriceFromRouter = web3.utils.toBN(uniAmountsOut[1]);

    console.log("Fetching final price from Sushiswap Router...");
    const sushiAmountsOut = await sushiRouter.methods
      .getAmountsOut(priceQueryAmountIn.toString(), pathUsdcToWeth)
      .call();
    const sushiPriceFromRouter = web3.utils.toBN(sushiAmountsOut[1]);

    console.log(
      "--- Final Calculated Pool Prices (WETH per 1 USDC, scaled 1e18) ---",
    );
    console.log(`Uniswap V2: ${uniPriceFromRouter.toString()}`);
    console.log(`SushiSwap V2: ${sushiPriceFromRouter.toString()}`);
    console.log(
      "------------------------------------------------------------------",
    );

    if (uniPriceFromRouter.gt(sushiPriceFromRouter)) {
      console.log(
        "✅ Price successfully skewed! (Uniswap WETH/USDC > SushiSwap WETH/USDC)",
      );
    } else {
      console.warn(
        "⚠️ Price skew might not be significant or might be reversed.",
      );
    }
  } catch (priceError) {
    console.error("Error fetching final prices:", priceError);
  }

  console.log("\n✅ Skewing Script Complete.");
}

skewPrices().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
