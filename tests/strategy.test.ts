import { test } from "node:test";
import assert from "node:assert/strict";
import {
  templates,
  makeFarm,
  normalizeNetwork,
  simulate,
  templateById,
  validateStrategy,
} from "../src/domain/strategy";
import { deploymentAdapter } from "../src/adapters/deployment";
test("all templates produce valid initial configurations", () => {
  for (const t of templates) {
    const f = makeFarm(t, "test");
    assert.equal(f.values.asset, "USDC", `${t.name} should default to USDC`);
    assert.deepEqual(
      validateStrategy(t, f.values, f.allocations, f.network),
      {},
      t.name,
    );
  }
});
test("index cannot progress with incomplete allocation or missing name", () => {
  const t = templates[0],
    f = makeFarm(t, "test");
  f.values.name = "";
  f.allocations[0].weight = 10;
  const e = validateStrategy(t, f.values, f.allocations, f.network);
  assert.ok(e.name);
  assert.ok(e.allocations);
});
test("out-of-range leverage and unsupported networks are rejected", () => {
  const t = templates.find((t) => t.type === "PERPETUAL")!,
    f = makeFarm(t, "test");
  f.values.leverage = 11;
  const e = validateStrategy(t, f.values, f.allocations, "Arbitrum");
  assert.ok(e.leverage);
  assert.ok(e.network);
});
test("stress scenarios lose money and fees reduce outcomes", () => {
  const f = makeFarm(templates[0], "test");
  const base = simulate(f.values, f.type, "Base", 90);
  const stress = simulate(f.values, f.type, "Stress", 90);
  assert.ok(stress.returnPct < 0);
  assert.ok(stress.drawdown > base.drawdown);
  assert.ok(
    simulate({ ...f.values, managementFee: 5 }, f.type, "Base", 90).returnPct <
      base.returnPct,
  );
  assert.deepEqual(base, simulate(f.values, f.type, "Base", 90));
});
test("library has four templates per strategy type with distinct theses", () => {
  for (const type of ["INDEX", "SPOT", "PERPETUAL"] as const)
    assert.equal(templates.filter((t) => t.type === type).length, 4, type);
  assert.equal(new Set(templates.map((t) => t.description)).size, templates.length);
  for (const t of templates) {
    assert.ok(t.description.split(/\s+/).length <= 14, t.name);
    assert.deepEqual(t.networks, ["Base", "Solana"], t.name);
  }
});
test("retired template ids resolve to a current template", () => {
  assert.equal(templateById("lp-farming")?.id, "liquidity-yield");
  assert.equal(templateById("funding-rate-capture")?.id, "funding-capture");
  assert.equal(templateById("unknown-id", "SPOT")?.type, "SPOT");
  assert.equal(templateById("unknown-id"), undefined);
});
test("legacy networks normalize to Base", () => {
  assert.equal(normalizeNetwork("Arbitrum"), "Base");
  assert.equal(normalizeNetwork("Solana"), "Solana");
});
test("deployment preview never fabricates hashes or executes transactions", async () => {
  const t = templates[0],
    f = makeFarm(t, "test");
  const plan = deploymentAdapter.prepare(f, t);
  assert.equal(plan.mode, "preview");
  assert.ok(plan.steps.every((s) => s.state === "Waiting" && !s.hash));
  await assert.rejects(deploymentAdapter.execute(f), /No transaction was sent/);
  assert.equal(f.status, "DRAFT");
});
