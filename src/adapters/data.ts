import { Farm, farmSchema, makeFarm, templateById } from "../domain/strategy";
export const STORAGE_KEY = "farm-manager:farms:v1";
export function seedFarms(): Farm[] {
  return [
    {
      template: "delta-neutral",
      name: "ETH Delta Neutral",
      tvl: 2840000,
      apy: 14.8,
      performance: 3.42,
    },
    {
      template: "blue-chip-index",
      name: "Blue Chip Index",
      tvl: 1650000,
      apy: 12.6,
      performance: 5.18,
    },
    {
      template: "stablecoin-yield",
      name: "Stablecoin Yield",
      tvl: 920000,
      apy: 7.2,
      performance: 1.78,
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
    return (parsed.data as Farm[]).map((farm) => ({
      ...farm,
      values: {
        ...templateById(farm.templateId)?.defaults,
        ...farm.values,
        capacity:
          farm.source === "demo" && Number(farm.values.capacity) < farm.tvl
            ? farm.tvl * 2
            : farm.values.capacity,
        description:
          farm.values.description ||
          templateById(farm.templateId)?.description ||
          "A transparent onchain Farm with clearly defined strategy controls.",
      },
      documents: farm.documents || [],
    }));
  },
  write(farms: Farm[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(farms));
  },
};
