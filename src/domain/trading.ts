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
};

export const perpetualMarkets: PerpetualMarket[] = [
  { base: "BTC", quote: "USDC", price: 116420, change: 1.36, funding: 0.0081, openInterest: "$2.74B", volume: "$1.12B", group: "Major", maxLeverage: 10 },
  { base: "ETH", quote: "USDC", price: 3826.4, change: 2.84, funding: 0.0108, openInterest: "$1.28B", volume: "$684.2M", group: "Major", maxLeverage: 10 },
  { base: "SOL", quote: "USDC", price: 249.83, change: -0.72, funding: 0.0124, openInterest: "$486.7M", volume: "$312.4M", group: "Major", maxLeverage: 10 },
  { base: "ARB", quote: "USDC", price: 1.17, change: 4.18, funding: 0.0064, openInterest: "$186.3M", volume: "$92.8M", group: "Alt", maxLeverage: 7 },
  { base: "OP", quote: "USDC", price: 2.84, change: -1.42, funding: -0.0031, openInterest: "$142.8M", volume: "$74.1M", group: "Alt", maxLeverage: 7 },
  { base: "AVAX", quote: "USDC", price: 48.62, change: 0.91, funding: 0.0048, openInterest: "$216.5M", volume: "$108.7M", group: "Alt", maxLeverage: 7 },
  { base: "LINK", quote: "USDC", price: 26.38, change: 3.12, funding: 0.0072, openInterest: "$204.7M", volume: "$126.4M", group: "Alt", maxLeverage: 7 },
  { base: "DOGE", quote: "USDC", price: 0.284, change: -2.06, funding: -0.0054, openInterest: "$328.1M", volume: "$198.6M", group: "Alt", maxLeverage: 5 },
  { base: "BTC", quote: "USDT", price: 116398, change: 1.31, funding: 0.008, openInterest: "$812.6M", volume: "$429.3M", group: "Major", maxLeverage: 10 },
  { base: "ETH", quote: "USDT", price: 3825.7, change: 2.79, funding: 0.0105, openInterest: "$604.8M", volume: "$291.5M", group: "Major", maxLeverage: 10 },
];

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
  };
  return {
    ...farm,
    values: {
      ...farm.values,
      demoTradePair: pair,
      demoTradeBase: base,
      demoTradeQuote: quote,
      demoTradeSide: order.side,
      demoTradeType: order.type,
      demoTradeSize: order.size,
      demoTradeLeverage: order.leverage,
      demoEntryPrice: order.price,
      demoFilledOrders: JSON.stringify([...filledOrders(farm), orderRecord]),
    },
    updatedAt: filledAt,
    events: [
      ...farm.events,
      `${order.side} ${pair} · ${order.size.toLocaleString()} ${quote} at ${order.leverage}× · demo order filled`,
    ],
  };
}
