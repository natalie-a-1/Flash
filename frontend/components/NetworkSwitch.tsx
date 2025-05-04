import React, { useState, useEffect } from "react";
import { NETWORK_IDS, NETWORK_NAMES, RPC_URLS } from "@/lib/web3/config";
import { switchToMainnet, getNetworkDetails } from "@/lib/web3/web3";

/**
 * @deprecated This component's functionality has been integrated into the Header component.
 * Please update any references to use the network switcher in the Header instead.
 *
 * NetworkSwitch component for toggling between Mainnet and Local networks.
 */
const NetworkSwitch: React.FC = () => {
  const [isFork, setIsFork] = useState(false);

  // initialize state and subscribe to chain changes
  useEffect(() => {
    const updateNetwork = async () => {
      const { id } = await getNetworkDetails();
      setIsFork(id === NETWORK_IDS.LOCALHOST);
    };
    updateNetwork();

    window.ethereum?.on("chainChanged", (chainIdHex: string) => {
      const id = parseInt(chainIdHex, 16);
      setIsFork(id === NETWORK_IDS.LOCALHOST);
    });

    return () => {
      window.ethereum?.removeListener("chainChanged", () => {});
    };
  }, []);

  const toggleNetwork = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed");
      return;
    }

    try {
      if (!isFork) {
        // switch to local fork (localhost)
        const chainIdHex = `0x${NETWORK_IDS.LOCALHOST.toString(16)}`;
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
          });
        } catch (error: any) {
          // if network not added, add it
          if (error.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chainIdHex,
                  chainName: NETWORK_NAMES[NETWORK_IDS.LOCALHOST],
                  rpcUrls: [RPC_URLS[NETWORK_IDS.LOCALHOST]],
                  nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            });
          } else {
            throw error;
          }
        }
      } else {
        // switch back to Ethereum Mainnet
        await switchToMainnet();
      }
    } catch (err: any) {
      console.error(err);
      // MetaMask may throw an internal error code when the chain actually changed
      if (
        err.code === -32603 ||
        (err.message && err.message.includes("change in selected network"))
      ) {
        // suppress this error; chainChanged event will update the UI
        return;
      }
      alert(`Failed to switch network: ${err.message || err}`);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/70 shadow-sm transition-all hover:border-slate-600/70">
      <span
        className={`text-xs font-medium ${isFork ? "text-slate-400" : "text-cyan-400"}`}
      >
        Mainnet
      </span>
      <button
        onClick={toggleNetwork}
        className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-slate-700"
        role="switch"
        aria-checked={isFork}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isFork ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span
        className={`text-xs font-medium ${isFork ? "text-cyan-400" : "text-slate-400"}`}
      >
        Local
      </span>
    </div>
  );
};

export default NetworkSwitch;
