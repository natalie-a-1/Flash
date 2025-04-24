// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// ===================================================================
// Imports
// ===================================================================
import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol"; // Import Uniswap Router Interface
import {ISushiSwapV2Router02} from "./interfaces/ISushiSwapV2Router02.sol"; // Import SushiSwap Router Interface
// IFlashLoanReceiver interface is implicitly inherited via FlashLoanSimpleReceiverBase
// import {IFlashLoanReceiver} from "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanReceiver.sol";

// ===================================================================
// Interfaces
// ===================================================================
// Moved interfaces to separate files in contracts/interfaces/

// ===================================================================
// Contract
// ===================================================================

/**
 * @title FlashLoan Arbitrage Example
 * @notice Implements an Aave V3 Flash Loan Receiver for a *specific* arbitrage strategy.
 * @dev This contract demonstrates borrowing USDC on Aave (Sepolia), swapping it for WETH on Uniswap V2 (Sepolia),
 *      swapping the WETH back to USDC on SushiSwap V2 (Sepolia), and repaying the loan.
 *      It includes basic slippage protection but is intended for educational purposes.
 *      Does NOT account for gas costs in profitability checks.
 * @author Your Name/Organization (or remove if desired)
 */
contract FlashLoan is FlashLoanSimpleReceiverBase {
  // ===================================================================
  // State Variables
  // ===================================================================

  // --- Owner ---
  address private immutable i_owner;

  // --- Configuration: Sepolia Addresses ---
  // @dev Ensure these addresses are correct for the target network (Sepolia).
  // @dev USDC and WETH addresses specific to Sepolia testnet
  address private immutable USDC; // Example: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8 on Sepolia
  address private immutable WETH; // Example: 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14 on Sepolia

  // --- Router Addresses ---
  IUniswapV2Router02 private immutable uniswapRouter;
  ISushiSwapV2Router02 private immutable sushiRouter;

  // --- Configuration: Swap Parameters ---
  uint256 private constant SWAP_DEADLINE_OFFSET = 600; // 10 minutes from block timestamp
  uint256 private constant SLIPPAGE_TOLERANCE_BPS = 50; // 0.5% expressed in basis points (1 BPS = 0.01%)

  // ===================================================================
  // Events
  // ===================================================================
  event ArbitrageExecution(
    address indexed asset,
    uint256 amountBorrowed,
    uint256 premiumPaid,
    uint256 wethReceived,
    uint256 usdcRecovered,
    bool success
  );

  // ===================================================================
  // Errors
  // ===================================================================
  error NotOwner(); // Caller is not the owner.
  error InvalidAsset(address expected, address actual); // Flash loan requested for an asset other than the configured one.
  error ArbitrageSwapFailed(string reason); // Arbitrage execution failed (e.g., swap revert, insufficient balance).
  error RepayFailed(); // Final approval step for Aave Pool failed.
  error TransferFailed(); // ERC20 or Ether withdrawal failed.
  error InvalidRouterAddress(); // Provided router address is the zero address.
  error InvalidTokenAddress(); // Provided token address is the zero address.

  // ===================================================================
  // Constructor
  // ===================================================================

  /**
   * @notice Sets up the contract, linking it to Aave, Routers and Tokens.
   * @param _poolAddressesProvider The address of the Aave V3 IPoolAddressesProvider contract (for Sepolia).
   * @param _uniswapRouterAddress The address of the Uniswap V2 Router contract (for Sepolia).
   * @param _sushiRouterAddress The address of the SushiSwap V2 Router contract (for Sepolia).
   * @param _usdcAddress The address of the USDC token contract (for Sepolia).
   * @param _wethAddress The address of the WETH token contract (for Sepolia).
   */
  constructor(
    address _poolAddressesProvider,
    address _uniswapRouterAddress,
    address _sushiRouterAddress,
    address _usdcAddress,
    address _wethAddress
  ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_poolAddressesProvider)) {
    if (_uniswapRouterAddress == address(0)) revert InvalidRouterAddress();
    if (_sushiRouterAddress == address(0)) revert InvalidRouterAddress();
    if (_usdcAddress == address(0)) revert InvalidTokenAddress();
    if (_wethAddress == address(0)) revert InvalidTokenAddress();

    i_owner = msg.sender;
    uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);
    sushiRouter = ISushiSwapV2Router02(_sushiRouterAddress);
    USDC = _usdcAddress;
    WETH = _wethAddress;

    // Basic validation: Ensure routers report the correct WETH address if possible
    // Note: SushiSwap interface doesn't enforce WETH() function presence, handle potential errors
    try uniswapRouter.WETH() returns (address uniWeth) {
      if (uniWeth != WETH) revert InvalidRouterAddress(); // Or a more specific error
    } catch {
      // Handle cases where Uniswap router might not have WETH() or reverts
      // Consider adding logging or a specific error if WETH check fails
    }
    // Similar check for SushiSwap if its interface included WETH()
    // try sushiRouter.WETH() returns (address sushiWeth) {
    //     if (sushiWeth != WETH) revert InvalidRouterAddress();
    // } catch {
    //     // Handle potential errors
    // }
  }

  // ===================================================================
  // Aave Flash Loan Callback
  // ===================================================================

  /**
   * @notice The core function called by the Aave Pool after transferring the flash loan funds.
   * @dev Executes the predefined arbitrage strategy (USDC -> WETH -> USDC) and handles repayment.
   *      Reverts if the strategy fails or if repayment conditions are not met.
   * @param asset The address of the borrowed token (must be USDC for this contract).
   * @param amount The amount of the token borrowed.
   * @param premium The fee charged by Aave for the flash loan.
   * @param _initiator The address that initiated the flash loan request (unused in this implementation).
   * @param _params Arbitrary data passed during the `flashLoanSimple` call (unused in this implementation).
   * @return bool Returns `true` if the operation and repayment approval were successful.
   */
  function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address _initiator, // Silence unused warning
    bytes calldata _params // Silence unused warning
  ) external override returns (bool) {
    // Restore override
    // 1. Input Validation
    if (asset != USDC) revert InvalidAsset(USDC, asset); // Strategy only supports the configured USDC address
    uint256 amountToRepay = amount + premium;
    uint256 wethReceived; // Declare before try
    uint256 finalUsdcReceived; // Declare before try
    bool success = false; // Declare and initialize before try

    // --- Start Arbitrage Logic ---
    // Note: Gas costs are NOT accounted for in this on-chain logic.
    // Real profitability must consider transaction fees evaluated off-chain.
    // Remove try...catch block wrapper
    // try {

    // Variable declarations remain outside

    // 2. Uniswap Trade (USDC -> WETH)
    {
      // Scope limited variables for Uniswap swap
      address[] memory path = new address[](2);
      path[0] = USDC;
      path[1] = WETH;

      // Approve router
      _safeApprove(USDC, address(uniswapRouter), amount);

      // Calculate minimum output with slippage
      uint amountOutMin = _getMinAmountOut(address(uniswapRouter), amount, path);

      // Perform swap
      uint[] memory actualAmounts = uniswapRouter.swapExactTokensForTokens(
        amount,
        amountOutMin,
        path,
        address(this), // Send WETH directly to this contract
        block.timestamp + SWAP_DEADLINE_OFFSET
      );
      // Router guarantees path length >= 2, so actualAmounts length is >= 2
      wethReceived = actualAmounts[actualAmounts.length - 1]; // WETH received is the last element
    }

    // 3. SushiSwap Trade (WETH -> USDC)
    {
      // Scope limited variables for SushiSwap swap
      address[] memory path = new address[](2);
      path[0] = WETH;
      path[1] = USDC;

      // Approve router to spend the WETH we just received
      _safeApprove(WETH, address(sushiRouter), wethReceived);

      // Calculate minimum output with slippage
      uint amountOutMin = _getMinAmountOut(address(sushiRouter), wethReceived, path);

      // Perform swap
      uint[] memory actualAmounts = sushiRouter.swapExactTokensForTokens(
        wethReceived,
        amountOutMin,
        path,
        address(this), // Send USDC directly to this contract
        block.timestamp + SWAP_DEADLINE_OFFSET
      );
      finalUsdcReceived = actualAmounts[actualAmounts.length - 1]; // USDC received is the last element
    }

    // --- End Arbitrage Logic ---

    // 4. Repayment Check & Approval
    uint256 finalUsdcBalance = IERC20(USDC).balanceOf(address(this));
    if (finalUsdcBalance < amountToRepay) {
      revert ArbitrageSwapFailed("Insufficient final balance for repayment");
    }

    // Approve the Aave Pool to pull the repayment amount
    _safeApprove(USDC, address(POOL), amountToRepay);

    success = true; // Mark as successful only if all steps pass

    // Remove catch block
    // } catch (bytes memory lowLevelData) {
    //     revert ArbitrageSwapFailed(string(abi.encodePacked("Swap or Repay failed: ", _getRevertMsg(lowLevelData))));
    // }

    // Emit event
    emit ArbitrageExecution(asset, amount, premium, wethReceived, finalUsdcReceived, success);

    // Return success status
    return success;
  }

  // ===================================================================
  // External Functions
  // ===================================================================

  /**
   * @notice Initiates an Aave V3 flash loan for the configured USDC token.
   * @dev Triggers the flash loan process; `executeOperation` will be called by Aave.
   * @param _amount The amount of USDC to borrow.
   */
  function requestFlashLoan(uint256 _amount) external onlyOwner {
    address receiverAddress = address(this);
    address asset = USDC; // Use configured USDC address
    uint256 amount = _amount;
    bytes memory params = ""; // No parameters needed for this simple receiver
    uint16 referralCode = 0; // No referral

    // Call Aave Pool's flashLoanSimple function
    POOL.flashLoanSimple(receiverAddress, asset, amount, params, referralCode);
  }

  /**
   * @notice Withdraw accumulated tokens (e.g., profits or accidentally sent tokens).
   * @dev Can only be called by the owner. Only allows withdrawing the configured USDC or WETH.
   * @param _tokenAddress The address of the ERC20 token to withdraw.
   */
  function withdrawToken(address _tokenAddress) external onlyOwner {
    if (_tokenAddress != USDC && _tokenAddress != WETH)
      revert InvalidAsset(_tokenAddress, _tokenAddress); // Use InvalidAsset for simplicity or add a new error

    uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
    if (balance > 0) {
      bool sent = IERC20(_tokenAddress).transfer(i_owner, balance);
      if (!sent) revert TransferFailed();
    }
  }

  /**
   * @notice Allows the owner to withdraw accumulated Ether from this contract.
   * @dev Reverts if called by non-owner or if the transfer fails.
   */
  function withdrawEther() external onlyOwner {
    uint256 balance = address(this).balance;
    if (balance > 0) {
      // Use call to send Ether; require success
      (bool success, ) = i_owner.call{value: balance}("");
      if (!success) revert TransferFailed();
    }
  }

  // ===================================================================
  // View Functions (Getters)
  // ===================================================================

  /** @notice Gets the owner address of the contract. */
  function getOwner() external view returns (address) {
    return i_owner;
  }

  /** @notice Gets the configured Aave Pool Addresses Provider address. */
  function getPoolProviderAddress() external view returns (address) {
    return address(ADDRESSES_PROVIDER);
  }

  /** @notice Gets the configured USDC token address. */
  function getUsdcAddress() external view returns (address) {
    return USDC;
  }

  /** @notice Gets the configured WETH token address. */
  function getWethAddress() external view returns (address) {
    return WETH;
  }

  /** @notice Gets the configured Uniswap V2 Router address. */
  function getUniswapRouterAddress() external view returns (address) {
    return address(uniswapRouter);
  }

  /** @notice Gets the configured SushiSwap V2 Router address. */
  function getSushiSwapRouterAddress() external view returns (address) {
    return address(sushiRouter);
  }

  // ===================================================================
  // Internal Helper Functions
  // ===================================================================

  /**
   * @notice Calculates the minimum amount of output tokens acceptable for a swap, applying slippage tolerance.
   * @param _router Address of the Uniswap/SushiSwap router.
   * @param _amountIn The amount of input tokens.
   * @param _path The swap path (array of token addresses).
   * @return amountOutMin The minimum acceptable output amount.
   */
  function _getMinAmountOut(
    address _router,
    uint _amountIn,
    address[] memory _path
  ) internal view returns (uint amountOutMin) {
    require(_path.length >= 2, "Path must have at least 2 tokens");

    uint[] memory expectedAmounts;
    // Use a generic interface call assuming both routers implement getAmountsOut
    // This requires ISushiSwapV2Router02 to also have getAmountsOut defined, which we did.
    try IUniswapV2Router02(_router).getAmountsOut(_amountIn, _path) returns (
      uint[] memory _expectedAmounts
    ) {
      expectedAmounts = _expectedAmounts;
    } catch {
      revert ArbitrageSwapFailed("getAmountsOut call failed");
    }

    if (expectedAmounts.length != _path.length) {
      revert ArbitrageSwapFailed("getAmountsOut returned unexpected array length");
    }

    uint expectedAmountOut = expectedAmounts[expectedAmounts.length - 1];
    amountOutMin = (expectedAmountOut * (10000 - SLIPPAGE_TOLERANCE_BPS)) / 10000;

    if (amountOutMin == 0) {
      revert ArbitrageSwapFailed("Calculated min output is zero");
    }
  }

  /**
   * @dev Internal function to safely approve spending tokens. Handles non-standard ERC20 approve return values.
   * @param _token The address of the ERC20 token.
   * @param _spender The address authorized to spend the tokens.
   * @param _amount The amount to approve.
   */
  function _safeApprove(address _token, address _spender, uint256 _amount) internal {
    // Some tokens might implement approve incorrectly (e.g., return void or false on success).
    // Standard is to return true on success.
    // We use a low-level call to handle different return value patterns.
    (bool success, bytes memory data) = _token.call(
      abi.encodeWithSelector(IERC20.approve.selector, _spender, _amount)
    );

    // Check for call success AND (if data is returned) if it decodes to `true`.
    require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeApprove failed");
  }

  // Add helper function to decode revert reason
  function _getRevertMsg(bytes memory _returnData) internal pure returns (string memory) {
    // If the _returnData isAbiEncoded as a string, return the string
    // if (_returnData.length >= 68 && bytes4(_returnData) == bytes4(keccak256("Error(string)"))) {
    //     return abi.decode(bytes.concat(_returnData[4:]), (string));
    // }
    // Always return hex representation for simplicity and compatibility
    return string(abi.encodePacked("0x", _toHex(_returnData)));
  }

  // Helper function to convert bytes to hex string
  function _toHex(bytes memory _bytes) internal pure returns (string memory) {
    bytes memory alphabet = "0123456789abcdef";
    bytes memory str = new bytes(2 + _bytes.length * 2);
    str[0] = "0";
    str[1] = "x";
    for (uint i = 0; i < _bytes.length; i++) {
      uint8 b = uint8(_bytes[i]);
      str[2 + i * 2] = alphabet[b >> 4];
      str[3 + i * 2] = alphabet[b & 0x0f];
    }
    return string(str);
  }

  // ===================================================================
  // Modifiers
  // ===================================================================

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    if (msg.sender != i_owner) revert NotOwner();
    _;
  }

  // ===================================================================
  // Receive Function (for receiving Ether, if needed)
  // ===================================================================
  receive() external payable {} // Restore receive function
}
