// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISushiSwapV2Router02.sol"; // Use SushiSwap Interface

/**
 * @title SushiSwap Interactor
 * @notice A simple contract to interact with the SushiSwap V2 Router.
 * @dev Designed for testing purposes, holds tokens and swaps them via SushiSwap.
 *      Requires funding with the input token before swapping.
 */
contract SushiSwapInteractor is Ownable {
  using SafeERC20 for IERC20;

  ISushiSwapV2Router02 public immutable sushiRouter; // Changed variable name and type

  // Sepolia SushiSwap V2 Router address (Replace if network changes)
  // Ensure this matches the address used in deployment scripts/tests
  address constant SUSHI_ROUTER_ADDRESS = 0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791;

  event SwapExecuted(
    address indexed tokenIn,
    address indexed tokenOut,
    uint256 amountIn,
    uint256[] amounts
  );

  // Custom Errors
  error InvalidRouterAddress();
  error InvalidTokenAddress();
  error TransferFailed();
  error InvalidPath();
  error ZeroAmount();
  error InsufficientInputBalance(address token, uint256 required, uint256 actual);
  error ApprovalFailed(address token, address spender);
  error ExpiredDeadline();
  error InsufficientOutputAmount();

  constructor() Ownable(msg.sender) {
    if (SUSHI_ROUTER_ADDRESS == address(0)) revert InvalidRouterAddress();
    sushiRouter = ISushiSwapV2Router02(SUSHI_ROUTER_ADDRESS);
  }

  /**
   * @notice Gets the expected output amounts for a given input amount and path via SushiSwap.
   * @param _tokenIn Address of the input token.
   * @param _tokenOut Address of the output token.
   * @param _amountIn Amount of the input token.
   * @return amounts Array containing input amount and output amount(s).
   */
  function getAmountsOut(
    address _tokenIn,
    address _tokenOut,
    uint256 _amountIn
  ) external view returns (uint256[] memory amounts) {
    if (_tokenIn == address(0) || _tokenOut == address(0)) revert InvalidTokenAddress();
    if (_amountIn == 0) revert ZeroAmount();

    address[] memory path = new address[](2);
    path[0] = _tokenIn;
    path[1] = _tokenOut;

    try sushiRouter.getAmountsOut(_amountIn, path) returns (uint256[] memory _amounts) {
      amounts = _amounts;
    } catch {
      revert("SushiSwapInteractor: GET_AMOUNTS_OUT_FAILED");
    }
  }

  /**
   * @notice Swaps an exact amount of input tokens for output tokens via SushiSwap.
   * @dev Contract must hold sufficient `_tokenIn` balance and approve the router.
   *      Only callable by the owner.
   * @param _tokenIn Address of the input token (contract must hold this).
   * @param _tokenOut Address of the output token.
   * @param _amountIn The exact amount of input tokens to swap.
   * @param _amountOutMin The minimum amount of output tokens acceptable.
   * @param _to The address to receive the output tokens.
   * @param _deadline Timestamp after which the transaction will revert.
   */
  function swapExactTokensForTokens(
    address _tokenIn,
    address _tokenOut,
    uint256 _amountIn,
    uint256 _amountOutMin,
    address _to,
    uint256 _deadline
  ) external onlyOwner {
    if (_tokenIn == address(0) || _tokenOut == address(0) || _to == address(0))
      revert InvalidTokenAddress();
    if (_amountIn == 0) revert ZeroAmount();
    if (_deadline < block.timestamp) revert ExpiredDeadline();

    IERC20 inputToken = IERC20(_tokenIn);
    uint256 contractBalance = inputToken.balanceOf(address(this));
    if (contractBalance < _amountIn) {
      revert InsufficientInputBalance(_tokenIn, _amountIn, contractBalance);
    }

    // Approve the SushiSwap router
    _safeApprove(_tokenIn, address(sushiRouter), _amountIn);

    address[] memory path = new address[](2);
    path[0] = _tokenIn;
    path[1] = _tokenOut;

    uint256[] memory amounts;
    try
      sushiRouter.swapExactTokensForTokens(_amountIn, _amountOutMin, path, _to, _deadline)
    returns (uint256[] memory _amounts) {
      amounts = _amounts;
    } catch Error(string memory reason) {
      // Catch specific Uniswap V2 errors if possible, otherwise generic revert
      if (
        keccak256(abi.encodePacked(reason)) ==
        keccak256(abi.encodePacked("UniswapV2Router: EXPIRED"))
      ) {
        revert ExpiredDeadline();
      } else if (
        keccak256(abi.encodePacked(reason)) ==
        keccak256(abi.encodePacked("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"))
      ) {
        revert InsufficientOutputAmount();
      }
      // Add more specific SushiSwap/UniswapV2 error catches if needed
      revert(string(abi.encodePacked("SushiSwapInteractor: SWAP_FAILED - ", reason)));
    } catch {
      revert("SushiSwapInteractor: SWAP_FAILED_UNKNOWN");
    }

    // If successful, emit event
    emit SwapExecuted(_tokenIn, _tokenOut, _amountIn, amounts);
  }

  /**
   * @notice Allows the owner to withdraw ERC20 tokens from this contract.
   * @param _tokenAddress The address of the ERC20 token to withdraw.
   * @param _amount The amount to withdraw. If 0, withdraws full balance.
   */
  function withdrawToken(address _tokenAddress, uint256 _amount) external onlyOwner {
    if (_tokenAddress == address(0)) revert InvalidTokenAddress();
    IERC20 token = IERC20(_tokenAddress);
    uint256 balance = token.balanceOf(address(this));
    uint256 amountToSend = _amount == 0 ? balance : _amount;

    if (amountToSend > balance) revert("Withdraw amount exceeds balance");
    if (amountToSend > 0) {
      token.safeTransfer(owner(), amountToSend);
    }
  }

  /**
   * @notice Allows the owner to withdraw Ether from this contract.
   */
  function withdrawEther() external onlyOwner {
    uint256 balance = address(this).balance;
    if (balance > 0) {
      (bool success, ) = owner().call{value: balance}("");
      if (!success) revert TransferFailed();
    }
  }

  // Internal function to safely approve spending tokens
  function _safeApprove(address _token, address _spender, uint256 _amount) internal {
    (bool success, bytes memory data) = _token.call(
      abi.encodeWithSelector(IERC20.approve.selector, _spender, _amount)
    );
    if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
      revert ApprovalFailed(_token, _spender);
    }
    // Some tokens (like USDT) require resetting allowance to 0 first if current allowance > 0
    // Consider adding that logic if interacting with such tokens. For WETH/USDC it's not needed.
  }

  // Receive function to accept Ether
  receive() external payable {}
}
