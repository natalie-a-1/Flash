# Flash Frontend

<div align="center">

  <h3><em>Beautiful interface for DeFi arbitrage</em></h3>
</div>

---

## Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🔗 Wallet Integration</h3>
      <p>Seamlessly connect your Ethereum wallet and manage your identity within the Flash ecosystem.</p>
      <ul>
        <li><strong>Status:</strong> ✓ Complete</li>
        <li><strong>Wallets:</strong> MetaMask, WalletConnect, Coinbase Wallet (beta)</li>
        <li><strong>Features:</strong> Auto-reconnect, chain detection, signing</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Real-time Dashboard</h3>
      <p>Monitor market conditions and arbitrage opportunities with live updates.</p>
      <ul>
        <li><strong>Status:</strong> ✓ Complete</li>
        <li><strong>Refresh Rate:</strong> 30-second intervals</li>
        <li><strong>Features:</strong> Price charts, gas monitoring, network status</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🔍 Arbitrage Discovery</h3>
      <p>Automatically identify profitable trading opportunities across supported exchanges based on real-time price data.</p>
      <ul>
        <li><strong>Status:</strong> ✓ Complete</li>
        <li><strong>Logic:</strong> Buys on DEX with highest WETH/USDC, sells on DEX with lowest WETH/USDC.</li>
        <li><strong>Exchanges:</strong> Uniswap V2/V3, SushiSwap (V3 display-only, execution limited to V2/Sushi)</li>
        <li><strong>Features:</strong> Profit calculation (including DEX fees, slippage, gas, flash loan premium), dynamic exchange filtering based on network.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>💸 Flash Loan Execution</h3>
      <p>Execute arbitrage opportunities with Aave V3 flash loans.</p>
      <ul>
        <li><strong>Status:</strong> ⚠️ Partially Complete</li>
        <li><strong>Working:</strong> Transaction submission, parameter configuration</li>
        <li><strong>In Progress:</strong> Batch transactions, transaction simulation</li>
      </ul>
    </td>
  </tr>
</table>

## Technical Architecture

### Data Flow

<ol>
  <li>
    <strong>Authentication Layer</strong>
    <ul>
      <li>Web3Provider establishes secure wallet connection</li>
      <li>Account & network information propagates to global context</li>
      <li>Protected routes ensure authenticated access</li>
    </ul>
  </li>
  <li>
    <strong>Price Monitoring System</strong>
    <ul>
      <li>Direct RPC calls to DEX contracts for real-time pricing</li>
      <li>WebSocket connections for live price updates</li>
      <li>Rate-limited updates to prevent excessive API calls</li>
    </ul>
  </li>
  <li>
    <strong>Transaction Pipeline</strong>
    <ul>
      <li>User input validation with comprehensive checks</li>
      <li>Gas optimization using current network conditions</li>
      <li>Transaction submission with receipt tracking</li>
      <li>Success/failure state management with user feedback</li>
    </ul>
  </li>
</ol>

### Key Components

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>Web3Provider.tsx</h4>
      <p><strong>Purpose:</strong> Centralized Web3 connection management using React Context.</p>
      <p><strong>Key Functions:</strong></p>
      <ul>
        <li><code>connectWallet()</code>: Initiates secure wallet connection</li>
        <li><code>disconnectWallet()</code>: Safely terminates connection</li>
        <li><code>switchNetwork(chainId)</code>: Handles network switching</li>
        <li><code>signMessage(message)</code>: Manages authentication signing</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>ArbitrageOpportunities.tsx</h4>
      <p><strong>Purpose:</strong> Discovers and displays profitable trading routes, dynamically filtering exchanges based on network.</p>
      <p><strong>Key Functions:</strong></p>
      <ul>
        <li><code>fetchPrices()</code>: Retrieves current DEX prices (WETH/USDC).</li>
        <li><code>findBestArbitragePath()</code>: Identifies optimal buy (highest WETH/USDC) and sell (lowest WETH/USDC) exchanges among visible ones.</li>
        <li>Displays correct "BEST BUY" / "BEST SELL" labels.</li>
        <li>Calculates potential % profit using <code>calculateArbitragePercentage</code>.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>ArbitrageProfitCalculator.tsx</h4>
      <p><strong>Purpose:</strong> Calculates detailed profit estimates based on user inputs and selected path.</p>
      <p><strong>Key Functions:</strong></p>
      <ul>
        <li>Uses <code>useArbitrageCalculator</code> hook.</li>
        <li>Accepts user input for slippage and profit threshold.</li>
        <li>Displays estimated profit/loss, ROI, flash loan fee, gas estimate, and specific buy/sell DEX fees.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>useArbitrageCalculator.ts</h4>
      <p><strong>Purpose:</strong> Custom hook for arbitrage calculations.</p>
      <p><strong>Key Functions:</strong></p>
      <ul>
        <li>Takes loan amount, buy/sell prices, specific buy/sell DEX fees (<code>buyFeePct</code>, <code>sellFeePct</code>), slippage, gas cost, threshold, flash loan bps.</li>
        <li>Uses <code>calcArbUsdc</code> utility for core calculation.</li>
        <li>Returns potential profit, profitability flag, ROI.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>FlashLoanOptions.tsx</h4>
      <p><strong>Purpose:</strong> Interface for configuring and executing flash loans.</p>
      <p><strong>Key Functions:</strong></p>
      <ul>
        <li><code>validateInputs()</code>: Ensures parameter validity</li>
        <li><code>estimateGas()</code>: Calculates transaction costs</li>
        <li><code>buildTransaction()</code>: Assembles transaction data</li>
        <li><code>executeFlashLoan()</code>: Submits transaction to wallet</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>TransactionFees.tsx</h4>
      <p><strong>Purpose:</strong> Displays network fees and cost estimates.</p>
      <p><strong>Key Functions:</strong></p>
      <ul>
        <li>Gas price monitoring from network oracle</li>
        <li>Historical transaction data analysis</li>
        <li>Cost projection based on current conditions</li>
        <li>15-second refresh interval for latest data</li>
      </ul>
    </td>
  </tr>
