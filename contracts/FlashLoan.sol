// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// ===================================================================
// Imports
// ===================================================================
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol"; // Import Uniswap Router Interface
import {ISushiSwapV2Router02} from "./interfaces/ISushiSwapV2Router02.sol"; // Import SushiSwap Router Interface
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol"; // Keep for ReserveData if needed later
// IFlashLoanReceiver is pulled in via the base contract

// ===================================================================
// Interfaces
// ===================================================================
// Moved interfaces to separate files in contracts/interfaces/

// ===================================================================
// Contract
// ===================================================================

/**
 * @title Dynamic FlashLoan Arbitrage
 * @notice Implements an Aave V3 Flash Loan receiver for configurable arbitrage strategies.
 */
contract FlashLoan { // REMOVED Inheritance
  // ===================================================================
  // State Variables
  // ===================================================================

  // --- Owner ---
  address private immutable i_owner;
  // --- Addresses Provider (kept for deployment compatibility, but not used for getPool) ---
  IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;

  // +++ ADDED: Hardcoded Mainnet Pool Address +++
  address private constant MAINNET_POOL_ADDRESS = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;

  // --- Configuration: Swap Parameters ---
  uint256 private constant SWAP_DEADLINE_OFFSET = 600; // 10 minutes from block timestamp
  uint256 private constant MAX_BPS = 10000;

  // --- Router Registry ---
  mapping(address => bool) public approvedRouters;

  // Pricing: first 3 flash loan calls per user are free; 4th+ require fee
  uint256 private constant FLASH_LOAN_FREE_CALLS = 3;
  uint256 private constant FLASH_LOAN_FEE = 0.005 ether;
  mapping(address => uint256) private s_flashLoanCalls;

  // --- Transaction Parameters (for executeOperation) ---
  struct ArbitrageParams {
    address sourceRouter;
    address targetRouter;
    address intermediateToken;
    address[] firstPath;
    address[] secondPath;
    uint256 slippageBps;
    address initiator; // Store the user who initiated the transaction
  }

  // ===================================================================
  // Events (ADDED FOR DEBUGGING)
  // ===================================================================
  event OperationStep(string indexed step); // Indexed for easier filtering
  event SwapParams(string dex, uint amountIn, uint amountOutMin, address[] path);
  event SwapResult(string dex, uint amountReceived);
  event RepaymentCheck(uint finalBalance, uint amountToRepay);
  event ErrorMessage(string message);
  event ProfitTransferred(address indexed recipient, address indexed token, uint256 amount);

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
  error FlashLoanPaymentRequired();
  error InvalidSlippageTolerance();

  // ===================================================================
  // Constructor
  // ===================================================================

  /**
   * @notice Sets up the contract with the Aave Addresses Provider address
   * @param _addressesProvider The Aave Pool Addresses Provider address
   */
  constructor(address _addressesProvider)
    // REMOVED: FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressesProvider))
  {
    ADDRESSES_PROVIDER = IPoolAddressesProvider(_addressesProvider); // RE-ADDED Assignment
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
   * @param params Encoded arbitrage parameters
   * @return bool Returns `true` if the operation and repayment approval were successful.
   */
  function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address /* _initiator */, // Marked unused
    bytes calldata params
  ) external returns (bool) {
    emit OperationStep("Entered executeOperation");
    uint256 intermediateReceived;
    uint256 finalReceived;
    bool success = false;

    // Fetch the Aave Pool from the provider
    // IMPORTANT: Ensure ADDRESSES_PROVIDER is correctly set during deployment
    if (address(ADDRESSES_PROVIDER) == address(0)) {
        emit ErrorMessage("ADDRESSES_PROVIDER is zero");
        revert("ADDRESSES_PROVIDER not set"); 
    }
    IPool pool = IPool(MAINNET_POOL_ADDRESS);
    if (address(pool) == address(0)) {
        emit ErrorMessage("Hardcoded Pool address is zero - THIS SHOULD NOT HAPPEN");
        revert("Hardcoded Pool address is zero"); 
    }
     emit OperationStep("Got Pool address (Hardcoded)");

    uint256 amountToRepay = amount + premium;

    // Decode arbitrage parameters
    ArbitrageParams memory arbParams = abi.decode(params, (ArbitrageParams));
    emit OperationStep("Params Decoded");

    // Validate routers are approved
    if (!approvedRouters[arbParams.sourceRouter]) {
        emit ErrorMessage("Source Router Not Approved");
        revert RouterNotApproved();
    }
    if (!approvedRouters[arbParams.targetRouter]) {
        emit ErrorMessage("Target Router Not Approved");
        revert RouterNotApproved();
    }
    emit OperationStep("Routers Validated");

    // Validate paths
    if (arbParams.firstPath.length < 2) revert InvalidPath();
    if (arbParams.secondPath.length < 2) revert InvalidPath();
    if (arbParams.firstPath[0] != asset) revert InvalidPath();
    if (arbParams.firstPath[arbParams.firstPath.length - 1] != arbParams.intermediateToken)
      revert InvalidPath();
    if (arbParams.secondPath[0] != arbParams.intermediateToken) revert InvalidPath();
    if (arbParams.secondPath[arbParams.secondPath.length - 1] != asset) revert InvalidPath();
     emit OperationStep("Paths Validated");

    // --- Start Arbitrage Logic ---
    // First Swap (borrowed asset -> intermediate token)
    {
      emit OperationStep("Before Source Swap Approval");
      // Approve router
      _safeApprove(asset, arbParams.sourceRouter, amount);
      emit OperationStep("After Source Swap Approval");

      // Calculate minimum output with slippage
      uint amountOutMin = _getMinAmountOut(
        arbParams.sourceRouter,
        amount,
        arbParams.firstPath,
        arbParams.slippageBps
      );
      emit SwapParams("Source", amount, amountOutMin, arbParams.firstPath);
      emit OperationStep("Before Source Swap Execution");

      // Perform swap
      // Consider adding try/catch here if swaps can fail gracefully
      try IUniswapV2Router02(arbParams.sourceRouter).swapExactTokensForTokens(
          amount,
          amountOutMin,
          arbParams.firstPath,
          address(this),
          block.timestamp + SWAP_DEADLINE_OFFSET
        ) returns (uint[] memory actualAmounts) {
           intermediateReceived = actualAmounts[actualAmounts.length - 1];
           emit SwapResult("Source", intermediateReceived);
      } catch Error(string memory reason) {
            emit ErrorMessage(string.concat("Source Swap Failed: ", reason));
            revert ArbitrageSwapFailed(string.concat("Source Swap Failed: ", reason));
      } catch (bytes memory lowLevelData) {
            emit ErrorMessage(string.concat("Source Swap Failed (Low Level): ", string(lowLevelData)));
             revert ArbitrageSwapFailed(string.concat("Source Swap Failed (Low Level): ", string(lowLevelData)));
      }
      emit OperationStep("After Source Swap Execution");
    }

    // Second Swap (intermediate token -> original borrowed asset)
    {
      emit OperationStep("Before Target Swap Approval");
      // Approve router
      _safeApprove(arbParams.intermediateToken, arbParams.targetRouter, intermediateReceived);
      emit OperationStep("After Target Swap Approval");

      // Calculate minimum output with slippage
      uint amountOutMin = _getMinAmountOut(
        arbParams.targetRouter,
        intermediateReceived,
        arbParams.secondPath,
        arbParams.slippageBps
      );
      emit SwapParams("Target", intermediateReceived, amountOutMin, arbParams.secondPath);
      emit OperationStep("Before Target Swap Execution");

      // Perform swap
      try IUniswapV2Router02(arbParams.targetRouter).swapExactTokensForTokens(
          intermediateReceived,
          amountOutMin,
          arbParams.secondPath,
          address(this),
          block.timestamp + SWAP_DEADLINE_OFFSET
       ) returns (uint[] memory actualAmounts) {
            finalReceived = actualAmounts[actualAmounts.length - 1];
            emit SwapResult("Target", finalReceived);
       } catch Error(string memory reason) {
             emit ErrorMessage(string.concat("Target Swap Failed: ", reason));
             revert ArbitrageSwapFailed(string.concat("Target Swap Failed: ", reason));
       } catch (bytes memory lowLevelData) {
             emit ErrorMessage(string.concat("Target Swap Failed (Low Level): ", string(lowLevelData)));
              revert ArbitrageSwapFailed(string.concat("Target Swap Failed (Low Level): ", string(lowLevelData)));
       }
      emit OperationStep("After Target Swap Execution");
    }
    // --- End Arbitrage Logic ---

    // Repayment Check & Approval
    uint256 finalBalance = IERC20(asset).balanceOf(address(this));
    emit RepaymentCheck(finalBalance, amountToRepay);
    emit OperationStep("Before Repayment Check Require");
    if (finalBalance < amountToRepay) {
      emit ErrorMessage("Insufficient final balance for repayment");
      revert ArbitrageSwapFailed("Insufficient final balance for repayment");
    }
    emit OperationStep("After Repayment Check Require");

    // Approve the Aave Pool to pull the repayment amount
    emit OperationStep("Before Final Approval");
    _safeApprove(asset, address(pool), amountToRepay);
    emit OperationStep("After Final Approval");

    success = true;

    // Calculate profit and send it to the initiator
    uint256 profit = finalBalance - amountToRepay;
    if (profit > 0 && arbParams.initiator != address(0)) {
        emit OperationStep("Sending profit to initiator");
        
        // Transfer profit to the transaction initiator
        _safeApprove(asset, address(this), 0); // Reset approval first
        bool sent = IERC20(asset).transfer(arbParams.initiator, profit);
        if (!sent) {
            emit ErrorMessage("Failed to transfer profit to initiator");
        } else {
            emit ProfitTransferred(arbParams.initiator, asset, profit);
            emit OperationStep("Profit successfully transferred");
        }
    }

    // Emit event
    emit ArbitrageExecution(asset, amount, premium, intermediateReceived, finalReceived, success);
    emit OperationStep("Operation Successful");

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
   * @param _slippageBps Slippage tolerance in basis points (1 BPS = 0.01%)
   */
  function requestFlashLoan(
    address _asset,
    uint256 _amount,
    address _sourceRouter,
    address _targetRouter,
    address _intermediateToken,
    uint256 _slippageBps
  ) external payable {
    if (_slippageBps > MAX_BPS) revert InvalidSlippageTolerance();
    emit OperationStep("Entered requestFlashLoan");

    // Pricing logic: track calls and enforce fee after free quota
    if (msg.sender != i_owner) {
      uint256 calls = s_flashLoanCalls[msg.sender];
      if (calls >= FLASH_LOAN_FREE_CALLS) {
        if (msg.value < FLASH_LOAN_FEE) revert FlashLoanPaymentRequired();
      }
      // forward any ETH sent to owner
      if (msg.value > 0) {
        (bool sent, ) = payable(i_owner).call{value: msg.value}("");
        if (!sent) revert TransferFailed();
      }
      s_flashLoanCalls[msg.sender] = calls + 1;
    }
    if (_asset == address(0)) revert InvalidTokenAddress();
    if (_sourceRouter == address(0)) revert InvalidRouterAddress();
    if (_targetRouter == address(0)) revert InvalidRouterAddress();
    if (_intermediateToken == address(0)) revert InvalidTokenAddress();

    if (!approvedRouters[_sourceRouter]) revert RouterNotApproved();
    if (!approvedRouters[_targetRouter]) revert RouterNotApproved();

    emit OperationStep("Basic Validations Passed");

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
      secondPath: secondPath,
      slippageBps: _slippageBps,
      initiator: msg.sender // Store the transaction initiator
    });

    // Encode parameters for the flash loan callback
    bytes memory params = abi.encode(arbParams);
    emit OperationStep("Params Encoded");

    // Fetch the Aave Pool and initiate flash loan
    IPool pool = IPool(MAINNET_POOL_ADDRESS);
    emit OperationStep("Got Pool Address in requestFlashLoan (Hardcoded)");

    // Re-check router approval just before call
    require(approvedRouters[_sourceRouter], "Source Router Not Approved (Pre-call Check)");
    require(approvedRouters[_targetRouter], "Target Router Not Approved (Pre-call Check)");
    emit OperationStep("Router Approval Re-checked");

    emit OperationStep("Calling pool.flashLoanSimple");
    pool.flashLoanSimple(address(this), _asset, _amount, params, 0);
    emit OperationStep("Finished requestFlashLoan (after pool call)");
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
   * @param _slippageBps Slippage tolerance in basis points (1 BPS = 0.01%)
   */
  function requestFlashLoanWithCustomPaths(
    address _asset,
    uint256 _amount,
    address _sourceRouter,
    address _targetRouter,
    address _intermediateToken,
    address[] calldata _firstPath,
    address[] calldata _secondPath,
    uint256 _slippageBps
  ) external payable {
    if (_slippageBps > MAX_BPS) revert InvalidSlippageTolerance();
    emit OperationStep("Entered requestFlashLoanWithCustomPaths");

    // Pricing logic: track calls and enforce fee after free quota
    if (msg.sender != i_owner) {
      uint256 calls = s_flashLoanCalls[msg.sender];
      if (calls >= FLASH_LOAN_FREE_CALLS) {
        if (msg.value < FLASH_LOAN_FEE) revert FlashLoanPaymentRequired();
      }
      if (msg.value > 0) {
        (bool sent, ) = payable(i_owner).call{value: msg.value}("");
        if (!sent) revert TransferFailed();
      }
      s_flashLoanCalls[msg.sender] = calls + 1;
    }
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

    emit OperationStep("Custom Paths Validated");

    // Create arbitrage parameters
    ArbitrageParams memory arbParams = ArbitrageParams({
      sourceRouter: _sourceRouter,
      targetRouter: _targetRouter,
      intermediateToken: _intermediateToken,
      firstPath: _firstPath,
      secondPath: _secondPath,
      slippageBps: _slippageBps,
      initiator: msg.sender // Store the transaction initiator
    });

    // Encode parameters for the flash loan callback
    bytes memory params = abi.encode(arbParams);
    emit OperationStep("Custom Params Encoded");

    // Fetch the Aave Pool and initiate flash loan
    IPool pool = IPool(MAINNET_POOL_ADDRESS);
    emit OperationStep("Got Pool Address in requestFlashLoanWithCustomPaths (Hardcoded)");

    // Re-check router approval just before call
    require(approvedRouters[_sourceRouter], "Custom Source Router Not Approved (Pre-call Check)");
    require(approvedRouters[_targetRouter], "Custom Target Router Not Approved (Pre-call Check)");
    emit OperationStep("Custom Router Approval Re-checked");

    emit OperationStep("Calling pool.flashLoanSimple (Custom)");
    pool.flashLoanSimple(address(this), _asset, _amount, params, 0);
    emit OperationStep("Finished requestFlashLoanWithCustomPaths (after pool call)");
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
    return address(ADDRESSES_PROVIDER); // Access inherited variable
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
   * @param _slippageBps Slippage tolerance in basis points (1 BPS = 0.01%)
   * @return amountOutMin The minimum acceptable output amount
   */
  function _getMinAmountOut(
    address _router,
    uint _amountIn,
    address[] memory _path,
    uint256 _slippageBps
  ) internal returns (uint amountOutMin) {
    require(_path.length >= 2, "Path must have at least 2 tokens");

    uint[] memory expectedAmounts;
    try IUniswapV2Router02(_router).getAmountsOut(_amountIn, _path) returns (
      uint[] memory _expectedAmounts
    ) {
      expectedAmounts = _expectedAmounts;
    } catch {
      emit ErrorMessage("getAmountsOut call failed on router");
      revert ArbitrageSwapFailed("getAmountsOut call failed");
    }

    if (expectedAmounts.length != _path.length) {
      emit ErrorMessage("getAmountsOut returned unexpected array length");
      revert ArbitrageSwapFailed("getAmountsOut returned unexpected array length");
    }

    uint expectedAmountOut = expectedAmounts[expectedAmounts.length - 1];
    amountOutMin = (expectedAmountOut * (MAX_BPS - _slippageBps)) / MAX_BPS;

    if (amountOutMin == 0) {
      emit ErrorMessage("Calculated min output is zero");
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
