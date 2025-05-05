/**
 * Combined script to start Ganache fork and automatically approve routers
 */
require("dotenv").config();
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configure variables
const WAIT_TIME = 5000; // Wait 5 seconds for Ganache to start before approving routers
let ganacheProcess = null;

// Handle process termination to clean up Ganache
process.on("SIGINT", () => {
  console.log("Caught interrupt signal. Stopping Ganache...");
  if (ganacheProcess) {
    ganacheProcess.kill();
  }
  process.exit();
});

// Check if contracts are compiled
function checkAndCompileContracts() {
  console.log("🔍 Checking if contracts are compiled...");

  const buildDir = path.join(__dirname, "..", "build", "contracts");

  // Check if the build directory exists and has files
  if (!fs.existsSync(buildDir) || fs.readdirSync(buildDir).length === 0) {
    console.log(
      "📝 Contracts not compiled or build directory is empty. Compiling now...",
    );
    try {
      execSync("npx truffle compile", { stdio: "inherit" });
      console.log("✅ Contracts compiled successfully!");
    } catch (error) {
      console.error("❌ Failed to compile contracts:", error);
      process.exit(1);
    }
  } else {
    console.log("✅ Contracts already compiled.");
  }
}

// Start Ganache fork
function startGanacheFork() {
  console.log("🚀 Starting Ganache fork...");

  const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
  const blockNumber = process.env.BLOCK_NUMBER || "latest";
  const whaleAddress = process.env.USDC_WHALE_ADDRESS;

  if (!mainnetRpcUrl) {
    console.error(
      "❌ NEXT_PUBLIC_MAINNET_RPC_URL environment variable is required",
    );
    process.exit(1);
  }

  if (!whaleAddress) {
    console.error("❌ USDC_WHALE_ADDRESS environment variable is required");
    process.exit(1);
  }

  const ganacheCommand = "ganache";
  const ganacheArgs = [
    "--fork",
    `${mainnetRpcUrl}@${blockNumber}`,
    "--unlock",
    whaleAddress,
    "-a",
    "10",
    "-e",
    "1000",
    "-d",
    "--chain.chainId",
    "1337",
  ];

  // Spawn Ganache process
  ganacheProcess = spawn(ganacheCommand, ganacheArgs, {
    stdio: "inherit",
    shell: process.platform === "win32", // Use shell on Windows
  });

  ganacheProcess.on("error", (err) => {
    console.error("❌ Failed to start Ganache:", err);
    process.exit(1);
  });

  console.log("⌛ Waiting for Ganache to initialize...");

  // Wait for Ganache to start up, then run router approvals
  setTimeout(() => {
    deployAndApprove();
  }, WAIT_TIME);
}

// Deploy the contract and then run router approvals
function deployAndApprove() {
  console.log("🔄 Checking contract deployment and approving routers...");

  // First check if the contract exists
  const web3Path = path.join(
    __dirname,
    "..",
    "test",
    "demo",
    "checkContract.js",
  );

  // Create a simple script to check if the contract exists at the expected address
  const checkContractScript = `
  const Web3 = require('web3');
  const web3 = new Web3('http://localhost:8545');
  
  async function checkContract() {
    try {
      const address = process.env.FLASH_LOAN_CONTRACT_ADDRESS || "0xF9a393Baab3C575c2B31166636082AB58a3dae62";
      const code = await web3.eth.getCode(address);
      return code !== '0x' && code !== '0x0';
    } catch (error) {
      return false;
    }
  }
  
  checkContract().then(exists => {
    process.exit(exists ? 0 : 1);
  });
  `;

  fs.writeFileSync(web3Path, checkContractScript);

  try {
    // Check if contract exists at the address
    execSync(`node ${web3Path}`, { stdio: "ignore" });
    console.log(
      "✅ Contract already exists, proceeding with router approvals...",
    );
    runRouterApprovals();
  } catch (error) {
    // Contract doesn't exist, deploy it first
    console.log(
      "⚠️ Contract not found at the expected address, deploying a new contract...",
    );
    const deployScript = path.join(
      __dirname,
      "..",
      "test",
      "demo",
      "deployFlashLoan.js",
    );

    try {
      execSync(`node ${deployScript}`, { stdio: "inherit" });
      console.log("✅ Contract deployed successfully!");
      runRouterApprovals();
    } catch (deployError) {
      console.error("❌ Failed to deploy contract:", deployError.message);
      console.log("⚠️ Will try to approve routers anyway...");
      runRouterApprovals();
    }
  } finally {
    // Clean up the temporary check script
    if (fs.existsSync(web3Path)) {
      fs.unlinkSync(web3Path);
    }
  }
}

// Run the router approvals script
function runRouterApprovals() {
  console.log("🔄 Running router approvals script...");

  const approveScript = path.join(
    __dirname,
    "..",
    "test",
    "demo",
    "approveRouters.js",
  );
  const nodeProcess = spawn("node", [approveScript], {
    stdio: "inherit",
    shell: process.platform === "win32", // Use shell on Windows
  });

  nodeProcess.on("error", (err) => {
    console.error("❌ Failed to run approval script:", err);
  });

  nodeProcess.on("exit", (code) => {
    if (code === 0) {
      console.log("✅ Router approvals completed successfully!");
      console.log("🌐 Ganache fork is now running with approved routers");
      console.log("🔔 Press Ctrl+C to stop Ganache when done");
    } else {
      console.error(`❌ Router approvals script failed with code ${code}`);
      console.log(
        "⚠️ Ganache will continue running, but routers may not be approved",
      );
      console.log("🔔 Press Ctrl+C to stop Ganache");
    }
  });
}

// Start the process
checkAndCompileContracts();
startGanacheFork();
