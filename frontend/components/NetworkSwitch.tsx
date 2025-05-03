import React, { useState, useEffect } from "react";
import {
  NETWORK_IDS,
  NETWORK_NAMES,
  RPC_URLS,
} from "@/lib/web3/config";
import { switchToMainnet, getNetworkDetails } from "@/lib/web3/web3";

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
      alert(`Failed to switch network: ${err.message || err}`);
    }
  };

  return (
    <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={isFork}
        onChange={toggleNetwork}
        style={{ marginRight: "8px" }}
      />
      <span>
        {isFork
          ? NETWORK_NAMES[NETWORK_IDS.LOCALHOST]
          : NETWORK_NAMES[NETWORK_IDS.MAINNET]}
      </span>
    </label>
  );
};

export default NetworkSwitch; 