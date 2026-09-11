import assert from "node:assert/strict";
import test from "node:test";
import {
  canPauseFarm,
  depositToDemoFarm,
  deployDemoFarm,
  setFarmPaused,
  withdrawFromDemoFarm,
} from "../src/domain/farm-actions";
import { makeFarm, templates } from "../src/domain/strategy";

test("demo deployment creates a manageable active Farm", () => {
  const draft = makeFarm(templates[0], "test-farm");
  const deployed = deployDemoFarm(draft, "MEDIUM", 12.345);
  assert.equal(deployed.status, "ACTIVE");
  assert.equal(deployed.source, "demo");
  assert.equal(deployed.apy, 12.35);
  assert.equal(canPauseFarm(deployed), true);
});

test("deposit, pause, and withdrawal update demo Farm state", () => {
  const deployed = deployDemoFarm(makeFarm(templates[0], "test-farm"), "MEDIUM", 12);
  const funded = depositToDemoFarm(deployed, 1_000);
  assert.equal(funded.tvl, 1_000);
  assert.equal(funded.values.demoPosition, 1_000);
  const paused = setFarmPaused(funded, true);
  assert.equal(paused.status, "PAUSED");
  const withdrawn = withdrawFromDemoFarm(paused, 400);
  assert.equal(withdrawn.tvl, 600);
  assert.equal(withdrawn.values.demoPosition, 600);
});

test("seed Farms without manager pause controls cannot be paused", () => {
  const fixture = { ...makeFarm(templates[0], "fixture"), source: "demo" as const, status: "ACTIVE" as const };
  assert.equal(canPauseFarm(fixture), false);
  assert.throws(() => setFarmPaused(fixture, true), /not available/);
});
