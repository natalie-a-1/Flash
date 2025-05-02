/* ========= Types ========= */

export interface ArbParamsWeth {
  loanWeth: number;            // how much WETH you borrow
  buyPrice: number;            // USDC per WETH on leg-1 DEX
  sellPrice: number;           // USDC per WETH on leg-2 DEX
  buyFeePct: number;           // e.g. 0.30 for 0.30 %
  sellFeePct: number;          // e.g. 0.05 for 0.05 %
  buySlipPct: number;          // expected slippage %
  sellSlipPct: number;
  gasCostWeth: number;         // gas+tip converted 1:1 to WETH
  flashLoanBps: number;        // 5 = 5 bps = 0.05 %
}

export interface ArbResult {
  netProfit: number;           // WETH left in your wallet (≤0 if none)
  roiPct: number;              // return on "capital at risk"
  grossProfit: number;         // before flash-loan & gas
  flashLoanFee: number;        // WETH owed to Aave
}

/* ========= Calculator ========= */

export function calcArbWeth({
  loanWeth,
  buyPrice,
  sellPrice,
  buyFeePct,
  sellFeePct,
  buySlipPct,
  sellSlipPct,
  gasCostWeth,
  flashLoanBps,
}: ArbParamsWeth): ArbResult {

  // sanity-check critical inputs
  if ([loanWeth, buyPrice, sellPrice].some(v => v <= 0)) {
    return { netProfit: 0, roiPct: 0, grossProfit: 0, flashLoanFee: 0 };
  }

  const dec = (pct: number) => 1 - pct / 100;

  // ------ Leg 1 – sell WETH for USDC ---------------------------
  const usdcOut =
    loanWeth * buyPrice * dec(buyFeePct) * dec(buySlipPct);

  // ------ Leg 2 – buy WETH back -------------------------------
  const wethBack =
    (usdcOut / sellPrice) * dec(sellFeePct) * dec(sellSlipPct);

  // ------ Costs ------------------------------------------------
  const flashLoanFee = (loanWeth * flashLoanBps) / 10_000; // bps ➜ decimal
  const grossProfit  = wethBack - loanWeth;
  const netProfit    = grossProfit - flashLoanFee - gasCostWeth;

  const invested = loanWeth + flashLoanFee + gasCostWeth;   // "capital at risk"
  const roiPct   = invested > 0 ? (netProfit / invested) * 100 : 0;

  return { netProfit, roiPct, grossProfit, flashLoanFee };
} 