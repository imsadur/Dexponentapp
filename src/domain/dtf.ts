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
  /** Token ticker the manager set for the DTF share token, without the "$". */
  symbol: string;
  type: StrategyType;
  manager: string;
  network: string;
  baseAsset: string;
  /** Total deposits in USD. */
  tvl: number;
  /** Annual return the manager is aiming for. A goal, not a forecast. */
  targetApr: number;
  /** Minimum share of deposits (%) kept idle in the DTF contract to pay withdrawals. */
  bufferPct: number;
  /** Days each deposit is locked before it can be withdrawn; 0 means withdraw anytime. */
  lockupDays: number;
  /** Annualised return measured over the last 7 days, after fees; null under 7 days old. */
  apy7d: number | null;
  change30d: number;
  risk: RiskLevel;
  assets: string[];
  lps: number;
  launchedAt: string;
  trending: number;
  managementFee: number;
  performanceFee: number;
  /** Takes directional (non-hedged) positions. Only meaningful for PERPETUAL. */
  directional?: boolean;
  /** Target weights when known (workspace Farms); otherwise derived for the demo. */
  weights?: { asset: string; weight: number }[];
  description: string;
  /** Security review, when one exists. Demo catalogue auditors are fictional. */
  audit?: { by: string; date: string };
  /** Present when the DTF is a Farm in this workspace. */
  farmId?: string;
};

export type DtfSort = "trending" | "top";

export const DTF_PAGE_SIZE = 9;

const typeName = (type: StrategyType) => (type === "PERPETUAL" ? "Perpetual" : type === "INDEX" ? "Index" : "Spot");

const describe = (type: StrategyType, manager: string, network: string, base: string) =>
  `${typeName(type)} DTF managed by ${manager} on ${network}, settled in ${base}.`;

type CatalogueRow = Omit<PublicDtf, "description">;

