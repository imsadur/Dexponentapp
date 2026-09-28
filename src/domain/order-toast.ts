export type OrderToastState =
  | "awaiting_signature"
  | "sending"
  | "filled"
  | "partially_filled"
  | "resting"
  | "triggered"
  | "cancelled"
  | "rejected"
  | "unknown";

export type OrderToastAction =
  | "view_position"
  | "view_order"
  | "view_history"
  | "details"
  | "cancel_rest"
  | "retry_market"
  | "edit_price"
  | "edit_trigger"
  | "add_funds"
  | "lower_size"
  | "turn_off_reduce_only"
  | "approve"
  | "try_again"
  | "copy_ref";

export type OrderToastOrder = {
  orderType: "Market" | "Limit" | "Stop" | "Take profit" | "Stop loss" | "Spot";
  side: "Long" | "Short" | "Buy" | "Sell";
  asset: string;
  quote: string;
  size: number;
  price?: number;
  reduceOnly?: boolean;
  farmId?: string;
};

export type OrderToastEvent = {
  status: OrderToastState;
  scenario?: "slippage_exceeded" | "insufficient_liquidity" | "post_only_would_cross" | "invalid_trigger" | "reduce_only_rejected" | "insufficient_margin" | "leverage_change_failed" | "near_liquidation" | "insufficient_balance" | "approval_needed" | "cancelled_by_user";
  rawError?: unknown;
  filled?: number;
  remaining?: number;
  avgPrice?: number;
  triggerPrice?: number;
  requiredMargin?: number;
  minimum?: number;
  balance?: number;
  amountQuote?: number;
  liquidationPrice?: number;
};

export type OrderToastView = {
  state: OrderToastState;
  kind: "progress" | "success" | "warning" | "error";
  title: string;
  body: string;
  actions: OrderToastAction[];
  autoDismissMs: number | null;
  spinner: boolean;
};

const formatNumber = (value: number | undefined, maximumFractionDigits = 6) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits });

const pastVerb = (side: OrderToastOrder["side"]) =>
  side === "Long" || side === "Buy" ? "Bought" : "Sold";

const actionVerb = (side: OrderToastOrder["side"]) =>
  side === "Long" || side === "Buy" ? "Buy" : "Sell";

function mappedScenario(order: OrderToastOrder, event: OrderToastEvent): OrderToastView | null {
  if (!event.scenario) return null;
  if (event.scenario === "slippage_exceeded") return { state: "rejected", kind: "error", title: "Price moved too fast", body: "The price passed your slippage limit. Nothing was bought.", actions: ["retry_market"], autoDismissMs: null, spinner: false };
  if (event.scenario === "insufficient_liquidity") return { state: "partially_filled", kind: "warning", title: "Not enough liquidity", body: `Only ${formatNumber(event.filled)} ${order.asset} was available.`, actions: ["view_position"], autoDismissMs: null, spinner: false };
  if (event.scenario === "post_only_would_cross") return { state: "rejected", kind: "error", title: "Order not placed", body: "Post-only orders can't fill right away. Change the price.", actions: ["edit_price"], autoDismissMs: null, spinner: false };
  if (event.scenario === "invalid_trigger") return { state: "rejected", kind: "error", title: "Trigger price invalid", body: "Change the trigger price and try again.", actions: ["edit_trigger"], autoDismissMs: null, spinner: false };
  if (event.scenario === "reduce_only_rejected") return { state: "rejected", kind: "error", title: "Order not placed", body: "Reduce Only can only close an existing position.", actions: ["turn_off_reduce_only"], autoDismissMs: null, spinner: false };
  if (event.scenario === "insufficient_margin") return { state: "rejected", kind: "error", title: "Not enough margin", body: `You need $${formatNumber(event.requiredMargin)} more. Nothing was charged.`, actions: ["add_funds", "lower_size"], autoDismissMs: null, spinner: false };
  if (event.scenario === "leverage_change_failed") return { state: "rejected", kind: "error", title: "Leverage not changed", body: "Close open orders first, then try again.", actions: ["view_order"], autoDismissMs: null, spinner: false };
  if (event.scenario === "near_liquidation") return { state: "filled", kind: "warning", title: "Liquidation risk", body: `Liquidation price is $${formatNumber(event.liquidationPrice, 2)}. Add margin to lower risk.`, actions: ["add_funds"], autoDismissMs: null, spinner: false };
  if (event.scenario === "insufficient_balance") return { state: "rejected", kind: "error", title: `Not enough ${order.quote}`, body: `You have ${formatNumber(event.balance)} ${order.quote}. Nothing was charged.`, actions: ["add_funds", "lower_size"], autoDismissMs: null, spinner: false };
  if (event.scenario === "approval_needed") return { state: "awaiting_signature", kind: "progress", title: `Approve ${order.asset}`, body: "Allow trading once to continue.", actions: ["approve"], autoDismissMs: null, spinner: false };
  if (event.scenario === "cancelled_by_user") return { state: "cancelled", kind: "warning", title: "Order cancelled", body: `${formatNumber(order.size)} ${order.asset} limit order removed.`, actions: [], autoDismissMs: 3000, spinner: false };
  return null;
}

