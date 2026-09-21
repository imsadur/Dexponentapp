import { Farm, farmSchema, makeFarm, templateById, type Values } from "../domain/strategy";
export const STORAGE_KEY = "farm-manager:farms:v1";
const seedPositionByFarmId: Record<string, number> = {
  "demo-0": 72_480,
  "demo-1": 47_580,
  "demo-2": 64_200,
};
const demoMetricsByFarmId: Record<string, Record<string, number>> = {
  "demo-0": { lockedUsd: 920000, activeLps: 184, topHolderPct: 8.4, totalDepositsUsd: 2725000, realizedApy: 18.2, periodPnlUsd: 97128, marginHealthPct: 76, markPriceUsd: 2505.1, fundingRate8h: 0.0125 },
  "demo-1": { lockedUsd: 180000, activeLps: 126, topHolderPct: 7.1, totalDepositsUsd: 1575000, realizedApy: 14.1, periodPnlUsd: 85470 },
  "demo-2": { lockedUsd: 60000, activeLps: 98, topHolderPct: 6.8, totalDepositsUsd: 895000, realizedApy: 8.4, periodPnlUsd: 16376, impermanentLossPct: -0.34, composition_USDC: 58, composition_USDT: 42 },
};
export function seedFarms(): Farm[] {
  return [
    {
      template: "delta-neutral",
      name: "ETH Delta Neutral",
      tvl: 2840000,
      apy: 14.8,
      performance: 3.42,
      lockedUsd: 920000,
      activeLps: 184,
      topHolderPct: 8.4,
      totalDepositsUsd: 2725000,
      realizedApy: 18.2,
      periodPnlUsd: 97128,
      marginHealthPct: 76,
      markPriceUsd: 2505.1,
      fundingRate8h: 0.0125,
    },
    {
      template: "blue-chip-index",
      name: "Blue Chip Index",
      tvl: 1650000,
      apy: 12.6,
      performance: 5.18,
      lockedUsd: 180000,
      activeLps: 126,
      topHolderPct: 7.1,
      totalDepositsUsd: 1575000,
      realizedApy: 14.1,
      periodPnlUsd: 85470,
    },
    {
      template: "stablecoin-yield",
      name: "Stablecoin Yield",
      tvl: 920000,
      apy: 7.2,
      performance: 1.78,
      lockedUsd: 60000,
      activeLps: 98,
      topHolderPct: 6.8,
      totalDepositsUsd: 895000,
      realizedApy: 8.4,
      periodPnlUsd: 16376,
      impermanentLossPct: -0.34,
      composition_USDC: 58,
      composition_USDT: 42,
    },
  ].map((data, i) => ({
    ...makeFarm(
      templateById(data.template)!,
      `demo-${i}`,
      "2026-09-01T10:00:00.000Z",
    ),
    name: data.name,
    values: {
      ...templateById(data.template)!.defaults,
      name: data.name,
      demoPosition: [72_480, 47_580, 64_200][i],
      lockedUsd: data.lockedUsd,
      activeLps: data.activeLps,
      topHolderPct: data.topHolderPct,
      totalDepositsUsd: data.totalDepositsUsd,
      realizedApy: data.realizedApy,
      periodPnlUsd: data.periodPnlUsd,
      ...(i === 0 ? {
        marginHealthPct: data.marginHealthPct,
        markPriceUsd: data.markPriceUsd,
        fundingRate8h: data.fundingRate8h,
      } : {}),
      ...(i === 2 ? {
        impermanentLossPct: data.impermanentLossPct,
        composition_USDC: data.composition_USDC,
        composition_USDT: data.composition_USDT,
      } : {}),
      capacity: Math.max(
        Number(templateById(data.template)!.defaults.capacity),
        data.tvl * 2,
      ),
    },
    tvl: data.tvl,
    apy: data.apy,
    performance: data.performance,
    status: "ACTIVE" as const,
    source: "demo" as const,
    events: ["Demo fixture loaded · sample data"],
    lpPositions: makeDemoLpPositions(
      `demo-${i}`,
      data.activeLps,
      data.tvl,
      data.topHolderPct,
    ),
  }));
}

function makeDemoLpPositions(id: string, count: number, tvl: number, topHolderPct: number) {
  const topDeposit = tvl * topHolderPct / 100;
  const remainder = count > 1 ? (tvl - topDeposit) / (count - 1) : 0;
  return Array.from({ length: count }, (_, index) => ({
    address: `demo:${id}:${index}`,
    depositedUsd: index === 0 ? topDeposit : remainder,
  }));
}
export const localDataAdapter = {
  read(): Farm[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedFarms();
    const parsed = farmSchema.array().safeParse(JSON.parse(raw));
    if (!parsed.success)
      throw new Error(
        "Saved workspace could not be read. Export or reset local data in Settings.",
      );
    return (parsed.data as Farm[]).map((farm) => {
      const values: Values = {
        ...templateById(farm.templateId)?.defaults,
        ...(demoMetricsByFarmId[farm.id] || {}),
        ...farm.values,
        capacity:
          farm.source === "demo" && Number(farm.values.capacity) < farm.tvl
            ? farm.tvl * 2
            : farm.values.capacity,
        demoPosition:
          farm.values.demoPosition ?? seedPositionByFarmId[farm.id] ?? 0,
        description:
          farm.values.description ||
          templateById(farm.templateId)?.description ||
          "A transparent onchain Farm with clearly defined strategy controls.",
      };
      return {
      ...farm,
      values,
      documents: farm.documents || [],
      lpPositions:
        farm.lpPositions ||
        (farm.source === "demo"
          ? makeDemoLpPositions(
              farm.id,
              Number(values.activeLps || 0),
              farm.tvl,
              Number(values.topHolderPct || 8.4),
            )
          : []),
    }});
  },
  write(farms: Farm[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(farms));
  },
};
