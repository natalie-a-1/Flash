// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "./interfaces/IERC20.sol"; // Remove local import
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Use OpenZeppelin import
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IWETH.sol";

contract UniswapInteractor {
    // Uniswap V2 Router address for Sepolia testnet
    address private constant UNISWAP_V2_ROUTER = 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008;
    
    IUniswapV2Router02 public immutable uniswapRouter;

    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256[] amounts
    );

    event SwapFailed( 
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        string reason
    );

    constructor() {
        uniswapRouter = IUniswapV2Router02(UNISWAP_V2_ROUTER);
    }

    /**
     * @notice Swaps an exact amount of input tokens for as many output tokens as possible.
     * @param _tokenIn The address of the input token.
     * @param _tokenOut The address of the output token.
     * @param _amountIn The exact amount of input tokens to send.
     * @param _amountOutMin The minimum amount of output tokens that must be received for the swap to succeed (slippage control).
     * @param _to The address that will receive the output tokens.
     * @param _deadline The timestamp after which the transaction will revert.
     */
    function swapExactTokensForTokens(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address _to,
        uint256 _deadline
    ) external returns (uint256[] memory amounts) {
        require(_tokenIn != address(0), "UniswapInteractor: INVALID_INPUT_TOKEN");
        require(_tokenOut != address(0), "UniswapInteractor: INVALID_OUTPUT_TOKEN");
        require(_amountIn > 0, "UniswapInteractor: INVALID_AMOUNT_IN");
        require(_to != address(0), "UniswapInteractor: INVALID_RECEIVER");
        require(block.timestamp <= _deadline, "UniswapInteractor: EXPIRED_DEADLINE");

        // Approve the router to spend the input token on behalf of this contract
        // This requires the contract itself to hold the _tokenIn
        // Alternatively, the user could approve the router directly and this contract calls transferFrom
        // For simplicity here, we assume the contract holds the tokens and approves the router.
        IERC20(_tokenIn).approve(address(uniswapRouter), _amountIn);

        // Define the swap path
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        // Execute the swap
        try uniswapRouter.swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            _deadline
        ) returns (uint256[] memory receivedAmounts) {
            amounts = receivedAmounts;
            // Optional: Add further checks on receivedAmounts if needed
            require(amounts[amounts.length - 1] >= _amountOutMin, "UniswapInteractor: INSUFFICIENT_OUTPUT_AMOUNT");
            emit SwapExecuted(_tokenIn, _tokenOut, _amountIn, _amountOutMin, amounts);
            return amounts;
        } catch Error(string memory reason) {
            // Catch low-level errors from the router call
            emit SwapFailed(_tokenIn, _tokenOut, _amountIn, _amountOutMin, reason);
            revert(string(abi.encodePacked("UniswapInteractor: SWAP_FAILED - ", reason)));
        } catch (bytes memory /*lowLevelData*/) {
            // Catch other potential errors
             emit SwapFailed(_tokenIn, _tokenOut, _amountIn, _amountOutMin, "Unknown low-level error");
            revert("UniswapInteractor: SWAP_FAILED_LOW_LEVEL");
        }
    }

    /**
     * @notice Returns the minimum amount of output tokens that can be received for a given amount of input tokens.
     * @param _tokenIn The address of the input token.
     * @param _tokenOut The address of the output token.
     * @param _amountIn The amount of input tokens.
     * @return amounts The array containing input amount and output amount.
     */
    function getAmountsOut(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) public view returns (uint256[] memory amounts) {
        require(_tokenIn != address(0), "UniswapInteractor: INVALID_INPUT_TOKEN");
        require(_tokenOut != address(0), "UniswapInteractor: INVALID_OUTPUT_TOKEN");
        require(_amountIn > 0, "UniswapInteractor: INVALID_AMOUNT_IN");
        
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        amounts = uniswapRouter.getAmountsOut(_amountIn, path);
    }

    // --- Helper functions (Optional) ---

    // Function to allow owner to withdraw accidentally sent ERC20 tokens
    // function withdrawTokens(address _tokenAddress, address _to, uint256 _amount) external onlyOwner { // Assuming Ownable
    //     require(_tokenAddress != address(0), "Cannot withdraw Ether");
    //     IERC20 token = IERC20(_tokenAddress);
    //     token.transfer(_to, _amount);
    // }

    // Function to allow owner to withdraw accidentally sent Ether
    // function withdrawEther(address payable _to, uint256 _amount) external onlyOwner { // Assuming Ownable
    //     (bool success, ) = _to.call{value: _amount}("");
    //     require(success, "Ether transfer failed");
    // }

    // Receive function to accept Ether (if needed for WETH interactions)
    // receive() external payable {}
} 