// Import the Migrations contract artifact
const Migrations = artifacts.require("Migrations");

/**
 * Deploy the Migrations contract
 * @param {object} deployer - The Truffle deployer object
 */
module.exports = function (deployer) {
  // Deploy the Migrations contract
  deployer.deploy(Migrations);
};