const catalogue: CatalogueRow[] = [
  { id: "dtf-l1-majors", name: "L1 Majors Index", symbol: "L1MAJ", type: "INDEX", manager: "Northbeam Capital", network: "Base", baseAsset: "USDC", tvl: 4_820_000, targetApr: 12, bufferPct: 10, lockupDays: 0, apy7d: 11.4, change30d: 6.2, risk: "MEDIUM", assets: ["BTC", "ETH", "SOL", "AVAX"], lps: 412, launchedAt: "2026-03-14", trending: 98, managementFee: 1, performanceFee: 10, audit: { by: "Sentinel Audits", date: "2026-02-28" } },
  { id: "dtf-funding-harvest", name: "Funding Harvest", symbol: "FHRV", type: "PERPETUAL", manager: "Kestrel Labs", network: "Solana", baseAsset: "USDC", tvl: 3_150_000, targetApr: 15, bufferPct: 10, lockupDays: 15, apy7d: 16.9, change30d: 2.1, risk: "HIGH", assets: ["USDC", "ETH", "BTC"], lps: 238, launchedAt: "2026-05-02", trending: 94, managementFee: 1.5, performanceFee: 15, audit: { by: "Arcbridge Security", date: "2026-04-17" } },
  { id: "dtf-defi-bluechip", name: "DeFi Blue Chip", symbol: "DEFIBC", type: "INDEX", manager: "Orbit Research", network: "Base", baseAsset: "USDC", tvl: 2_460_000, targetApr: 10, bufferPct: 10, lockupDays: 0, apy7d: 9.8, change30d: 8.7, risk: "HIGH", assets: ["UNI", "AAVE", "LINK", "ETH", "ARB", "OP"], lps: 305, launchedAt: "2026-02-20", trending: 90, managementFee: 1, performanceFee: 10, audit: { by: "Sentinel Audits", date: "2026-02-05" } },
  { id: "dtf-stable-lending", name: "Stable Lending Plus", symbol: "SLP", type: "SPOT", manager: "Harbor Yield", network: "Base", baseAsset: "USDC", tvl: 6_210_000, targetApr: 6.5, bufferPct: 10, lockupDays: 0, apy7d: 6.4, change30d: 0.52, risk: "LOW", assets: ["USDC", "USDT", "DAI"], lps: 688, launchedAt: "2025-12-08", trending: 86, managementFee: 0.5, performanceFee: 10, audit: { by: "Northlock Labs", date: "2025-11-20" } },
  { id: "dtf-eth-basis", name: "ETH Basis Trade", symbol: "ETHB", type: "PERPETUAL", manager: "Kestrel Labs", network: "Base", baseAsset: "USDC", tvl: 1_980_000, targetApr: 12, bufferPct: 10, lockupDays: 7, apy7d: 13.2, change30d: 1.6, risk: "MEDIUM", assets: ["ETH", "USDC"], lps: 171, launchedAt: "2026-06-11", trending: 81, managementFee: 1.5, performanceFee: 15, audit: { by: "Arcbridge Security", date: "2026-05-29" } },
  { id: "dtf-btc-eth-5050", name: "BTC / ETH 50-50", symbol: "BE50", type: "INDEX", manager: "Northbeam Capital", network: "Solana", baseAsset: "USDC", tvl: 3_740_000, targetApr: 9, bufferPct: 10, lockupDays: 0, apy7d: 8.9, change30d: 4.9, risk: "MEDIUM", assets: ["WBTC", "ETH"], lps: 356, launchedAt: "2026-01-17", trending: 77, managementFee: 0.75, performanceFee: 10, weights: [{ asset: "WBTC", weight: 50 }, { asset: "ETH", weight: 50 }], audit: { by: "Northlock Labs", date: "2026-01-02" } },
  { id: "dtf-sol-momentum", name: "SOL Momentum", symbol: "SOLM", type: "PERPETUAL", manager: "Vela Quant", network: "Solana", baseAsset: "USDC", tvl: 640_000, targetApr: 25, bufferPct: 10, lockupDays: 30, apy7d: -12.6, change30d: -4.3, risk: "CRITICAL", assets: ["SOL", "USDC"], lps: 64, launchedAt: "2026-08-03", trending: 72, managementFee: 2, performanceFee: 20, directional: true },
  { id: "dtf-l2-ecosystem", name: "L2 Ecosystem", symbol: "L2E", type: "INDEX", manager: "Orbit Research", network: "Base", baseAsset: "USDC", tvl: 890_000, targetApr: 10, bufferPct: 10, lockupDays: 0, apy7d: 7.3, change30d: -1.8, risk: "HIGH", assets: ["ARB", "OP", "ETH", "LINK"], lps: 48, launchedAt: "2026-10-22", trending: 69, managementFee: 1, performanceFee: 10, audit: { by: "Sentinel Audits", date: "2026-10-08" } },
  { id: "dtf-conservative-usdt", name: "Conservative USDT", symbol: "CUSDT", type: "SPOT", manager: "Harbor Yield", network: "Solana", baseAsset: "USDT", tvl: 2_120_000, targetApr: 5, bufferPct: 10, lockupDays: 0, apy7d: 5.1, change30d: 0.41, risk: "LOW", assets: ["USDT", "USDC"], lps: 254, launchedAt: "2026-04-05", trending: 61, managementFee: 0.5, performanceFee: 5, audit: { by: "Northlock Labs", date: "2026-03-19" } },
  { id: "dtf-market-neutral", name: "Market Neutral Core", symbol: "MNC", type: "PERPETUAL", manager: "Vela Quant", network: "Solana", baseAsset: "USDC", tvl: 1_310_000, targetApr: 11, bufferPct: 10, lockupDays: 15, apy7d: 10.7, change30d: 0.93, risk: "MEDIUM", assets: ["BTC", "ETH", "SOL", "USDC"], lps: 133, launchedAt: "2026-07-19", trending: 55, managementFee: 1.5, performanceFee: 15, audit: { by: "Arcbridge Security", date: "2026-07-01" } },
  { id: "dtf-lp-yield", name: "Blue Chip LP Yield", symbol: "BCLP", type: "SPOT", manager: "Meridian Partners", network: "Base", baseAsset: "USDC", tvl: 1_050_000, targetApr: 8, bufferPct: 10, lockupDays: 0, apy7d: 7.9, change30d: 1.2, risk: "MEDIUM", assets: ["ETH", "USDC", "WBTC"], lps: 119, launchedAt: "2026-05-28", trending: 48, managementFee: 1, performanceFee: 10, audit: { by: "Northlock Labs", date: "2026-05-12" } },
  { id: "dtf-alt-basket", name: "Large Cap Alt Basket", symbol: "LCALT", type: "INDEX", manager: "Meridian Partners", network: "Solana", baseAsset: "USDC", tvl: 520_000, targetApr: 14, bufferPct: 10, lockupDays: 0, apy7d: null, change30d: 1.1, risk: "HIGH", assets: ["SOL", "AVAX", "LINK", "DOGE", "UNI", "AAVE", "ARB", "OP"], lps: 37, launchedAt: "2026-11-19", trending: 42, managementFee: 1, performanceFee: 10 },
];