function mappedError(order: OrderToastOrder, event: OrderToastEvent): OrderToastView | null {
  const error = event.rawError instanceof Error ? event.rawError.message : String(event.rawError || "");
  const normalized = error.toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("minimum") || normalized.includes("too small")) return { state: "rejected", kind: "error", title: "Order too small", body: `Minimum order is ${event.minimum ? `$${formatNumber(event.minimum)}` : "higher than this amount"}.`, actions: ["lower_size"], autoDismissMs: null, spinner: false };
  if (normalized.includes("margin") || normalized.includes("buying power")) return { state: "rejected", kind: "error", title: "Not enough margin", body: `You need $${formatNumber(event.requiredMargin)} more. Nothing was charged.`, actions: ["add_funds", "lower_size"], autoDismissMs: null, spinner: false };
  if (normalized.includes("reduce") || normalized.includes("no open")) return { state: "rejected", kind: "error", title: "Order not placed", body: "Reduce Only can only close an existing position.", actions: ["turn_off_reduce_only"], autoDismissMs: null, spinner: false };
  if (normalized.includes("slippage")) return { state: "rejected", kind: "error", title: "Price moved too fast", body: "The price passed your slippage limit. Nothing was bought.", actions: ["retry_market"], autoDismissMs: null, spinner: false };
  if (normalized.includes("liquidity")) return { state: "partially_filled", kind: "warning", title: "Not enough liquidity", body: `Only ${formatNumber(event.filled)} ${order.asset} was available.`, actions: ["view_position"], autoDismissMs: null, spinner: false };
  if (normalized.includes("post-only")) return { state: "rejected", kind: "error", title: "Order not placed", body: "Post-only orders can't fill right away. Change the price.", actions: ["edit_price"], autoDismissMs: null, spinner: false };
  if (normalized.includes("trigger")) return { state: "rejected", kind: "error", title: "Trigger price invalid", body: "Change the trigger price and try again.", actions: ["edit_trigger"], autoDismissMs: null, spinner: false };
  if (normalized.includes("network") || normalized.includes("timeout") || normalized.includes("connection")) return { state: "unknown", kind: "warning", title: "Connection problem", body: "Check Open Orders before trying again.", actions: ["view_order"], autoDismissMs: null, spinner: false };
  if (normalized.includes("rate")) return { state: "rejected", kind: "error", title: "Too many requests", body: "Wait a few seconds and try again.", actions: ["try_again"], autoDismissMs: null, spinner: false };
  return null;
}

