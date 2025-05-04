/**
 * @fileoverview
 * This script seeds a development account with USDC from a whale account on a local Mainnet fork (e.g., Ganache),
 * approves the Uniswap V2 router to spend the USDC, and then performs a swap on Uniswap V2
 * to intentionally skew the USDC/WETH price, making it higher than the price on SushiSwap V2.
 * Finally, it fetches and logs the reserves and calculated prices from both Uniswap V2 and SushiSwap V2
 * USDC/WETH pools to verify the price skew.
 *
 * @requires web3
 * @requires ../../constants.json - Contains contract addresses and other constants.
 * @requires ../../build/contracts/IERC20.json - ABI for ERC20 tokens.
 * @requires ../../build/contracts/IUniswapV2Router02.json - ABI for Uniswap V2 Router.
 * @requires ../../build/contracts/IUniswapV2Factory.json - ABI for Uniswap V2 Factory.
 * @requires ../../build/contracts/IUniswapV2Pair.json - ABI for Uniswap V2 Pair.
 * @requires dotenv - Requires USDC_WHALE_ADDRESS environment variable.
 */

const Web3 = require('web3');
const constants = require('../../constants.json');
const IERC20 = require('../../build/contracts/IERC20.json');
const IUniswapV2Router = require('../../build/contracts/IUniswapV2Router02.json');
const IUniswapV2Factory = require('../../build/contracts/IUniswapV2Factory.json'); // Moved up for clarity
const IUniswapV2Pair = require('../../build/contracts/IUniswapV2Pair.json'); // Moved up for clarity

/**
 * Main asynchronous function to execute the seeding and price skewing logic.
 * @async
 */
