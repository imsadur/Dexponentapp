import { z } from "zod";

export type StrategyType = "INDEX" | "SPOT" | "PERPETUAL";
export type FarmStatus =
  | "DRAFT"
  | "SIMULATION"
  | "READY"
  | "DEPLOYING"
  | "ACTIVE"
  | "PAUSED"
  | "FAILED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Values = Record<string, string | number>;
export type Field = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "number" | "select" | "range";
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  help?: string;
  advanced?: boolean;
};
export type StrategyTemplate = {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  risk: RiskLevel;
  complexity: string;
  assets: string[];
  networks: string[];
  protocols: string[];
  allocations?: Allocation[];
  defaults: Values;
  fields: Field[];
};
export type Allocation = { asset: string; weight: number };
export type Farm = {
  id: string;
  name: string;
  type: StrategyType;
  templateId: string;
  status: FarmStatus;
  network: string;
  values: Values;
  allocations: Allocation[];
  step: number;
  tvl: number;
  apy: number;
  performance: number;
  risk: RiskLevel;
  createdAt: string;
  updatedAt: string;
  source: "demo" | "local";
  events: string[];
  icon?: string;
  /** `id` keys the file in browser storage; older drafts have metadata only. */
  documents?: { id?: string; name: string; size: number; type: string }[];
  lpPositions?: { address: string; depositedUsd: number }[];
};
export type User = { name: string; workspace: string };
export type FarmManager = User & { wallet?: string };
export type Asset = {
  symbol: string;
  name: string;
  network: string;
  address?: string;
};
export type Protocol = {
  name: string;
  networks: string[];
  integrated: boolean;
};
export type Position = {
  asset: string;
  value: number;
  weight: number;
  source: "demo" | "live";
};
export type RiskProfile = {
  level: RiskLevel;
  reasons: string[];
  audited: boolean;
};
export type Strategy = Pick<
  Farm,
  "type" | "templateId" | "values" | "allocations"
>;

const select = (
  key: string,
  label: string,
  options: string[],
  advanced = false,
): Field => ({ key, label, options, kind: "select", advanced });
const number = (
  key: string,
  label: string,
  min: number,
  max: number,
  unit = "",
  advanced = false,
): Field => ({
  key,
  label,
  min,
  max,
  unit,
  advanced,
  kind: "number",
  step: 0.1,
});
/** Networks where DTFs can be created. */
export const NETWORKS = ["Base", "Solana"] as const;
const LEGACY_NETWORKS = new Set(["Arbitrum", "Ethereum"]);
/** Saved drafts from older builds may reference networks that are no longer offered. */
export function normalizeNetwork(network: string): string {
  return LEGACY_NETWORKS.has(network) ? "Base" : network;
}
const common: Field[] = [
  { key: "name", label: "DTF name", kind: "text" },
  {
    key: "description",
    label: "Short description",
    kind: "textarea",
    help: "The objective and source of return, in plain language.",
  },
  select("asset", "Base token", ["USDC", "ETH", "WBTC"]),
  number("capacity", "TVL capacity", 100, 100000000, "USD"),
  { ...select("visibility", "Visibility", ["Public", "Private"]), help: "Shown to LPs on the DTF page." },
  select("risk", "Risk profile", ["Balanced", "Conservative", "Aggressive"]),
  number("assumedApr", "Assumed annual gross return", -80, 100, "%", true),
  number("managementFee", "Management fee", 0, 10, "% / year", true),
  number("performanceFee", "Performance fee", 0, 50, "% of gains", true),
];
const protocolOptions: Record<StrategyType, string[]> = {
  INDEX: ["Uniswap", "Aerodrome", "Jupiter"],
  SPOT: ["Aave", "Morpho", "Aerodrome", "Kamino"],
  PERPETUAL: ["Hyperliquid", "Drift"],
};
const indexFields: Field[] = [
  select("allocationMethod", "Allocation method", [
    "Custom Weight",
    "Equal Weight",
    "Market Cap",
    "Risk Weighted",
  ]),
  select("rebalance", "Rebalance frequency", ["Weekly", "Daily", "Monthly"]),
  number("minWeight", "Minimum asset weight", 0, 50, "%", true),
  number("maxWeight", "Maximum asset weight", 25, 100, "%", true),
];
const spotFields: Field[] = [
  select("pool", "Pool", [
    "USDC lending market",
    "USDT lending market",
    "ETH lending market",
    "ETH / USDC",
    "USDC / USDT",
  ]),
  select("strategy", "Strategy", [
    "Lending",
    "Liquidity Provision",
    "Auto Compound",
  ]),
  number("allocation", "Capital allocation", 1, 100, "%"),
  number("minApy", "Minimum APY threshold", 0, 50, "%"),
  number("slippage", "Maximum slippage", 0.1, 5, "%", true),
  select("harvest", "Harvest frequency", ["Daily", "Weekly", "Monthly"], true),
  number("rebalanceThreshold", "Rebalance threshold", 1, 50, "%", true),
  number("maxExposure", "Maximum protocol exposure", 1, 100, "%", true),
];
const perpFields: Field[] = [
  select("underlying", "Base asset", ["ETH", "BTC", "SOL"]),
  select("quoteAsset", "Quote asset", ["USDC", "USDT"]),
  select("venue", "Trading venue", ["Hyperliquid", "Drift"]),
  select("direction", "Direction", ["Delta Neutral", "Long", "Short"]),
  {
    key: "leverage",
    label: "Leverage",
    kind: "range",
    min: 1,
    max: 10,
    step: 0.5,
    unit: "×",
    help: "Leverage amplifies losses. Your entire margin can be liquidated.",
  },
  number("margin", "Margin", 100, 10000000, "USDC"),
  select(
    "entry",
    "Entry condition",
    ["Manual activation", "Funding above threshold", "Price breakout"],
    true,
  ),
  select(
    "exit",
    "Exit condition",
    ["Risk limit reached", "Funding below threshold", "Manual exit"],
    true,
  ),
  number("fundingThreshold", "Funding threshold", -1, 1, "% / 8h", true),
  number("stopLoss", "Stop loss", 0.5, 30, "%", true),
  number("takeProfit", "Take profit", 1, 100, "%", true),
  number("maxDrawdown", "Maximum drawdown", 1, 50, "%", true),
  number("rebalanceThreshold", "Hedge rebalance threshold", 1, 30, "%", true),
];