</table>

## Technology Stack

<div align="center">
  <table>
    <tr>
      <td align="center" width="20%">
        <!-- <img src="./public/nextjs_icon.png" width="48" height="48" /> -->
        <br />
        <strong>Next.js</strong><br />
        <small>15.3.0</small>
      </td>
      <td align="center" width="20%">
        <!-- <img src="./public/react_icon.png" width="48" height="48" /> -->
        <br />
        <strong>React</strong><br />
        <small>19.0.0</small>
      </td>
      <td align="center" width="20%">
        <!-- <img src="./public/tailwind_icon.png" width="48" height="48" /> -->
        <br />
        <strong>TailwindCSS</strong><br />
        <small>3.4.17</small>
      </td>
      <td align="center" width="20%">
        <!-- <img src="./public/ethers_icon.png" width="48" height="48" /> -->
        <br />
        <strong>ethers.js</strong><br />
        <small>5.8.0</small>
      </td>
      <td align="center" width="20%">
        <!-- <img src="./public/aave_icon.png" width="48" height="48" /> -->
        <br />
        <strong>Aave</strong><br />
        <small>helpers</small>
      </td>
    </tr>
  </table>
</div>

## Network Compatibility

<table>
  <tr>
    <th>Network</th>
    <th>Price Display</th>
    <th>Transaction Execution</th>
    <th>Status</th>
  </tr>
  <tr>
    <td>Local Development</td>
    <td>✓</td>
    <td>✓</td>
    <td><span style="color:#34c759">Fully Supported</span></td>
  </tr>
  <tr>
    <td>Ethereum Mainnet</td>
    <td>✓</td>
    <td>⚠️</td>
    <td><span style="color:#ff9f0a">Limited Support</span></td>
  </tr>
  <tr>
    <td>Sepolia Testnet</td>
    <td>✓</td>
    <td>✗</td>
    <td><span style="color:#ff3b30">UI Not Configured</span></td>
  </tr>
</table>

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet
- Ethereum RPC endpoint (Alchemy recommended)

### Installation & Setup

Follow the steps in the main project [README.md](../README.md#🏁-try-flash-today) to clone, install dependencies, configure your `.env` file, start the local Ganache fork, and deploy the contracts.

**Important:** For the frontend application to function correctly, especially for accessing RPC URLs and other configuration needed client-side or during build, you must also create a `.env.local` file specifically within this `frontend/` directory. Copy the relevant variables from the root `.env.example` (or your root `.env`), ensuring client-exposed variables are prefixed with `NEXT_PUBLIC_`. 

Example `frontend/.env.local`:
```dotenv
NEXT_PUBLIC_MAINNET_RPC_URL=https://your_alchemy_or_infura_url_here
# Add other NEXT_PUBLIC_ variables if needed
```

Crucially, after deploying contracts with Truffle, ensure the ABI artifacts are copied to the frontend:

```bash
# From the project root directory
npx truffle migrate --network mainnet_fork # Or --reset if needed
node copy-contracts.js
```

This `copy-contracts.js` script places the necessary JSON ABI files (including `FlashLoan.json`, `Ownable.json`, `SafeERC20.json`, etc.) into the `frontend/contracts/` directory, allowing the frontend to interact with the deployed contracts.

### Development

Once contracts are deployed and copied, start the frontend development server:

```bash
# Navigate to frontend directory
cd frontend

# Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── contracts/              # Copied contract ABI artifacts (via copy-contracts.js)
├── hooks/                  # Custom React hooks (e.g., useArbitrageCalculator)
├── lib/                    # Utilities, constants, services, web3 helpers
├── public/                 # Static assets
└── ...                     # Config files (tailwind, postcss, tsconfig, etc.)
```

## Performance Optimizations

- **Batched RPC Calls**: Reduces network requests
- **SWR Data Caching**: Minimizes redundant fetching
- **React.memo**: Prevents unnecessary re-renders
- **Throttled Updates**: Limits API call frequency
- **Code Splitting**: Improves initial load time

## Known Limitations

- **Mainnet Integration**: UI connects but transactions need testing
- **Exchange Support**: Only Uniswap V2 and SushiSwap execute trades
- **Route Complexity**: Limited to single-pair arbitrage routes
- **Mobile Experience**: Functional but not fully optimized

## Troubleshooting

- **Wallet Connection Issues**: Ensure browser permissions are enabled
- **Missing Opportunities**: Check RPC endpoint and network connection
- **Transaction Failures**: Verify gas settings during network congestion
- **Network Switching Problems**: Some networks require manual configuration

<div align="center">
  <p><em>We're here to help</em></p>
</div>
