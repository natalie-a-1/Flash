# Flash Blockchain Frontend

This is the frontend application for the Flash Blockchain project, built with Next.js, React, and Tailwind CSS.

## Quick Start

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Technology Stack

- **Framework**: Next.js with App Router
- **UI Library**: React
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Blockchain Connectivity**: Web3.js, ethers.js
- **Testing**: (TBD)

## Project Structure

- `app/` - Next.js application routes
- `components/` - Reusable React components
- `lib/` - Utility functions and configurations
- `contracts/` - Contract ABIs (copied from Truffle build)
- `types/` - TypeScript type definitions
- `public/` - Static assets

## Connecting to Blockchain

The application automatically connects to MetaMask if available and displays connection status on the homepage.

### Features

- MetaMask connection management
- Network detection and switching
- Contract interaction (coming soon)

## Development Process

1. Start the local blockchain: `npm run ganache` (from project root)
2. Deploy contracts: `npm run migrate` (from project root)
3. Start the frontend: `npm run dev` (from this directory)

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
