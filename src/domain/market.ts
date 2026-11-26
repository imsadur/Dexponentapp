import { dtfMarketRow, type PublicDtf } from "./dtf";
import { perpetualMarkets } from "./trading";

/**
 * Market view centred on Dexponent DTF tokens. Majors, DeFi tokens and stablecoins are listed
 * as reference rows only: they have no page here and are not tradable from this view.
 * Figures are generated (see the app-wide Preview disclosure); none of it is a live quote.
 */
export type MarketCategory = "DTF" | "MAJOR" | "DEFI" | "STABLE";

export const MARKET_CATEGORIES: { id: MarketCategory | "ALL"; label: string }[] = [
  { id: "DTF", label: "Dexponent DTFs" },
  { id: "MAJOR", label: "Majors" },
  { id: "DEFI", label: "DeFi" },
  { id: "STABLE", label: "Stablecoins" },
  { id: "ALL", label: "All" },
];

export const DEFAULT_MARKET_CATEGORY: MarketCategory = "DTF";

export const categoryLabel: Record<MarketCategory, string> = {
  DTF: "DTF",
  MAJOR: "Major",
  DEFI: "DeFi",
  STABLE: "Stablecoin",
};

/** Reference rows are listed for context and cannot be opened or traded here. */
export const isReferenceToken = (t: { category: MarketCategory }) => t.category !== "DTF";

export type MarketToken = {
  id: string;
  symbol: string;
  name: string;
  category: MarketCategory;
  network: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  /** DTFs: deposits minus withdrawals. Other tokens: buy minus sell volume. USD, 24 hours. */
  netFlow24h: number;
  liquidity: number;
  holders: number;
  holdersChange24h: number;
  ageDays: number;
  /** Higher is more popular; used by the Popular sort. */
  popularity: number;
  /** Hourly price over the last 7 days. */
  spark: number[];
  /** Present for Dexponent DTFs. */
  dtf?: PublicDtf;
};

type Seed = Omit<MarketToken, "id" | "spark" | "price" | "change24h" | "netFlow24h"> & {
  price?: number;
  change24h?: number;
  netShare: number;
};

const major = (base: string) => perpetualMarkets.find((m) => m.base === base && m.quote === "USDC")!;

