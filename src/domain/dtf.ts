import type { Farm, RiskLevel, StrategyType } from "./strategy";

/**
 * A public DTF (decentralised token fund) listing shown to LPs.
 * Listings come from two places: active Farms in this workspace, and a demo
 * catalogue standing in for other managers until a public index API exists.
 * All figures are demo data and must be labelled as such in the UI.
 */
export type PublicDtf = {
  id: string;
  name: string;
  type: StrategyType;
  manager: string;
  network: string;
  baseAsset: string;
  tvl: number;
  /** Trailing APY; null while a DTF has too little history to report one. */
  apy: number | null;
  change30d: number;
  risk: RiskLevel;
  assets: string[];
  lps: number;
  launchedAt: string;
  trending: number;
  description: string;
  /** Present when the DTF is a Farm in this workspace with a full profile. */
  farmId?: string;
};

export type DtfSort = "trending" | "top";

export const DTF_PAGE_SIZE = 9;

const describe = (type: StrategyType, manager: string, network: string, base: string) =>
  `${type === "PERPETUAL" ? "Perpetual" : type === "INDEX" ? "Index" : "Spot"} DTF managed by ${manager} on ${network}, settled in ${base}.`;

const catalogue: Omit<PublicDtf, "description">[] = [
  { id: "dtf-l1-majors", name: "L1 Majors Index", type: "INDEX", manager: "Northbeam Capital", network: "Base", baseAsset: "USDC", tvl: 4_820_000, apy: 11.4, change30d: 6.2, risk: "MEDIUM", assets: ["BTC", "ETH", "SOL", "AVAX"], lps: 412, launchedAt: "2026-03-14", trending: 98 },
  { id: "dtf-funding-harvest", name: "Funding Harvest", type: "PERPETUAL", manager: "Kestrel Labs", network: "Base", baseAsset: "USDC", tvl: 3_150_000, apy: 16.9, change30d: 2.1, risk: "HIGH", assets: ["USDC", "ETH", "BTC"], lps: 238, launchedAt: "2026-05-02", trending: 94 },
  { id: "dtf-defi-bluechip", name: "DeFi Blue Chip", type: "INDEX", manager: "Orbit Research", network: "Ethereum", baseAsset: "USDC", tvl: 2_460_000, apy: 9.8, change30d: 8.7, risk: "HIGH", assets: ["UNI", "AAVE", "LINK", "ETH", "ARB", "OP"], lps: 305, launchedAt: "2026-02-20", trending: 90 },
  { id: "dtf-stable-lending", name: "Stable Lending Plus", type: "SPOT", manager: "Harbor Yield", network: "Base", baseAsset: "USDC", tvl: 6_210_000, apy: 6.4, change30d: 0.52, risk: "LOW", assets: ["USDC", "USDT", "DAI"], lps: 688, launchedAt: "2025-12-08", trending: 86 },
  { id: "dtf-eth-basis", name: "ETH Basis Trade", type: "PERPETUAL", manager: "Kestrel Labs", network: "Arbitrum", baseAsset: "USDC", tvl: 1_980_000, apy: 13.2, change30d: 1.6, risk: "MEDIUM", assets: ["ETH", "USDC"], lps: 171, launchedAt: "2026-06-11", trending: 81 },
  { id: "dtf-btc-eth-5050", name: "BTC / ETH 50-50", type: "INDEX", manager: "Northbeam Capital", network: "Arbitrum", baseAsset: "USDC", tvl: 3_740_000, apy: 8.9, change30d: 4.9, risk: "MEDIUM", assets: ["WBTC", "ETH"], lps: 356, launchedAt: "2026-01-17", trending: 77 },
  { id: "dtf-sol-momentum", name: "SOL Momentum", type: "PERPETUAL", manager: "Vela Quant", network: "Base", baseAsset: "USDC", tvl: 640_000, apy: -12.6, change30d: -4.3, risk: "CRITICAL", assets: ["SOL", "USDC"], lps: 64, launchedAt: "2026-08-03", trending: 72 },
  { id: "dtf-l2-ecosystem", name: "L2 Ecosystem", type: "INDEX", manager: "Orbit Research", network: "Base", baseAsset: "USDC", tvl: 890_000, apy: null, change30d: -1.8, risk: "HIGH", assets: ["ARB", "OP", "ETH", "LINK"], lps: 48, launchedAt: "2026-10-22", trending: 69 },
  { id: "dtf-conservative-usdt", name: "Conservative USDT", type: "SPOT", manager: "Harbor Yield", network: "Ethereum", baseAsset: "USDT", tvl: 2_120_000, apy: 5.1, change30d: 0.41, risk: "LOW", assets: ["USDT", "USDC"], lps: 254, launchedAt: "2026-04-05", trending: 61 },
  { id: "dtf-market-neutral", name: "Market Neutral Core", type: "PERPETUAL", manager: "Vela Quant", network: "Arbitrum", baseAsset: "USDC", tvl: 1_310_000, apy: 10.7, change30d: 0.93, risk: "MEDIUM", assets: ["BTC", "ETH", "SOL", "USDC"], lps: 133, launchedAt: "2026-07-19", trending: 55 },
  { id: "dtf-lp-yield", name: "Blue Chip LP Yield", type: "SPOT", manager: "Meridian Partners", network: "Base", baseAsset: "USDC", tvl: 1_050_000, apy: 7.9, change30d: 1.2, risk: "MEDIUM", assets: ["ETH", "USDC", "WBTC"], lps: 119, launchedAt: "2026-05-28", trending: 48 },
  { id: "dtf-alt-basket", name: "Large Cap Alt Basket", type: "INDEX", manager: "Meridian Partners", network: "Ethereum", baseAsset: "USDC", tvl: 520_000, apy: null, change30d: 3.4, risk: "HIGH", assets: ["SOL", "AVAX", "LINK", "DOGE", "UNI", "AAVE", "ARB", "OP"], lps: 37, launchedAt: "2026-11-02", trending: 42 },
];