async function main() {
  // Initialize Web3 connected to the local development node.
  const web3 = new Web3('http://127.0.0.1:8545');

  // Add a small delay to allow the Ganache fork instance to fully initialize and stabilize.
  console.log('Waiting for Ganache fork to stabilize...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
  console.log('Proceeding with script...');

  // Fetch available accounts from the connected node.
  const accounts = await web3.eth.getAccounts();

  // Log the initial ETH balances of the first few accounts for debugging purposes.
  console.log('--- Initial Account Balances ---');
  for (let i = 0; i < Math.min(accounts.length, 3); i++) {
    const bal = await web3.eth.getBalance(accounts[i]);
    console.log(`Account ${i} (${accounts[i]}): ${web3.utils.fromWei(bal, 'ether')} ETH`);
  }
  console.log('-------------------------------');

  // Set the primary account ('me') for transactions.
  const me = accounts[0];
  // Define a fixed gas price for all transactions to ensure predictability in testing.
  const fixedGasPrice = web3.utils.toWei('20', 'gwei'); // Use a fixed gas price (e.g., 20 Gwei)

  // --- Section 1: Seed Development Account with USDC ---
  console.log('\n── 1) Seeding Dev Account with USDC ────────────────────────────');
  const USDC_ADDRESS = constants.mainnet.USDC; // Mainnet USDC contract address.
  const WETH_ADDRESS = constants.mainnet.WETH; // Define WETH here
  const whale = process.env.USDC_WHALE_ADDRESS; // Address holding a large amount of USDC.
  if (!whale) {
    throw new Error('Set USDC_WHALE_ADDRESS environment variable before running.');
  }
  console.log(`Using USDC Whale: ${whale}`);

  // Log the whale's initial ETH balance to ensure it can pay for gas.
  const initialWhaleEth = await web3.eth.getBalance(whale);
  console.log(`Initial Whale ETH Balance (${whale}): ${web3.utils.fromWei(initialWhaleEth, 'ether')} ETH`);

  // Create a contract instance for USDC.
  const usdc = new web3.eth.Contract(IERC20.abi, USDC_ADDRESS);
  // Log the whale's initial USDC balance.
  const balance = await usdc.methods.balanceOf(whale).call();
  console.log(`Whale USDC balance: ${web3.utils.fromWei(balance, 'mwei')} USDC`); // USDC has 6 decimals

  // Ensure the whale account has sufficient ETH (at least 0.1 ETH) to cover gas fees for the transfer.
  const whaleEthBalance = await web3.eth.getBalance(whale);
  if (web3.utils.toBN(whaleEthBalance).lt(web3.utils.toBN(web3.utils.toWei('0.1', 'ether')))) {
    console.log('Funding USDC whale with 0.1 ETH for gas...');
    const meEthBalanceCheck = await web3.eth.getBalance(me);
    console.log(`  (Sender [me] balance: ${web3.utils.fromWei(meEthBalanceCheck, 'ether')} ETH)`);
    // Send ETH from the 'me' account to the whale account.
    await web3.eth.sendTransaction({
      from: me,
      to: whale,
      value: web3.utils.toWei('0.1', 'ether'),
      gas: 50000, // Standard gas limit for ETH transfer
      gasPrice: fixedGasPrice
    });
    console.log('Whale funded.');
  }

  // Seed with a large amount to accommodate potentially large calculated swap
  const seedAmount = web3.utils.toBN('100000').mul(web3.utils.toBN('1000000')); // 100,000 USDC
  // Transfer USDC from the whale to the 'me' account.
  console.log(`Attempting to transfer ${web3.utils.fromWei(seedAmount, 'mwei')} USDC from whale to ${me}...`);
  await usdc.methods.transfer(me, seedAmount.toString())
    .send({ from: whale, gas: 200000, gasPrice: fixedGasPrice });
  console.log(`Successfully transferred ${web3.utils.fromWei(seedAmount, 'mwei')} USDC to ${me}`);
  const myUsdcBalance = await usdc.methods.balanceOf(me).call();
  console.log(`My new USDC balance: ${web3.utils.fromWei(myUsdcBalance, 'mwei')} USDC`);

  // --- Section 2: Approve Uniswap Router ---
  console.log('\n── 2) Approving Routers ─────────────────────────────────────────');
  const UNISWAP_ROUTER_ADDR = constants.mainnet.UNISWAP_V2_ROUTER;
  const SUSHISWAP_ROUTER_ADDR = constants.mainnet.SUSHISWAP_V2_ROUTER;
  const uniRouter = new web3.eth.Contract(IUniswapV2Router.abi, UNISWAP_ROUTER_ADDR);
  const sushiRouter = new web3.eth.Contract(IUniswapV2Router.abi, SUSHISWAP_ROUTER_ADDR);

  console.log(`Approving Uniswap Router (${UNISWAP_ROUTER_ADDR}) to spend ${web3.utils.fromWei(seedAmount, 'mwei')} USDC...`);
  await usdc.methods.approve(UNISWAP_ROUTER_ADDR, seedAmount.toString())
    .send({ from: me, gas: 100000, gasPrice: fixedGasPrice });
  console.log('Approved Uniswap Router to spend USDC.');

  console.log(`Approving Sushiswap Router (${SUSHISWAP_ROUTER_ADDR}) to spend ${web3.utils.fromWei(seedAmount, 'mwei')} USDC...`);
  await usdc.methods.approve(SUSHISWAP_ROUTER_ADDR, seedAmount.toString())
    .send({ from: me, gas: 100000, gasPrice: fixedGasPrice });
  console.log('Approved Sushiswap to spend USDC');

  // --- Section 3: Calculate & Execute Skewing Swaps ---
  console.log('\n── 3) Calculating and Executing Skewing Swaps ───────────────');
  const pathUsdcToWeth = [USDC_ADDRESS, WETH_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes

  // 3a) Calculate required Uniswap swap amount
  console.log('Calculating required Uniswap swap amount...');
  const uniFactoryAddress = web3.utils.toChecksumAddress(constants.mainnet.UNISWAP_V2_FACTORY);
  const uniFactory = new web3.eth.Contract(IUniswapV2Factory.abi, uniFactoryAddress);
  const uniPairAddress = await uniFactory.methods.getPair(USDC_ADDRESS, WETH_ADDRESS).call();
  const uniPool = new web3.eth.Contract(IUniswapV2Pair.abi, uniPairAddress);
  const initialUniReserves = await uniPool.methods.getReserves().call();
  const token0Uni = await uniPool.methods.token0().call();
  const [initialUsdcResUni_bn, initialWethResUni_bn] = token0Uni.toLowerCase() === USDC_ADDRESS.toLowerCase()
    ? [web3.utils.toBN(initialUniReserves.reserve0), web3.utils.toBN(initialUniReserves.reserve1)]
    : [web3.utils.toBN(initialUniReserves.reserve1), web3.utils.toBN(initialUniReserves.reserve0)];

  // Target reserve price (WETH per USDC, scaled 1e18) ~0.3% higher than frontend target
  // Target: 0.0005452 / (1 - 0.003) = 0.00054684052... -> scaled by 1e18 -> 546840521564694
  const targetReservePriceScaled_bn = web3.utils.toBN('546840521564694'); 
  let calculatedSkewAmountUSDC_bn = web3.utils.toBN('0'); // Initialize
  let currentGuessAmountUSDC_bn = web3.utils.toBN('1000').mul(web3.utils.toBN('1000000')); // Start guess: 1k USDC
  const maxIterations = 20; // Safety break
  const availableUsdcBalance_bn = web3.utils.toBN(await usdc.methods.balanceOf(me).call());

  for (let i = 0; i < maxIterations; i++) {
    console.log(`   Iteration ${i+1}: Testing swap amount ${web3.utils.fromWei(currentGuessAmountUSDC_bn, 'mwei')} USDC...`);

    let potentialAmount = currentGuessAmountUSDC_bn;
    let exceedsBalance = false;
    if (currentGuessAmountUSDC_bn.gte(availableUsdcBalance_bn)) {
         console.warn("   WARN: Test swap amount exceeds available balance. Simulating with max possible.");
         // Use slightly less than balance for simulation
         potentialAmount = availableUsdcBalance_bn.sub(web3.utils.toBN('1')); 
         exceedsBalance = true;
         if (potentialAmount.isNeg() || potentialAmount.isZero()) {
             console.error("   ERROR: Not enough balance to even simulate a swap.");
             calculatedSkewAmountUSDC_bn = web3.utils.toBN('0'); // Ensure it stays zero
             break;
         }
    }
    
    try {
      const simulatedAmountsOut = await uniRouter.methods.getAmountsOut(potentialAmount.toString(), pathUsdcToWeth).call();
      const simulatedWethOut_bn = web3.utils.toBN(simulatedAmountsOut[1]);

      // Calculate the reserves *after* this simulated swap
      const finalUsdcRes_bn = initialUsdcResUni_bn.add(potentialAmount);
      const finalWethRes_bn = initialWethResUni_bn.sub(simulatedWethOut_bn);

      if (finalUsdcRes_bn.isZero() || finalWethRes_bn.isZero() || finalWethRes_bn.isNeg()) {
          console.warn("   WARN: Simulated swap would drain pool or result in negative reserves. Stopping search.");
          calculatedSkewAmountUSDC_bn = (i > 0) ? lastSuccessfulGuess_bn : web3.utils.toBN('0'); // Use previous good guess if available
          break; 
      }
      const lastSuccessfulGuess_bn = potentialAmount; // Store the last amount that simulated successfully

      // Calculate the simulated price from final reserves
      const simulatedFinalPrice_bn = finalWethRes_bn.mul(web3.utils.toBN('1000000')).div(finalUsdcRes_bn);
      console.log(`   Simulated final reserve price: ${simulatedFinalPrice_bn.toString()}`);

      // Check if target met
      if (simulatedFinalPrice_bn.gt(targetReservePriceScaled_bn)) {
        console.log(`   Target reserve price met! Required amount approx: ${web3.utils.fromWei(potentialAmount, 'mwei')} USDC`);
        calculatedSkewAmountUSDC_bn = potentialAmount;
        break; // Found suitable amount
      }
       // If the simulation used max balance and STILL didn't meet the target, stop.
      if (exceedsBalance) {
          console.error("   Calculation stopped: Target price not met even when simulating with full available balance.");
          calculatedSkewAmountUSDC_bn = lastSuccessfulGuess_bn; // Use the max balance we simulated with
          console.warn(`   Proceeding with the largest possible amount: ${web3.utils.fromWei(calculatedSkewAmountUSDC_bn, 'mwei')} USDC`);
          break;
      }
      // Increase guess for next iteration (e.g., multiply by 1.5)
      currentGuessAmountUSDC_bn = currentGuessAmountUSDC_bn.mul(web3.utils.toBN(3)).div(web3.utils.toBN(2));
           
    } catch (e) {
         console.warn(`   WARN: Simulation error for ${web3.utils.fromWei(potentialAmount, 'mwei')} USDC:`, e.message);
         // If error occurs on first try, maybe target is impossible? 
         if (i === 0) {
            console.error("   Simulation failed on first iteration. Target might be unfeasible.");
            calculatedSkewAmountUSDC_bn = web3.utils.toBN('0');
            break;
         } 
         // Otherwise, maybe the step was too large, try smaller increment or stop?
         // For now, let's just stop and use the last successful guess.
         console.error("   Stopping calculation due to simulation error.");
         calculatedSkewAmountUSDC_bn = lastSuccessfulGuess_bn || web3.utils.toBN('0'); 
         break;
    }

    if (i === maxIterations - 1) {
      console.error("Calculation failed: Max iterations reached without meeting target price.");
      calculatedSkewAmountUSDC_bn = lastSuccessfulGuess_bn; // Use the last successful guess
      console.warn(`Proceeding with the largest tested amount: ${web3.utils.fromWei(calculatedSkewAmountUSDC_bn, 'mwei')} USDC`);
    }
  }

  if (calculatedSkewAmountUSDC_bn.isZero()) {
      console.error("Could not determine a valid swap amount. Exiting without swapping.");
      // Exit here instead of proceeding with a zero swap
      process.exit(1); 
  }

  // 3b) Execute Uniswap Swap with calculated amount
  console.log(`Executing Uniswap swap with calculated amount: ${web3.utils.fromWei(calculatedSkewAmountUSDC_bn, 'mwei')} USDC...`);
  await uniRouter.methods.swapExactTokensForTokens(
    calculatedSkewAmountUSDC_bn.toString(),
    '0', // Accept any amount of WETH output (slippage not controlled here)
    pathUsdcToWeth,
    me,
    deadline
  ).send({ from: me, gas: 300000, gasPrice: fixedGasPrice });
  console.log(`Step 1: Swapped calculated USDC → WETH on Uniswap`);

  // 3c) Execute Sushiswap Swap (Still using 5000 USDC)
  const skewAmountSushi_bn = web3.utils.toBN('5000').mul(web3.utils.toBN('1000000')); // 5k USDC
  // Check if remaining balance is enough for Sushi swap
  const currentUsdcBalance_bn = web3.utils.toBN(await usdc.methods.balanceOf(me).call());
  if (currentUsdcBalance_bn.gte(skewAmountSushi_bn)) {
      console.log(`Executing Sushiswap swap with ${web3.utils.fromWei(skewAmountSushi_bn, 'mwei')} USDC...`);
      await sushiRouter.methods.swapExactTokensForTokens(
        skewAmountSushi_bn.toString(),
        '0',
        pathUsdcToWeth,
        me,
        deadline
      ).send({ from: me, gas: 300000, gasPrice: fixedGasPrice });
      console.log(`Step 2: Swapped ${web3.utils.fromWei(skewAmountSushi_bn, 'mwei')} USDC → WETH on Sushiswap`);
  } else {
      console.warn(`Skipping Sushiswap swap: Insufficient USDC balance (${web3.utils.fromWei(currentUsdcBalance_bn,'mwei')}) after Uniswap swap.`);
  }

  // --- Section 4: Log Resulting Prices (Using Router) ---
  console.log('\n── 4) Logging Resulting Pool Prices (via Router) ────────────');
  const priceQueryAmountIn = web3.utils.toBN('1').mul(web3.utils.toBN('1000000')); // 1 USDC
  const pathForPrice = [USDC_ADDRESS, WETH_ADDRESS];

  console.log('Fetching final price from Uniswap Router...');
  const uniAmountsOut = await uniRouter.methods.getAmountsOut(
      priceQueryAmountIn.toString(),
      pathForPrice
  ).call();
  const uniPriceFromRouter = web3.utils.toBN(uniAmountsOut[1]);

  console.log('Fetching final price from Sushiswap Router...');
  const sushiAmountsOut = await sushiRouter.methods.getAmountsOut(
      priceQueryAmountIn.toString(),
      pathForPrice
  ).call();
  const sushiPriceFromRouter = web3.utils.toBN(sushiAmountsOut[1]);

  console.log('--- Final Calculated Pool Prices (via Router) ---');
  console.log(`Uniswap   WETH per 1 USDC (scaled 1e18): ${uniPriceFromRouter.toString()}`);
  console.log(`SushiSwap WETH per 1 USDC (scaled 1e18): ${sushiPriceFromRouter.toString()}`);
  console.log('-----------------------------------------------');

  // Final Verification
  const isSkewed = uniPriceFromRouter.gt(sushiPriceFromRouter);
  const targetPrice = web3.utils.toBN('545200000000000'); // Target: 0.0005452 * 1e18
  const meetsTarget = uniPriceFromRouter.gt(targetPrice);

  console.log(`✅ Price successfully skewed? (Uniswap > Sushi): ${isSkewed}`);
  console.log(`🎯 Met Target? (Uniswap > 0.0005452): ${meetsTarget}`);

  if (!meetsTarget) {
      console.error("Target price not met.");
  } else {
      console.log("🎉 Target price successfully met!");
  }
}

// Execute the main function and catch any errors.
main().catch(err => {
  console.error("Script failed with error:", err);
  process.exit(1); // Exit with a non-zero code to indicate failure.
});
