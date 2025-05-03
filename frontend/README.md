# Flash Frontend

This directory contains the **Flash** arbitrage frontend: a Next.js web application that lets users monitor on-chain arbitrage opportunities between Uniswap V2 and SushiSwap and execute Flash Loans via Aave V3.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Blockchain Configuration](#blockchain-configuration)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Ethers.js & Web3.js
- Aave Address Book (@bgd-labs/aave-address-book)
- Uniswap V2 & SushiSwap V2 Router ABIs
- Jest / Mocha + Chai (in `test/`)

---

## Features

- **Wallet Connection**: MetaMask integration with network checks.
- **Arbitrage Dashboard**: Live pricing from Uniswap and SushiSwap; best-path highlighting.
- **Flash Loans**: Retrieve on-chain liquidity from Aave V3 via UI pool data provider.
- **Responsive UI**: Built with Tailwind CSS and Next.js server + client components.

---

## Prerequisites

- Node.js v16 or higher
- npm (or Yarn) package manager
- MetaMask or any `window.ethereum`-compatible wallet

---

## Installation

```bash
# 1. Change into the frontend folder
cd frontend

# 2. Install dependencies
npm install
# or: yarn install

# 3. Run in development mode
npm run dev
# or: yarn dev
```

Open http://localhost:3000 in your browser.

---

## Available Scripts

In the `frontend` directory, run:

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start development server on port 3000 |
| `npm run build` | Build for production (Next.js)        |
| `npm run start` | Run the production build              |
| `npm run lint`  | Run ESLint                            |
| `npm test`      | Run Mocha/Chai tests                  |

---

## Environment Variables

Create a `.env.local` in `frontend/` if you need to override defaults:

```ini
# Example: custom mainnet RPC for price comparisons
NEXT_PUBLIC_MAINNET_RPC_URL=https://eth.llamarpc.com
```

Next.js will automatically load any `NEXT_PUBLIC_*` variables.

---

## Project Structure

```
frontend/
├── app/                  # Next.js App Router pages & layouts
│   ├── layout.tsx        # Root layout with Web3Provider
│   └── dashboard/        # Dashboard page (arbs + flash loans)
├── components/           # Reusable React components
│   ├── web3/             # Wallet & provider management
│   ├── ArbitrageOpportunities.tsx
│   └── FlashLoanOptions.tsx
├── lib/                  # Application logic & constants
│   ├── web3/             # Web3 & Ethers provider utilities
│   ├── services/         # On-chain data fetch (priceService)
│   └── constants/        # DEX/router & token definitions
├── types/                # Shared TypeScript types
├── public/               # Static assets (logos, icons)
├── test/                 # Unit & integration tests
├── next.config.ts        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

---

## Blockchain Configuration

- **DEXes & Tokens** come from `lib/constants/dex.ts` and `lib/constants/tokens.ts` using your own `MAINNET_ADDRESSES` in `config.ts`.
- **Aave Protocol** addresses (pool, UI provider, incentives) can be imported from:

  ```ts
  import { AaveV3Ethereum } from "@bgd-labs/aave-address-book";
  ```

- **FlashLoan Contract** address should be set manually in your deployment or via an environment variable.

---

## Testing

Tests live under `frontend/test`. To run:

```bash
npm test
# or: yarn test
```

Make sure your local chain or fork is running if tests depend on on-chain state.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Install dependencies and run tests.
3. Submit a pull request with clear description.

Please keep the code style consistent (Prettier + ESLint enforced via Husky pre-commit hooks).

---

## License

This frontend is released under the **MIT License**. See the [LICENSE](../LICENSE) file at the project root.
