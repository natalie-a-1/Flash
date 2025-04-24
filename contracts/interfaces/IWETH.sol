// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "./IERC20.sol"; // Remove local import
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Use OpenZeppelin import

// Minimal interface for WETH (Wrapped Ether) contract
// Includes standard ERC20 functions plus deposit and withdraw
interface IWETH is IERC20 {
  /**
   * @dev Deposits Ether into the contract, receiving WETH tokens in return.
   */
  function deposit() external payable;

  /**
   * @dev Withdraws Ether from the contract by burning WETH tokens.
   * @param wad The amount of WETH tokens to burn (and ETH to receive).
   */
  function withdraw(uint wad) external;
}
