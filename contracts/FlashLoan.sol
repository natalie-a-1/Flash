// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// ===================================================================
// Imports
// ===================================================================
import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// IFlashLoanReceiver interface is implicitly inherited via FlashLoanSimpleReceiverBase
// import {IFlashLoanReceiver} from "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanReceiver.sol";

// ===================================================================
// Interfaces
// ===================================================================

/**
 * @title IUniswapV2Router02 Interface
 * @notice Minimal interface for Uniswap V2 Router, containing only functions used.
 */
interface IUniswapV2Router02 {
    /**
     * @notice Swaps an exact amount of input tokens for as many output tokens as possible.
     * @param amountIn The amount of input tokens to send.
     * @param amountOutMin The minimum amount of output tokens that must be received for the transaction not to revert.
     * @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist.
     * @param to Recipient of the output tokens.
     * @param deadline Unix timestamp after which the transaction will revert.
     * @return amounts The input token amount and all subsequent output token amounts.
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /**
     * @notice Returns the minimum amount of output tokens that can be received for a given amount of input tokens.
     * @param amountIn The amount of input tokens.
     * @param path An array of token addresses representing the swap route.
     * @return amounts An array of token amounts, where amounts[0] is amountIn and amounts[path.length - 1] is the calculated output amount.
     */
    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);

    /**
     * @notice Returns the address of the WETH token contract.
     * @return The WETH address.
     */
    function WETH() external pure returns (address);
}

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
 * @author Your Name/Organization (or remove)
 */
