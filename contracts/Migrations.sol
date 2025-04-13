// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/// @title Migrations Contract
/// @notice This contract is used to manage the deployment of smart contracts
/// @dev This contract is used by Truffle to handle migrations
contract Migrations {
  /// @notice The address of the contract owner
  address public owner;
  
  /// @notice The last completed migration
  uint public last_completed_migration;

  /// @notice Modifier to restrict access to the contract owner
  modifier restricted() {
    require(msg.sender == owner, "This function is restricted to the contract's owner");
    _;
  }

  /// @notice Constructor to set the contract owner
  constructor() {
    owner = msg.sender;
  }

  /// @notice Function to set the last completed migration
  /// @param completed The last completed migration
  function setCompleted(uint completed) public restricted {
    last_completed_migration = completed;
  }

  /// @notice Function to upgrade the contract to a new address
  /// @param new_address The address of the new contract
  function upgrade(address new_address) public restricted {
    Migrations upgraded = Migrations(new_address);
    upgraded.setCompleted(last_completed_migration);
  }
} 