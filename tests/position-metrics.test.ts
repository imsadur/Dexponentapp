import assert from "node:assert/strict";
import test from "node:test";
import {
  formatCount,
  formatDate,
  formatPct,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  formatUsdCompact,
  formatUsdPrecise,
  MISSING,
} from "../src/domain/format";
import {
  concentration,
  lpPositionMetrics,
  lpSummary,
  managerSummary,
  performanceFees,
  returnMetric,
  splitTvlChange,
  weightedAverage,
  type LpPositionInput,
  type ManagerRowInput,
} from "../src/domain/position-metrics";
import { applyDeposit, applyWithdraw, emptyPortfolio, flowsFor, heldDtfIds, positionValueAt } from "../src/domain/dtf-portfolio";

const apy = (value: number | null) => ({ kind: "apy" as const, value, label: "APY" });
const lp = (over: Partial<LpPositionInput>): LpPositionInput => ({
  id: "x",
  value: 100,
  costBasis: 100,
  deposited: 100,
  withdrawn: 0,
  change24hPct: 0,
  ret: apy(10),
  ...over,
});

/* ------------------------------ formatting ------------------------------ */

test("formatting follows the spec table", () => {
  assert.equal(formatUsd(10.18278), "$10.18");
  assert.equal(formatUsd(0.00131), "$0.001310");
  assert.equal(formatUsd(-1.22), "−$1.22");
  assert.equal(formatUsd(0), "$0.00");
  assert.equal(formatUsdCompact(12_400), "$12.4K");
  assert.equal(formatUsdCompact(5_373_917.18), "$5.37M");
  assert.equal(formatUsdCompact(4_999.37), "$4,999.37");
  assert.equal(formatUsdPrecise(10.18278), "$10.18278");
  assert.equal(formatSignedUsd(1.22), "+$1.22");
  assert.equal(formatSignedUsd(-1.22), "−$1.22");
  assert.equal(formatSignedUsd(0.01), "+$0.01");
  assert.equal(formatSignedUsd(-0.004), "$0.00");
  assert.equal(formatSignedUsd(0), "$0.00");
  assert.equal(formatSignedPct(2.5), "+2.50%");
  assert.equal(formatSignedPct(-3.24), "−3.24%");
  assert.equal(formatSignedPct(-0.0001), "+0.00%");
  assert.equal(formatPct(12.4), "12.40%");
  assert.equal(formatCount(4), "4");
  assert.equal(formatCount(1204), "1,204");
  assert.equal(formatDate("2026-09-24"), "24 Sep 2026");
  assert.equal(formatDate(Date.UTC(2026, 8, 24, 15)), "24 Sep 2026");
});

test("missing data renders as an em dash, never $0", () => {
  for (const fn of [formatUsd, formatUsdCompact, formatSignedUsd, formatSignedPct, formatPct, formatCount, formatUsdPrecise])
    assert.equal(fn(null), MISSING);
  assert.equal(formatUsd(Number.NaN), MISSING);
  assert.equal(formatDate("not a date"), MISSING);
});

/* -------------------------------- returns -------------------------------- */

test("DTFs younger than 90 days report return since launch, not APY", () => {
  assert.deepEqual(returnMetric({ ageDays: 60, apy: -45.26, sinceLaunch: -4.1 }), { kind: "sinceLaunch", value: -4.1, label: "Since launch" });
  assert.deepEqual(returnMetric({ ageDays: 90, apy: 12, sinceLaunch: 3 }), { kind: "apy", value: 12, label: "APY" });
  assert.equal(returnMetric({ ageDays: 200, apy: null, sinceLaunch: 3 }).value, null);
});

test("weighted return for the reported manager rows is about −21.3%", () => {
  const value = weightedAverage([
    { weight: 4.46784, value: -45.26 },
    { weight: 4.99937, value: 0 },
    { weight: 1.40406, value: -21.24 },
  ]);
  assert.ok(value !== null && Math.abs(value - -21.3) < 0.05, `got ${value}`);
});

test("weighted average skips missing rows instead of counting them as zero", () => {
  assert.equal(weightedAverage([{ weight: 10, value: 5 }, { weight: 90, value: null }]), 5);
  assert.equal(weightedAverage([{ weight: null, value: 5 }]), null);
});

/* ---------------------------------- LP ----------------------------------- */

test("a missing price never produces $0 value or a −100% P&L", () => {
  const missing = lpPositionMetrics(lp({ value: null, deposited: 5, costBasis: 5 }));
  assert.equal(missing.priceMissing, true);
  assert.equal(missing.totalPnl, null);
  assert.equal(missing.totalPnlPct, null);
  const ok = lpPositionMetrics(lp({ value: 110 }));
  const summary = lpSummary([ok, missing]);
  assert.equal(summary.value, 110);
  assert.equal(summary.deposited, 100);
  assert.equal(summary.totalPnl, 10);
  assert.equal(summary.totalPnlPct, 10);
  assert.equal(summary.excluded, 1);
});