export const demoDtfCatalogue: PublicDtf[] = catalogue.map((d) => ({
  ...d,
  description: describe(d.type, d.manager, d.network, d.baseAsset),
}));

/** Assets a Farm actually holds, based on its strategy type. */
export function farmHoldings(farm: Farm): string[] {
  const v = farm.values;
  const text = (key: string) => (typeof v[key] === "string" ? String(v[key]) : "");
  let assets: string[];
  if (farm.type === "PERPETUAL") assets = [text("quoteAsset") || text("asset"), text("underlying")];
  else if (farm.type === "SPOT") {
    const mix = Object.keys(v).filter((k) => k.startsWith("composition_")).map((k) => k.slice(12));
    assets = mix.length ? mix : [text("asset")];
  } else assets = farm.allocations.map((a) => a.asset);
  return [...new Set(assets.filter(Boolean))];
}

/** Lists an active workspace Farm as a public DTF. */
export function dtfFromFarm(farm: Farm, manager: string): PublicDtf {
  const assets = farmHoldings(farm);
  const lps = Number(farm.values.activeLps) || farm.lpPositions?.length || 0;
  return {
    id: farm.id,
    name: farm.name,
    type: farm.type,
    manager,
    network: farm.network,
    baseAsset: "USDC",
    tvl: farm.tvl,
    apy: farm.apy,
    change30d: farm.performance,
    risk: farm.risk,
    assets: assets.length ? assets : ["USDC"],
    lps,
    launchedAt: farm.createdAt.slice(0, 10),
    trending: 100,
    description: describe(farm.type, manager, farm.network, "USDC"),
    farmId: farm.id,
  };
}

export function filterDtfs(
  dtfs: PublicDtf[],
  { query = "", type = "ALL", network = "All Chains" }: { query?: string; type?: StrategyType | "ALL"; network?: string },
) {
  const q = query.trim().toLowerCase();
  return dtfs.filter(
    (d) =>
      (type === "ALL" || d.type === type) &&
      (network === "All Chains" || d.network === network) &&
      (!q ||
        [d.name, d.manager, d.network, d.baseAsset, d.type, ...d.assets].some((field) =>
          field.toLowerCase().includes(q),
        )),
  );
}

/** Trending ranks by recent LP interest; Top performing by 30D change. */
export function sortDtfs(dtfs: PublicDtf[], sort: DtfSort) {
  return [...dtfs].sort((a, b) =>
    sort === "top" ? b.change30d - a.change30d : b.trending - a.trending || b.tvl - a.tvl,
  );
}

export function dtfTotals(dtfs: PublicDtf[]) {
  return {
    tvl: dtfs.reduce((sum, d) => sum + d.tvl, 0),
    count: dtfs.length,
    managers: new Set(dtfs.map((d) => d.manager)).size,
  };
}
