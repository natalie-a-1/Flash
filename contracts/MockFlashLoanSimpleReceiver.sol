// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockFlashLoanSimpleReceiver
 * @notice A simple mock implementation of the Aave FlashLoanSimpleReceiverBase for testing
 * @dev This contract implements the barebone functionality needed for flash loan testing
 */
contract MockFlashLoanSimpleReceiver is FlashLoanSimpleReceiverBase {
    // Owner of the contract
    address private immutable owner;
    
    // Event to track execution of operations
    event ExecutionCompleted(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bool success
    );
    
    // Errors
    error NotOwner();
    error TransferFailed();
    
    /**
     * @notice Sets up the contract, linking it to Aave
     * @param _poolAddressesProvider The address of the Aave V3 IPoolAddressesProvider contract
     */
    constructor(
        address _poolAddressesProvider
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_poolAddressesProvider)) {
        owner = msg.sender;
    }
    
    /**
     * @notice The core function called by the Aave Pool after transferring the flash loan funds
     * @dev This is a mock implementation that simply approves the repayment
     * @param asset The address of the borrowed token
     * @param amount The amount of the token borrowed
     * @param premium The fee charged by Aave for the flash loan
     * @param initiator The address that initiated the flash loan request
     * @param params Additional parameters (unused in this mock)
     * @return bool Returns `true` if the operation was successful
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Calculate total repayment amount
        uint256 amountToRepay = amount + premium;
        
        // Approve the Pool to pull the repayment amount
        IERC20(asset).approve(address(POOL), amountToRepay);
        
        // Emit event for tracking
        emit ExecutionCompleted(
            asset,
            amount,
            premium,
            initiator,
            true
        );
        
        return true;
    }
    
    /**
     * @notice Initiates a flash loan request to the Aave Pool
     * @param _asset Address of the asset to borrow
     * @param _amount Amount to borrow
     */
    function requestFlashLoan(
        address _asset,
        uint256 _amount
    ) external onlyOwner {
        // Call the Aave Pool's flashLoanSimple function
        // Using empty params as we don't need any extra data for the mock
        POOL.flashLoanSimple(address(this), _asset, _amount, "", 0);
    }
    
    /**
     * @notice Withdraw accumulated tokens (e.g., accidentally sent tokens)
     * @param _tokenAddress The address of the ERC20 token to withdraw
     */
    function withdrawToken(address _tokenAddress) external onlyOwner {
        uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
        if (balance > 0) {
            bool sent = IERC20(_tokenAddress).transfer(owner, balance);
            if (!sent) revert TransferFailed();
        }
    }
    
    /**
     * @dev Throws if called by any account other than the owner
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    /**
     * @notice Allows receiving ETH
     */
    receive() external payable {}
} 