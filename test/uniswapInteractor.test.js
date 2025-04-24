// test/uniswapInteractor.test.js
const UniswapInteractor = artifacts.require("UniswapInteractor");
// const IERC20 = artifacts.require("IERC20"); // Use specific interface for WETH
const IWETH = artifacts.require("IWETH"); // Import the new WETH interface
const IERC20 = artifacts.require("IERC20"); // Keep for other tokens like USDC
const {
  BN,
  time,
  expectRevert,
  expectEvent,
} = require("@openzeppelin/test-helpers");
const truffleAssert = require("truffle-assertions"); // Using truffle-assertions for revert checks
const constants = require("../constants.json"); // Load addresses

// Load environment variables (optional, if addresses are stored there)
// require('dotenv').config();

// --- Sepolia Addresses from constants file ---
const {
  WETH: WETH_ADDRESS,
  USDC: USDC_ADDRESS,
  // Use the same Uniswap router as the main contract/test for consistency
  UNISWAP_V2_ROUTER: UNISWAP_ROUTER_ADDRESS,
} = constants.sepolia;

contract("UniswapInteractor (Forked Sepolia)", (accounts) => {
  let interactorInstance;
  let weth; // Will be IWETH instance now
  let usdc;
  const deployer = accounts[0]; // Assumes this account has ETH on the fork
  const recipient = accounts[1]; // User receiving the swapped tokens
  const fundingAccount = accounts[0]; // Account that holds tokens to fund the interactor contract

  // Define amounts, considering decimals
  const oneWeth = new BN(web3.utils.toWei("1", "ether"));
  const pointOneWeth = new BN(web3.utils.toWei("0.1", "ether"));
  const oneUsdc = new BN("1000000"); // 1 USDC with 6 decimals

  before(async () => {
    // Runs once before all tests
    const networkId = await web3.eth.net.getId();
    console.log(`   Testing on Network ID: ${networkId} (Expected fork)`);
    // Setup contract instances for tokens
    weth = await IWETH.at(WETH_ADDRESS);
    usdc = await IERC20.at(USDC_ADDRESS);
    // Optional: Log initial ETH balance of funding account for info
    const initialEthBalance = await web3.eth.getBalance(fundingAccount);
    console.log(
      `   Funding account ${fundingAccount} initial ETH balance: ${web3.utils.fromWei(initialEthBalance)} ETH`,
    );
    // Removed WETH wrapping logic from here - will be done in beforeEach
  });

  beforeEach(async () => {
    // Runs before each test case ("it" block)

    // Deploy a new interactor instance for isolation
    interactorInstance = await UniswapInteractor.new({ from: deployer });

    // --- Ensure Funding Account has WETH needed for this test's funding step ---
    const amountToFundWeth = oneWeth; // Amount needed to transfer to interactor in this hook
    try {
      let currentWethBalance = await weth.balanceOf(fundingAccount);
      console.log(
        `   [BeforeEach] Funding account WETH balance: ${web3.utils.fromWei(currentWethBalance)}`,
      );

      if (currentWethBalance.lt(amountToFundWeth)) {
        const wrapAmount = amountToFundWeth.sub(currentWethBalance);
        console.log(
          `   [BeforeEach] Insufficient WETH. Wrapping ${web3.utils.fromWei(wrapAmount)} ETH from ${fundingAccount} into WETH...`,
        );

        const ethBalance = await web3.eth.getBalance(fundingAccount);
        if (new BN(ethBalance).lt(wrapAmount)) {
          throw new Error(
            `Funding account ${fundingAccount} has insufficient ETH (${web3.utils.fromWei(ethBalance)}) to wrap ${web3.utils.fromWei(wrapAmount)} WETH.`,
          );
        }

        await weth.deposit({ from: fundingAccount, value: wrapAmount });
        currentWethBalance = await weth.balanceOf(fundingAccount);
        console.log(
          `   [BeforeEach] New Funding account WETH balance: ${web3.utils.fromWei(currentWethBalance)}`,
        );
        assert(
          currentWethBalance.gte(amountToFundWeth),
          "WETH balance is still insufficient after wrapping.",
        );
      }
    } catch (e) {
      console.error(
        `   [BeforeEach] ERROR during WETH balance check/wrap. Error: ${e.message}`,
      );
      throw e; // Fail setup if wrapping fails
    }

    // --- Fund the Interactor Contract Instance for the current test ---
    try {
      const balanceInteractorBefore = await weth.balanceOf(
        interactorInstance.address,
      );
      await weth.transfer(interactorInstance.address, amountToFundWeth, {
        from: fundingAccount,
      });
      const balanceInteractorAfter = await weth.balanceOf(
        interactorInstance.address,
      );
      console.log(
        `   [BeforeEach] Funded interactor ${interactorInstance.address} with ${web3.utils.fromWei(amountToFundWeth)} WETH`,
      );
      assert(
        new BN(balanceInteractorAfter)
          .sub(new BN(balanceInteractorBefore))
          .eq(amountToFundWeth),
        "Interactor WETH funding transfer failed",
      );
    } catch (e) {
      const currentWethBalance = await weth.balanceOf(fundingAccount);
      console.error(
        `   [BeforeEach] ERROR: Failed to fund interactor instance. Funding account WETH: ${web3.utils.fromWei(currentWethBalance)}. Error: ${e.message}`,
      );
      throw e;
    }
    // Optional: Fund with USDC if needed for specific tests
    // ...
  });

  it("should have correct Uniswap Router address set", async () => {
    const router = await interactorInstance.uniswapRouter();
    assert.equal(
      router.toLowerCase(),
      UNISWAP_ROUTER_ADDRESS.toLowerCase(),
      "Router address mismatch",
    );
  });

  it("should retrieve amounts out for WETH -> USDC", async () => {
    const amounts = await interactorInstance.getAmountsOut(
      WETH_ADDRESS,
      USDC_ADDRESS,
      pointOneWeth,
    );
    assert.isArray(amounts, "Amounts should be an array");
    assert.equal(amounts.length, 2, "Amounts array should have 2 elements");
    assert.equal(
      amounts[0].toString(),
      pointOneWeth.toString(),
      "Input amount in array mismatch",
    );
    console.log(
      `   0.1 WETH -> ${amounts[1].div(oneUsdc).toString()} USDC (approx)`,
    );
    assert(new BN(amounts[1]).gt(new BN(0)), "USDC output should be positive");
  });

  it("should swap WETH for USDC successfully", async () => {
    const amountIn = pointOneWeth; // Swap 0.1 WETH held by the contract
    const amountsOut = await interactorInstance.getAmountsOut(
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
    );
    const amountOutMin = new BN(amountsOut[1]).mul(new BN(99)).div(new BN(100)); // Tolerate 1% slippage
    const deadline = (await time.latest()).add(time.duration.minutes(10));

    const recipientUsdcBalanceBefore = await usdc.balanceOf(recipient);
    const interactorWethBalanceBefore = await weth.balanceOf(
      interactorInstance.address,
    );

    const tx = await interactorInstance.swapExactTokensForTokens(
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
      amountOutMin,
      recipient, // Send output to recipient account
      deadline,
      { from: deployer }, // Sender doesn't need approval, contract uses its own WETH
    );

    // Check event
    let swapEvent;
    truffleAssert.eventEmitted(tx, "SwapExecuted", (ev) => {
      swapEvent = ev;
      return (
        ev.tokenIn === WETH_ADDRESS &&
        ev.tokenOut === USDC_ADDRESS &&
        ev.amountIn.eq(amountIn)
      );
    });
    assert(
      new BN(swapEvent.amounts[1]).gte(amountOutMin),
      "Event output lower than calculated min",
    );

    // Check balances
    const recipientUsdcBalanceAfter = await usdc.balanceOf(recipient);
    const interactorWethBalanceAfter = await weth.balanceOf(
      interactorInstance.address,
    );
    const usdcReceived = new BN(recipientUsdcBalanceAfter).sub(
      new BN(recipientUsdcBalanceBefore),
    );

    console.log(
      `   Swapped ${web3.utils.fromWei(amountIn)} WETH for ${usdcReceived.div(oneUsdc).toString()} USDC`,
    );
    assert(
      usdcReceived.gte(amountOutMin),
      "Received USDC less than specified minimum",
    );
    assert(
      new BN(interactorWethBalanceBefore)
        .sub(new BN(interactorWethBalanceAfter))
        .eq(amountIn),
      "Interactor WETH balance did not decrease correctly",
    );
  });

  it("should revert swap if deadline expired", async () => {
    const amountIn = pointOneWeth;
    const amountsOut = await interactorInstance.getAmountsOut(
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
    );
    const amountOutMin = new BN(amountsOut[1]).mul(new BN(90)).div(new BN(100)); // 10% slippage okay
    const deadline = (await time.latest()).sub(time.duration.seconds(1)); // Deadline in the past

    await truffleAssert.reverts(
      interactorInstance.swapExactTokensForTokens(
        WETH_ADDRESS,
        USDC_ADDRESS,
        amountIn,
        amountOutMin,
        recipient,
        deadline,
        { from: deployer },
      ),
      "UniswapInteractor: EXPIRED_DEADLINE",
    );
  });

  it("should revert swap if minimum output not met (slippage too high)", async () => {
    const amountIn = pointOneWeth;
    const amountsOut = await interactorInstance.getAmountsOut(
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
    );
    // Set minimum output higher than the expected output
    const amountOutMin = new BN(amountsOut[1]).add(oneUsdc); // Expect at least 1 USDC more than predicted
    const deadline = (await time.latest()).add(time.duration.minutes(10));

    // We expect the transaction to revert. The revert reason might come from Uniswap
    // itself ("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT") or our contract's check.
    // truffle-assertions checks if the revert reason *includes* the provided string.
    await truffleAssert.reverts(
      interactorInstance.swapExactTokensForTokens(
        WETH_ADDRESS,
        USDC_ADDRESS,
        amountIn,
        amountOutMin,
        recipient,
        deadline,
        { from: deployer },
      ),
      "INSUFFICIENT_OUTPUT_AMOUNT", // Check for the core reason
    );
  });

  it("should revert swap with invalid input token", async () => {
    const amountIn = pointOneWeth;
    const amountOutMin = new BN(1); // Arbitrary small amount
    const deadline = (await time.latest()).add(time.duration.minutes(10));

    await truffleAssert.reverts(
      interactorInstance.swapExactTokensForTokens(
        "0x0000000000000000000000000000000000000000", // Zero address
        USDC_ADDRESS,
        amountIn,
        amountOutMin,
        recipient,
        deadline,
        { from: deployer },
      ),
      "UniswapInteractor: INVALID_INPUT_TOKEN",
    );
  });

  // Add more tests:
  // - Invalid output token address
  // - Zero input amount
  // - Invalid recipient address
  // - Swap USDC -> WETH (requires funding interactor with USDC first)
});