export const demoDtfCatalogue: PublicDtf[] = catalogue.map((d) => ({
  ...d,
  description: describe(d.type, d.manager, d.network, d.baseAsset),
}));

/** Fictional manager profiles for the demo catalogue. */
export const dtfManagers: Record<string, { bio: string; since: number }> = {
  "Northbeam Capital": { bio: "Northbeam runs rules-based index DTFs for large-cap crypto assets, with published weights and a fixed rebalance schedule.", since: 2024 },
  "Kestrel Labs": { bio: "Kestrel builds hedged perpetual strategies that aim to earn funding and basis while keeping market exposure close to neutral.", since: 2023 },
  "Orbit Research": { bio: "Orbit researches DeFi sectors and turns its theses into thematic index DTFs, reviewed quarterly.", since: 2025 },
  "Harbor Yield": { bio: "Harbor allocates stablecoins across established lending markets, prioritising liquidity and protocol track record over headline yield.", since: 2023 },
  "Vela Quant": { bio: "Vela runs systematic perpetual strategies driven by trend and volatility signals. Strategies can be directional.", since: 2025 },
  "Meridian Partners": { bio: "Meridian manages liquidity-provision and alternative-asset baskets for LPs seeking broader exposure.", since: 2024 },
};

export function dtfLongDescription(dtf: PublicDtf) {
  const held = dtf.assets.filter((a) => a !== dtf.baseAsset);
  const list = (held.length ? held : dtf.assets).join(", ");
  if (dtf.type === "INDEX")
    return `${dtf.name} converts ${dtf.baseAsset} deposits into ${list} at target weights. The manager rebalances when any asset drifts more than 5 percentage points from its target, and at least weekly. Your deposit moves with the market value of these assets, so it can fall as well as rise.`;
  if (dtf.type === "SPOT")
    return `${dtf.name} supplies ${dtf.baseAsset} and related assets (${list}) to established DeFi markets, harvests the yield, and compounds it back into the DTF. Rates change with borrowing demand, so the APY moves over time.`;
  if (dtf.directional)
    return `${dtf.name} takes leveraged long or short ${list} perpetual positions based on trend signals, using ${dtf.baseAsset} as margin. It is not hedged: returns follow the manager's market calls, and losses can be large and fast.`;
  return `${dtf.name} holds spot ${list} and shorts the matching perpetual markets, keeping overall market exposure close to neutral. Returns come mainly from funding payments and basis, which can turn negative when market sentiment flips.`;
}