export const families: {
  type: StrategyType;
  title: string;
  description: string;
  use: string;
  risk: RiskLevel;
}[] = [
  {
    type: "INDEX",
    title: "Index",
    description: "A basket of assets with scheduled rebalancing.",
    use: "Asset baskets & rebalancing",
    risk: "MEDIUM",
  },
  {
    type: "SPOT",
    title: "Spot",
    description: "Lending and liquidity yield from spot markets.",
    use: "Lending, liquidity & compounding",
    risk: "LOW",
  },
  {
    type: "PERPETUAL",
    title: "Perpetual",
    description: "Hedged or directional positions on perpetual markets.",
    use: "Hedging, funding & leverage",
    risk: "HIGH",
  },
];

/** Shared defaults; each template overrides what defines it. */
const baseDefaults: Values = {
  asset: "USDC",
  capacity: 1000000,
  visibility: "Public",
  risk: "Balanced",
  managementFee: 1,
  performanceFee: 10,
  allocationMethod: "Custom Weight",
  rebalance: "Monthly",
  minWeight: 5,
  maxWeight: 60,
  pool: "USDC lending market",
  strategy: "Lending",
  allocation: 100,
  minApy: 3,
  slippage: 0.5,
  harvest: "Daily",
  maxExposure: 100,
  rebalanceThreshold: 5,
  underlying: "ETH",
  quoteAsset: "USDC",
  venue: "Hyperliquid",
  direction: "Delta Neutral",
  leverage: 2,
  margin: 10000,
  entry: "Manual activation",
  exit: "Risk limit reached",
  fundingThreshold: 0.01,
  stopLoss: 5,
  takeProfit: 15,
  maxDrawdown: 10,
};

type TemplateSpec = {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  risk: RiskLevel;
  assets: string[];
  protocols: string[];
  allocations?: Allocation[];
  defaults: Values;
};

