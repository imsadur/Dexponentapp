import assert from "node:assert/strict";
import test from "node:test";
import { demoDtfCatalogue } from "../src/domain/dtf";
import {
  DEFAULT_MARKET_CATEGORY,
  MARKET_CATEGORIES,
  filterMarket,
  isReferenceToken,
  marketPulse,
  marketTokens,
  sortMarket,
} from "../src/domain/market";

const now = Date.UTC(2026, 10, 23, 12);
const tokens = marketTokens(demoDtfCatalogue, now);

test("market leads with DTFs and lists majors, DeFi and stablecoins as reference rows", () => {
  assert.equal(DEFAULT_MARKET_CATEGORY, "DTF");
  assert.equal(MARKET_CATEGORIES[0].id, "DTF");
  for (const c of MARKET_CATEGORIES.filter((c) => c.id !== "ALL"))
    assert.ok(tokens.some((t) => t.category === c.id), `missing ${c.id}`);
  assert.ok(!MARKET_CATEGORIES.some((c) => (c.id as string) === "STOCK"));
  assert.ok(!tokens.some((t) => (t.category as string) === "STOCK"));
  assert.equal(tokens.filter((t) => t.category === "DTF").length, demoDtfCatalogue.length);
  assert.ok(tokens.filter((t) => t.category === "DTF").every((t) => t.dtf && !isReferenceToken(t)));
  assert.ok(tokens.filter((t) => t.category !== "DTF").every((t) => !t.dtf && isReferenceToken(t)));
  assert.equal(new Set(tokens.map((t) => t.id)).size, tokens.length);
});

test("sparklines end at the current price and match the 24H change", () => {
  for (const t of tokens.filter((t) => t.category !== "DTF")) {
    assert.ok(Math.abs(t.spark.at(-1)! / t.price - 1) < 1e-9, t.symbol);
    const dayAgo = t.spark[t.spark.length - 25];
    assert.ok(Math.abs((t.price / dayAgo - 1) * 100 - t.change24h) < 1e-6, t.symbol);
  }
  assert.ok(tokens.filter((t) => t.category === "STABLE").every((t) => Math.abs(t.price - 1) < 0.1 || t.symbol === "EURC"));
});

test("filters and sorts combine", () => {
  const majors = filterMarket(tokens, { category: "MAJOR" });
  assert.ok(majors.length > 0 && majors.every((t) => t.category === "MAJOR"));
  assert.deepEqual(filterMarket(tokens, { query: "$jup" }).map((t) => t.symbol), ["JUP"]);
  assert.ok(filterMarket(tokens, { minCap: 1_000_000_000 }).every((t) => t.marketCap >= 1_000_000_000));
  assert.ok(filterMarket(tokens, { network: "Solana" }).every((t) => t.network === "Solana"));
  const gainers = sortMarket(tokens, "gainers");
  for (let i = 1; i < gainers.length; i++) assert.ok(gainers[i - 1].change24h >= gainers[i].change24h);
  const losers = sortMarket(tokens, "losers", "7D");
  for (let i = 1; i < losers.length; i++) assert.ok(losers[i - 1].change7d <= losers[i].change7d);
});

test("market pulse counts DTF tokens only", () => {
  const dtfs = tokens.filter((t) => t.category === "DTF");
  const pulse = marketPulse(tokens);
  assert.ok(pulse.up + pulse.down <= dtfs.length);
  assert.equal(pulse.tvl, demoDtfCatalogue.reduce((s, d) => s + d.tvl, 0));
  assert.equal(pulse.netFlow24h, dtfs.reduce((s, t) => s + t.netFlow24h, 0));
  assert.deepEqual(marketPulse([]), { up: 0, down: 0, tvl: 0, netFlow24h: 0 });
});
