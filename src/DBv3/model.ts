export type V3Strategy = "INDEX" | "SPOT" | "PERPETUAL";
export type V3Risk = "LOW" | "MEDIUM" | "HIGH";
export type V3FarmStatus = "ACTIVE" | "PAUSED";

export type V3Farm = {
  id: string;
  name: string;
  description: string;
  type: V3Strategy;
  template: string;
  network: "Ethereum" | "Base" | "Arbitrum";
  assets: string[];
  depositAsset: string;
  risk: V3Risk;
  status: V3FarmStatus;
  apy: number;
  tvl: number;
  position: number;
  managerCanPause: boolean;
  events: string[];
};

export const V3_STORAGE_KEY = "dexponent:dbv3:farms:v1";

export const strategyOptions: Array<{ type: V3Strategy; title: string; copy: string; risk: V3Risk }> = [
  { type: "INDEX", title: "Index", copy: "Diversified exposure with automated rebalancing.", risk: "MEDIUM" },
  { type: "SPOT", title: "Spot", copy: "Lending and liquidity strategies without leverage.", risk: "LOW" },
  { type: "PERPETUAL", title: "Perpetual", copy: "Funding, hedging, and directional market strategies.", risk: "HIGH" },
];

export const templatesByStrategy: Record<V3Strategy, string[]> = {
  INDEX: ["Blue Chip Index", "Balanced Crypto Index", "Stablecoin Index"],
  SPOT: ["Stablecoin Yield", "Lending Optimizer", "Liquidity Yield"],
  PERPETUAL: ["Delta Neutral", "Funding Capture", "Hedged Yield"],
};

export function seedV3Farms(): V3Farm[] {
  return [
    {
      id: "v3-eth-neutral",
      name: "ETH Delta Neutral",
      description: "Captures funding while maintaining a market-neutral ETH hedge.",
      type: "PERPETUAL",
      template: "Delta Neutral",
      network: "Arbitrum",
      assets: ["ETH", "USDC"],
      depositAsset: "USDC",
      risk: "HIGH",
      status: "ACTIVE",
      apy: 14.8,
      tvl: 2_840_000,
      position: 72_480,
      managerCanPause: false,
      events: ["Demo position opened", "Funding payment accrued"],
    },
    {
      id: "v3-blue-chip",
      name: "Blue Chip Index",
      description: "A transparent ETH, WBTC, and SOL allocation with scheduled rebalancing.",
      type: "INDEX",
      template: "Blue Chip Index",
      network: "Ethereum",
      assets: ["ETH", "WBTC", "SOL"],
      depositAsset: "USDC",
      risk: "MEDIUM",
      status: "ACTIVE",
      apy: 12.6,
      tvl: 1_650_000,
      position: 47_580,
      managerCanPause: false,
      events: ["Demo position opened", "Allocation rebalanced"],
    },
    {
      id: "v3-stable-yield",
      name: "Stablecoin Yield",
      description: "Routes stablecoin liquidity across conservative lending markets.",
      type: "SPOT",
      template: "Stablecoin Yield",
      network: "Base",
      assets: ["USDC", "USDT"],
      depositAsset: "USDC",
      risk: "LOW",
      status: "ACTIVE",
      apy: 7.2,
      tvl: 920_000,
      position: 64_200,
      managerCanPause: false,
      events: ["Demo position opened", "Yield harvested"],
    },
  ];
}

export function money(value: number, compact = false) {
  if (compact && value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (compact && value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

