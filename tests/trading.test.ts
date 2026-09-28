import assert from "node:assert/strict";
import test from "node:test";
import { makeFarm, templates } from "../src/domain/strategy";
import {
  filledOrders,
  maximumOrderNotional,
  percentageToSize,
  perpetualPair,
  placeDemoOrder,
  searchPerpetualMarkets,
  sizeToPercentage,
} from "../src/domain/trading";

const perpetualTemplate = templates.find((template) => template.type === "PERPETUAL")!;

test("Perpetual templates include base, quote, and venue defaults", () => {
  const farm = makeFarm(perpetualTemplate, "perp-test");
  assert.equal(perpetualPair(farm), "ETH/USDC");
  assert.equal(farm.values.venue, "Hyperliquid");
});

test("placing a demo order records the Perpetual position", () => {
  const farm = {
    ...makeFarm(perpetualTemplate, "perp-test"),
    status: "ACTIVE" as const,
    source: "demo" as const,
  };
  const updated = placeDemoOrder(farm, {
    side: "Long",
    type: "Market",
    size: 2_500,
    leverage: 3,
    price: 3_826.4,
  });
  assert.equal(updated.values.demoTradeSide, "Long");
  assert.equal(updated.values.demoTradeSize, 2_500);
  assert.match(updated.events.at(-1) || "", /demo order filled/);
});

test("market search matches symbols, quotes, and groups", () => {
  assert.deepEqual(
    searchPerpetualMarkets("arb").map((market) => market.base),
    ["ARB"],
  );
  assert.ok(searchPerpetualMarkets("USDT").every((market) => market.quote === "USDT"));
  assert.ok(searchPerpetualMarkets("", "Major").every((market) => market.group === "Major"));
});

test("a demo order can open a market different from the Farm default", () => {
  const farm = {
    ...makeFarm(perpetualTemplate, "perp-alt-pair"),
    status: "ACTIVE" as const,
    source: "demo" as const,
  };
  const updated = placeDemoOrder(farm, {
    side: "Short",
    type: "Market",
    size: 1_500,
    leverage: 2,
    price: 1.17,
    market: { base: "ARB", quote: "USDC" },
  });
  assert.equal(updated.values.demoTradePair, "ARB/USDC");
  assert.equal(updated.values.demoTradeBase, "ARB");
  assert.match(updated.events.at(-1) || "", /Short ARB\/USDC/);
  assert.equal(filledOrders(updated).at(-1)?.pair, "ARB/USDC");
});

test("filled demo orders retain complete execution history", () => {
  const farm = {
    ...makeFarm(perpetualTemplate, "perp-history"),
    status: "ACTIVE" as const,
    source: "demo" as const,
  };
  const first = placeDemoOrder(farm, {
    side: "Long",
    type: "Market",
    size: 800,
    leverage: 2,
    price: 3_826.4,
  });
  const second = placeDemoOrder(first, {
    side: "Short",
    type: "Limit",
    size: 500,
    leverage: 3,
    price: 3_900,
  });
  assert.equal(filledOrders(second).length, 2);
  assert.deepEqual(filledOrders(second).map((order) => order.side), ["Long", "Short"]);
});

test("demo trades require an active Perpetual Farm", () => {
  const farm = makeFarm(perpetualTemplate, "perp-test");
  assert.throws(
    () =>
      placeDemoOrder(farm, {
        side: "Short",
        type: "Limit",
        size: 100,
        leverage: 2,
        price: 3_700,
      }),
    /Resume this Farm/,
  );
});

test("position sizing helpers clamp, round down, and synchronize percentages", () => {
  assert.equal(percentageToSize({ percentage: 50, maxSize: 0.123456, precision: 5 }), 0.06172);
  assert.equal(percentageToSize({ percentage: 120, maxSize: 2, precision: 3 }), 2);
  assert.equal(sizeToPercentage({ size: 0.5, maxSize: 1 }), 50);
  assert.equal(sizeToPercentage({ size: 2, maxSize: 1 }), 100);
  assert.ok(maximumOrderNotional({ availableMargin: 1_000, leverage: 10 }) < 10_000);
  assert.equal(maximumOrderNotional({ availableMargin: 0, leverage: 10 }), 0);
  assert.equal(percentageToSize({ percentage: 50, maxSize: 0, precision: 5 }), 0);
});

test("reduce-only orders close a percentage of the existing quantity without flipping side", () => {
  const farm = {
    ...makeFarm(perpetualTemplate, "perp-reduce"),
    status: "ACTIVE" as const,
    source: "demo" as const,
  };
  const opened = placeDemoOrder(farm, {
    side: "Long",
    type: "Market",
    size: 7_652.8,
    quantity: 2,
    leverage: 2,
    price: 3_826.4,
  });
  const reduced = placeDemoOrder(opened, {
    side: "Short",
    type: "Market",
    size: 3_826.4,
    quantity: 1,
    leverage: 2,
    price: 3_826.4,
    reduceOnly: true,
  });
  assert.equal(reduced.values.demoTradeSide, "Long");
  assert.equal(reduced.values.demoTradeQuantity, 1);
  assert.equal(reduced.values.demoTradeSize, 3_826.4);
  assert.equal(filledOrders(reduced).at(-1)?.reduceOnly, true);
});

test("reduce-only orders cannot exceed or increase the open position", () => {
  const farm = {
    ...makeFarm(perpetualTemplate, "perp-reduce-guard"),
    status: "ACTIVE" as const,
    source: "demo" as const,
  };
  const opened = placeDemoOrder(farm, { side: "Short", type: "Market", size: 3_826.4, quantity: 1, leverage: 2, price: 3_826.4 });
  assert.throws(() => placeDemoOrder(opened, { side: "Long", type: "Market", size: 7_652.8, quantity: 2, leverage: 2, price: 3_826.4, reduceOnly: true }), /cannot exceed/);
  assert.throws(() => placeDemoOrder(opened, { side: "Short", type: "Market", size: 1_913.2, quantity: .5, leverage: 2, price: 3_826.4, reduceOnly: true }), /must be reduced/);
});