/** Ticker from a name's initials, e.g. "Blue Chip Index" → "BCI". */
export function tickerFromName(name: string) {
  const words = name.toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  const ticker = words.length > 1 ? words.map((w) => (/^\d/.test(w) ? w : w[0])).join("") : (words[0] ?? "DTF").slice(0, 4);
  return ticker.slice(0, 6) || "DTF";
}

/** Normalises a manager-entered ticker: letters and digits only, upper case, no "$". */
export function cleanTicker(value: unknown) {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) : "";
}

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
  const buffer = Number(farm.values.bufferPct);
  const weights =
    farm.type === "INDEX"
      ? farm.allocations.map((a) => ({ asset: a.asset, weight: a.weight }))
      : farm.type === "SPOT"
        ? Object.keys(farm.values)
            .filter((k) => k.startsWith("composition_"))
            .map((k) => ({ asset: k.slice(12), weight: Number(farm.values[k]) || 0 }))
            .filter((w) => w.weight > 0)
        : undefined;
  return {
    id: farm.id,
    name: farm.name,
    symbol: cleanTicker(farm.values.tokenSymbol) || tickerFromName(farm.name),
    type: farm.type,
    manager,
    network: farm.network,
    baseAsset: String(farm.values.asset || "USDC"),
    tvl: farm.tvl,
    targetApr: Number(farm.values.targetApr) || Math.max(1, Math.round(farm.apy * 10) / 10),
    bufferPct: buffer > 0 && buffer < 100 ? buffer : 10,
    lockupDays: Math.max(0, Math.round(Number(farm.values.lockupDays) || 0)),
    apy7d: farm.apy,
    change30d: farm.performance,
    risk: farm.risk,
    assets: assets.length ? assets : ["USDC"],
    lps,
    launchedAt: farm.createdAt.slice(0, 10),
    trending: 100,
    managementFee: Number(farm.values.managementFee) || 0,
    performanceFee: Number(farm.values.performanceFee) || 0,
    weights: weights?.length ? weights : undefined,
    audit:
      typeof farm.values.auditedBy === "string" && farm.values.auditedBy.trim()
        ? { by: farm.values.auditedBy.trim(), date: String(farm.values.auditedAt || farm.createdAt).slice(0, 10) }
        : undefined,
    description: describe(farm.type, manager, farm.network, String(farm.values.asset || "USDC")),
    farmId: farm.id,
  };
}

/** Every DTF an LP can browse: active workspace Farms first, then the demo catalogue. */
export function dtfDirectory(farms: Farm[], manager: string): PublicDtf[] {
  return [
    ...farms.filter((farm) => farm.status === "ACTIVE").map((farm) => dtfFromFarm(farm, manager)),
    ...demoDtfCatalogue,
  ];
}

export function filterDtfs(
  dtfs: PublicDtf[],
  { query = "", type = "ALL", network = "All Chains" }: { query?: string; type?: StrategyType | "ALL"; network?: string },
) {
  const q = query.trim().replace(/^\$/, "").toLowerCase();
  return dtfs.filter(
    (d) =>
      (type === "ALL" || d.type === type) &&
      (network === "All Chains" || d.network === network) &&
      (!q ||
        [d.name, d.symbol, d.manager, d.network, d.baseAsset, d.type, ...d.assets].some((field) =>
          field.toLowerCase().includes(q),
        )),
  );
}

/** Trending ranks by recent LP interest; Top by 24H return. */
export function sortDtfs(dtfs: PublicDtf[], sort: DtfSort, now = Date.now()) {
  if (sort === "trending") return [...dtfs].sort((a, b) => b.trending - a.trending || b.tvl - a.tvl);
  const returns = new Map(dtfs.map((d) => [d.id, dtfReturn24h(d, now)]));
  return [...dtfs].sort((a, b) => returns.get(b.id)! - returns.get(a.id)!);
}

