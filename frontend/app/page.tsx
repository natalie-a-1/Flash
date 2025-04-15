"use client";

import { useWeb3 } from "@/components/web3/Web3Provider";
import { FAUCETS } from "@/lib/web3/config";

export default function Home() {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    networkName,
    connectWallet,
    switchNetwork,
  } = useWeb3();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Flash Blockchain Project
        </h1>

        <div className="bg-white/30 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">
            Ethereum Connection Status
          </h2>

          {isConnected ? (
            <div className="space-y-4">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p className="font-bold">Connected to MetaMask</p>
                <p className="text-sm">Account: {account}</p>
                <p className="text-sm">Network: {networkName}</p>
              </div>

              {isCorrectNetwork ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  <p>Connected to Sepolia Testnet ✓</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>Please switch to Sepolia Testnet</p>
                  </div>

                  <button
                    onClick={switchNetwork}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded w-full"
                  >
                    Switch to Sepolia
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <p>Not connected to MetaMask</p>
              </div>

              <button
                onClick={connectWallet}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Connect MetaMask
              </button>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Make sure MetaMask is installed</li>
              <li>Connect your wallet using the button above</li>
              <li>Switch to Sepolia Testnet in MetaMask</li>
              <li>Get test ETH from a Sepolia faucet</li>
            </ul>
          </div>

          {isConnected && !isCorrectNetwork && (
            <div className="mt-4">
              <p className="font-medium">What is Sepolia?</p>
              <p className="text-sm mt-1">
                Sepolia is an Ethereum testnet used for development. You can
                experiment without using real ETH.
              </p>
            </div>
          )}

          {isConnected && isCorrectNetwork && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Sepolia Faucets</h3>
              <p className="text-sm mb-2">
                Need test ETH? Get some from these faucets:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {FAUCETS[11155111].map((faucet, index) => (
                  <li key={index}>
                    <a
                      href={faucet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {faucet.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