const seeds: Seed[] = [
  // Majors (prices match the perpetual markets used by the ticker)
  { symbol: "BTC", name: "Bitcoin", category: "MAJOR", network: "Base", price: major("BTC").price, change24h: major("BTC").change, change7d: 4.2, marketCap: 2_310_000_000_000, volume24h: 38_400_000_000, netShare: 0.04, liquidity: 1_820_000_000, holders: 58_200_000, holdersChange24h: 0.02, ageDays: 6170, popularity: 99 },
  { symbol: "ETH", name: "Ethereum", category: "MAJOR", network: "Base", price: major("ETH").price, change24h: major("ETH").change, change7d: 6.8, marketCap: 461_000_000_000, volume24h: 21_700_000_000, netShare: 0.06, liquidity: 1_240_000_000, holders: 129_000_000, holdersChange24h: 0.04, ageDays: 4130, popularity: 98 },
  { symbol: "SOL", name: "Solana", category: "MAJOR", network: "Solana", price: major("SOL").price, change24h: major("SOL").change, change7d: -2.1, marketCap: 134_000_000_000, volume24h: 6_900_000_000, netShare: -0.03, liquidity: 612_000_000, holders: 9_400_000, holdersChange24h: 0.11, ageDays: 2050, popularity: 97 },
  // DeFi
  { symbol: "AAVE", name: "Aave", category: "DEFI", network: "Base", price: 342.6, change24h: 3.4, change7d: 9.1, marketCap: 5_190_000_000, volume24h: 412_000_000, netShare: 0.08, liquidity: 86_400_000, holders: 182_000, holdersChange24h: 0.21, ageDays: 2240, popularity: 88 },
  { symbol: "UNI", name: "Uniswap", category: "DEFI", network: "Base", price: 11.84, change24h: -1.2, change7d: 2.6, marketCap: 7_110_000_000, volume24h: 286_000_000, netShare: -0.04, liquidity: 64_200_000, holders: 391_000, holdersChange24h: 0.05, ageDays: 2260, popularity: 84 },
  { symbol: "PENDLE", name: "Pendle", category: "DEFI", network: "Base", price: 5.62, change24h: 5.8, change7d: 14.3, marketCap: 912_000_000, volume24h: 128_000_000, netShare: 0.12, liquidity: 21_800_000, holders: 64_800, holdersChange24h: 0.48, ageDays: 1960, popularity: 79 },
  { symbol: "LDO", name: "Lido DAO", category: "DEFI", network: "Base", price: 1.48, change24h: -2.7, change7d: -6.4, marketCap: 1_330_000_000, volume24h: 96_200_000, netShare: -0.09, liquidity: 18_100_000, holders: 51_300, holdersChange24h: -0.06, ageDays: 1700, popularity: 66 },
  { symbol: "CRV", name: "Curve DAO", category: "DEFI", network: "Base", price: 0.874, change24h: 1.1, change7d: -3.2, marketCap: 1_140_000_000, volume24h: 118_000_000, netShare: 0.02, liquidity: 24_600_000, holders: 98_700, holdersChange24h: 0.09, ageDays: 1930, popularity: 63 },
  { symbol: "JUP", name: "Jupiter", category: "DEFI", network: "Solana", price: 0.4812, change24h: -4.6, change7d: -10.5, marketCap: 1_470_000_000, volume24h: 164_000_000, netShare: -0.11, liquidity: 31_400_000, holders: 912_000, holdersChange24h: 0.14, ageDays: 1030, popularity: 86 },
  { symbol: "RAY", name: "Raydium", category: "DEFI", network: "Solana", price: 2.36, change24h: 2.2, change7d: 5.7, marketCap: 631_000_000, volume24h: 74_800_000, netShare: 0.05, liquidity: 12_900_000, holders: 141_000, holdersChange24h: 0.17, ageDays: 1550, popularity: 71 },
  { symbol: "PYTH", name: "Pyth Network", category: "DEFI", network: "Solana", price: 0.1563, change24h: -0.8, change7d: 1.9, marketCap: 898_000_000, volume24h: 52_300_000, netShare: -0.01, liquidity: 9_700_000, holders: 236_000, holdersChange24h: 0.03, ageDays: 1100, popularity: 68 },
  // Stablecoins
  { symbol: "USDC", name: "USD Coin", category: "STABLE", network: "Base", price: 1.0001, change24h: 0.01, change7d: 0.0, marketCap: 76_400_000_000, volume24h: 9_820_000_000, netShare: 0.01, liquidity: 2_410_000_000, holders: 7_900_000, holdersChange24h: 0.06, ageDays: 2620, popularity: 96 },
  { symbol: "USDT", name: "Tether USD", category: "STABLE", network: "Solana", price: 0.9998, change24h: -0.02, change7d: 0.01, marketCap: 182_000_000_000, volume24h: 61_300_000_000, netShare: 0.0, liquidity: 3_160_000_000, holders: 6_300_000, holdersChange24h: 0.04, ageDays: 4040, popularity: 95 },
  { symbol: "DAI", name: "Dai", category: "STABLE", network: "Base", price: 1.0002, change24h: 0.02, change7d: -0.01, marketCap: 4_870_000_000, volume24h: 214_000_000, netShare: 0.0, liquidity: 88_000_000, holders: 512_000, holdersChange24h: 0.01, ageDays: 2560, popularity: 74 },
  { symbol: "USDE", name: "Ethena USDe", category: "STABLE", network: "Base", price: 0.9996, change24h: -0.03, change7d: 0.02, marketCap: 14_200_000_000, volume24h: 318_000_000, netShare: 0.02, liquidity: 142_000_000, holders: 46_200, holdersChange24h: 0.38, ageDays: 1000, popularity: 72 },
  { symbol: "PYUSD", name: "PayPal USD", category: "STABLE", network: "Solana", price: 1.0, change24h: 0.0, change7d: 0.01, marketCap: 1_240_000_000, volume24h: 41_600_000, netShare: 0.01, liquidity: 22_700_000, holders: 69_400, holdersChange24h: 0.22, ageDays: 1200, popularity: 58 },
  { symbol: "EURC", name: "Euro Coin", category: "STABLE", network: "Base", price: 1.0812, change24h: 0.14, change7d: -0.21, marketCap: 236_000_000, volume24h: 18_900_000, netShare: 0.0, liquidity: 6_400_000, holders: 31_800, holdersChange24h: 0.12, ageDays: 1420, popularity: 49 },
  { symbol: "GHO", name: "GHO", category: "STABLE", network: "Base", price: 0.9991, change24h: -0.04, change7d: 0.03, marketCap: 284_000_000, volume24h: 12_100_000, netShare: 0.0, liquidity: 5_100_000, holders: 8_900, holdersChange24h: 0.09, ageDays: 830, popularity: 44 },
];

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 7 days of hourly prices passing through the 7D-ago, 24H-ago, and current prices. */
function sparkFor(seed: Seed & { price: number; change24h: number }) {
  const next = rng(`market:${seed.symbol}`);
  const end = seed.price;
  const dayAgo = end / (1 + seed.change24h / 100);
  const weekAgo = end / (1 + seed.change7d / 100);
  const vol = seed.category === "STABLE" ? 0.0002 : seed.category === "MAJOR" ? 0.004 : 0.008;
  const leg = (from: number, to: number, steps: number) => {
    const walk = [0];
    for (let i = 0; i < steps; i += 1) walk.push(walk[i] + (next() - 0.5) * 2 * vol);
    const drift = walk[steps];
    return walk.map((w, i) => from * Math.pow(to / from, i / steps) * Math.exp(w - (drift * i) / steps));
  };
  return [...leg(weekAgo, dayAgo, 144), ...leg(dayAgo, end, 24).slice(1)];
}

