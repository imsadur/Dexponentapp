import assert from "node:assert/strict";
import test from "node:test";
import { mapOrderEvent, type OrderToastOrder } from "../src/domain/order-toast";

const marketOrder: OrderToastOrder = { orderType: "Market", side: "Long", asset: "SOL", quote: "USDC", size: 1, price: 119.19 };

test("order toast maps progress and confirmation states", () => {
  assert.deepEqual(mapOrderEvent(marketOrder, { status: "sending" }), {
    state: "sending", kind: "progress", title: "Placing order…", body: "Buy 1 SOL", actions: [], autoDismissMs: null, spinner: true,
  });
  assert.match(mapOrderEvent(marketOrder, { status: "awaiting_signature" }).title, /Confirm/);
  assert.equal(mapOrderEvent(marketOrder, { status: "unknown" }).autoDismissMs, null);
  assert.equal(mapOrderEvent(marketOrder, { status: "cancelled" }).autoDismissMs, 3000);
});

test("order toast maps market, limit, conditional, and partial outcomes", () => {
  const filled = mapOrderEvent(marketOrder, { status: "filled", avgPrice: 119.19 });
  assert.equal(filled.title, "Order filled");
  assert.equal(filled.body, "Bought 1 SOL at $119.19");
  assert.deepEqual(filled.actions, ["view_position", "details"]);

  const partial = mapOrderEvent(marketOrder, { status: "partially_filled", filled: .6 });
  assert.match(partial.body, /rest was cancelled/);
  assert.equal(partial.autoDismissMs, null);

  const limit = { ...marketOrder, orderType: "Limit" as const };
  assert.equal(mapOrderEvent(limit, { status: "resting" }).title, "Order placed");
  assert.match(mapOrderEvent(limit, { status: "partially_filled", filled: .5 }).body, /still open/);
  assert.equal(mapOrderEvent(limit, { status: "filled" }).title, "Limit order filled");

  const stop = { ...marketOrder, orderType: "Stop loss" as const };
  assert.equal(mapOrderEvent(stop, { status: "resting", triggerPrice: 105 }).title, "Trigger set");
  assert.equal(mapOrderEvent(stop, { status: "triggered", triggerPrice: 105 }).title, "Order triggered");
});

test("order toast maps reduce-only position outcomes", () => {
  const reduce = { ...marketOrder, side: "Short" as const, reduceOnly: true };
  assert.equal(mapOrderEvent(reduce, { status: "filled", remaining: .4 }).title, "Position reduced");
  assert.equal(mapOrderEvent(reduce, { status: "filled", remaining: 0 }).title, "Position closed");
});

test("order toast converts raw errors into safe user copy", () => {
  const cases = [
    ["minimum order", "Order too small"],
    ["insufficient margin", "Not enough margin"],
    ["No open position to reduce", "Order not placed"],
    ["slippage exceeded", "Price moved too fast"],
    ["insufficient liquidity", "Not enough liquidity"],
    ["post-only would cross", "Order not placed"],
    ["invalid trigger", "Trigger price invalid"],
    ["network timeout", "Connection problem"],
    ["rate limited", "Too many requests"],
    ["unmapped exchange code 743", "Something went wrong"],
  ] as const;
  for (const [rawError, title] of cases) {
    const view = mapOrderEvent(marketOrder, { status: "rejected", rawError });
    assert.equal(view.title, title);
    assert.doesNotMatch(view.body, /743|exchange code/i);
  }
});

test("order toast covers perp risk, spot, approval, and cancellation scenarios", () => {
  assert.equal(mapOrderEvent(marketOrder, { status: "filled", scenario: "near_liquidation", liquidationPrice: 102.2 }).title, "Liquidation risk");
  assert.equal(mapOrderEvent(marketOrder, { status: "rejected", scenario: "leverage_change_failed" }).title, "Leverage not changed");
  const spot = { ...marketOrder, orderType: "Spot" as const, side: "Buy" as const };
  assert.equal(mapOrderEvent(spot, { status: "filled", amountQuote: 119.19 }).title, "Swap complete");
  assert.equal(mapOrderEvent(spot, { status: "rejected", scenario: "insufficient_balance", balance: 20 }).title, "Not enough USDC");
  assert.equal(mapOrderEvent(spot, { status: "awaiting_signature", scenario: "approval_needed" }).title, "Approve SOL");
  assert.equal(mapOrderEvent({ ...marketOrder, orderType: "Limit" }, { status: "cancelled", scenario: "cancelled_by_user" }).title, "Order cancelled");
});
