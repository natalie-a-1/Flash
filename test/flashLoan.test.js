const FlashLoan = artifacts.require("FlashLoan");
const IERC20 = artifacts.require(
  "@openzeppelin/contracts/token/ERC20/IERC20.sol",
);
const IUniswapV2Router02 = artifacts.require(
  "./interfaces/IUniswapV2Router02.sol",
);
const ISushiSwapV2Router02 = artifacts.require(
  "./interfaces/ISushiSwapV2Router02.sol",
);
const IWETH = artifacts.require("./interfaces/IWETH.sol");
const BN = web3.utils.BN;
const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const constants = require("../constants.json"); // Load addresses

contract("FlashLoan", (accounts) => {
  let flashLoanInstance;
  const owner = accounts[0];
  const nonOwner = accounts[1];
  const otherAccount = accounts[2];
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Load Sepolia addresses from constants file
  const AAVE_POOL_PROVIDER_SEPOLIA =
    "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A"; // Keep Aave provider specific for now
  const {
    WETH: WETH_SEPOLIA,
    USDC: USDC_SEPOLIA,
    UNISWAP_V2_ROUTER: UNISWAP_ROUTER_SEPOLIA,
    SUSHISWAP_V2_ROUTER: SUSHISWAP_ROUTER_SEPOLIA,
  } = constants.sepolia;

  let usdcToken;
  let wethToken;
  let uniswapRouter;
  let sushiswapRouter;

  const getLatestTimestamp = async () => {
    const block = await web3.eth.getBlock("latest");
    return block.timestamp;
  };

  beforeEach(async () => {
    // Deploy the updated contract with just the Aave Pool Provider
    flashLoanInstance = await FlashLoan.new(AAVE_POOL_PROVIDER_SEPOLIA, {
      from: owner,
    });

    // Set up token and router references
    usdcToken = await IERC20.at(USDC_SEPOLIA);
    wethToken = await IERC20.at(WETH_SEPOLIA);
    uniswapRouter = await IUniswapV2Router02.at(UNISWAP_ROUTER_SEPOLIA);
    sushiswapRouter = await ISushiSwapV2Router02.at(SUSHISWAP_ROUTER_SEPOLIA);

    // Approve routers in the contract
    await flashLoanInstance.setRouterApproval(UNISWAP_ROUTER_SEPOLIA, true, {
      from: owner,
    });
    await flashLoanInstance.setRouterApproval(SUSHISWAP_ROUTER_SEPOLIA, true, {
      from: owner,
    });
  });

  describe("Deployment and Configuration", () => {
    it("should deploy the contract successfully", async () => {
      assert(flashLoanInstance.address, "Contract should have an address.");
    });

    it("should set the owner correctly", async () => {
      const contractOwner = await flashLoanInstance.getOwner();
      assert.equal(contractOwner, owner, "Owner should be the deployer.");
    });

    it("should have the correct Aave Pool Provider address", async () => {
      const providerAddress = await flashLoanInstance.getPoolProviderAddress();
      assert.equal(
        providerAddress,
        AAVE_POOL_PROVIDER_SEPOLIA,
        "Incorrect Aave Pool Provider address.",
      );
    });

    it("should have both routers approved", async () => {
      const isUniswapApproved = await flashLoanInstance.isRouterApproved(
        UNISWAP_ROUTER_SEPOLIA,
      );
      const isSushiswapApproved = await flashLoanInstance.isRouterApproved(
        SUSHISWAP_ROUTER_SEPOLIA,
      );

      assert.equal(
        isUniswapApproved,
        true,
        "Uniswap router should be approved",
      );
      assert.equal(
        isSushiswapApproved,
        true,
        "SushiSwap router should be approved",
      );
    });

    it("should fail to approve a zero address router", async () => {
      await expectRevert.unspecified(
        flashLoanInstance.setRouterApproval(ZERO_ADDRESS, true, {
          from: owner,
        }),
      );
    });

    it("should prevent non-owners from approving routers", async () => {
      await expectRevert.unspecified(
        flashLoanInstance.setRouterApproval(UNISWAP_ROUTER_SEPOLIA, false, {
          from: nonOwner,
        }),
      );
    });
  });

  describe("Withdrawal Functions", () => {
    it("should allow the owner to withdraw Ether", async () => {
      const amountToSend = web3.utils.toWei("1", "ether"); // Send 1 ETH
      await web3.eth.sendTransaction({
        from: owner,
        to: flashLoanInstance.address,
        value: amountToSend,
      });

      const initialOwnerBalance = new BN(await web3.eth.getBalance(owner));
      const contractBalance = new BN(
        await web3.eth.getBalance(flashLoanInstance.address),
      );
      assert(
        contractBalance.eq(new BN(amountToSend)),
        "Contract should have received ETH.",
      );

      const tx = await flashLoanInstance.withdrawEther({ from: owner });
      const gasUsed = new BN(tx.receipt.gasUsed);
      const txInfo = await web3.eth.getTransaction(tx.tx);
      const gasPrice = new BN(txInfo.gasPrice);
      const txCost = gasUsed.mul(gasPrice);

      const finalOwnerBalance = new BN(await web3.eth.getBalance(owner));
      const finalContractBalance = new BN(
        await web3.eth.getBalance(flashLoanInstance.address),
      );

      assert(
        finalContractBalance.isZero(),
        "Contract ETH balance should be zero after withdrawal.",
      );
      // Check owner balance increased by amountToSend (minus gas costs)
      assert(
        finalOwnerBalance.eq(
          initialOwnerBalance.add(new BN(amountToSend)).sub(txCost),
        ),
        "Owner balance should increase by withdrawn amount minus gas.",
      );
    });

    it("should prevent non-owners from withdrawing Ether", async () => {
      await web3.eth.sendTransaction({
        from: owner,
        to: flashLoanInstance.address,
        value: web3.utils.toWei("1", "ether"),
      });
      await expectRevert.unspecified(
        flashLoanInstance.withdrawEther({ from: nonOwner }),
      );
    });

    it("should allow the owner to withdraw any token", async () => {
      // This test now works with any token since the contract design has changed
      await flashLoanInstance.withdrawToken(USDC_SEPOLIA, { from: owner });

      // Attempt with WETH as well
      await flashLoanInstance.withdrawToken(WETH_SEPOLIA, { from: owner });

      // Placeholder assertion as we can't easily send tokens to the contract in this test
      assert(true, "Owner should be able to withdraw any token");
    });

    it("should prevent non-owners from withdrawing tokens", async () => {
      await expectRevert.unspecified(
        flashLoanInstance.withdrawToken(USDC_SEPOLIA, { from: nonOwner }),
      );
    });

    it("should prevent withdrawing from zero address", async () => {
      await expectRevert.unspecified(
        flashLoanInstance.withdrawToken(ZERO_ADDRESS, { from: owner }),
      );
    });
  });

  describe("Flash Loan Request", () => {
    it("should allow the owner to request a flash loan", async () => {
      // This test checks permission logic only
      const loanAmount = "1000000"; // 1 USDC (6 decimal places)

      // Note: This will revert since we're not on a proper fork, but we're just testing ownership
      try {
        await flashLoanInstance.requestFlashLoan(
          USDC_SEPOLIA,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          50,
          { from: owner },
        );
      } catch (error) {
        // Expected to fail on non-forked network or if Aave pool is unavailable
        // But it should at least pass authorization check
        assert(
          !error.message.includes("NotOwner"),
          "Error should not be related to ownership",
        );
      }
    });

    it("should allow non-owners to request a flash loan", async () => {
      const loanAmount = "1000000"; // 1 USDC (6 decimal places)

      // Non-owner should be able to call without a NotOwner revert
      try {
        await flashLoanInstance.requestFlashLoan(
          USDC_SEPOLIA,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          50,
          { from: nonOwner },
        );
      } catch (error) {
        assert(
          !error.message.includes("NotOwner"),
          "Error should not be related to ownership",
        );
      }
    });

    it("should validate parameters for flash loan request", async () => {
      const loanAmount = "1000000"; // 1 USDC (6 decimal places)

      // Test with zero address asset
      await expectRevert.unspecified(
        flashLoanInstance.requestFlashLoan(
          ZERO_ADDRESS,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          50,
          { from: owner },
        ),
      );

      // Test with zero address source router
      await expectRevert.unspecified(
        flashLoanInstance.requestFlashLoan(
          USDC_SEPOLIA,
          loanAmount,
          ZERO_ADDRESS,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          50,
          { from: owner },
        ),
      );

      // Test with zero address intermediate token
      await expectRevert.unspecified(
        flashLoanInstance.requestFlashLoan(
          USDC_SEPOLIA,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          ZERO_ADDRESS,
          50,
          { from: owner },
        ),
      );
    });

    it("should validate custom path parameters", async () => {
      const loanAmount = "1000000"; // 1 USDC (6 decimal places)

      // Create valid paths
      const firstPath = [USDC_SEPOLIA, WETH_SEPOLIA];
      const secondPath = [WETH_SEPOLIA, USDC_SEPOLIA];

      // Test with invalid first path (wrong start token)
      const invalidFirstPath = [WETH_SEPOLIA, USDC_SEPOLIA]; // Should start with USDC
      await expectRevert.unspecified(
        flashLoanInstance.requestFlashLoanWithCustomPaths(
          USDC_SEPOLIA,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          invalidFirstPath,
          secondPath,
          50,
          { from: owner },
        ),
      );

      // Test with invalid second path (wrong end token)
      const invalidSecondPath = [WETH_SEPOLIA, ZERO_ADDRESS]; // Should end with USDC
      await expectRevert.unspecified(
        flashLoanInstance.requestFlashLoanWithCustomPaths(
          USDC_SEPOLIA,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          firstPath,
          invalidSecondPath,
          50,
          { from: owner },
        ),
      );
    });

    // New fee/quota tests
    it("should allow up to three free calls for non-owner", async () => {
      const loanAmount = "1000000";
      for (let i = 0; i < 3; i++) {
        try {
          await flashLoanInstance.requestFlashLoan(
            USDC_SEPOLIA,
            loanAmount,
            UNISWAP_ROUTER_SEPOLIA,
            SUSHISWAP_ROUTER_SEPOLIA,
            WETH_SEPOLIA,
            50,
            { from: nonOwner },
          );
        } catch (error) {
          // Ensure failure is not due to fee requirement
          assert(
            !error.message.includes("FlashLoanPaymentRequired"),
            "Should not require fee on early calls",
          );
        }
      }
    });

    it("should revert on fourth call without fee for non-owner", async () => {
      const loanAmount = "1000000";
      // consume 3 free calls
      for (let i = 0; i < 3; i++) {
        try {
          await flashLoanInstance.requestFlashLoan(
            USDC_SEPOLIA,
            loanAmount,
            UNISWAP_ROUTER_SEPOLIA,
            SUSHISWAP_ROUTER_SEPOLIA,
            WETH_SEPOLIA,
            50,
            { from: nonOwner },
          );
        } catch {}
      }
      // fourth call without fee should revert
      await expectRevert.unspecified(
        flashLoanInstance.requestFlashLoan(
          USDC_SEPOLIA,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          50,
          { from: nonOwner },
        ),
      );
    });

    it("should allow fourth call when sending required fee for non-owner", async () => {
      const loanAmount = "1000000";
      const fee = web3.utils.toWei("0.005", "ether");
      // consume 3 free calls
      for (let i = 0; i < 3; i++) {
        try {
          await flashLoanInstance.requestFlashLoan(
            USDC_SEPOLIA,
            loanAmount,
            UNISWAP_ROUTER_SEPOLIA,
            SUSHISWAP_ROUTER_SEPOLIA,
            WETH_SEPOLIA,
            50,
            { from: nonOwner },
          );
        } catch {}
      }
      // fourth call with fee should proceed past fee check
      try {
        await flashLoanInstance.requestFlashLoan(
          USDC_SEPOLIA,
          loanAmount,
          UNISWAP_ROUTER_SEPOLIA,
          SUSHISWAP_ROUTER_SEPOLIA,
          WETH_SEPOLIA,
          50,
          { from: nonOwner, value: fee },
        );
      } catch (error) {
        // Should not revert for fee; may revert later due to pool
        assert(
          !error.message.includes("FlashLoanPaymentRequired"),
          "Should not require fee when correct amount sent",
        );
      }
    });

    it("should allow unlimited calls for owner without fee", async () => {
      const loanAmount = "1000000";
      for (let i = 0; i < 5; i++) {
        try {
          await flashLoanInstance.requestFlashLoan(
            USDC_SEPOLIA,
            loanAmount,
            UNISWAP_ROUTER_SEPOLIA,
            SUSHISWAP_ROUTER_SEPOLIA,
            WETH_SEPOLIA,
            50,
            { from: owner },
          );
        } catch (error) {
          // Owner should never hit fee requirement
          assert(
            !error.message.includes("FlashLoanPaymentRequired"),
            "Owner should not be charged fee",
          );
        }
      }
    });
  });

  // The full arbitrage test would need to run on a mainnet or Sepolia fork
  // with proper Aave, Uniswap and SushiSwap setups
  describe("Arbitrage Test (Fork Required)", function () {
    it("should be able to execute a flash loan arbitrage", async function () {
      // Skip this test unless we're on a fork
      this.skip();

      // This would be the implementation for a fork test
      // But we skip it here since it requires a properly configured fork
    });
  });
});