/** Simulated value traded by the manager since launch (USD). Perpetual DTFs turn capital over fastest. */
export function dtfVolume(dtf: PublicDtf, now = Date.now()) {
  const turnover = dtf.type === "PERPETUAL" ? 0.35 : dtf.type === "INDEX" ? 0.04 : 0.015;
  const next = rng(`${dtf.id}:volume`);
  return Math.round(dtf.tvl * turnover * (0.7 + next() * 0.6) * Math.max(1, ageInDays(dtf.launchedAt, now)));
}

export function dtfTotals(dtfs: PublicDtf[], now = Date.now()) {
  return {
    tvl: dtfs.reduce((sum, d) => sum + d.tvl, 0),
    volume: dtfs.reduce((sum, d) => sum + dtfVolume(d, now), 0),
    count: dtfs.length,
    managers: new Set(dtfs.map((d) => d.manager)).size,
  };
}

/**
 * Share of deposits (%) the manager has deployed into the strategy. The rest is idle
 * in the DTF contract; the manager must keep at least the buffer idle for withdrawals.
 */
export function dtfUtilization(dtf: Pick<PublicDtf, "id" | "bufferPct">) {
  const next = rng(`${dtf.id}:utilization`);
  const max = 100 - dtf.bufferPct;
  return Math.round(Math.max(0, max - 2 - next() * 22) * 100) / 100;
}

export function ageInDays(launchedAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - Date.parse(`${launchedAt}T00:00:00Z`)) / 86_400_000));
}

export function managerSummary(dtfs: PublicDtf[], manager: string) {
  const own = dtfs.filter((d) => d.manager === manager);
  const earliest = own.reduce((year, d) => Math.min(year, Number(d.launchedAt.slice(0, 4))), Infinity);
  const profile = dtfManagers[manager];
  return {
    tvl: own.reduce((sum, d) => sum + d.tvl, 0),
    count: own.length,
    since: profile?.since ?? (Number.isFinite(earliest) ? earliest : new Date().getFullYear()),
    bio: profile?.bio ?? "Farm Manager on Dexponent. This profile is managed from your workspace settings.",
  };
}

/** Other DTFs of the same type first, then the most popular. */
export function similarDtfs(dtfs: PublicDtf[], dtf: PublicDtf, count = 3) {
  const others = dtfs.filter((d) => d.id !== dtf.id);
  const same = sortDtfs(others.filter((d) => d.type === dtf.type), "trending");
  const rest = sortDtfs(others.filter((d) => d.type !== dtf.type), "trending");
  return [...same, ...rest].slice(0, count);
}

/* ------------------------------------------------------------------ */
/* Simulated detail data. Deterministic per DTF so pages are stable.   */
/* ------------------------------------------------------------------ */

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

