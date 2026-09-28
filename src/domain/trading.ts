import type { Farm } from "./strategy";

export type PerpetualMarket = {
  base: string;
  quote: "USDC" | "USDT";
  price: number;
  change: number;
  funding: number;
  openInterest: string;
  volume: string;
  group: "Major" | "Alt";
  maxLeverage: number;
  quantityPrecision: number;
  minQuantity: number;
};

export const perpetualMarkets: PerpetualMarket[] = [
  { base: "BTC", quote: "USDC", price: 116420, change: 1.36, funding: 0.0081, openInterest: "$2.74B", volume: "$1.12B", group: "Major", maxLeverage: 10, quantityPrecision: 5, minQuantity: 0.0001 },
  { base: "ETH", quote: "USDC", price: 3826.4, change: 2.84, funding: 0.0108, openInterest: "$1.28B", volume: "$684.2M", group: "Major", maxLeverage: 10, quantityPrecision: 4, minQuantity: 0.001 },
  { base: "SOL", quote: "USDC", price: 249.83, change: -0.72, funding: 0.0124, openInterest: "$486.7M", volume: "$312.4M", group: "Major", maxLeverage: 10, quantityPrecision: 2, minQuantity: 0.01 },
  { base: "ARB", quote: "USDC", price: 1.17, change: 4.18, funding: 0.0064, openInterest: "$186.3M", volume: "$92.8M", group: "Alt", maxLeverage: 7, quantityPrecision: 1, minQuantity: 1 },
  { base: "OP", quote: "USDC", price: 2.84, change: -1.42, funding: -0.0031, openInterest: "$142.8M", volume: "$74.1M", group: "Alt", maxLeverage: 7, quantityPrecision: 1, minQuantity: 1 },
  { base: "AVAX", quote: "USDC", price: 48.62, change: 0.91, funding: 0.0048, openInterest: "$216.5M", volume: "$108.7M", group: "Alt", maxLeverage: 7, quantityPrecision: 2, minQuantity: 0.1 },
  { base: "LINK", quote: "USDC", price: 26.38, change: 3.12, funding: 0.0072, openInterest: "$204.7M", volume: "$126.4M", group: "Alt", maxLeverage: 7, quantityPrecision: 2, minQuantity: 0.1 },
  { base: "DOGE", quote: "USDC", price: 0.284, change: -2.06, funding: -0.0054, openInterest: "$328.1M", volume: "$198.6M", group: "Alt", maxLeverage: 5, quantityPrecision: 0, minQuantity: 10 },
  { base: "BTC", quote: "USDT", price: 116398, change: 1.31, funding: 0.008, openInterest: "$812.6M", volume: "$429.3M", group: "Major", maxLeverage: 10, quantityPrecision: 5, minQuantity: 0.0001 },
  { base: "ETH", quote: "USDT", price: 3825.7, change: 2.79, funding: 0.0105, openInterest: "$604.8M", volume: "$291.5M", group: "Major", maxLeverage: 10, quantityPrecision: 4, minQuantity: 0.001 },
];

export function roundOrderQuantity(value: number, precision: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const factor = 10 ** Math.max(0, precision);
  return Math.floor(value * factor + Number.EPSILON) / factor;
}

export function percentageToSize({ percentage, maxSize, precision }: { percentage: number; maxSize: number; precision: number }) {
  const safePercentage = Math.min(100, Math.max(0, Number.isFinite(percentage) ? percentage : 0));
  const safeMax = Number.isFinite(maxSize) ? Math.max(0, maxSize) : 0;
  return roundOrderQuantity(safeMax * safePercentage / 100, precision);
}

export function sizeToPercentage({ size, maxSize }: { size: number; maxSize: number }) {
  if (!Number.isFinite(size) || !Number.isFinite(maxSize) || maxSize <= 0) return 0;
  return Math.min(100, Math.max(0, size / maxSize * 100));
}

export function maximumOrderNotional({ availableMargin, leverage, feeRate = 0.00035 }: { availableMargin: number; leverage: number; feeRate?: number }) {
  if (!Number.isFinite(availableMargin) || !Number.isFinite(leverage) || availableMargin <= 0 || leverage <= 0) return 0;
  return availableMargin * leverage / (1 + leverage * Math.max(0, feeRate));
}

