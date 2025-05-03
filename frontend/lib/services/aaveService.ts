import { UiPoolDataProvider, ChainId } from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import { ethers } from "ethers";
import { TOKENS } from "@/lib/constants/tokens";
import { HumanizedReserveData } from "@/types/aave";
import { FlashLoanFees } from "@/types/flashloan";

/**
 * Fetches humanized reserve data for tracked tokens from Aave V3 Ethereum.
 */
export async function fetchFlashLoanReserves(
  provider: ethers.providers.Provider,
): Promise<Record<string, HumanizedReserveData>> {
  const uiPoolDataProvider = new UiPoolDataProvider({
    uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
    provider,
    chainId: ChainId.mainnet,
  });
  // @ts-ignore
  const { reservesData }: any = await (
    uiPoolDataProvider as any
  ).getReservesHumanized({
    lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  });

  const reservesMap: Record<string, HumanizedReserveData> = {};
  reservesData.forEach((reserve: any) => {
    const tokenInfo = TOKENS.find(
      (t) => t.address.toLowerCase() === reserve.underlyingAsset?.toLowerCase(),
    );
    if (tokenInfo) {
      reservesMap[tokenInfo.address] = {
        ...reserve,
        decimals: tokenInfo.decimals,
      };
    }
  });

  return reservesMap;
}

/**
 * Fetches flash loan premium fee configuration from Aave V3 Ethereum Pool contract.
 */
export async function fetchFlashLoanFees(
  provider: ethers.providers.Provider,
): Promise<FlashLoanFees> {
  const providerContract = new ethers.Contract(
    markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    ["function getPool() external view returns (address)"],
    provider,
  );
  const poolAddress: string = await providerContract.getPool();

  const poolContract = new ethers.Contract(
    poolAddress,
    [
      "function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128)",
      "function FLASHLOAN_PREMIUM_TO_PROTOCOL() external view returns (uint128)",
    ],
    provider,
  );
  const totalBpsBN = await poolContract.FLASHLOAN_PREMIUM_TOTAL();
  const protocolBpsBN = await poolContract.FLASHLOAN_PREMIUM_TO_PROTOCOL();
  const liquidityProvidersBpsBN = totalBpsBN.sub(protocolBpsBN);

  return {
    totalBps: totalBpsBN.toNumber(),
    totalPercent: totalBpsBN.toNumber() / 100,
    protocolPercent: protocolBpsBN.toNumber() / 100,
    liquidityProvidersPercent: liquidityProvidersBpsBN.toNumber() / 100,
  };
}