const specs: TemplateSpec[] = [
  {
    id: "blue-chip-index",
    name: "Blue Chip Index",
    type: "INDEX",
    description: "Core exposure to BTC, ETH and SOL, rebalanced monthly.",
    risk: "MEDIUM",
    assets: ["WBTC", "ETH", "SOL"],
    protocols: ["Uniswap"],
    allocations: [
      { asset: "WBTC", weight: 45 },
      { asset: "ETH", weight: 35 },
      { asset: "SOL", weight: 20 },
    ],
    defaults: { assumedApr: 12, protocol: "Uniswap", rebalance: "Monthly" },
  },
  {
    id: "large-cap-defi-index",
    name: "Large Cap DeFi Index",
    type: "INDEX",
    description: "Governance tokens of the largest lending, exchange and staking protocols.",
    risk: "HIGH",
    assets: ["AAVE", "UNI", "LDO", "JUP"],
    protocols: ["Uniswap", "Jupiter"],
    allocations: [
      { asset: "AAVE", weight: 30 },
      { asset: "UNI", weight: 25 },
      { asset: "LDO", weight: 25 },
      { asset: "JUP", weight: 20 },
    ],
    defaults: {
      assumedApr: 16,
      protocol: "Uniswap",
      risk: "Aggressive",
      rebalance: "Weekly",
      maxWeight: 40,
      managementFee: 1.5,
      performanceFee: 15,
    },
  },
  {
    id: "balanced-crypto-index",
    name: "Balanced Crypto Index",
    type: "INDEX",
    description: "Majors paired with a stablecoin sleeve to soften drawdowns.",
    risk: "MEDIUM",
    assets: ["WBTC", "ETH", "SOL", "USDC"],
    protocols: ["Aerodrome"],
    allocations: [
      { asset: "WBTC", weight: 30 },
      { asset: "ETH", weight: 30 },
      { asset: "SOL", weight: 10 },
      { asset: "USDC", weight: 30 },
    ],
    defaults: { assumedApr: 9, protocol: "Aerodrome", maxWeight: 50 },
  },
  {
    id: "stablecoin-index",
    name: "Stablecoin Index",
    type: "INDEX",
    description: "Spread across major stablecoins to limit single-issuer risk.",
    risk: "LOW",
    assets: ["USDC", "USDT", "DAI"],
    protocols: ["Uniswap"],
    allocations: [
      { asset: "USDC", weight: 50 },
      { asset: "USDT", weight: 30 },
      { asset: "DAI", weight: 20 },
    ],
    defaults: {
      assumedApr: 4,
      protocol: "Uniswap",
      risk: "Conservative",
      minWeight: 10,
      managementFee: 0.5,
      performanceFee: 5,
    },
  },
  {
    id: "stablecoin-yield",
    name: "Stablecoin Yield",
    type: "SPOT",
    description: "USDC supplied to established lending markets for variable interest.",
    risk: "LOW",
    assets: ["USDC"],
    protocols: ["Aave"],
    defaults: { assumedApr: 6, protocol: "Aave", risk: "Conservative" },
  },
  {
    id: "lending-optimizer",
    name: "Lending Optimizer",
    type: "SPOT",
    description: "Moves stablecoins to the best lending rate within set exposure limits.",
    risk: "MEDIUM",
    assets: ["USDC", "USDT"],
    protocols: ["Morpho", "Aave"],
    defaults: {
      assumedApr: 8,
      protocol: "Morpho",
      strategy: "Auto Compound",
      rebalanceThreshold: 2,
      minApy: 4,
    },
  },
  {
    id: "liquidity-yield",
    name: "Liquidity Yield",
    type: "SPOT",
    description: "Trading fees from a concentrated ETH/USDC liquidity position.",
    risk: "MEDIUM",
    assets: ["ETH", "USDC"],
    protocols: ["Aerodrome"],
    defaults: {
      assumedApr: 14,
      protocol: "Aerodrome",
      pool: "ETH / USDC",
      strategy: "Liquidity Provision",
      rebalanceThreshold: 10,
      performanceFee: 15,
    },
  },
  {
    id: "conservative-yield",
    name: "Conservative Yield",
    type: "SPOT",
    description: "Stablecoin lending with tight exposure caps and weekly harvests.",
    risk: "LOW",
    assets: ["USDC", "USDT"],
    protocols: ["Aave"],
    defaults: {
      assumedApr: 4.5,
      protocol: "Aave",
      risk: "Conservative",
      allocation: 80,
      maxExposure: 80,
      harvest: "Weekly",
      minApy: 2,
      managementFee: 0.5,
      performanceFee: 5,
    },
  },
  {
    id: "delta-neutral",
    name: "Delta Neutral",
    type: "PERPETUAL",
    description: "Long spot ETH, short ETH perp; earns funding with little price exposure.",
    risk: "HIGH",
    assets: ["ETH", "USDC"],
    protocols: ["Hyperliquid"],
    defaults: { assumedApr: 14, protocol: "Hyperliquid" },
  },
  {
    id: "funding-capture",
    name: "Funding Capture",
    type: "PERPETUAL",
    description: "Hedged BTC position opened only while funding rates stay elevated.",
    risk: "HIGH",
    assets: ["BTC", "USDC"],
    protocols: ["Hyperliquid"],
    defaults: {
      assumedApr: 16,
      protocol: "Hyperliquid",
      underlying: "BTC",
      entry: "Funding above threshold",
      exit: "Funding below threshold",
      fundingThreshold: 0.02,
      performanceFee: 20,
    },
  },
  {
    id: "market-neutral",
    name: "Market Neutral",
    type: "PERPETUAL",
    description: "Offsetting SOL long and short legs to isolate basis and funding.",
    risk: "HIGH",
    assets: ["SOL", "USDC"],
    protocols: ["Drift"],
    defaults: {
      assumedApr: 11,
      protocol: "Drift",
      venue: "Drift",
      underlying: "SOL",
      maxDrawdown: 8,
      performanceFee: 15,
    },
  },
  {
    id: "hedged-yield",
    name: "Hedged Yield",
    type: "PERPETUAL",
    description: "ETH yield position with a partial perp hedge to limit drawdowns.",
    risk: "MEDIUM",
    assets: ["ETH", "USDC"],
    protocols: ["Hyperliquid"],
    defaults: {
      assumedApr: 9,
      protocol: "Hyperliquid",
      direction: "Short",
      leverage: 1,
      stopLoss: 8,
      maxDrawdown: 12,
    },
  },
];

