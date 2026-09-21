import type { Allocation, Farm, StrategyType } from "./strategy";

export type LpPosition = { address: string; depositedUsd: number };

const numberValue = (farm: Farm, key: string, fallback = 0) => {
  const value = Number(farm.values[key]);
  return Number.isFinite(value) ? value : fallback;
};

export function farmLpPositions(farm: Farm): LpPosition[] {
  if (farm.lpPositions?.length) return farm.lpPositions;
  const count = Math.max(0, Math.round(numberValue(farm, "activeLps")));
  if (!count || farm.tvl <= 0) return [];
  const topPct = numberValue(farm, "topHolderPct", 8.4);
  const topDeposit = farm.tvl * topPct / 100;
  const remainder = count > 1 ? (farm.tvl - topDeposit) / (count - 1) : 0;
  return Array.from({ length: count }, (_, index) => ({
    address: `demo:${farm.id}:${index}`,
    depositedUsd: index === 0 ? topDeposit : remainder,
  }));
}

export function portfolioMetrics(farms: Farm[]) {
  const active = farms.filter((farm) => farm.status === "ACTIVE");
  const drafts = farms.filter((farm) => farm.status === "DRAFT" || farm.status === "SIMULATION");
  const managedCapital = active.reduce((sum, farm) => sum + farm.tvl, 0);
  const weighted = (key: "apy" | "performance") => managedCapital
    ? active.reduce((sum, farm) => sum + farm[key] * farm.tvl, 0) / managedCapital
    : 0;
  const lockedCapital = active.reduce(
    (sum, farm) => sum + Math.min(farm.tvl, Math.max(0, numberValue(farm, "lockedUsd"))),
    0,
  );
  const providers = active.flatMap(farmLpPositions);
  const byAddress = new Map<string, number>();
  providers.forEach(({ address, depositedUsd }) => byAddress.set(address, (byAddress.get(address) || 0) + depositedUsd));
  const largestDepositor = Math.max(0, ...byAddress.values());
  const allocation = (["INDEX", "SPOT", "PERPETUAL"] as StrategyType[]).map((type) => ({
    type,
    amount: active.filter((farm) => farm.type === type).reduce((sum, farm) => sum + farm.tvl, 0),
  }));
  return {
    active,
    drafts,
    managedCapital,
    blendedApy: weighted("apy"),
    netTrajectory30d: weighted("performance"),
    withdrawableCapital: Math.max(0, managedCapital - lockedCapital),
    withdrawablePct: managedCapital ? ((managedCapital - lockedCapital) / managedCapital) * 100 : 0,
    totalLps: byAddress.size,
    topHolderPct: managedCapital ? (largestDepositor / managedCapital) * 100 : 0,
    allocation,
  };
}

export function performanceForRange(netTrajectory30d: number, range: number) {
  if (range === 30) return netTrajectory30d;
  if (range === 90) return netTrajectory30d * 2.29;
  return netTrajectory30d * 3.5;
}

export function farmFinancialMetrics(farm: Farm, now = new Date()) {
  const totalDeposits = numberValue(
    farm,
    "totalDepositsUsd",
    farm.performance > -99 ? farm.tvl / (1 + farm.performance / 100) : farm.tvl,
  );
  const periodPnl = numberValue(farm, "periodPnlUsd", farm.tvl * farm.performance / 100);
  const performanceFeePct = numberValue(farm, "performanceFee");
  const managerFee = Math.max(0, periodPnl) * performanceFeePct / 100;
  const created = new Date(farm.createdAt);
  const ageDays = Number.isNaN(created.valueOf()) ? 0 : Math.max(0, Math.floor((now.valueOf() - created.valueOf()) / 86_400_000));
  const explicitRealized = Number(farm.values.realizedApy);
  const realizedApy = ageDays < 7
    ? null
    : Number.isFinite(explicitRealized)
      ? explicitRealized
      : totalDeposits > 0
        ? (Math.pow(Math.max(farm.tvl, 0) / totalDeposits, 365 / Math.max(ageDays, 1)) - 1) * 100
        : 0;
  return {
    totalDeposits,
    netSinceInception: farm.tvl - totalDeposits,
    currentApy: farm.apy,
    realizedApy,
    lpYieldDistributed: Math.max(0, periodPnl - managerFee),
    managerFee,
    activeLps: farmLpPositions(farm).length,
    topHolderPct: farm.tvl ? Math.max(0, ...farmLpPositions(farm).map((position) => position.depositedUsd)) / farm.tvl * 100 : 0,
  };
}

export function perpetualHealth(farm: Farm) {
  const leverage = Math.max(1, numberValue(farm, "leverage", 1));
  const markPrice = numberValue(farm, "markPriceUsd", String(farm.values.underlying) === "BTC" ? 77_669 : 2_505.1);
  const margin = Math.max(0, numberValue(farm, "margin"));
  const marginHealth = Math.max(0, Math.min(100, numberValue(farm, "marginHealthPct", margin > 0 ? 100 / leverage + 42 : 0)));
  const direction = String(farm.values.direction || "Neutral").replace("Delta Neutral", "Neutral");
  const liquidationDistance = markPrice * (marginHealth / 100) / leverage;
  const liquidationPrice = direction === "Short" ? markPrice + liquidationDistance : Math.max(0, markPrice - liquidationDistance);
  const fundingRate = numberValue(farm, "fundingRate8h", numberValue(farm, "fundingThreshold"));
  return { direction, marginHealth, liquidationPrice, fundingRate };
}

export function indexWeights(farm: Farm) {
  const driftPattern = [6, -4, -1, -1];
  const threshold = numberValue(farm, "rebalanceThreshold", 5);
  return farm.allocations.map((allocation: Allocation, index) => {
    const current = numberValue(farm, `currentWeight_${allocation.asset}`, allocation.weight + (driftPattern[index] || 0));
    const drift = current - allocation.weight;
    return { ...allocation, current, drift, flagged: Math.abs(drift) >= threshold };
  });
}

export function spotComposition(farm: Farm) {
  const primary = String(farm.values.asset || "USDC");
  const paired = primary === "USDC" ? "USDT" : "USDC";
  return {
    impermanentLoss: numberValue(farm, "impermanentLossPct", -0.34),
    assets: [
      { asset: primary, weight: numberValue(farm, `composition_${primary}`, 58) },
      { asset: paired, weight: numberValue(farm, `composition_${paired}`, 42) },
    ],
  };
}