export function mapOrderEvent(order: OrderToastOrder, event: OrderToastEvent): OrderToastView {
  const scenarioView = mappedScenario(order, event);
  if (scenarioView) return scenarioView;
  const errorView = mappedError(order, event);
  if (errorView) return errorView;
  const size = formatNumber(order.size);
  const price = formatNumber(event.avgPrice ?? order.price, 2);
  const filled = formatNumber(event.filled);
  if (event.status === "awaiting_signature") return { state: event.status, kind: "progress", title: "Confirm in your wallet", body: `${actionVerb(order.side)} ${size} ${order.asset} · ${order.orderType}`, actions: [], autoDismissMs: null, spinner: true };
  if (event.status === "sending") return { state: event.status, kind: "progress", title: "Placing order…", body: `${actionVerb(order.side)} ${size} ${order.asset}`, actions: [], autoDismissMs: null, spinner: true };
  if (event.status === "unknown") return { state: event.status, kind: "warning", title: "Checking your order…", body: "We're confirming it. Don't resubmit yet.", actions: [], autoDismissMs: null, spinner: true };
  if (event.status === "cancelled") return { state: event.status, kind: "warning", title: "Order not placed", body: "You cancelled in your wallet.", actions: [], autoDismissMs: 3000, spinner: false };
  if (event.status === "triggered") return { state: event.status, kind: "progress", title: "Order triggered", body: `${order.orderType} hit $${formatNumber(event.triggerPrice, 2)}. Placing your order…`, actions: [], autoDismissMs: null, spinner: true };
  if (event.status === "resting") return { state: event.status, kind: "success", title: order.orderType === "Limit" ? "Order placed" : "Trigger set", body: order.orderType === "Limit" ? `${actionVerb(order.side)} ${size} ${order.asset} at $${price}. Waiting to fill.` : `${order.orderType} at $${formatNumber(event.triggerPrice, 2)}. Nothing has executed yet.`, actions: ["view_order"], autoDismissMs: 7000, spinner: false };
  if (event.status === "partially_filled") return { state: event.status, kind: "warning", title: "Partially filled", body: order.orderType === "Market" ? `${filled} of ${size} ${order.asset} filled. The rest was cancelled.` : `${filled} of ${size} ${order.asset} filled. The rest is still open.`, actions: order.orderType === "Market" ? ["view_position"] : ["view_order", "cancel_rest"], autoDismissMs: null, spinner: false };
  if (event.status === "rejected") return { state: event.status, kind: "error", title: "Something went wrong", body: "Order not placed. Nothing was charged.", actions: ["try_again", "copy_ref"], autoDismissMs: null, spinner: false };
  if (order.reduceOnly) {
    const remaining = Number(event.remaining || 0);
    return remaining > 0
      ? { state: "filled", kind: "success", title: "Position reduced", body: `Reduced by ${size} ${order.asset}. ${formatNumber(remaining)} ${order.asset} left.`, actions: ["view_position", "details"], autoDismissMs: 7000, spinner: false }
      : { state: "filled", kind: "success", title: "Position closed", body: `Closed ${size} ${order.asset} at $${price}`, actions: ["view_history", "details"], autoDismissMs: 7000, spinner: false };
  }
  if (order.orderType === "Limit") return { state: "filled", kind: "success", title: "Limit order filled", body: `${pastVerb(order.side)} ${size} ${order.asset} at $${price}`, actions: ["view_position", "details"], autoDismissMs: 7000, spinner: false };
  if (order.orderType === "Stop loss" || order.orderType === "Take profit") return { state: "filled", kind: "success", title: `${order.orderType} filled`, body: `Closed ${size} ${order.asset} at $${price}`, actions: ["view_position"], autoDismissMs: 7000, spinner: false };
  if (order.orderType === "Spot" && event.amountQuote !== undefined) return { state: "filled", kind: "success", title: "Swap complete", body: `${pastVerb(order.side)} ${size} ${order.asset} for ${formatNumber(event.amountQuote)} ${order.quote}`, actions: ["view_history"], autoDismissMs: 7000, spinner: false };
  return { state: "filled", kind: "success", title: "Order filled", body: `${pastVerb(order.side)} ${size} ${order.asset} at $${price}`, actions: ["view_position", "details"], autoDismissMs: 7000, spinner: false };
}
