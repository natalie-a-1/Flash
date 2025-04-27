declare module '@bgd-labs/aave-address-book' {
  /**
   * Aave V3 Sepolia addresses
   */
  export const AaveV3Sepolia: {
    POOL: string;
    POOL_ADDRESSES_PROVIDER: string;
    POOL_CONFIGURATOR: string;
    ORACLE: string;
    LENDING_RATE_ORACLE: string;
    POOL_ADMIN: string;
    EMERGENCY_ADMIN: string;
    COLLECTOR: string;
    UI_POOL_DATA_PROVIDER: string;
    UI_INCENTIVE_DATA_PROVIDER: string;
    WALLET_BALANCE_PROVIDER: string;
    CHAIN_ID: number;
  };

  /**
   * Aave V3 Ethereum addresses
   */
  export const AaveV3Ethereum: {
    POOL: string;
    POOL_ADDRESSES_PROVIDER: string;
    POOL_CONFIGURATOR: string;
    ORACLE: string;
    LENDING_RATE_ORACLE: string;
    POOL_ADMIN: string;
    EMERGENCY_ADMIN: string;
    COLLECTOR: string;
    UI_POOL_DATA_PROVIDER: string;
    UI_INCENTIVE_DATA_PROVIDER: string;
    WALLET_BALANCE_PROVIDER: string;
    CHAIN_ID: number;
    WETH: string;
    USDC: string;
  };

  // Add more Aave V3 markets as needed
} 