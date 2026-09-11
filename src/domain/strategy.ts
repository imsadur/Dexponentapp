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
  documents?: { name: string; size: number; type: string }[];
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
const common: Field[] = [
  { key: "name", label: "Farm name", kind: "text" },
  {
    key: "description",
    label: "Short description",
    kind: "textarea",
    help: "Explain the Farm’s objective and source of return in plain language.",
  },
  select("asset", "Deposit asset", ["USDC", "ETH", "WBTC"]),
  number("capacity", "TVL capacity", 100, 100000000, "USD"),
  select("risk", "Risk profile", ["Balanced", "Conservative", "Aggressive"]),
  number("assumedApr", "Assumed annual gross return", -80, 100, "%", true),
  number("managementFee", "Management fee", 0, 10, "% / year", true),
  number("performanceFee", "Performance fee", 0, 50, "% of gains", true),
];
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
    "ETH lending market",
    "ETH / USDC",
  ]),
  select("strategy", "Strategy", [
    "Lending",
    "Liquidity Provision",
    "Staking",
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
  select("venue", "Trading venue", ["Hyperliquid", "GMX", "dYdX"]),
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
    description: "Diversified exposure. One strategy.",
    use: "Asset baskets & automated rebalancing",
    risk: "MEDIUM",
  },
  {
    type: "SPOT",
    title: "Spot",
    description: "Put your assets to work.",
    use: "Lending, liquidity & compounding",
    risk: "LOW",
  },
  {
    type: "PERPETUAL",
    title: "Perpetual",
    description: "Precision for advanced strategies.",
    use: "Hedging, funding & leveraged positions",
    risk: "HIGH",
  },
];
const names: Record<StrategyType, string[]> = {
  INDEX: [
    "Blue Chip Index",
    "Stablecoin Index",
    "DeFi Index",
    "Market Cap Weighted Index",
    "Equal Weight Index",
    "Custom Index",
  ],
  SPOT: [
    "Single Asset Yield",
    "Lending Yield",
    "LP Farming",
    "Auto Compound",
    "Stablecoin Yield",
    "Delta Neutral Spot",
  ],
  PERPETUAL: [
    "Delta Neutral",
    "Funding Rate Capture",
    "Market Neutral",
    "Long/Short",
    "Leveraged Long",
    "Leveraged Short",
    "Basis Trade",
  ],
};
const descriptions: Record<StrategyType, string> = {
  INDEX:
    "Build a diversified basket with transparent weights and scheduled rebalancing.",
  SPOT: "Allocate capital to a yield strategy with configurable harvest and exposure limits.",
  PERPETUAL:
    "Configure directional or hedged exposure with explicit margin and risk controls.",
};
export const templates: StrategyTemplate[] = (
  Object.keys(names) as StrategyType[]
).flatMap((type) =>
  names[type].map((name, i) => ({
    id: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
    name,
    type,
    description: descriptions[type],
    risk: type === "PERPETUAL" ? "HIGH" : type === "SPOT" ? "LOW" : "MEDIUM",
    complexity: type === "PERPETUAL" ? "Advanced" : "Standard",
    assets:
      type === "INDEX"
        ? ["WBTC", "ETH", "USDC"]
        : type === "SPOT"
          ? ["USDC", "ETH"]
          : ["ETH", "BTC"],
    networks:
      type === "PERPETUAL" ? ["Arbitrum"] : ["Arbitrum", "Base", "Ethereum"],
    protocols:
      type === "INDEX"
        ? ["Uniswap"]
        : type === "SPOT"
          ? ["Aave", "Uniswap", "Lido"]
          : ["GMX"],
    defaults: {
      name,
      description: descriptions[type],
      asset: "USDC",
      capacity: 1000000,
      risk: "Balanced",
      assumedApr: type === "INDEX" ? 12 : type === "SPOT" ? 6 : 14,
      managementFee: 1,
      performanceFee: 10,
      protocol: type === "INDEX" ? "Uniswap" : type === "SPOT" ? "Aave" : "GMX",
      allocationMethod:
        name === "Equal Weight Index"
          ? "Equal Weight"
          : name === "Market Cap Weighted Index"
            ? "Market Cap"
            : "Custom Weight",
      rebalance: "Weekly",
      minWeight: 0,
      maxWeight: 100,
      pool: "USDC lending market",
      strategy:
        i === 2 ? "Liquidity Provision" : i === 3 ? "Auto Compound" : "Lending",
      allocation: 100,
      minApy: 3,
      slippage: 0.5,
      harvest: "Daily",
      maxExposure: 100,
      rebalanceThreshold: 5,
      underlying: "ETH",
      quoteAsset: "USDC",
      venue: "Hyperliquid",
      direction:
        name === "Leveraged Long"
          ? "Long"
          : name === "Leveraged Short"
            ? "Short"
            : "Delta Neutral",
      leverage: name.startsWith("Leveraged") ? 3 : 2,
      margin: 10000,
      entry: "Manual activation",
      exit: "Risk limit reached",
      fundingThreshold: 0.01,
      stopLoss: 5,
      takeProfit: 15,
      maxDrawdown: 10,
    },
    fields: [
      ...common.slice(0, 3),
      select(
        "protocol",
        "Protocol",
        type === "INDEX"
          ? ["Uniswap"]
          : type === "SPOT"
            ? ["Aave", "Uniswap", "Lido"]
            : ["GMX"],
      ),
      ...(type === "INDEX"
        ? indexFields
        : type === "SPOT"
          ? spotFields
          : perpFields),
      ...common.slice(3),
    ],
  })),
);
export const templateById = (id: string) => templates.find((t) => t.id === id);
export function defaultAllocations(template: StrategyTemplate): Allocation[] {
  return template.name === "Stablecoin Index"
    ? [
        { asset: "USDC", weight: 50 },
        { asset: "DAI", weight: 50 },
      ]
    : template.name === "Equal Weight Index"
      ? [
          { asset: "WBTC", weight: 25 },
          { asset: "ETH", weight: 25 },
          { asset: "UNI", weight: 25 },
          { asset: "USDC", weight: 25 },
        ]
      : [
          { asset: "WBTC", weight: 40 },
          { asset: "ETH", weight: 35 },
          { asset: "UNI", weight: 15 },
          { asset: "USDC", weight: 10 },
        ];
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
  if (
    t.type === "SPOT" &&
    values.protocol === "Lido" &&
    (values.asset !== "ETH" ||
      values.strategy !== "Staking" ||
      network !== "Ethereum")
  )
    errors.protocol =
      "This prototype models Lido only for ETH staking on Ethereum.";
  return errors;
}
export function riskFor(t: StrategyTemplate, v: Values): RiskLevel {
  return t.type === "PERPETUAL"
    ? Number(v.leverage) >= 5
      ? "CRITICAL"
      : "HIGH"
    : v.risk === "Aggressive"
      ? "HIGH"
      : t.risk;
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
    .array(z.object({ name: z.string(), size: z.number(), type: z.string() }))
    .optional(),
});