export const marketPair = (market: Pick<PerpetualMarket, "base" | "quote">) =>
  `${market.base}/${market.quote}`;

export function findPerpetualMarket(pair: string) {
  return perpetualMarkets.find((market) => marketPair(market) === pair);
}

export function searchPerpetualMarkets(query: string, group: "All" | PerpetualMarket["group"] = "All") {
  const normalized = query.trim().toLowerCase();
  return perpetualMarkets.filter((market) => {
    const groupMatches = group === "All" || market.group === group;
    const textMatches = !normalized || `${market.base} ${market.quote} ${marketPair(market)}`.toLowerCase().includes(normalized);
    return groupMatches && textMatches;
  });
}

export type DemoOrder = {
  side: "Long" | "Short";
  type: "Market" | "Limit";
  size: number;
  leverage: number;
  price: number;
  market?: Pick<PerpetualMarket, "base" | "quote">;
  quantity?: number;
  reduceOnly?: boolean;
};

export type FilledOrder = {
  id: string;
  pair: string;
  side: "Long" | "Short";
  type: "Market" | "Limit";
  size: number;
  leverage: number;
  price: number;
  quote: string;
  fee: number;
  filledAt: string;
  base?: string;
  quantity?: number;
  reduceOnly?: boolean;
};

export function filledOrders(farm: Farm): FilledOrder[] {
  const raw = farm.values.demoFilledOrders;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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

  const base = order.market?.base || String(farm.values.underlying || "ETH");
  const quote = order.market?.quote || String(farm.values.quoteAsset || "USDC");
  const pair = `${base}/${quote}`;
  const filledAt = new Date().toISOString();
  const orderRecord: FilledOrder = {
    id: `demo-${Date.now()}-${filledOrders(farm).length + 1}`,
    pair,
    side: order.side,
    type: order.type,
    size: order.size,
    leverage: order.leverage,
    price: order.price,
    quote,
    fee: order.size * 0.00035,
    filledAt,
    base,
    quantity: order.quantity,
    reduceOnly: order.reduceOnly,
  };
  const existingPair = String(farm.values.demoTradePair || "");
  const existingNotional = Number(farm.values.demoTradeSize || 0);
  const existingQuantity = Number(farm.values.demoTradeQuantity || (existingNotional && Number(farm.values.demoEntryPrice) ? existingNotional / Number(farm.values.demoEntryPrice) : 0));
  if (order.reduceOnly && (existingPair !== pair || existingNotional <= 0))
    throw new Error(`No open ${pair} position is available to reduce.`);
  const orderQuantity = Number(order.quantity || order.size / order.price);
  if (order.reduceOnly && orderQuantity > existingQuantity + Number.EPSILON)
    throw new Error("Reduce-only size cannot exceed the open position.");
  const existingSide = String(farm.values.demoTradeSide || "");
  if (order.reduceOnly && ((existingSide === "Long" && order.side !== "Short") || (existingSide === "Short" && order.side !== "Long")))
    throw new Error(`A ${existingSide} position must be reduced with a ${existingSide === "Long" ? "Short" : "Long"} order.`);
  const remainingQuantity = order.reduceOnly ? Math.max(0, existingQuantity - orderQuantity) : orderQuantity;
  const remainingNotional = order.reduceOnly ? existingNotional * (existingQuantity ? remainingQuantity / existingQuantity : 0) : order.size;
  const nextSide = order.reduceOnly ? String(farm.values.demoTradeSide || order.side) : order.side;
  return {
    ...farm,
    values: {
      ...farm.values,
      demoTradePair: pair,
      demoTradeBase: base,
      demoTradeQuote: quote,
      demoTradeSide: nextSide,
      demoTradeType: order.type,
      demoTradeSize: remainingNotional,
      demoTradeQuantity: remainingQuantity,
      demoTradeLeverage: order.leverage,
      demoEntryPrice: order.price,
      demoFilledOrders: JSON.stringify([...filledOrders(farm), orderRecord]),
    },
    updatedAt: filledAt,
    events: [
      ...farm.events,
      `${order.reduceOnly ? "Reduce" : order.side} ${pair} · ${order.size.toLocaleString()} ${quote} at ${order.leverage}× · demo order filled`,
    ],
  };
}