export function demoHash(seed: string, length = 64) {
  const next = rng(seed);
  let out = "";
  while (out.length < length) out += Math.floor(next() * 16).toString(16);
  return `0x${out}`;
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function demoBase58(seed: string, length: number) {
  const next = rng(seed);
  return Array.from({ length }, () => BASE58[Math.floor(next() * BASE58.length)]).join("");
}

/** Demo address in the network's format: base58 on Solana, 0x hex on EVM chains. */
const demoAddress = (network: string, seed: string) => (network === "Solana" ? demoBase58(seed, 44) : demoHash(seed, 40));
/** Demo transaction id in the network's format: an 88-character signature on Solana, a 0x hash on EVM chains. */
const demoTxId = (network: string, seed: string) => (network === "Solana" ? demoBase58(seed, 88) : demoHash(seed));

export const dtfContract = (dtf: Pick<PublicDtf, "id" | "network">) => demoAddress(dtf.network, `${dtf.id}:contract`);

const explorers: Record<string, (address: string) => string> = {
  Base: (a) => `https://basescan.org/address/${a}`,
  Solana: (a) => `https://solscan.io/account/${a}`,
  Ethereum: (a) => `https://etherscan.io/address/${a}`,
  Arbitrum: (a) => `https://arbiscan.io/address/${a}`,
};

export const explorerUrl = (network: string, address: string) => explorers[network]?.(address) ?? null;

const txExplorers: Record<string, (hash: string) => string> = {
  Base: (h) => `https://basescan.org/tx/${h}`,
  Solana: (h) => `https://solscan.io/tx/${h}`,
  Ethereum: (h) => `https://etherscan.io/tx/${h}`,
  Arbitrum: (h) => `https://arbiscan.io/tx/${h}`,
};

export const txExplorerUrl = (network: string, hash: string) => txExplorers[network]?.(hash) ?? null;

/** Shows only the ends of a wallet address, e.g. 0x85…e90b. */
export const maskAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;

export type DtfDocument = { name: string; type: string; size: number; demo: boolean };

/** Documents the manager published. Workspace Farms use their uploads; the demo catalogue gets sample titles. */
export function dtfDocuments(dtf: PublicDtf, uploads?: { name: string; size: number; type: string }[]): DtfDocument[] {
  const ext = (name: string, type: string) => (name.split(".").pop() || type.split("/").pop() || "file").toUpperCase();
  if (dtf.farmId) return (uploads ?? []).map((d) => ({ name: d.name, type: ext(d.name, d.type), size: d.size, demo: false }));
  const next = rng(`${dtf.id}:docs`);
  const kb = (min: number, max: number) => Math.round((min + next() * (max - min)) * 1024);
  const docs: DtfDocument[] = [
    { name: `${dtf.name} methodology.pdf`, type: "PDF", size: kb(380, 1400), demo: true },
    { name: `${dtf.name} investor deck.pptx`, type: "PPTX", size: kb(2400, 6800), demo: true },
    { name: "Risk disclosure.docx", type: "DOCX", size: kb(60, 180), demo: true },
  ];
  if (dtf.audit) docs.splice(1, 0, { name: `${dtf.audit.by} audit report.pdf`, type: "PDF", size: kb(900, 2600), demo: true });
  return docs;
}

export type AllocationRow = {
  id: string;
  label: string;
  venue: string;
  asset: string;
  /** Market rate before DTF fees; null for idle or unlevered spot holdings. */
  apy: number | null;
  share: number;
};

const lendingVenues = ["Aave v3", "Morpho", "Compound v3"];

export function dtfAllocation(dtf: PublicDtf): AllocationRow[] {
  const next = rng(`${dtf.id}:allocation`);
  const deployed = dtfUtilization(dtf);
  const idle = Math.round((100 - deployed) * 100) / 100;
  const held = dtf.assets.filter((a) => a !== dtf.baseAsset);
  const base = dtf.apy7d ?? dtf.targetApr;
  let rows: Omit<AllocationRow, "share">[] = [];
  let weights: number[] = [];

  if (dtf.type === "INDEX") {
    const assets = dtf.weights?.map((w) => w.asset) ?? dtf.assets;
    weights = dtf.weights?.map((w) => w.weight) ?? assets.map(() => 0.6 + next());
    rows = assets.map((asset) => ({ id: asset, label: asset, venue: "Spot holding", asset, apy: null }));
  } else if (dtf.type === "SPOT") {
    const assets = dtf.weights?.map((w) => w.asset) ?? dtf.assets;
    weights = dtf.weights?.map((w) => w.weight) ?? assets.map(() => 0.5 + next());
    const lp = /lp|liquidity/i.test(dtf.name);
    rows = assets.map((asset, i) => ({
      id: asset,
      label: lp ? `${asset} liquidity` : `${asset} lending`,
      venue: lp ? "Uniswap v3" : lendingVenues[i % lendingVenues.length],
      asset,
      apy: Math.round(Math.max(0.5, base * (0.8 + next() * 0.4)) * 100) / 100,
    }));
  } else {
    const legs = held.length ? held : ["ETH"];
    rows = [{ id: "margin", label: `${dtf.baseAsset} margin`, venue: "Hyperliquid", asset: dtf.baseAsset, apy: null }];
    weights = [dtf.directional ? 1.6 : 1];
    for (const asset of legs) {
      if (!dtf.directional) {
        rows.push({ id: `${asset}-spot`, label: `${asset} spot`, venue: "Spot holding", asset, apy: null });
        weights.push(0.8 + next() * 0.4);
      }
      rows.push({
        id: `${asset}-perp`,
        label: dtf.directional ? `${asset}-PERP position` : `${asset}-PERP short`,
        venue: dtf.directional ? "Trend signal · Hyperliquid" : "Hedge · Hyperliquid",
        asset,
        apy: dtf.directional ? null : Math.round(base * (1.1 + next() * 0.5) * 100) / 100,
      });
      weights.push(0.25 + next() * 0.2);
    }
  }

  const total = weights.reduce((sum, w) => sum + w, 0) || 1;
  const sized = rows.map((row, i) => ({ ...row, share: Math.round(((weights[i] / total) * deployed) * 100) / 100 }));
  const drift = Math.round((deployed - sized.reduce((sum, r) => sum + r.share, 0)) * 100) / 100;
  if (sized.length) sized[0].share = Math.round((sized[0].share + drift) * 100) / 100;
  return [
    ...sized.sort((a, b) => b.share - a.share),
    { id: "idle", label: "Idle capital", venue: "DTF contract", asset: dtf.baseAsset, apy: null, share: idle },
  ];
}

export type DtfMetric = "return" | "tvl" | "apy";
export type DtfRange = "24H" | "7D" | "30D" | "90D";
export const DTF_RANGES: DtfRange[] = ["24H", "7D", "30D", "90D"];
const rangeHours: Record<DtfRange, number> = { "24H": 24, "7D": 168, "30D": 720, "90D": 2160 };
const rangeStep: Record<DtfRange, number> = { "24H": 1, "7D": 4, "30D": 12, "90D": 24 };
const HOUR = 3_600_000;
const HISTORY_HOURS = 2160 + 168;
const volatility: Record<RiskLevel, number> = { LOW: 0.00004, MEDIUM: 0.0012, HIGH: 0.0024, CRITICAL: 0.0045 };
/** How far the trailing APY wanders around its current value, in percentage points. */
const apySwing: Record<RiskLevel, number> = { LOW: 0.8, MEDIUM: 3, HIGH: 6, CRITICAL: 12 };

export type SeriesPoint = { time: number; value: number };

/**
 * Simulated hourly history. The final 7 days are pinned so the chart agrees
 * with the listed 7D APY, and nothing is drawn before the launch date.
 */
export function dtfHistory(dtf: PublicDtf, now = Date.now()) {
  const next = rng(`${dtf.id}:history`);
  const end = Math.floor(now / HOUR) * HOUR;
  const apy = (dtf.apy7d ?? dtf.targetApr) / 100;
  const vol = volatility[dtf.risk];
  const noise = () => (next() + next() + next() - 1.5) * 2 * vol;
  const steps = Array.from({ length: HISTORY_HOURS }, () => apy / 8760 + noise());
  const actual = steps.slice(-168).reduce((s, x) => s + x, 0);
  const target = Math.log(1 + (apy * 7) / 365);
  for (let i = HISTORY_HOURS - 168; i < HISTORY_HOURS; i += 1) steps[i] += (target - actual) / 168;

  const logPrice: number[] = [0];
  for (const s of steps) logPrice.push(logPrice.at(-1)! + s);
  const flows: number[] = [0];
  for (let i = 0; i < HISTORY_HOURS; i += 1) flows.push(flows.at(-1)! + 0.00012 + (next() - 0.5) * 0.004);
  const lastFlow = flows.at(-1)!;
  // Trailing APY moves slowly (it is a 7-day average), so model it as a smooth walk ending at the listed value.
  const drift: number[] = [0];
  for (let i = 0; i < HISTORY_HOURS; i += 1) drift.push(drift.at(-1)! * 0.997 + (next() - 0.5) * 0.08);
  const spread = Math.max(...drift.map(Math.abs)) || 1;
  const lastDrift = drift.at(-1)!;
  const launch = Date.parse(`${dtf.launchedAt}T00:00:00Z`);
  return logPrice.map((lp, i) => ({
    time: end - (HISTORY_HOURS - i) * HOUR,
    price: Math.exp(lp),
    tvl: dtf.tvl * Math.exp(flows[i] - lastFlow),
    apy: (dtf.apy7d ?? 0) + ((drift[i] - lastDrift) / spread) * apySwing[dtf.risk],
    live: end - (HISTORY_HOURS - i) * HOUR >= launch,
  }));
}

/** Simulated return (%) over the last 24 hours, after fees. */
export function dtfReturn24h(dtf: PublicDtf, now = Date.now()) {
  const history = dtfHistory(dtf, now);
  const last = history[history.length - 1];
  const dayAgo = history[history.length - 25];
  return (last.price / dayAgo.price - 1) * 100;
}

/** The 24-hour return that would put the DTF exactly on its target APR. */
export const targetPace24h = (targetApr: number) => targetApr / 365;

export function dtfSeries(history: ReturnType<typeof dtfHistory>, metric: DtfMetric, range: DtfRange): SeriesPoint[] {
  const step = rangeStep[range];
  const startIndex = history.length - 1 - rangeHours[range];
  const out: SeriesPoint[] = [];
  let anchor: number | null = null;
  for (let i = startIndex; i < history.length; i += 1) {
    const point = history[i];
    if (!point.live || (history.length - 1 - i) % step !== 0) continue;
    if (metric === "return") {
      anchor ??= point.price;
      out.push({ time: point.time, value: (point.price / anchor - 1) * 100 });
    } else if (metric === "tvl") {
      out.push({ time: point.time, value: point.tvl });
    } else {
      if (!history[i - 168]?.live) continue;
      out.push({ time: point.time, value: point.apy });
    }
  }
  return out;
}

export type DtfActivity = {
  id: string;
  time: number;
  type: "Deposit" | "Withdraw";
  /** LP wallet address (demo). */
  wallet: string;
  /** Amount in the DTF's base asset. */
  amount: number;
  hash: string;
};

/** Simulated LP deposits and withdrawals, newest first. Bigger DTFs see bigger tickets. */
export function dtfActivity(dtf: PublicDtf, now = Date.now(), count = 30): DtfActivity[] {
  const next = rng(`${dtf.id}:lp-activity`);
  const wallets = Array.from({ length: Math.max(4, Math.min(14, Math.round(dtf.lps / 25))) }, (_, i) =>
    demoAddress(dtf.network, `${dtf.id}:lp:${i}`),
  );
  const ticket = Math.max(250, dtf.tvl / 400);
  let time = now - next() * 3 * HOUR;
  const launch = Date.parse(`${dtf.launchedAt}T00:00:00Z`);
  const items: DtfActivity[] = [];
  for (let i = 0; i < count && time > launch; i += 1) {
    const raw = ticket * (0.15 + next() ** 2 * 3);
    const amount = raw >= 10_000 ? Math.round(raw / 500) * 500 : Math.round(raw / 10) * 10;
    items.push({
      id: `${dtf.id}-${i}`,
      time,
      type: next() < 0.68 ? "Deposit" : "Withdraw",
      wallet: wallets[Math.floor(next() * wallets.length)],
      amount,
      hash: demoTxId(dtf.network, `${dtf.id}:tx:${i}`),
    });
    time -= (1.5 + next() * 12) * HOUR;
  }
  return items;
}
