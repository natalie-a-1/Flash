"use client";

import { useWeb3 } from "@/components/web3/Web3Provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * LoginPage component handles the user login interface.
 * It checks if the user's wallet is connected and redirects to the dashboard if so.
 * Otherwise, it displays a login page with a connect wallet button.
 */
export default function LoginPage() {
  const { isConnected, connectWallet } = useWeb3(); // Destructuring to get wallet connection status and connect function
  const router = useRouter(); // Hook to programmatically navigate
  const [mounted, setMounted] = useState(false); // State to track if the component is mounted

  /**
   * useEffect hook to run side effects.
   * Sets the mounted state to true when the component is mounted.
   * Redirects to the dashboard if the wallet is already connected.
   */
  useEffect(() => {
    setMounted(true);

    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  /**
   * Renders a placeholder during server-side rendering and the first mount.
   * This ensures the structure remains consistent before the client-side logic takes over.
   */
  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Flash
            </h1>
            <p className="text-xl text-white/80">
              Flash loan arbitrage platform using Aave V3
            </p>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl border border-white/20">
            {/* Pre-rendering placeholder with animation */}
            <div className="animate-pulse">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-white/10 rounded-full"></div>
              </div>
              <div className="h-6 bg-white/10 rounded w-3/4 mx-auto mt-5"></div>
              <div className="h-4 bg-white/10 rounded w-1/2 mx-auto mt-3 mb-8"></div>
              <div className="h-12 bg-white/10 rounded-lg w-full mb-6"></div>
              <div className="h-4 bg-white/10 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /**
   * Renders the main login interface when the component is mounted.
   * Displays a connect wallet button and information about the platform.
   */
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Flash
          </h1>
          <p className="text-xl text-white/80">
            Flash loan arbitrage platform using Aave V3
          </p>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mt-4">Welcome to Flash</h2>
            <p className="text-white/70 mt-2">
              Connect your wallet to access the dashboard
            </p>
          </div>

          <button
            onClick={connectWallet}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 20V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Connect Wallet
          </button>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              This application requires a Web3 wallet like MetaMask
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-sm text-white/70">
              <p className="mb-2">With Flash, you can:</p>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Monitor arbitrage opportunities
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Execute flash loans
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  View real-time pricing data
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