test("partial withdrawal: total P&L = value + withdrawn − deposited, split into realised and unrealised", () => {
  // Deposited 1,000, withdrew 550 when the position was worth 1,100 (cost out 500), 550 left worth 560.
  const m = lpPositionMetrics(lp({ value: 560, costBasis: 500, deposited: 1_000, withdrawn: 550 }));
  assert.equal(m.netDeposited, 450);
  assert.equal(m.totalPnl, 110);
  assert.equal(m.totalPnlPct, 11);
  assert.equal(m.realizedPnl, 50);
  assert.equal(m.unrealizedPnl, 60);
});

test("withdrawals above deposits keep the P&L % on gross deposits", () => {
  const m = lpPositionMetrics(lp({ value: 0, costBasis: 0, deposited: 1_000, withdrawn: 1_200 }));
  assert.equal(m.netDeposited, -200);
  assert.equal(m.totalPnl, 200);
  assert.equal(m.totalPnlPct, 20);
  assert.equal(m.closed, true);
});

test("24h change in USD backs out the day's return from today's value", () => {
  const m = lpPositionMetrics(lp({ value: 110, change24hPct: 10 }));
  assert.ok(Math.abs(m.change24hUsd! - 10) < 1e-9);
});

test("withdrawable excludes locked value", () => {
  const s = lpSummary([lpPositionMetrics(lp({ value: 100, lockedValue: 40 })), lpPositionMetrics(lp({ value: 50 }))]);
  assert.equal(s.withdrawable, 110);
});

test("a manager's self-deposit counts once as an LP position and never adds AUM to their value", () => {
  const stake = 25;
  const lpView = lpSummary([lpPositionMetrics(lp({ id: "own", value: stake, costBasis: stake, deposited: stake }))]);
  assert.equal(lpView.value, stake);
  const row: ManagerRowInput = {
    id: "own",
    tvl: 1_000,
    ret: apy(5),
    change24hPct: 0,
    aumChange24h: null,
    netFlows30d: 0,
    depositors: 10,
    feesEarned: 0,
    feesClaimed: 0,
    stake,
  };
  const mgr = managerSummary([row]);
  assert.equal(mgr.aum, 1_000);
  // Nothing in the manager summary is a personal net worth figure.
  assert.equal("netWorth" in mgr, false);
});

/* -------------------------------- Manager -------------------------------- */

test("AUM change splits into LP flows and performance", () => {
  const split = splitTvlChange(1_000, 1_150, 5);
  assert.equal(split.change, 150);
  assert.equal(split.performance, 50);
  assert.equal(split.flows, 100);
});

test("fees accrue only on positive yield", () => {
  assert.equal(performanceFees(1_000, 10), 100);
  assert.equal(performanceFees(-500, 10), 0);
});

test("manager summary sums AUM and excludes rows with missing TVL", () => {
  const base: Omit<ManagerRowInput, "id" | "tvl"> = {
    ret: apy(10),
    change24hPct: 1,
    aumChange24h: { change: 10, flows: 4, performance: 6 },
    netFlows30d: 100,
    depositors: 3,
    feesEarned: 2,
    feesClaimed: 0.5,
    stake: 0,
  };
  const s = managerSummary([{ id: "a", tvl: 1_000, ...base }, { id: "b", tvl: null, ...base }]);
  assert.equal(s.aum, 1_000);
  assert.equal(s.aumChange24h, 10);
  assert.equal(s.flows24h, 4);
  assert.equal(s.claimable, 3);
  assert.equal(s.excluded, 1);
});

test("concentration is the largest depositor's share of TVL", () => {
  assert.equal(concentration([60, 20, 20]), 60);
  assert.equal(concentration([]), null);
});

/* ------------------------------ portfolio -------------------------------- */

test("deposits at NAV record shares, and value follows NAV", () => {
  const dtf = { id: "d", baseAsset: "USDC", apy7d: 10 };
  const t = Date.UTC(2026, 10, 1);
  const p = applyDeposit(emptyPortfolio(), dtf, 100, t, { nav: 1.25 });
  const pos = p.positions.d;
  assert.equal(pos.shares, 80);
  assert.equal(positionValueAt(pos, 10, t, 1.5), 120);
  assert.equal(positionValueAt(pos, 10, t, null), null);
  const after = applyWithdraw(p, dtf, 60, t, { nav: 1.5 });
  assert.ok(Math.abs(after.positions.d.shares! - 40) < 1e-9);
  assert.deepEqual(
    { deposited: flowsFor(after, "d").deposited, withdrawn: flowsFor(after, "d").withdrawn },
    { deposited: 100, withdrawn: 60 },
  );
});

test("a withdrawal is refused when NAV is missing", () => {
  const dtf = { id: "d", baseAsset: "USDC", apy7d: 10 };
  const p = applyDeposit(emptyPortfolio(), dtf, 100, 0, { nav: 1 });
  assert.equal(applyWithdraw(p, dtf, 50, 0, { nav: null }), p);
});

test("closed positions stay in the ledger", () => {
  const dtf = { id: "d", baseAsset: "USDC", apy7d: null };
  const opened = applyDeposit(emptyPortfolio(), dtf, 100, 0, { nav: 1 });
  const closed = applyWithdraw(opened, dtf, 100, 0, { nav: 1 });
  assert.equal(closed.positions.d, undefined);
  assert.deepEqual(heldDtfIds(closed), ["d"]);
});
