// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Import the base contract for simple flash loans
import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// IFlashLoanReceiver interface is implicitly inherited via FlashLoanSimpleReceiverBase
// import {IFlashLoanReceiver} from "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanReceiver.sol";

/**
 * @title FlashLoan
 * @notice Implements a basic Aave V3 Flash Loan Receiver using SimpleFlashLoanReceiverBase.
 */
 // Inherit from FlashLoanSimpleReceiverBase instead of IFlashLoanReceiver directly
contract FlashLoan is FlashLoanSimpleReceiverBase {
    // i_poolAddressesProvider is now inherited as ADDRESSES_PROVIDER
    // address private immutable i_poolAddressesProvider;
    address private immutable i_owner;

    error NotOwner();

    /**
     * @param _poolAddressesProvider The address of the Aave V3 PoolAddressesProvider contract.
     */
     // Call the base contract's constructor
    constructor(address _poolAddressesProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_poolAddressesProvider))
    {
        // i_poolAddressesProvider = _poolAddressesProvider; // No longer needed
        i_owner = msg.sender;
    }

    /**
     * @dev This function is called by the Aave Pool contract after the flash loan funds have been transferred.
     * It contains the logic to execute with the borrowed funds and must repay the loan plus fees.
     * The signature matches FlashLoanSimpleReceiverBase.
     */
    function executeOperation(
        address asset, // Single asset
        uint256 amount, // Single amount
        uint256 premium, // Single premium
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Logic to execute with the borrowed funds goes here.
        // Examples: Arbitrage, collateral swap, liquidation, etc.
        // This part needs to be implemented based on the specific use case.

        // --- Start User Logic ---

        // --- End User Logic ---


        // Repay the loan plus the fee (premium)
        uint256 amountToRepay = amount + premium;
        // Use the POOL constant inherited from the base contract
        // address pool = IPoolAddressesProvider(i_poolAddressesProvider).getPool(); // No longer needed

        // Approve the Aave Pool to pull the funds back
        IERC20(asset).approve(address(POOL), amountToRepay);

        return true;
    }

    /**
     * @notice Initiates an Aave V3 flash loan for a single asset.
     * @param _token The address of the token to borrow.
     * @param _amount The amount of the token to borrow.
     */
    function requestFlashLoan(address _token, uint256 _amount) external {
         address receiverAddress = address(this);
         address asset = _token;
         uint256 amount = _amount;
         bytes memory params = ""; // Optional: Can pass data to executeOperation
         uint16 referralCode = 0;

        // Use the POOL constant inherited from the base contract
        // address pool = IPoolAddressesProvider(i_poolAddressesProvider).getPool(); // No longer needed

        // Use flashLoanSimple for single asset loans
         POOL.flashLoanSimple(
             receiverAddress,
             asset,
             amount,
             params,
             referralCode
         );

         /* // Previous multi-asset flashLoan call - keep for reference if needed
         // Define assets, amounts, and modes arrays
         address[] memory assets = new address[](1);
         assets[0] = asset;
         uint256[] memory amounts = new uint256[](1);
         amounts[0] = amount;
         // 0 = borrow amount specified, 1 = borrow total balance
         // Flashloans are typically mode 0 (no debt token)
         uint256[] memory modes = new uint256[](1);
         modes[0] = 0;

         // Call the flashLoan function on the Aave Pool
         IPool(pool).flashLoan(
             receiverAddress,
             assets,
             amounts,
             modes,
             address(this), // onBehalfOf - The contract itself or msg.sender? Using contract for now.
             params,
             referralCode
         );*/
    }

    /**
     * @notice Allows the owner to withdraw accumulated ERC20 tokens from this contract.
     * @param _tokenAddress The address of the ERC20 token to withdraw.
     */
    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            bool success = token.transfer(i_owner, balance);
            require(success, "Withdraw failed");
        }
    }

     /**
     * @notice Allows the owner to withdraw accumulated Ether from this contract.
     */
    function withdrawEther() external onlyOwner {
        uint256 balance = address(this).balance;
         if (balance > 0) {
            (bool success, ) = i_owner.call{value: balance}("");
            require(success, "Ether withdraw failed");
        }
    }


    // Modifier to restrict functions to the owner
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert NotOwner();
        }
        _;
    }

    // Receive function to accept Ether
    receive() external payable {}
    fallback() external payable {}

    // --- Getters ---
    function getOwner() external view returns (address) {
        return i_owner;
    }

    // ADDRESSES_PROVIDER and POOL getters are inherited from FlashLoanSimpleReceiverBase
    /*
    function ADDRESSES_PROVIDER() external view returns (IPoolAddressesProvider) {
        return IPoolAddressesProvider(i_poolAddressesProvider);
    }

    function POOL() external view returns (IPool) {
        return IPool(IPoolAddressesProvider(i_poolAddressesProvider).getPool());
    }
    */

    // Keep this specific getter if needed elsewhere, although ADDRESSES_PROVIDER is available
    function getPoolProviderAddress() external view returns (address) {
        // Access inherited state variable
        return address(ADDRESSES_PROVIDER);
    }
} 