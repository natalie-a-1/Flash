/**
 * @fileoverview
 * Seeds a development account with USDC from a whale account on a local Mainnet fork
 * and approves both Uniswap V2 and SushiSwap V2 routers to spend the USDC.
 *
 * @requires web3
 * @requires ../../constants.json
 * @requires ../../build/contracts/IERC20.json
 * @requires dotenv - Requires USDC_WHALE_ADDRESS environment variable.
 */

const Web3 = require('web3');
const constants = require('../../constants.json');
const IERC20 = require('../../build/contracts/IERC20.json');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function seedWallet() {
  console.log('\n── Running Wallet Seeding Script ────────────────────────────');
  const web3 = new Web3('http://127.0.0.1:8545');

  console.log('Waiting for Ganache fork to stabilize...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('Proceeding...');

  const accounts = await web3.eth.getAccounts();
  if (accounts.length === 0) {
    throw new Error("No accounts found. Ensure Ganache fork is running.");
  }
  const me = accounts[0];
  const fixedGasPrice = web3.utils.toWei('20', 'gwei');

  console.log(`Target account (me): ${me}`);

  // --- Seed Development Account with USDC ---
  console.log('\n── 1) Seeding Dev Account with USDC ──────────────');
  const USDC_ADDRESS = constants.mainnet.USDC;
  const whale = process.env.USDC_WHALE_ADDRESS;
  if (!whale) {
    throw new Error('Set USDC_WHALE_ADDRESS environment variable.');
  }
  console.log(`Using USDC Whale: ${whale}`);

  const usdc = new web3.eth.Contract(IERC20.abi, USDC_ADDRESS);
  const initialWhaleBalance = await usdc.methods.balanceOf(whale).call();
  console.log(`Whale initial USDC balance: ${web3.utils.fromWei(initialWhaleBalance, 'mwei')} USDC`);

  // Fund whale with ETH if needed
  const whaleEthBalance = await web3.eth.getBalance(whale);
  if (web3.utils.toBN(whaleEthBalance).lt(web3.utils.toBN(web3.utils.toWei('0.1', 'ether')))) {
    console.log('Funding USDC whale with 0.1 ETH for gas...');
    await web3.eth.sendTransaction({
      from: me,
      to: whale,
      value: web3.utils.toWei('0.1', 'ether'),
      gas: 50000,
      gasPrice: fixedGasPrice
    });
    console.log('Whale funded.');
  }

  // Transfer USDC
  const seedAmount = web3.utils.toBN('100000').mul(web3.utils.toBN('1000000')); // 100,000 USDC
  console.log(`Attempting to transfer ${web3.utils.fromWei(seedAmount, 'mwei')} USDC from whale to ${me}...`);
  await usdc.methods.transfer(me, seedAmount.toString())
    .send({ from: whale, gas: 200000, gasPrice: fixedGasPrice });
  console.log(`Successfully transferred USDC.`);
  const myUsdcBalance = await usdc.methods.balanceOf(me).call();
  console.log(`My new USDC balance: ${web3.utils.fromWei(myUsdcBalance, 'mwei')} USDC`);

  // --- Approve Routers ---
  console.log('\n── 2) Approving Routers ─────────────────────────');
  const UNISWAP_ROUTER_ADDR = constants.mainnet.UNISWAP_V2_ROUTER;
  const SUSHISWAP_ROUTER_ADDR = constants.mainnet.SUSHISWAP_V2_ROUTER;
  const maxApproval = web3.utils.toBN('2').pow(web3.utils.toBN('256')).sub(web3.utils.toBN('1')).toString(); // Max uint256

  console.log(`Approving Uniswap Router (${UNISWAP_ROUTER_ADDR}) for max USDC...`);
  await usdc.methods.approve(UNISWAP_ROUTER_ADDR, maxApproval)
    .send({ from: me, gas: 100000, gasPrice: fixedGasPrice });
  console.log('Approved Uniswap Router.');

  console.log(`Approving Sushiswap Router (${SUSHISWAP_ROUTER_ADDR}) for max USDC...`);
  await usdc.methods.approve(SUSHISWAP_ROUTER_ADDR, maxApproval)
    .send({ from: me, gas: 100000, gasPrice: fixedGasPrice });
  console.log('Approved Sushiswap Router.');

  console.log('\n✅ Seeding and Approvals Complete.');
}

seedWallet().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
}); 