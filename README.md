# Flash Blockchain Project

## Development Environment Setup

### Prerequisites
- Node.js (>=16.0.0)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Flash
```

2. Install dependencies:
```bash
npm install
```

This will install all required dependencies including:
- Truffle framework
- Web3.js
- Ganache CLI (for local blockchain)

### Available Scripts

```bash
# Start Truffle development console
npm run dev

# Run tests
npm test

# Compile contracts
npm run compile

# Deploy contracts
npm run migrate

# Start Ganache blockchain
npm run ganache
```

### Project Structure

- `contracts/`: Solidity smart contracts
- `migrations/`: Deployment scripts
- `test/`: Test files
- `build/`: Compiled contracts (generated)

## Development Guidelines

- Always use the provided npm scripts instead of global installations
- Run tests before committing changes
- Follow the solidity style guide for contract development 