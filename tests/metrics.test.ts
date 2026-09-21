import assert from "node:assert/strict";
import test from "node:test";
import { seedFarms } from "../src/adapters/data";
import {
  farmFinancialMetrics,
  indexWeights,
  performanceForRange,
  perpetualHealth,
  portfolioMetrics,
  spotComposition,
} from "../src/domain/metrics";

test("capital overview uses one reconciled active-Farm aggregation", () => {
  const metrics = portfolioMetrics(seedFarms());
  assert.equal(metrics.active.length, 3);
  assert.equal(metrics.drafts.length, 0);
  assert.equal(metrics.managedCapital, 5_410_000);
  assert.equal(metrics.withdrawableCapital, 4_250_000);
  assert.equal(metrics.totalLps, 408);
  assert.equal(metrics.netTrajectory30d.toFixed(2), "3.68");
  assert.equal(performanceForRange(metrics.netTrajectory30d, 30), metrics.netTrajectory30d);
  assert.equal(metrics.allocation.reduce((sum, item) => sum + item.amount, 0), metrics.managedCapital);
});

test("Farm metrics keep LP yield and manager fees separate", () => {
  const farm = seedFarms()[0];
  const metrics = farmFinancialMetrics(farm, new Date("2026-09-17T10:00:00.000Z"));
  assert.equal(metrics.totalDeposits, 2_725_000);
  assert.equal(metrics.netSinceInception, 115_000);
  assert.equal(metrics.managerFee, 9_712.8);
  assert.equal(metrics.lpYieldDistributed, 87_415.2);
  assert.equal(metrics.realizedApy, 18.2);
});

test("strategy-specific health is numeric and threshold-aware", () => {
  const [perp, index, spot] = seedFarms();
  const perpMetrics = perpetualHealth(perp);
  assert.equal(perpMetrics.direction, "Neutral");
  assert.equal(perpMetrics.marginHealth, 76);
  assert.equal(perpMetrics.fundingRate, 0.0125);
  assert.ok(perpMetrics.liquidationPrice > 0);
  assert.ok(indexWeights(index).some((asset) => asset.flagged));
  assert.deepEqual(spotComposition(spot).assets.map((asset) => asset.weight), [58, 42]);
});