export const templates: StrategyTemplate[] = specs.map((spec) => ({
  id: spec.id,
  name: spec.name,
  type: spec.type,
  description: spec.description,
  risk: spec.risk,
  complexity: spec.type === "PERPETUAL" ? "Advanced" : "Standard",
  assets: spec.assets,
  networks: [...NETWORKS],
  protocols: spec.protocols,
  allocations: spec.allocations,
  defaults: {
    ...baseDefaults,
    name: spec.name,
    description: spec.description,
    ...spec.defaults,
  },
  fields: [
    ...common.slice(0, 3),
    select("protocol", "Protocol", protocolOptions[spec.type]),
    ...(spec.type === "INDEX"
      ? indexFields
      : spec.type === "SPOT"
        ? spotFields
        : perpFields),
    ...common.slice(3),
  ],
}));

/** Template ids retired when the library was consolidated; saved DTFs keep resolving. */
const legacyTemplateIds: Record<string, string> = {
  "defi-index": "large-cap-defi-index",
  "market-cap-weighted-index": "blue-chip-index",
  "equal-weight-index": "balanced-crypto-index",
  "custom-index": "blue-chip-index",
  "single-asset-yield": "stablecoin-yield",
  "lending-yield": "lending-optimizer",
  "lp-farming": "liquidity-yield",
  "auto-compound": "lending-optimizer",
  "delta-neutral-spot": "conservative-yield",
  "funding-rate-capture": "funding-capture",
  "long-short": "market-neutral",
  "leveraged-long": "hedged-yield",
  "leveraged-short": "hedged-yield",
  "basis-trade": "funding-capture",
};
export const templateById = (
  id: string,
  type?: StrategyType,
): StrategyTemplate | undefined =>
  templates.find((t) => t.id === id) ??
  templates.find((t) => t.id === legacyTemplateIds[id]) ??
  (type ? templates.find((t) => t.type === type) : undefined);
