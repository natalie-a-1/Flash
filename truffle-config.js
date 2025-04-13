/**
 * Truffle configuration file
 */

module.exports = {
  // Configure networks
  networks: {
    // Development network with Ganache
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    // Add other networks as needed (testnet, mainnet, etc.)
  },

  // Configure compilers
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  // Project directory structure
  contracts_directory: './contracts',
  contracts_build_directory: './build/contracts',
  migrations_directory: './migrations',
  test_directory: './test'
}; 