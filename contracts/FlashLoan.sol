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
 * @title Dynamic FlashLoan Arbitrage
 * @notice Implements an Aave V3 Flash Loan Receiver for configurable arbitrage strategies.
 * @dev This contract allows borrowing any supported token on Aave and swapping between any two exchanges.
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

  // --- Configuration: Swap Parameters ---
  uint256 private constant SWAP_DEADLINE_OFFSET = 600; // 10 minutes from block timestamp
  uint256 private constant SLIPPAGE_TOLERANCE_BPS = 50; // 0.5% expressed in basis points (1 BPS = 0.01%)

  // --- Router Registry ---
  mapping(address => bool) public approvedRouters;

  // --- Transaction Parameters (for executeOperation) ---
  struct ArbitrageParams {
    address sourceRouter;
    address targetRouter;
    address intermediateToken;
    address[] firstPath;
    address[] secondPath;
  }

  // ===================================================================
  // Events
  // ===================================================================
  event ArbitrageExecution(
    address indexed asset,
    uint256 amountBorrowed,
    uint256 premiumPaid,
    uint256 intermediateReceived,
    uint256 finalReceived,
    bool success
  );

  event RouterApprovalChanged(address router, bool approved);

  // ===================================================================
  // Errors
  // ===================================================================
  error NotOwner(); // Caller is not the owner
  error ArbitrageSwapFailed(string reason); // Arbitrage execution failed
  error RepayFailed(); // Final approval step for Aave Pool failed
  error TransferFailed(); // ERC20 or Ether withdrawal failed
  error InvalidRouterAddress(); // Provided router address is the zero address
  error InvalidTokenAddress(); // Provided token address is the zero address
  error RouterNotApproved(); // The router used is not in the approved list
  error InvalidPath(); // The swap path provided is invalid

  // ===================================================================
  // Constructor
  // ===================================================================

  /**
   * @notice Sets up the contract, linking it to Aave
   * @param _poolAddressesProvider The address of the Aave V3 IPoolAddressesProvider contract
   */
  constructor(
    address _poolAddressesProvider
  ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_poolAddressesProvider)) {
    i_owner = msg.sender;
  }

  // ===================================================================
  // Aave Flash Loan Callback
  // ===================================================================

  /**
   * @notice The core function called by the Aave Pool after transferring the flash loan funds.
   * @dev Executes the dynamic arbitrage strategy and handles repayment.
   *      Reverts if the strategy fails or if repayment conditions are not met.
   * @param asset The address of the borrowed token
   * @param amount The amount of the token borrowed.
   * @param premium The fee charged by Aave for the flash loan.
   * @param _initiator The address that initiated the flash loan request
   * @param params Encoded arbitrage parameters
   * @return bool Returns `true` if the operation and repayment approval were successful.
   */
  function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address _initiator,
    bytes calldata params
  ) external override returns (bool) {
    uint256 amountToRepay = amount + premium;
    uint256 intermediateReceived;
    uint256 finalReceived;
    bool success = false;

    // Decode arbitrage parameters
    ArbitrageParams memory arbParams = abi.decode(params, (ArbitrageParams));

    // Validate routers are approved
    if (!approvedRouters[arbParams.sourceRouter]) revert RouterNotApproved();
    if (!approvedRouters[arbParams.targetRouter]) revert RouterNotApproved();

    // Validate paths
    if (arbParams.firstPath.length < 2) revert InvalidPath();
    if (arbParams.secondPath.length < 2) revert InvalidPath();
    if (arbParams.firstPath[0] != asset) revert InvalidPath();
    if (arbParams.firstPath[arbParams.firstPath.length - 1] != arbParams.intermediateToken)
      revert InvalidPath();
    if (arbParams.secondPath[0] != arbParams.intermediateToken) revert InvalidPath();
    if (arbParams.secondPath[arbParams.secondPath.length - 1] != asset) revert InvalidPath();

    // --- Start Arbitrage Logic ---
    // First Swap (borrowed asset -> intermediate token)
    {
      // Approve router
      _safeApprove(asset, arbParams.sourceRouter, amount);

      // Calculate minimum output with slippage
      uint amountOutMin = _getMinAmountOut(arbParams.sourceRouter, amount, arbParams.firstPath);

      // Perform swap
      uint[] memory actualAmounts = IUniswapV2Router02(arbParams.sourceRouter)
        .swapExactTokensForTokens(
          amount,
          amountOutMin,
          arbParams.firstPath,
          address(this),
          block.timestamp + SWAP_DEADLINE_OFFSET
        );
      intermediateReceived = actualAmounts[actualAmounts.length - 1];
    }

    // Second Swap (intermediate token -> original borrowed asset)
    {
      // Approve router
      _safeApprove(arbParams.intermediateToken, arbParams.targetRouter, intermediateReceived);

      // Calculate minimum output with slippage
      uint amountOutMin = _getMinAmountOut(
        arbParams.targetRouter,
        intermediateReceived,
        arbParams.secondPath
      );

      // Perform swap
      uint[] memory actualAmounts = IUniswapV2Router02(arbParams.targetRouter)
        .swapExactTokensForTokens(
          intermediateReceived,
          amountOutMin,
          arbParams.secondPath,
          address(this),
          block.timestamp + SWAP_DEADLINE_OFFSET
        );
      finalReceived = actualAmounts[actualAmounts.length - 1];
    }
    // --- End Arbitrage Logic ---

    // Repayment Check & Approval
    uint256 finalBalance = IERC20(asset).balanceOf(address(this));
    if (finalBalance < amountToRepay) {
      revert ArbitrageSwapFailed("Insufficient final balance for repayment");
    }

    // Approve the Aave Pool to pull the repayment amount
    _safeApprove(asset, address(POOL), amountToRepay);

    success = true;

    // Emit event
    emit ArbitrageExecution(asset, amount, premium, intermediateReceived, finalReceived, success);

    return success;
  }

  // ===================================================================
  // External Functions
  // ===================================================================

  /**
   * @notice Initiates an Aave V3 flash loan for arbitrage between two exchanges
   * @dev Triggers the flash loan process; executeOperation will be called by Aave
   * @param _asset The token to borrow
   * @param _amount The amount to borrow
   * @param _sourceRouter The router to use for the first swap
   * @param _targetRouter The router to use for the second swap
   * @param _intermediateToken The token to use as intermediate for the arbitrage
   */
  function requestFlashLoan(
    address _asset,
    uint256 _amount,
    address _sourceRouter,
    address _targetRouter,
    address _intermediateToken
  ) external onlyOwner {
    if (_asset == address(0)) revert InvalidTokenAddress();
    if (_sourceRouter == address(0)) revert InvalidRouterAddress();
    if (_targetRouter == address(0)) revert InvalidRouterAddress();
    if (_intermediateToken == address(0)) revert InvalidTokenAddress();

    if (!approvedRouters[_sourceRouter]) revert RouterNotApproved();
    if (!approvedRouters[_targetRouter]) revert RouterNotApproved();

    // Create paths for the swaps
    address[] memory firstPath = new address[](2);
    firstPath[0] = _asset;
    firstPath[1] = _intermediateToken;

    address[] memory secondPath = new address[](2);
    secondPath[0] = _intermediateToken;
    secondPath[1] = _asset;

    // Create arbitrage parameters
    ArbitrageParams memory arbParams = ArbitrageParams({
      sourceRouter: _sourceRouter,
      targetRouter: _targetRouter,
      intermediateToken: _intermediateToken,
      firstPath: firstPath,
      secondPath: secondPath
    });

    // Encode parameters for the flash loan callback
    bytes memory params = abi.encode(arbParams);

    // Call Aave Pool's flashLoanSimple function
    POOL.flashLoanSimple(address(this), _asset, _amount, params, 0);
  }

  /**
   * @notice Advanced flash loan request with custom token paths
   * @dev Allows specifying custom paths for more complex arbitrage routes
   * @param _asset The token to borrow
   * @param _amount The amount to borrow
   * @param _sourceRouter The router to use for the first swap
   * @param _targetRouter The router to use for the second swap
   * @param _intermediateToken The intermediate token
   * @param _firstPath Custom path for first swap (must start with _asset and end with _intermediateToken)
   * @param _secondPath Custom path for second swap (must start with _intermediateToken and end with _asset)
   */
  function requestFlashLoanWithCustomPaths(
    address _asset,
    uint256 _amount,
    address _sourceRouter,
    address _targetRouter,
    address _intermediateToken,
    address[] calldata _firstPath,
    address[] calldata _secondPath
  ) external onlyOwner {
    if (_asset == address(0)) revert InvalidTokenAddress();
    if (_sourceRouter == address(0)) revert InvalidRouterAddress();
    if (_targetRouter == address(0)) revert InvalidRouterAddress();
    if (_intermediateToken == address(0)) revert InvalidTokenAddress();

    if (!approvedRouters[_sourceRouter]) revert RouterNotApproved();
    if (!approvedRouters[_targetRouter]) revert RouterNotApproved();

    // Validate paths
    if (_firstPath.length < 2) revert InvalidPath();
    if (_secondPath.length < 2) revert InvalidPath();
    if (_firstPath[0] != _asset) revert InvalidPath();
    if (_firstPath[_firstPath.length - 1] != _intermediateToken) revert InvalidPath();
    if (_secondPath[0] != _intermediateToken) revert InvalidPath();
    if (_secondPath[_secondPath.length - 1] != _asset) revert InvalidPath();

    // Create arbitrage parameters
    ArbitrageParams memory arbParams = ArbitrageParams({
      sourceRouter: _sourceRouter,
      targetRouter: _targetRouter,
      intermediateToken: _intermediateToken,
      firstPath: _firstPath,
      secondPath: _secondPath
    });

    // Encode parameters for the flash loan callback
    bytes memory params = abi.encode(arbParams);

    // Call Aave Pool's flashLoanSimple function
    POOL.flashLoanSimple(address(this), _asset, _amount, params, 0);
  }

  /**
   * @notice Add or remove a router from the approved list
   * @dev Only callable by the owner
   * @param _router The router address to approve or disapprove
   * @param _approved Whether to approve or disapprove the router
   */
  function setRouterApproval(address _router, bool _approved) external onlyOwner {
    if (_router == address(0)) revert InvalidRouterAddress();
    approvedRouters[_router] = _approved;
    emit RouterApprovalChanged(_router, _approved);
  }

  /**
   * @notice Withdraw accumulated tokens (e.g., profits or accidentally sent tokens)
   * @dev Can only be called by the owner
   * @param _tokenAddress The address of the ERC20 token to withdraw
   */
  function withdrawToken(address _tokenAddress) external onlyOwner {
    if (_tokenAddress == address(0)) revert InvalidTokenAddress();

    uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
    if (balance > 0) {
      bool sent = IERC20(_tokenAddress).transfer(i_owner, balance);
      if (!sent) revert TransferFailed();
    }
  }

  /**
   * @notice Allows the owner to withdraw accumulated Ether from this contract
   * @dev Reverts if called by non-owner or if the transfer fails
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

  /** @notice Gets the owner address of the contract */
  function getOwner() external view returns (address) {
    return i_owner;
  }

  /** @notice Gets the configured Aave Pool Addresses Provider address */
  function getPoolProviderAddress() external view returns (address) {
    return address(ADDRESSES_PROVIDER);
  }

  /** @notice Checks if a router is approved */
  function isRouterApproved(address _router) external view returns (bool) {
    return approvedRouters[_router];
  }

  // ===================================================================
  // Internal Helper Functions
  // ===================================================================

  /**
   * @notice Calculates the minimum amount of output tokens acceptable for a swap, applying slippage tolerance
   * @param _router Address of the Uniswap/SushiSwap router
   * @param _amountIn The amount of input tokens
   * @param _path The swap path (array of token addresses)
   * @return amountOutMin The minimum acceptable output amount
   */
  function _getMinAmountOut(
    address _router,
    uint _amountIn,
    address[] memory _path
  ) internal view returns (uint amountOutMin) {
    require(_path.length >= 2, "Path must have at least 2 tokens");

    uint[] memory expectedAmounts;
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
   * @dev Internal function to safely approve spending tokens. Handles non-standard ERC20 approve return values
   * @param _token The address of the ERC20 token
   * @param _spender The address authorized to spend the tokens
   * @param _amount The amount to approve
   */
  function _safeApprove(address _token, address _spender, uint256 _amount) internal {
    (bool success, bytes memory data) = _token.call(
      abi.encodeWithSelector(IERC20.approve.selector, _spender, _amount)
    );

    require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeApprove failed");
  }

  // ===================================================================
  // Modifiers
  // ===================================================================

  /**
   * @dev Throws if called by any account other than the owner
   */
  modifier onlyOwner() {
    if (msg.sender != i_owner) revert NotOwner();
    _;
  }

  // ===================================================================
  // Receive Function (for receiving Ether, if needed)
  // ===================================================================
  receive() external payable {}
}
