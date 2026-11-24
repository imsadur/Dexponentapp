import assert from "node:assert/strict";
import test from "node:test";
import { seedFarms } from "../src/adapters/data";
import {
  demoDtfCatalogue,
  dtfActivity,
  dtfAllocation,
  dtfFromFarm,
  cleanTicker,
  dtfContract,
  dtfDocuments,
  dtfHistory,
  explorerUrl,
  maskAddress,
  txExplorerUrl,
  tickerFromName,
  dtfReturn24h,
  dtfUtilization,
  targetPace24h,
  dtfSeries,
  dtfTotals,
  filterDtfs,
  similarDtfs,
  sortDtfs,
} from "../src/domain/dtf";

test("catalogue ids are unique and descriptions name manager and base asset", () => {
  assert.equal(new Set(demoDtfCatalogue.map((d) => d.id)).size, demoDtfCatalogue.length);
  for (const d of demoDtfCatalogue) {
    assert.ok(d.description.includes(d.manager), d.id);
    assert.ok(d.description.includes(d.baseAsset), d.id);
  }
});

test("search matches name, token, chain, and manager case-insensitively", () => {
  assert.ok(filterDtfs(demoDtfCatalogue, { query: "sol" }).every((d) => d.assets.includes("SOL") || /sol/i.test(d.name) || d.network === "Solana"));
  assert.ok(filterDtfs(demoDtfCatalogue, { query: "BASE" }).length > 0);
  assert.ok(filterDtfs(demoDtfCatalogue, { query: "kestrel" }).every((d) => d.manager === "Kestrel Labs"));
  assert.deepEqual(filterDtfs(demoDtfCatalogue, { query: "zzzz" }), []);
});

test("type and network filters combine", () => {
  const result = filterDtfs(demoDtfCatalogue, { type: "SPOT", network: "Base" });
  assert.ok(result.length > 0);
  assert.ok(result.every((d) => d.type === "SPOT" && d.network === "Base"));
});

