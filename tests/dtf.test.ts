import assert from "node:assert/strict";
import test from "node:test";
import { seedFarms } from "../src/adapters/data";
import { demoDtfCatalogue, dtfFromFarm, dtfTotals, filterDtfs, sortDtfs } from "../src/domain/dtf";

test("catalogue ids are unique and descriptions name manager and base asset", () => {
  assert.equal(new Set(demoDtfCatalogue.map((d) => d.id)).size, demoDtfCatalogue.length);
  for (const d of demoDtfCatalogue) {
    assert.ok(d.description.includes(d.manager), d.id);
    assert.ok(d.description.includes(d.baseAsset), d.id);
  }
});

test("search matches name, token, chain, and manager case-insensitively", () => {
  assert.ok(filterDtfs(demoDtfCatalogue, { query: "sol" }).every((d) => d.assets.includes("SOL") || /sol/i.test(d.name)));
  assert.ok(filterDtfs(demoDtfCatalogue, { query: "BASE" }).length > 0);
  assert.ok(filterDtfs(demoDtfCatalogue, { query: "kestrel" }).every((d) => d.manager === "Kestrel Labs"));
  assert.deepEqual(filterDtfs(demoDtfCatalogue, { query: "zzzz" }), []);
});

test("type and network filters combine", () => {
  const result = filterDtfs(demoDtfCatalogue, { type: "SPOT", network: "Base" });
  assert.ok(result.length > 0);
  assert.ok(result.every((d) => d.type === "SPOT" && d.network === "Base"));
});

test("top performing sorts by 30D change, trending by score", () => {
  const top = sortDtfs(demoDtfCatalogue, "top");
  for (let i = 1; i < top.length; i++) assert.ok(top[i - 1].change30d >= top[i].change30d);
  const trending = sortDtfs(demoDtfCatalogue, "trending");
  for (let i = 1; i < trending.length; i++) assert.ok(trending[i - 1].trending >= trending[i].trending);
});

test("workspace farms become linked listings and totals add up", () => {
  const farm = seedFarms()[1];
  const dtf = dtfFromFarm(farm, "Alex Morgan");
  assert.equal(dtf.farmId, farm.id);
  assert.equal(dtf.type, "INDEX");
  assert.ok(dtf.description.startsWith("Index DTF managed by Alex Morgan"));
  const totals = dtfTotals([dtf, ...demoDtfCatalogue]);
  assert.equal(totals.count, demoDtfCatalogue.length + 1);
  assert.equal(totals.tvl, demoDtfCatalogue.reduce((s, d) => s + d.tvl, farm.tvl));
});

test("workspace listings show strategy-specific holdings", () => {
  const [perp, index, spot] = seedFarms().map((farm) => dtfFromFarm(farm, "Alex Morgan"));
  assert.deepEqual(perp.assets, ["USDC", "ETH"]);
  assert.deepEqual(spot.assets, ["USDC", "USDT"]);
  assert.ok(index.assets.length > 1);
});
