import type { Farm, RiskLevel } from "./strategy";

function withEvent(farm: Farm, event: string): Farm {
  return {
    ...farm,
    updatedAt: new Date().toISOString(),
    events: [...farm.events, event],
  };
}

export function deployDemoFarm(
  farm: Farm,
  risk: RiskLevel,
  projectedApy: number,
): Farm {
  return withEvent(
    {
      ...farm,
      source: "demo",
      status: "ACTIVE",
      step: 5,
      tvl: 0,
      apy: Math.max(0, Number(projectedApy.toFixed(2))),
      performance: 0,
      risk,
      values: {
        ...farm.values,
        demoPosition: 0,
        pauseControl: "manager",
      },
    },
    "Farm deployed in demo mode",
  );
}

export function canPauseFarm(farm: Farm) {
  return (
    farm.source === "demo" &&
    farm.values.pauseControl === "manager" &&
    (farm.status === "ACTIVE" || farm.status === "PAUSED")
  );
}

export function setFarmPaused(farm: Farm, paused: boolean): Farm {
  if (!canPauseFarm(farm))
    throw new Error("Pause controls are not available for this Farm.");
  return withEvent(
    { ...farm, status: paused ? "PAUSED" : "ACTIVE" },
    paused ? "Farm paused in demo mode" : "Farm resumed in demo mode",
  );
}

export function depositToDemoFarm(farm: Farm, amount: number): Farm {
  if (farm.source !== "demo" || farm.status !== "ACTIVE")
    throw new Error("Deposits are available only while this demo Farm is active.");
  if (!Number.isFinite(amount) || amount < 100)
    throw new Error("Enter a deposit of at least 100.");
  const capacity = Number(farm.values.capacity);
  if (Number.isFinite(capacity) && farm.tvl + amount > capacity)
    throw new Error("This deposit exceeds the Farm’s available capacity.");
  const position = Number(farm.values.demoPosition || 0);
  return withEvent(
    {
      ...farm,
      tvl: farm.tvl + amount,
      values: { ...farm.values, demoPosition: position + amount },
    },
    `Deposited ${amount.toLocaleString()} ${String(farm.values.asset)} in demo mode`,
  );
}

export function withdrawFromDemoFarm(farm: Farm, amount: number): Farm {
  if (farm.source !== "demo" || !["ACTIVE", "PAUSED"].includes(farm.status))
    throw new Error("Withdrawals are unavailable for this Farm.");
  const position = Number(farm.values.demoPosition || 0);
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Enter an amount greater than zero.");
  if (amount > position)
    throw new Error("The withdrawal exceeds your demo position.");
  return withEvent(
    {
      ...farm,
      tvl: Math.max(0, farm.tvl - amount),
      values: { ...farm.values, demoPosition: position - amount },
    },
    `Withdrew ${amount.toLocaleString()} ${String(farm.values.asset)} in demo mode`,
  );
}