test("top sorts by 24H return, trending by score", () => {
  const now = Date.UTC(2026, 10, 23, 12);
  const top = sortDtfs(demoDtfCatalogue, "top", now).map((d) => dtfReturn24h(d, now));
  for (let i = 1; i < top.length; i++) assert.ok(top[i - 1] >= top[i]);
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

test("catalogue lists only Base and Solana DTFs", () => {
  assert.ok(demoDtfCatalogue.every((d) => d.network === "Base" || d.network === "Solana"));
  assert.ok(demoDtfCatalogue.some((d) => d.network === "Solana"));
});

test("utilization never eats into the liquidity buffer and matches idle allocation", () => {
  for (const d of demoDtfCatalogue) {
    const used = dtfUtilization(d);
    assert.ok(used > 0 && used <= 100 - d.bufferPct, `${d.id} ${used}`);
    const idle = dtfAllocation(d).at(-1)!.share;
    assert.ok(Math.abs(idle - (100 - used)) < 0.02, d.id);
  }
});

test("24H return follows the simulated price history", () => {
  const now = Date.UTC(2026, 10, 23, 12);
  const dtf = demoDtfCatalogue[0];
  const history = dtfHistory(dtf, now);
  const expected = (history.at(-1)!.price / history.at(-25)!.price - 1) * 100;
  assert.equal(dtfReturn24h(dtf, now), expected);
  assert.ok(Math.abs(targetPace24h(36.5) - 0.1) < 1e-9);
});

test("allocation shares add up to 100% and end with idle capital", () => {
  for (const d of demoDtfCatalogue) {
    const rows = dtfAllocation(d);
    const total = rows.reduce((sum, r) => sum + r.share, 0);
    assert.ok(Math.abs(total - 100) < 0.02, `${d.id} sums to ${total}`);
    assert.equal(rows.at(-1)!.id, "idle");
    assert.ok(rows.every((r) => r.share > 0), d.id);
  }
});

test("simulated history agrees with the listed 7D APY and starts at launch", () => {
  const now = Date.UTC(2026, 10, 23, 12);
  const dtf = demoDtfCatalogue.find((d) => d.id === "dtf-l1-majors")!;
  const history = dtfHistory(dtf, now);
  const apy = dtfSeries(history, "apy", "7D").at(-1)!.value;
  assert.ok(Math.abs(apy - dtf.apy7d!) < 0.05, `apy ${apy}`);
  const ret = dtfSeries(history, "return", "7D");
  assert.equal(ret[0].value, 0);
  assert.ok(Math.abs(dtfSeries(history, "tvl", "30D").at(-1)!.value - dtf.tvl) < 1);

  const young = demoDtfCatalogue.find((d) => d.apy7d === null)!;
  const youngHistory = dtfHistory(young, now);
  const launch = Date.parse(`${young.launchedAt}T00:00:00Z`);
  assert.ok(dtfSeries(youngHistory, "return", "90D").every((p) => p.time >= launch));
  assert.equal(dtfSeries(youngHistory, "apy", "7D").length, 0);
});

test("LP activity is deterministic, newest first, and never predate launch", () => {
  const now = Date.UTC(2026, 10, 23, 12);
  const dtf = demoDtfCatalogue[3];
  assert.deepEqual(dtfActivity(dtf, now), dtfActivity(dtf, now));
  const launch = Date.parse(`${dtf.launchedAt}T00:00:00Z`);
  const activity = dtfActivity(dtf, now);
  assert.ok(activity.every((a) => a.time > launch && a.time <= now && a.amount > 0));
  assert.ok(activity.some((a) => a.type === "Deposit") && activity.some((a) => a.type === "Withdraw"));
  for (let i = 1; i < activity.length; i++) assert.ok(activity[i - 1].time > activity[i].time);
});

test("similar strategies prefer the same type and exclude the current one", () => {
  const dtf = demoDtfCatalogue.find((d) => d.type === "SPOT")!;
  const similar = similarDtfs(demoDtfCatalogue, dtf);
  assert.equal(similar.length, 3);
  assert.ok(!similar.some((d) => d.id === dtf.id));
  assert.equal(similar[0].type, "SPOT");
});

test("tickers come from the manager's symbol or the name's initials", () => {
  assert.equal(tickerFromName("Blue Chip Index"), "BCI");
  assert.equal(tickerFromName("ETH Delta Neutral"), "EDN");
  assert.equal(tickerFromName("Stablecoin"), "STAB");
  assert.equal(cleanTicker("$bci-1"), "BCI1");
  const farm = seedFarms()[1];
  assert.equal(dtfFromFarm({ ...farm, values: { ...farm.values, tokenSymbol: "$xyz" } }, "A").symbol, "XYZ");
  assert.equal(dtfFromFarm(farm, "A").symbol, tickerFromName(farm.name));
  assert.equal(new Set(demoDtfCatalogue.map((d) => d.symbol)).size, demoDtfCatalogue.length);
  assert.ok(filterDtfs(demoDtfCatalogue, { query: "$L1MAJ" }).length === 1);
});

test("contract addresses match the network and link to its explorer", () => {
  const base = demoDtfCatalogue.find((d) => d.network === "Base")!;
  const sol = demoDtfCatalogue.find((d) => d.network === "Solana")!;
  assert.match(dtfContract(base), /^0x[0-9a-f]{40}$/);
  assert.match(dtfContract(sol), /^[1-9A-HJ-NP-Za-km-z]{44}$/);
  assert.equal(explorerUrl("Base", "0xabc"), "https://basescan.org/address/0xabc");
  assert.equal(explorerUrl("Solana", "So1"), "https://solscan.io/account/So1");
  assert.equal(explorerUrl("Nowhere", "x"), null);
});

test("documents: audited demo DTFs include the audit report; Farms use their uploads", () => {
  const audited = demoDtfCatalogue.find((d) => d.audit)!;
  const unaudited = demoDtfCatalogue.find((d) => !d.audit)!;
  assert.ok(dtfDocuments(audited).some((d) => d.name.includes(audited.audit!.by) && d.type === "PDF"));
  assert.ok(!dtfDocuments(unaudited).some((d) => /audit/i.test(d.name)));
  assert.ok(dtfDocuments(audited).every((d) => d.demo));
  const farm = dtfFromFarm(seedFarms()[1], "A");
  assert.deepEqual(dtfDocuments(farm, [{ name: "Deck.pptx", size: 2048, type: "" }]), [{ name: "Deck.pptx", type: "PPTX", size: 2048, demo: false }]);
  assert.deepEqual(dtfDocuments(farm), []);
});

test("LP activity uses network-format ids, links transactions, and masks wallets", () => {
  const now = Date.UTC(2026, 10, 23, 12);
  const base = demoDtfCatalogue.find((d) => d.network === "Base")!;
  const sol = demoDtfCatalogue.find((d) => d.network === "Solana")!;
  const [b] = dtfActivity(base, now);
  const [s] = dtfActivity(sol, now);
  assert.match(b.hash, /^0x[0-9a-f]{64}$/);
  assert.match(b.wallet, /^0x[0-9a-f]{40}$/);
  assert.match(s.hash, /^[1-9A-HJ-NP-Za-km-z]{88}$/);
  assert.match(s.wallet, /^[1-9A-HJ-NP-Za-km-z]{44}$/);
  assert.equal(txExplorerUrl("Base", b.hash), `https://basescan.org/tx/${b.hash}`);
  assert.equal(txExplorerUrl("Solana", s.hash), `https://solscan.io/tx/${s.hash}`);
  assert.equal(maskAddress("0x1234567890abcdef"), "0x12…cdef");
});