export function defaultAllocations(template: StrategyTemplate): Allocation[] {
  return (
    template.allocations?.map((a) => ({ ...a })) ?? [
      { asset: "USDC", weight: 100 },
    ]
  );
}
export function makeFarm(
  t: StrategyTemplate,
  id: string,
  now = new Date().toISOString(),
): Farm {
  return {
    id,
    name: t.name,
    type: t.type,
    templateId: t.id,
    status: "DRAFT",
    network: t.networks[0],
    values: { ...t.defaults },
    allocations: defaultAllocations(t),
    step: 2,
    tvl: 0,
    apy: 0,
    performance: 0,
    risk: t.risk,
    source: "local",
    createdAt: now,
    updatedAt: now,
    events: [],
    documents: [],
  };
}
export function validateStrategy(
  t: StrategyTemplate,
  values: Values,
  allocations: Allocation[],
  network: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of t.fields) {
    const value = values[f.key];
    if (f.kind === "number" || f.kind === "range") {
      if (
        value === "" ||
        !z
          .number()
          .min(f.min ?? -Infinity)
          .max(f.max ?? Infinity)
          .safeParse(value).success
      )
        errors[f.key] = `Enter a number from ${f.min} to ${f.max}.`;
    } else if (typeof value !== "string" || !value.trim())
      errors[f.key] = "This field is required.";
    else if (f.options && !f.options.includes(value))
      errors[f.key] = "Choose a supported option.";
  }
  if (String(values.name).trim().length > 60)
    errors.name = "Use 60 characters or fewer.";
  if (!t.networks.includes(network))
    errors.network = "This template is not available on this network.";
  if (t.type === "INDEX") {
    if (
      !allocations.length ||
      Math.abs(allocations.reduce((s, a) => s + a.weight, 0) - 100) > 0.01
    )
      errors.allocations = "Asset weights must total exactly 100%.";
    if (
      allocations.some(
        (a) =>
          !Number.isFinite(a.weight) ||
          a.weight < Number(values.minWeight) ||
          a.weight > Number(values.maxWeight),
      )
    )
      errors.allocations =
        "Each weight must be within the configured minimum and maximum.";
  }
  if (
    t.type === "SPOT" &&
    Number(values.allocation) > Number(values.maxExposure)
  )
    errors.maxExposure =
      "Protocol exposure must cover the selected allocation.";
  return errors;
}
export function riskFor(t: StrategyTemplate, v: Values): RiskLevel {
  if (t.type === "PERPETUAL" && Number(v.leverage) >= 5) return "CRITICAL";
  if (t.type === "PERPETUAL" && Number(v.leverage) >= 3) return "HIGH";
  return v.risk === "Aggressive" && t.risk !== "CRITICAL" ? "HIGH" : t.risk;
}
export type Scenario = "Bull" | "Base" | "Bear" | "Stress";
export type Simulation = {
  points: number[];
  returnPct: number;
  apr: number;
  apy: number;
  volatility: number;
  drawdown: number;
  sharpe: number;
  scenario: Scenario;
  days: number;
};
export function simulate(
  v: Values,
  type: StrategyType,
  scenario: Scenario,
  days: number,
): Simulation {
  const leverage = type === "PERPETUAL" ? Number(v.leverage) : 1;
  const adjustment = { Bull: 12, Base: 0, Bear: -25, Stress: -65 }[scenario];
  const gross = (Number(v.assumedApr) + adjustment) * leverage;
  const apr = Math.max(
    -95,
    gross -
      (Math.max(0, gross) * Number(v.performanceFee)) / 100 -
      Number(v.managementFee),
  );
  const daily = apr / 100 / 365;
  const amplitude =
    (type === "INDEX" ? 0.006 : type === "SPOT" ? 0.001 : 0.004 * leverage) *
    (scenario === "Stress" ? 3 : 1);
  const points = [10000];
  for (let i = 1; i <= days; i++) {
    const change =
      daily +
      Math.sin(i * 1.7) * amplitude +
      Math.cos(i * 0.43) * amplitude * 0.6;
    points.push(Math.max(1, points[i - 1] * (1 + change)));
  }
  let peak = points[0],
    drawdown = 0;
  for (const p of points) {
    peak = Math.max(peak, p);
    drawdown = Math.max(drawdown, ((peak - p) / peak) * 100);
  }
  const returns = points.slice(1).map((p, i) => p / points[i] - 1);
  const mean = returns.reduce((s, n) => s + n, 0) / returns.length;
  const sd = Math.sqrt(
    returns.reduce((s, n) => s + (n - mean) ** 2, 0) / returns.length,
  );
  return {
    points,
    returnPct: (points.at(-1)! / points[0] - 1) * 100,
    apr,
    apy: ((1 + daily) ** 365 - 1) * 100,
    volatility: sd * Math.sqrt(365) * 100,
    drawdown,
    sharpe: sd ? (mean / sd) * Math.sqrt(365) : 0,
    scenario,
    days,
  };
}
export const farmSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["INDEX", "SPOT", "PERPETUAL"]),
  templateId: z.string(),
  status: z.enum([
    "DRAFT",
    "SIMULATION",
    "READY",
    "DEPLOYING",
    "ACTIVE",
    "PAUSED",
    "FAILED",
  ]),
  network: z.string(),
  values: z.record(z.string(), z.union([z.string(), z.number()])),
  allocations: z.array(z.object({ asset: z.string(), weight: z.number() })),
  step: z.number().int().min(0).max(5),
  tvl: z.number(),
  apy: z.number(),
  performance: z.number(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  source: z.enum(["demo", "local"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  events: z.array(z.string()),
  icon: z.string().optional(),
  documents: z
    .array(z.object({ id: z.string().optional(), name: z.string(), size: z.number(), type: z.string() }))
    .optional(),
  lpPositions: z
    .array(z.object({ address: z.string(), depositedUsd: z.number() }))
    .optional(),
});