function fromSeed(seed: Seed): MarketToken {
  const price = seed.price ?? 1;
  const change24h = seed.change24h ?? 0;
  const { netShare, ...rest } = seed;
  return {
    ...rest,
    id: `token-${seed.symbol.toLowerCase()}`,
    price,
    change24h,
    netFlow24h: Math.round(seed.volume24h * netShare),
    spark: sparkFor({ ...seed, price, change24h }),
  };
}

const tokenRows = seeds.map(fromSeed);

function fromDtf(dtf: PublicDtf, now: number): MarketToken {
  const row = dtfMarketRow(dtf, now);
  return {
    id: dtf.id,
    symbol: dtf.symbol,
    name: dtf.name,
    category: "DTF",
    network: dtf.network,
    price: row.price,
    change24h: row.change24h,
    change7d: row.change7d,
    marketCap: row.marketCap,
    volume24h: row.volume24h,
    netFlow24h: row.netFlow24h,
    liquidity: row.liquidity,
    holders: row.holders,
    holdersChange24h: row.holdersChange24h,
    ageDays: row.ageDays,
    // Scaled so DTFs interleave with large tokens instead of always leading the Popular sort.
    popularity: Math.round(dtf.trending * 0.9),
    spark: row.spark,
    dtf,
  };
}

/** Every token on the Market page: Dexponent DTFs first, then the reference token list. */
export function marketTokens(dtfs: PublicDtf[], now = Date.now()): MarketToken[] {
  return [...dtfs.map((d) => fromDtf(d, now)), ...tokenRows];
}

export function filterMarket(
  tokens: MarketToken[],
  { category = "ALL", query = "", network = "All Chains", minCap = 0, age = "any" }: {
    category?: MarketCategory | "ALL";
    query?: string;
    network?: string;
    minCap?: number;
    age?: "any" | "new" | "established";
  },
) {
  const q = query.trim().replace(/^\$/, "").toLowerCase();
  return tokens.filter(
    (t) =>
      (category === "ALL" || t.category === category) &&
      (network === "All Chains" || t.network === network) &&
      t.marketCap >= minCap &&
      (age === "any" || (age === "new" ? t.ageDays < 30 : t.ageDays >= 180)) &&
      (!q || [t.symbol, t.name, t.dtf?.manager ?? ""].some((f) => f.toLowerCase().includes(q))),
  );
}

export type MarketSort = "popular" | "gainers" | "losers" | "marketCap" | "volume" | "newest";

export function sortMarket(tokens: MarketToken[], sort: MarketSort, range: "24H" | "7D" = "24H") {
  const change = (t: MarketToken) => (range === "24H" ? t.change24h : t.change7d);
  const by: Record<MarketSort, (a: MarketToken, b: MarketToken) => number> = {
    popular: (a, b) => b.popularity - a.popularity || b.marketCap - a.marketCap,
    gainers: (a, b) => change(b) - change(a),
    losers: (a, b) => change(a) - change(b),
    marketCap: (a, b) => b.marketCap - a.marketCap,
    volume: (a, b) => b.volume24h - a.volume24h,
    newest: (a, b) => a.ageDays - b.ageDays,
  };
  return [...tokens].sort(by[sort]);
}

/** Headline figures for the Market pulse strip, computed over DTF tokens only. */
export function marketPulse(tokens: MarketToken[]) {
  const dtfs = tokens.filter((t) => t.category === "DTF");
  return {
    up: dtfs.filter((t) => t.change24h > 0).length,
    down: dtfs.filter((t) => t.change24h < 0).length,
    tvl: dtfs.reduce((s, t) => s + (t.dtf?.tvl ?? 0), 0),
    netFlow24h: dtfs.reduce((s, t) => s + t.netFlow24h, 0),
  };
}
