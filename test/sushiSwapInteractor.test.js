// test/sushiSwapInteractor.test.js
const SushiSwapInteractor = artifacts.require("SushiSwapInteractor"); // Use the new contract
const IWETH = artifacts.require("IWETH");
const IERC20 = artifacts.require("IERC20");
const {
  BN,
  time,
  expectRevert,
  expectEvent,
} = require("@openzeppelin/test-helpers");
const truffleAssert = require("truffle-assertions");

// Sepolia Addresses (ensure these are correct)
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // 6 decimals
const SUSHISWAP_ROUTER_ADDRESS = "0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791"; // Sepolia SushiSwap V2 Router

contract("SushiSwapInteractor (Forked Sepolia)", (accounts) => {
  let interactorInstance;
  let weth;
  let usdc;
  const deployer = accounts[0];
  const recipient = accounts[1];
  const fundingAccount = accounts[0];

  const oneWeth = new BN(web3.utils.toWei("1", "ether"));
  const pointOneWeth = new BN(web3.utils.toWei("0.1", "ether"));
  const oneUsdc = new BN("1000000");

  before(async () => {
    const networkId = await web3.eth.net.getId();
    console.log(
      `   Testing SushiSwap on Network ID: ${networkId} (Expected fork)`,
    );
    weth = await IWETH.at(WETH_ADDRESS);
    usdc = await IERC20.at(USDC_ADDRESS);
    const initialEthBalance = await web3.eth.getBalance(fundingAccount);
    console.log(
      `   Funding account ${fundingAccount} initial ETH balance: ${web3.utils.fromWei(initialEthBalance)} ETH`,
    );
  });

  beforeEach(async () => {
    // Deploy a new SushiSwap interactor instance
    interactorInstance = await SushiSwapInteractor.new({ from: deployer });

    // --- Ensure Funding Account has WETH ---
    const amountToFundWeth = oneWeth;
    try {
      let currentWethBalance = await weth.balanceOf(fundingAccount);
      console.log(
        `   [BeforeEach] Funding account WETH balance: ${web3.utils.fromWei(currentWethBalance)}`,
      );
      if (currentWethBalance.lt(amountToFundWeth)) {
        const wrapAmount = amountToFundWeth.sub(currentWethBalance);
        console.log(
          `   [BeforeEach] Insufficient WETH. Wrapping ${web3.utils.fromWei(wrapAmount)} ETH...`,
        );
        const ethBalance = await web3.eth.getBalance(fundingAccount);
        if (new BN(ethBalance).lt(wrapAmount)) {
          throw new Error(
            `Funding account ${fundingAccount} has insufficient ETH to wrap ${web3.utils.fromWei(wrapAmount)} WETH.`,
          );
        }
        await weth.deposit({ from: fundingAccount, value: wrapAmount });
        currentWethBalance = await weth.balanceOf(fundingAccount);
        console.log(
          `   [BeforeEach] New Funding account WETH balance: ${web3.utils.fromWei(currentWethBalance)}`,
        );
        assert(
          currentWethBalance.gte(amountToFundWeth),
          "WETH balance insufficient after wrap.",
        );
      }
    } catch (e) {
      console.error(
        `   [BeforeEach] ERROR during WETH check/wrap: ${e.message}`,
      );
      throw e;
    }

    // --- Fund the Interactor Contract Instance ---
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
        `   [BeforeEach] Funded Sushi interactor ${interactorInstance.address} with ${web3.utils.fromWei(amountToFundWeth)} WETH`,
      );
      assert(
        new BN(balanceInteractorAfter)
          .sub(new BN(balanceInteractorBefore))
          .eq(amountToFundWeth),
        "Interactor WETH funding failed",
      );
    } catch (e) {
      console.error(`   [BeforeEach] ERROR funding interactor: ${e.message}`);
      throw e;
    }
  });

  it("should have correct SushiSwap Router address set", async () => {
    const router = await interactorInstance.sushiRouter(); // Check the correct variable
    assert.equal(
      router.toLowerCase(),
      SUSHISWAP_ROUTER_ADDRESS.toLowerCase(),
      "SushiSwap Router address mismatch",
    );
  });

  it("should retrieve amounts out for WETH -> USDC via SushiSwap", async () => {
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
      "Input amount mismatch",
    );
    console.log(
      `   SushiSwap: 0.1 WETH -> ${amounts[1].div(oneUsdc).toString()} USDC (approx)`,
    );
    assert(new BN(amounts[1]).gt(new BN(0)), "USDC output should be positive");
  });

  it("should swap WETH for USDC successfully via SushiSwap", async () => {
    const amountIn = pointOneWeth;
    const amountsOut = await interactorInstance.getAmountsOut(
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
    );
    const amountOutMin = new BN(amountsOut[1]).mul(new BN(99)).div(new BN(100)); // 1% slippage
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
      recipient,
      deadline,
      { from: deployer },
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
      "Event output lower than calc min",
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
      `   SushiSwap: Swapped ${web3.utils.fromWei(amountIn)} WETH for ${usdcReceived.div(oneUsdc).toString()} USDC`,
    );
    assert(usdcReceived.gte(amountOutMin), "Received USDC less than min");
    assert(
      new BN(interactorWethBalanceBefore)
        .sub(new BN(interactorWethBalanceAfter))
        .eq(amountIn),
      "Interactor WETH balance decrease incorrect",
    );
  });

  it("should revert swap via SushiSwap if deadline expired", async () => {
    const amountIn = pointOneWeth;
    const amountsOut = await interactorInstance.getAmountsOut(
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
    );
    const amountOutMin = new BN(amountsOut[1]).mul(new BN(90)).div(new BN(100));
    const deadline = (await time.latest()).sub(time.duration.seconds(1)); // Past deadline

    await expectRevert.unspecified(
      interactorInstance.swapExactTokensForTokens(
        WETH_ADDRESS,
        USDC_ADDRESS,
        amountIn,
        amountOutMin,
        recipient,
        deadline,
        { from: deployer },
      ),
    );
  });

  it("should revert swap via SushiSwap if minimum output not met", async () => {
    const amountIn = pointOneWeth;
    const amountsOut = await interactorInstance.getAmountsOut(
      WETH_ADDRESS,
      USDC_ADDRESS,
      amountIn,
    );
    // Set minimum ridiculously high
    const amountOutMin = new BN(amountsOut[1])
      .mul(new BN(110))
      .div(new BN(100)); // Require 10% MORE
    const deadline = (await time.latest()).add(time.duration.minutes(10));

    await expectRevert.unspecified(
      interactorInstance.swapExactTokensForTokens(
        WETH_ADDRESS,
        USDC_ADDRESS,
        amountIn,
        amountOutMin,
        recipient,
        deadline,
        { from: deployer },
      ),
    );
  });

  it("should revert swap via SushiSwap if contract balance insufficient", async () => {
    const amountIn = oneWeth.add(new BN(1)); // Try to swap more WETH than contract holds
    const amountOutMin = new BN(1); // Min output doesn't matter here
    const deadline = (await time.latest()).add(time.duration.minutes(10));

    await expectRevert.unspecified(
      interactorInstance.swapExactTokensForTokens(
        WETH_ADDRESS,
        USDC_ADDRESS,
        amountIn,
        amountOutMin,
        recipient,
        deadline,
        { from: deployer },
      ),
    );
  });

  it("should revert swap via SushiSwap if called by non-owner", async () => {
    const amountIn = pointOneWeth;
    const amountOutMin = new BN(1);
    const deadline = (await time.latest()).add(time.duration.minutes(10));

    // Use expectRevert for Ownable errors as they are standard
    await expectRevert.unspecified(
      interactorInstance.swapExactTokensForTokens(
        WETH_ADDRESS,
        USDC_ADDRESS,
        amountIn,
        amountOutMin,
        recipient,
        deadline,
        { from: recipient }, // Called by non-owner
      ),
    );
  });

  // --- Add tests for withdraw functions ---
  it("should allow owner to withdraw WETH from SushiSwap interactor", async () => {
    const contractOwner = await interactorInstance.owner(); // Fetch owner inside test
    const interactorBalanceBefore = await weth.balanceOf(
      interactorInstance.address,
    );
    const ownerBalanceBefore = await weth.balanceOf(contractOwner); // Use fetched owner
    assert(
      interactorBalanceBefore.gt(new BN(0)),
      "Interactor should have WETH to withdraw",
    );

    // Withdraw full balance (amount = 0)
    await interactorInstance.withdrawToken(WETH_ADDRESS, 0, {
      from: contractOwner,
    }); // Use fetched owner

    const interactorBalanceAfter = await weth.balanceOf(
      interactorInstance.address,
    );
    const ownerBalanceAfter = await weth.balanceOf(contractOwner); // Use fetched owner

    assert(
      interactorBalanceAfter.isZero(),
      "Interactor balance should be zero",
    );
    assert(
      ownerBalanceAfter.eq(ownerBalanceBefore.add(interactorBalanceBefore)),
      "Owner did not receive WETH",
    );
  });

  it("should allow owner to withdraw Ether from SushiSwap interactor", async () => {
    const contractOwner = await interactorInstance.owner(); // Fetch owner inside test
    const ethToSend = web3.utils.toWei("0.5", "ether");
    await web3.eth.sendTransaction({
      from: deployer, // Any account with ETH can send
      to: interactorInstance.address,
      value: ethToSend,
    });

    const interactorEthBalanceBefore = await web3.eth.getBalance(
      interactorInstance.address,
    );
    const ownerEthBalanceBefore = await web3.eth.getBalance(contractOwner); // Use fetched owner
    assert.equal(
      interactorEthBalanceBefore.toString(),
      ethToSend,
      "Interactor ETH balance incorrect",
    );

    const tx = await interactorInstance.withdrawEther({ from: contractOwner }); // Use fetched owner
    const gasUsed = new BN(tx.receipt.gasUsed);
    const txInfo = await web3.eth.getTransaction(tx.tx);
    const gasPrice = new BN(txInfo.gasPrice);
    const txCost = gasUsed.mul(gasPrice);

    const interactorEthBalanceAfter = await web3.eth.getBalance(
      interactorInstance.address,
    );
    const ownerEthBalanceAfter = await web3.eth.getBalance(contractOwner); // Use fetched owner

    assert(
      new BN(interactorEthBalanceAfter).isZero(),
      "Interactor ETH balance should be zero",
    );
    assert(
      new BN(ownerEthBalanceAfter).eq(
        new BN(ownerEthBalanceBefore).add(new BN(ethToSend)).sub(txCost),
      ),
      "Owner ETH balance incorrect after withdrawal",
    );
  });
});
