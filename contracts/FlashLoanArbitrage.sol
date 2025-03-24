// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlashLoanArbitrage
 * @dev A contract that performs arbitrage between Uniswap and Sushiswap using Aave flash loans.
 * This contract takes advantage of price differences between DEXes without requiring upfront capital
 * by borrowing assets through flash loans, executing trades, and repaying the loan in a single transaction.
 */

// Interface for getting the Aave lending pool address
interface ILendingPoolAddressesProvider {
    /**
     * @dev Returns the address of the LendingPool contract
     * @return The lending pool address
     */
    function getLendingPool() external view returns (address);
}

// Interface for interacting with Aave's lending pool to get flash loans
interface ILendingPool {
    /**
     * @dev Allows users to borrow a specific amount of the reserve asset
     * @param receiverAddress The address of the contract receiving the funds
     * @param assets The addresses of the assets being flash-borrowed
     * @param amounts The amounts of the assets being flash-borrowed
     * @param modes The modes of the flash loans (0 = no debt is created)
     * @param onBehalfOf The address that will receive the debt in case of mode = 1 or 2
     * @param params Encoded parameters to pass to the receiver contract
     * @param referralCode Code used to register the integrator originating the operation
     */
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

// Interface for Uniswap V2 Router (also compatible with Sushiswap)
interface IUniswapV2Router {
    /**
     * @dev Swaps an exact amount of input tokens for as many output tokens as possible
     * @param amountIn The amount of input tokens to send
     * @param amountOutMin The minimum amount of output tokens to receive
     * @param path Array of token addresses representing the swap path
     * @param to Recipient of the output tokens
     * @param deadline Unix timestamp after which the transaction will revert
     * @return amounts The input and output amounts
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    /**
     * @dev Given an input amount of an asset and a path, returns the maximum output amount
     * @param amountIn The amount of input tokens
     * @param path Array of token addresses representing the swap path
     * @return amounts The input and expected output amounts for each token in the path
     */
    function getAmountsOut(
        uint amountIn, 
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

// Interface required by Aave to receive flash loans
interface IFlashLoanReceiver {
    /**
     * @dev Called by the lending pool after transferring the flash-borrowed assets
     * @param assets Addresses of the assets being flash-borrowed
     * @param amounts Amounts of the assets being flash-borrowed
     * @param premiums Fees to be paid on top of the borrowed amounts
     * @param initiator Address initiating the flash loan
     * @param params Additional encoded parameters
     * @return Boolean indicating if the execution was successful
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

contract FlashLoanArbitrage is IFlashLoanReceiver, Ownable {
    // Addresses of contracts we'll interact with
    address public lendingPoolAddressProvider; // Aave address provider to get lending pool
    address public uniswapRouterAddress;       // Uniswap router for swaps
    address public sushiswapRouterAddress;     // Sushiswap router for swaps
    
    // Events for logging important actions
    event ArbitrageExecuted(uint256 profit);  // Emitted when arbitrage is successful, includes profit amount
    event FlashLoanInitiated(address[] tokens, uint256[] amounts); // Emitted when flash loan is requested
    
    /**
     * @dev Sets up the contract with necessary addresses
     * @param _lendingPoolAddressProvider Address of Aave's LendingPoolAddressesProvider
     * @param _uniswapRouterAddress Address of Uniswap V2 Router
     * @param _sushiswapRouterAddress Address of Sushiswap Router
     */
    constructor(
        address _lendingPoolAddressProvider,
        address _uniswapRouterAddress,
        address _sushiswapRouterAddress
    ) Ownable(msg.sender) {
        lendingPoolAddressProvider = _lendingPoolAddressProvider;
        uniswapRouterAddress = _uniswapRouterAddress;
        sushiswapRouterAddress = _sushiswapRouterAddress;
    }
    
    /**
     * @dev Initiates a flash loan from Aave
     * @param token Address of the token to borrow
     * @param amount Amount of the token to borrow
     * @param params Encoded parameters (contains the trading paths for arbitrage)
     *
     * This function is the entry point for the arbitrage. It requests a flash loan
     * from Aave, which will then call back to executeOperation when the funds are received.
     * Only the contract owner can call this function.
     */
    function initiateFlashLoan(
        address token,
        uint256 amount,
        bytes calldata params
    ) external onlyOwner {
        // Set up the arrays for flash loan request
        // We're only borrowing a single token type in this implementation
        address[] memory assets = new address[](1);
        assets[0] = token;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        
        // 0 = no debt is created (pure flash loan)
        // 1 = stable rate loan
        // 2 = variable rate loan
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0; // No debt - just flash loan
        
        // Get the lending pool address from the provider
        address lendingPool = ILendingPoolAddressesProvider(lendingPoolAddressProvider).getLendingPool();
        
        // Log that we're initiating a flash loan
        emit FlashLoanInitiated(assets, amounts);
        
        // Request the flash loan from Aave
        // When the loan is issued, Aave will call executeOperation on this contract
        ILendingPool(lendingPool).flashLoan(
            address(this),    // Receiver address (this contract)
            assets,           // Array of assets to borrow
            amounts,          // Array of amounts to borrow
            modes,            // Array of modes (0 = flash loan)
            address(this),    // On behalf of this contract
            params,           // Encoded parameters (trading paths)
            0                 // Referral code (0 = no referral)
        );
    }
    
    /**
     * @dev This function is called by Aave after we receive the flash loaned funds
     * @param assets Addresses of the assets being flash-borrowed
     * @param amounts Amounts of the assets being flash-borrowed
     * @param premiums Fees to be paid on top of the borrowed amounts
     * @param initiator Address that initiated the flash loan
     * @param params Additional encoded parameters (trading paths)
     * @return Boolean indicating if the execution was successful
     *
     * This is the core function where the arbitrage logic is executed:
     * 1. Verify the caller is the lending pool
     * 2. Decode trading paths from params
     * 3. Execute the arbitrage trades
     * 4. Approve the lending pool to withdraw the borrowed amount + fee
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Security check: ensure the function is called by the lending pool
        address lendingPool = ILendingPoolAddressesProvider(lendingPoolAddressProvider).getLendingPool();
        require(msg.sender == lendingPool, "Caller must be lending pool");
        
        // Decode the params to get trading paths
        // path: Token0 -> Token1 (e.g., DAI -> WETH)
        // reversePath: Token1 -> Token0 (e.g., WETH -> DAI)
        (address[] memory path, address[] memory reversePath) = abi.decode(params, (address[], address[]));
        
        // Security check: ensure the borrowed token matches the start of our trading path
        require(assets[0] == path[0], "Borrowed token must match path start");
        
        // The amount we borrowed
        uint256 amountIn = amounts[0];
        
        // Calculate the total amount we need to repay (loan + fee)
        uint256 totalDebt = amounts[0] + premiums[0];
        
        // Approve the Uniswap router to spend our borrowed tokens
        IERC20(assets[0]).approve(uniswapRouterAddress, amountIn);
        
        // Execute the arbitrage between the two exchanges
        bool arbitrageSuccess = executeArbitrage(
            assets[0],   // Input token (borrowed token)
            amountIn,    // Amount of tokens borrowed
            path,        // First trading path (e.g., DAI -> WETH)
            reversePath  // Second trading path (e.g., WETH -> DAI)
        );
        
        // If arbitrage wasn't profitable, revert the entire transaction
        // This prevents executing unprofitable trades
        require(arbitrageSuccess, "Arbitrage did not yield profit");
        
        // Approve the lending pool to withdraw the borrowed amount plus fees
        // This is necessary for the flash loan repayment
        IERC20(assets[0]).approve(lendingPool, totalDebt);
        
        // Return true to indicate successful execution
        // Aave will then pull the loan amount + fee from this contract
        return true;
    }
    
    /**
     * @dev Executes the arbitrage between Uniswap and Sushiswap
     * @param tokenIn The address of the input token (borrowed token)
     * @param amountIn The amount of input tokens
     * @param path The forward trading path (e.g., TokenA -> TokenB)
     * @param reversePath The reverse trading path (e.g., TokenB -> TokenA)
     * @return Boolean indicating if the arbitrage was profitable
     *
     * This function:
     * 1. Checks prices on both Uniswap and Sushiswap
     * 2. Executes a trade on the exchange with better prices
     * 3. Takes the proceeds and trades back on the other exchange
     * 4. Determines if a profit was made and returns the result
     */
    function executeArbitrage(
        address tokenIn,
        uint256 amountIn,
        address[] memory path,
        address[] memory reversePath
    ) internal returns (bool) {
        // Record the initial balance to later calculate profit
        uint256 initialBalance = IERC20(tokenIn).balanceOf(address(this));
        
        // Get router interfaces for both exchanges
        IUniswapV2Router uniswapRouter = IUniswapV2Router(uniswapRouterAddress);
        IUniswapV2Router sushiswapRouter = IUniswapV2Router(sushiswapRouterAddress);
        
        // Check how much TokenB we would get for TokenA on Uniswap
        uint256[] memory uniswapAmountsOut = uniswapRouter.getAmountsOut(amountIn, path);
        uint256 uniswapExpectedOut = uniswapAmountsOut[uniswapAmountsOut.length - 1];
        
        // Check how much TokenB we would get for TokenA on Sushiswap
        uint256[] memory sushiswapAmountsOut = sushiswapRouter.getAmountsOut(amountIn, path);
        uint256 sushiswapExpectedOut = sushiswapAmountsOut[sushiswapAmountsOut.length - 1];
        
        // Compare which exchange offers better rates for the first swap
        if (uniswapExpectedOut > sushiswapExpectedOut) {
            // Uniswap gives better rates for the first trade (TokenA -> TokenB)
            
            // Buy TokenB with TokenA on Uniswap
            uniswapRouter.swapExactTokensForTokens(
                amountIn,
                1, // Accept any amount out (minimum 1 wei) - we already checked the expected output
                path,
                address(this), // Send tokens to this contract
                block.timestamp + 3600 // Set deadline 1 hour from now
            );
            
            // Get the amount of intermediate token (TokenB) we received
            uint256 intermediateBalance = IERC20(path[path.length - 1]).balanceOf(address(this));
            
            // Approve Sushiswap to spend our intermediate token (TokenB)
            IERC20(path[path.length - 1]).approve(sushiswapRouterAddress, intermediateBalance);
            
            // Sell TokenB for TokenA on Sushiswap
            sushiswapRouter.swapExactTokensForTokens(
                intermediateBalance,
                1, // Accept any amount out (minimum 1 wei)
                reversePath,
                address(this), // Send tokens to this contract
                block.timestamp + 3600 // Set deadline 1 hour from now
            );
        } else {
            // Sushiswap gives better rates for the first trade (TokenA -> TokenB)
            
            // Buy TokenB with TokenA on Sushiswap
            sushiswapRouter.swapExactTokensForTokens(
                amountIn,
                1, // Accept any amount out (minimum 1 wei)
                path,
                address(this), // Send tokens to this contract
                block.timestamp + 3600 // Set deadline 1 hour from now
            );
            
            // Get the amount of intermediate token (TokenB) we received
            uint256 intermediateBalance = IERC20(path[path.length - 1]).balanceOf(address(this));
            
            // Approve Uniswap to spend our intermediate token (TokenB)
            IERC20(path[path.length - 1]).approve(uniswapRouterAddress, intermediateBalance);
            
            // Sell TokenB for TokenA on Uniswap
            uniswapRouter.swapExactTokensForTokens(
                intermediateBalance,
                1, // Accept any amount out (minimum 1 wei)
                reversePath,
                address(this), // Send tokens to this contract
                block.timestamp + 3600 // Set deadline 1 hour from now
            );
        }
        
        // Check our final balance of the original token
        uint256 finalBalance = IERC20(tokenIn).balanceOf(address(this));
        
        // Calculate profit (if any)
        uint256 profit = finalBalance > initialBalance ? finalBalance - initialBalance : 0;
        
        // If we made a profit, emit an event and return success
        if (profit > 0) {
            emit ArbitrageExecuted(profit);
            return true;
        }
        
        // Return false if no profit was made
        return false;
    }
    
    /**
     * @dev Allows the owner to withdraw tokens from the contract
     * @param token The address of the token to withdraw
     *
     * This function lets the owner extract accumulated profits or
     * rescue tokens that may have been sent to the contract.
     */
    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        // Transfer all tokens to the owner
        IERC20(token).transfer(owner(), balance);
    }
    
    /**
     * @dev Allows the contract to receive ETH
     * This is required in case the contract needs to work with ETH directly
     */
    receive() external payable {}
} 