contract FlashLoan is FlashLoanSimpleReceiverBase {
    // ===================================================================
    // State Variables
    // ===================================================================

    // --- Owner --- 
    address private immutable i_owner;

    // --- Configuration: Sepolia Addresses ---
    // @dev Ensure these addresses are correct for the target network (Sepolia).
    address private immutable USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address private immutable WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address private immutable UNISWAP_V2_ROUTER = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;
    address private immutable SUSHISWAP_V2_ROUTER = 0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791;

    // --- Configuration: Swap Parameters ---
    uint256 private constant SWAP_DEADLINE_OFFSET = 600; // 10 minutes from block timestamp
    uint256 private constant SLIPPAGE_TOLERANCE_BPS = 50; // 0.5% expressed in basis points (1 BPS = 0.01%)

    // ===================================================================
    // Errors
    // ===================================================================
    error NotOwner(); // Caller is not the owner.
    error InvalidAsset(); // Flash loan requested for an asset other than USDC.
    error ArbitrageFailed(); // Arbitrage execution failed (e.g., swap revert, insufficient balance).
    error RepayFailed(); // Final approval step for Aave Pool failed.
    error TransferFailed(); // ERC20 or Ether withdrawal failed.

    // ===================================================================
    // Constructor
    // ===================================================================

    /**
     * @notice Sets up the contract, linking it to the Aave V3 Pool Addresses Provider.
     * @param _poolAddressesProvider The address of the Aave V3 IPoolAddressesProvider contract (for Sepolia).
     */
    constructor(address _poolAddressesProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_poolAddressesProvider))
    {
        i_owner = msg.sender;
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
     * @param initiator The address that initiated the flash loan request (unused in this implementation).
     * @param params Arbitrary data passed during the `flashLoanSimple` call (unused in this implementation).
     * @return bool Returns `true` if the operation and repayment approval were successful.
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator, // Kept for interface compatibility
        bytes calldata params // Kept for interface compatibility
    ) external override returns (bool) {
        // 1. Input Validation
        if (asset != USDC) revert InvalidAsset(); // Strategy only supports USDC
        uint256 amountToRepay = amount + premium;

        // --- Start Arbitrage Logic ---
        // Note: Gas costs are NOT accounted for in this on-chain logic.
        // Real profitability must consider transaction fees evaluated off-chain.

        // 2. Uniswap Trade (USDC -> WETH)
        uint256 wethReceived; // Declare variable to store received WETH
        {
            // Scope limited variables for Uniswap swap
            address[] memory path = new address[](2);
            path[0] = USDC;
            path[1] = WETH;

            // Approve router
            require(IERC20(USDC).approve(UNISWAP_V2_ROUTER, amount), "Approve Uniswap failed");

            // Calculate minimum output with slippage
            uint[] memory expectedAmounts = IUniswapV2Router02(UNISWAP_V2_ROUTER).getAmountsOut(amount, path);
            if (expectedAmounts.length != 2) revert ArbitrageFailed(); // Should not happen with valid path
            uint expectedWethOut = expectedAmounts[1];
            uint amountOutMin = (expectedWethOut * (10000 - SLIPPAGE_TOLERANCE_BPS)) / 10000;
            if (amountOutMin == 0) revert ArbitrageFailed(); // Calculation error or extreme slippage expected

            // Perform swap
            uint[] memory actualAmounts;
            try IUniswapV2Router02(UNISWAP_V2_ROUTER).swapExactTokensForTokens(
                amount,
                amountOutMin,
                path,
                address(this),
                block.timestamp + SWAP_DEADLINE_OFFSET
            ) returns (uint[] memory _actualAmounts) {
                actualAmounts = _actualAmounts;
            } catch {
                revert ArbitrageFailed(); // Uniswap swap reverted
            }
            if (actualAmounts.length != 2) revert ArbitrageFailed(); // Unexpected return from swap
            wethReceived = actualAmounts[1];

            // Sanity check (optional, router enforces amountOutMin)
            if (wethReceived < amountOutMin) revert ArbitrageFailed(); // Received less than minimum despite router check
        }

        // 3. SushiSwap Trade (WETH -> USDC)
        {
            // Scope limited variables for SushiSwap swap
            address[] memory path = new address[](2);
            path[0] = WETH;
            path[1] = USDC;

            // Approve router
            require(IERC20(WETH).approve(SUSHISWAP_V2_ROUTER, wethReceived), "Approve SushiSwap failed");

            // Calculate minimum output with slippage
            uint[] memory expectedAmounts = IUniswapV2Router02(SUSHISWAP_V2_ROUTER).getAmountsOut(wethReceived, path);
            if (expectedAmounts.length != 2) revert ArbitrageFailed();
            uint expectedUsdcOut = expectedAmounts[1];
            uint amountOutMin = (expectedUsdcOut * (10000 - SLIPPAGE_TOLERANCE_BPS)) / 10000;
             if (amountOutMin == 0) revert ArbitrageFailed();

            // Perform swap
            try IUniswapV2Router02(SUSHISWAP_V2_ROUTER).swapExactTokensForTokens(
                wethReceived,
                amountOutMin,
                path,
                address(this),
                block.timestamp + SWAP_DEADLINE_OFFSET
            ) {
                // Return value not strictly needed as we check final balance
            } catch {
                revert ArbitrageFailed(); // SushiSwap swap reverted
            }
        }

        // --- End Arbitrage Logic ---

        // 4. Repayment Check & Approval
        uint256 finalUsdcBalance = IERC20(USDC).balanceOf(address(this));
        if (finalUsdcBalance < amountToRepay) {
             revert ArbitrageFailed(); // Insufficient final balance for repayment
        }

        // Approve the Aave Pool to pull the repayment amount
        if (!IERC20(USDC).approve(address(POOL), amountToRepay)) {
            revert RepayFailed(); // Approval for repayment failed
        }

        return true;
    }

    // ===================================================================
    // External Functions
    // ===================================================================

    /**
     * @notice Initiates an Aave V3 flash loan for USDC.
     * @dev Triggers the flash loan process; `executeOperation` will be called by Aave.
     * @param _amount The amount of USDC to borrow.
     */
    function requestFlashLoan(uint256 _amount) external {
        // Only allow borrowing the configured asset (USDC)
        address receiverAddress = address(this);
        address asset = USDC;
        uint256 amount = _amount;
        bytes memory params = ""; // No parameters needed for this simple receiver
        uint16 referralCode = 0; // No referral

        // Call Aave Pool's flashLoanSimple function
        POOL.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
    }

    // ===================================================================
    // Owner Functions
    // ===================================================================

    /**
     * @notice Allows the owner to withdraw accumulated ERC20 tokens (e.g., profit) from this contract.
     * @param _tokenAddress The address of the ERC20 token to withdraw.
     */
    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            bool success = token.transfer(i_owner, balance);
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @notice Allows the owner to withdraw accumulated Ether from this contract.
     */
    function withdrawEther() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = i_owner.call{value: balance}("");
            if (!success) revert TransferFailed();
        }
    }

    // ===================================================================
    // Modifiers
    // ===================================================================

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert NotOwner();
        }
        _;
    }

    // ===================================================================
    // Fallback/Receive
    // ===================================================================

    /**
     * @dev Allows the contract to receive Ether (e.g., if accidentally sent).
     */
    receive() external payable {}

    /**
     * @dev Fallback function (also allows receiving Ether).
     */
    fallback() external payable {}

    // ===================================================================
    // Getters
    // ===================================================================

    /**
     * @notice Gets the owner address of the contract.
     * @return The address of the owner.
     */
    function getOwner() external view returns (address) {
        return i_owner;
    }

    /**
     * @notice Gets the configured Aave Pool Addresses Provider address.
     * @dev Accesses the inherited ADDRESSES_PROVIDER state variable.
     * @return The address of the Pool Addresses Provider.
     */
    function getPoolProviderAddress() external view returns (address) {
        return address(ADDRESSES_PROVIDER);
    }

    /**
     * @notice Gets the configured USDC token address (Sepolia).
     * @return The address of the USDC token.
     */
    function getUsdcAddress() external view returns (address) { return USDC; }

    /**
     * @notice Gets the configured WETH token address (Sepolia).
     * @return The address of the WETH token.
     */
    function getWethAddress() external view returns (address) { return WETH; }

    /**
     * @notice Gets the configured Uniswap V2 Router address (Sepolia).
     * @return The address of the Uniswap V2 Router.
     */
    function getUniswapRouterAddress() external view returns (address) { return UNISWAP_V2_ROUTER; }

    /**
     * @notice Gets the configured SushiSwap V2 Router address (Sepolia).
     * @return The address of the SushiSwap V2 Router.
     */
    function getSushiSwapRouterAddress() external view returns (address) { return SUSHISWAP_V2_ROUTER; }
} 