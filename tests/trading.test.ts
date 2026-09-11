import assert from "node:assert/strict";
import test from "node:test";
import { makeFarm, templates } from "../src/domain/strategy";
import { perpetualPair, placeDemoOrder } from "../src/domain/trading";

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
