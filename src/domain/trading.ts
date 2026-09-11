import type { Farm } from "./strategy";

export type DemoOrder = {
  side: "Long" | "Short";
  type: "Market" | "Limit";
  size: number;
  leverage: number;
  price: number;
};

export function perpetualPair(farm: Farm) {
  return `${String(farm.values.underlying || "ETH")}/${String(farm.values.quoteAsset || "USDC")}`;
}

export function placeDemoOrder(farm: Farm, order: DemoOrder): Farm {
  if (farm.type !== "PERPETUAL")
    throw new Error("Trading is available only for Perpetual Farms.");
  if (farm.status !== "ACTIVE")
    throw new Error("Resume this Farm before placing a demo trade.");
  if (!Number.isFinite(order.size) || order.size <= 0)
    throw new Error("Enter a position size greater than zero.");
  if (!Number.isFinite(order.leverage) || order.leverage < 1 || order.leverage > 10)
    throw new Error("Choose leverage between 1× and 10×.");
  if (order.type === "Limit" && (!Number.isFinite(order.price) || order.price <= 0))
    throw new Error("Enter a valid limit price.");

  const quote = String(farm.values.quoteAsset || "USDC");
  const pair = perpetualPair(farm);
  return {
    ...farm,
    values: {
      ...farm.values,
      demoTradeSide: order.side,
      demoTradeType: order.type,
      demoTradeSize: order.size,
      demoTradeLeverage: order.leverage,
      demoEntryPrice: order.price,
    },
    updatedAt: new Date().toISOString(),
    events: [
      ...farm.events,
      `${order.side} ${pair} · ${order.size.toLocaleString()} ${quote} at ${order.leverage}× · demo order filled`,
    ],
  };
}
