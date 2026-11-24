import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_BALANCES,
  MIN_DEPOSIT,
  applyDeposit,
  applyWithdraw,
  depositError,
  isLocked,
  emptyPortfolio,
  parseAmount,
  parsePortfolio,
  portfolioSummary,
  positionValue,
  withdrawError,
} from "../src/domain/dtf-portfolio";

const dtf = { id: "dtf-x", baseAsset: "USDC", apy7d: 10 };
const t0 = Date.UTC(2026, 10, 1);
const DAY = 86_400_000;

test("deposit moves demo balance into a position", () => {
  const next = applyDeposit(emptyPortfolio(), dtf, 1_000, t0);
  assert.equal(next.balances.USDC, DEMO_BALANCES.USDC - 1_000);
  assert.deepEqual(next.positions[dtf.id], { costBasis: 1_000, value: 1_000, valuedAt: new Date(t0).toISOString() });
});

test("position value accrues at the 7D APY and earnings stay separate from cost", () => {
  const p = applyDeposit(emptyPortfolio(), dtf, 1_000, t0).positions[dtf.id];
  assert.ok(Math.abs(positionValue(p, 10, t0 + 365 * DAY) - 1_100) < 1e-6);
  assert.equal(positionValue(p, null, t0 + 30 * DAY), 1_000);
  assert.equal(positionValue(undefined, 10), 0);
});

test("a second deposit adds to the accrued value", () => {
  const first = applyDeposit(emptyPortfolio(), dtf, 1_000, t0);
  const second = applyDeposit(first, dtf, 500, t0 + 365 * DAY);
  assert.equal(second.positions[dtf.id].costBasis, 1_500);
  assert.equal(second.positions[dtf.id].value, 1_600);
});

test("partial withdrawal reduces cost basis proportionally; full withdrawal closes it", () => {
  const funded = applyDeposit(emptyPortfolio(), dtf, 1_000, t0);
  const later = t0 + 365 * DAY;
  const half = applyWithdraw(funded, dtf, 550, later);
  assert.equal(half.positions[dtf.id].value, 550);
  assert.equal(half.positions[dtf.id].costBasis, 500);
  assert.equal(half.balances.USDC, DEMO_BALANCES.USDC - 1_000 + 550);
  const closed = applyWithdraw(half, dtf, 550, later);
  assert.equal(closed.positions[dtf.id], undefined);
  assert.equal(closed.balances.USDC, DEMO_BALANCES.USDC + 100);
});

test("deposit validation covers empty, minimum, and balance with no deposit cap", () => {
  const ctx = { balance: 2_000, asset: "USDC" };
  assert.match(depositError(NaN, ctx)!, /Enter an amount/);
  assert.equal(depositError(MIN_DEPOSIT - 1, ctx), `Minimum ${MIN_DEPOSIT} USDC`);
  assert.equal(depositError(2_500, ctx), "Insufficient USDC balance");
  assert.equal(depositError(1_800, ctx), null);
  assert.equal(depositError(1_000, ctx), null);
});

test("withdraw validation needs a position and caps at its value", () => {
  assert.equal(withdrawError(10, 0), "No position to withdraw");
  assert.equal(withdrawError(0, 100), "Enter an amount");
  assert.equal(withdrawError(100.5, 100), "Exceeds your position");
  assert.equal(withdrawError(100, 100), null);
});

test("amount parsing accepts plain decimals only", () => {
  assert.equal(parseAmount("1,250.50"), 1250.5);
  assert.ok(Number.isNaN(parseAmount("")));
  assert.ok(Number.isNaN(parseAmount("1e3")));
  assert.ok(Number.isNaN(parseAmount("-5")));
});

test("stored data is validated and malformed entries are dropped", () => {
  assert.deepEqual(parsePortfolio("not json"), emptyPortfolio());
  const parsed = parsePortfolio(JSON.stringify({
    balances: { USDC: 5, USDT: -1 },
    positions: { good: { costBasis: 1, value: 2, valuedAt: "2026-11-01T00:00:00Z" }, bad: { costBasis: "x" } },
  }));
  assert.equal(parsed.balances.USDC, 5);
  assert.equal(parsed.balances.USDT, DEMO_BALANCES.USDT);
  assert.deepEqual(Object.keys(parsed.positions), ["good"]);
});

test("withdrawals lock in yield; summary splits open P&L from total yield", () => {
  const start = Date.UTC(2026, 0, 1);
  const later = start + 365 * 86_400_000;
  const opened = applyDeposit(emptyPortfolio(), dtf, 1_000, start);
  // 10% over a year → 1,100. Withdraw 550 = half: 50 of yield is realised.
  const half = applyWithdraw(opened, dtf, 550, later);
  assert.equal(half.realized, 50);
  const summary = portfolioSummary(half, [dtf], later);
  assert.equal(summary.rows.length, 1);
  assert.equal(summary.costBasis, 500);
  assert.ok(Math.abs(summary.pnl - 50) < 0.01);
  assert.ok(Math.abs(summary.pnlPct - 10) < 0.01);
  assert.ok(Math.abs(summary.totalYield - 100) < 0.01);
  assert.equal(parsePortfolio(JSON.stringify(half)).realized, 50);
  assert.equal(parsePortfolio(JSON.stringify({ ...half, realized: "x" })).realized, 0);
});

test("lock-in blocks withdrawals until it ends; new deposits restart it", () => {
  const locked = { ...dtf, lockupDays: 15 };
  const first = applyDeposit(emptyPortfolio(), locked, 1_000, t0);
  const until = Date.parse(first.positions[dtf.id].lockedUntil!);
  assert.equal(until, t0 + 15 * DAY);
  assert.ok(isLocked(first.positions[dtf.id], t0 + 14 * DAY));
  assert.match(withdrawError(100, 1_000, { lockedUntil: first.positions[dtf.id].lockedUntil, now: t0 + DAY })!, /^Locked until /);
  assert.equal(withdrawError(100, 1_000, { lockedUntil: first.positions[dtf.id].lockedUntil, now: t0 + 16 * DAY }), null);
  const second = applyDeposit(first, locked, 500, t0 + 10 * DAY);
  assert.equal(Date.parse(second.positions[dtf.id].lockedUntil!), t0 + 25 * DAY);
  assert.equal(applyDeposit(emptyPortfolio(), dtf, 100, t0).positions[dtf.id].lockedUntil, undefined);
  assert.equal(parsePortfolio(JSON.stringify(second)).positions[dtf.id].lockedUntil, second.positions[dtf.id].lockedUntil);
});
