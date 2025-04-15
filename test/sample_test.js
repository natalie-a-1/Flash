const Migrations = artifacts.require("Migrations");

/**
 * Example test file for the Migrations contract
 * This serves as a template for future contract tests
 */
contract("Migrations", (accounts) => {
  let migrations;
  const owner = accounts[0];
  const newOwner = accounts[1];

  beforeEach(async () => {
    // Deploy a fresh contract before each test
    migrations = await Migrations.new({ from: owner });
  });

  it("should set the correct owner on deployment", async () => {
    const contractOwner = await migrations.owner();
    assert.equal(
      contractOwner,
      owner,
      "Owner was not set correctly on deployment",
    );
  });

  it("should update last_completed_migration when called by owner", async () => {
    const newCompletedMigration = 5;

    await migrations.setCompleted(newCompletedMigration, { from: owner });

    const completedMigration = await migrations.last_completed_migration();
    assert.equal(
      completedMigration.toNumber(),
      newCompletedMigration,
      "last_completed_migration was not updated correctly",
    );
  });

  it("should only allow the owner to update last_completed_migration", async () => {
    const newCompletedMigration = 10;

    try {
      await migrations.setCompleted(newCompletedMigration, { from: newOwner });
      assert.fail("Non-owner was able to update last_completed_migration");
    } catch (error) {
      assert(
        error.toString().includes("revert"),
        "Expected revert error but got: " + error.toString(),
      );
    }
  });
});
