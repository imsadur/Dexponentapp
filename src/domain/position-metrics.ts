/**
 * Position metrics for the Positions page and the DTF detail page. Both pages must use
 * these functions so the same DTF shows the same numbers everywhere.
 *
 * Conventions:
 * - `null` means the input is missing (for example a failed NAV fetch). Missing values are
 *   excluded from totals and never treated as $0.
 * - Deposits and withdrawals are USD at transaction time.
 */

/** DTFs younger than this show return since launch instead of an annualised APY. */
export const YOUNG_DTF_DAYS = 90;

export type ReturnMetric = {
  kind: "apy" | "sinceLaunch";
  /** Percent. Null when the input is missing. */
  value: number | null;
  label: string;
};

const finite = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/** Annualising a short track record exaggerates both gains and losses, so young DTFs report plain return. */
export function returnMetric({ ageDays, apy, sinceLaunch }: { ageDays: number; apy: number | null; sinceLaunch: number | null }): ReturnMetric {
  if (ageDays < YOUNG_DTF_DAYS) return { kind: "sinceLaunch", value: finite(sinceLaunch) ? sinceLaunch : null, label: "Since launch" };
  return { kind: "apy", value: finite(apy) ? apy : null, label: "APY" };
}

/** sum(weight × value) ÷ sum(weight), skipping rows with a missing value or weight. Null when nothing qualifies. */
export function weightedAverage(rows: { weight: number | null; value: number | null }[]): number | null {
  let weight = 0;
  let total = 0;
  for (const row of rows) {
    if (!finite(row.weight) || !finite(row.value) || row.weight <= 0) continue;
    weight += row.weight;
    total += row.weight * row.value;
  }
  return weight > 0 ? total / weight : null;
}

/* ---------------------------------- LP ----------------------------------- */

export type LpPositionInput = {
  id: string;
  /** Current value (shares × NAV). Null when NAV is unavailable. */
  value: number | null;
  /** Remaining cost basis of the open position. */
  costBasis: number;
  /** Lifetime deposits and withdrawals in USD at transaction time. */
  deposited: number;
  withdrawn: number;
  claimed?: number;
  /** DTF 24h return in percent; null when unknown. */
  change24hPct: number | null;
  ret: ReturnMetric;
  /** Value that cannot be withdrawn right now (lock-in, cooldown, pending request). */
  lockedValue?: number;
};

export type LpPositionMetrics = LpPositionInput & {
  netDeposited: number;
  totalPnl: number | null;
  totalPnlPct: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number;
  change24hUsd: number | null;
  priceMissing: boolean;
  closed: boolean;
};

export function lpPositionMetrics(input: LpPositionInput): LpPositionMetrics {
  const claimed = input.claimed ?? 0;
  const priceMissing = input.value === null;
  const closed = !priceMissing && (input.value ?? 0) < 0.005 && input.costBasis < 0.005;
  const totalPnl = priceMissing ? null : input.value! + input.withdrawn + claimed - input.deposited;
  const unrealizedPnl = priceMissing ? null : input.value! - input.costBasis;
  // Realised P&L does not depend on the current price, so it is known even when NAV is missing.
  const realizedPnl = input.withdrawn + claimed - (input.deposited - input.costBasis);
  const r = input.change24hPct;
  const change24hUsd = priceMissing || !finite(r) || r <= -100 ? null : input.value! - input.value! / (1 + r / 100);
  return {
    ...input,
    netDeposited: input.deposited - input.withdrawn,
    totalPnl,
    // Always over gross deposits: net deposits can be zero or negative after large withdrawals.
    totalPnlPct: totalPnl === null || input.deposited <= 0 ? null : (totalPnl / input.deposited) * 100,
    unrealizedPnl,
    realizedPnl,
    change24hUsd,
    priceMissing,
    closed,
  };
}

export function lpSummary(rows: LpPositionMetrics[]) {
  const priced = rows.filter((r) => !r.priceMissing);
  const sum = (list: LpPositionMetrics[], pick: (r: LpPositionMetrics) => number) => list.reduce((s, r) => s + pick(r), 0);
  const value = sum(priced, (r) => r.value!);
  const deposited = sum(priced, (r) => r.deposited);
  const withdrawn = sum(priced, (r) => r.withdrawn);
  const totalPnl = sum(priced, (r) => r.totalPnl!);
  const change24h = sum(priced, (r) => r.change24hUsd ?? 0);
  const locked = sum(priced, (r) => Math.min(r.value!, r.lockedValue ?? 0));
  return {
    value,
    deposited,
    withdrawn,
    netDeposited: deposited - withdrawn,
    totalPnl,
    totalPnlPct: deposited > 0 ? (totalPnl / deposited) * 100 : null,
    realizedPnl: sum(priced, (r) => r.realizedPnl),
    unrealizedPnl: sum(priced, (r) => r.unrealizedPnl!),
    change24h,
    change24hPct: value - change24h > 0 ? (change24h / (value - change24h)) * 100 : null,
    withdrawable: value - locked,
    avgReturn: weightedAverage(priced.filter((r) => !r.closed).map((r) => ({ weight: r.value, value: r.ret.value }))),
    excluded: rows.length - priced.length,
    open: rows.filter((r) => !r.closed).length,
  };
}

/* -------------------------------- Manager -------------------------------- */

/**
 * Splits a change in TVL into LP flows and strategy performance.
 * Performance is the return earned on the starting balance; flows are the rest.
 */
export function splitTvlChange(before: number, after: number, returnPct: number) {
  const change = after - before;
  const performance = before * (returnPct / 100);
  return { change, performance, flows: change - performance };
}

/** Performance fee on positive yield only. With a high-water mark, pass yield above the mark. */
export const performanceFees = (yieldUsd: number, feePct: number) => Math.max(0, yieldUsd) * (Math.max(0, feePct) / 100);

export type ManagerRowInput = {
  id: string;
  tvl: number | null;
  ret: ReturnMetric;
  change24hPct: number | null;
  aumChange24h: { change: number; flows: number; performance: number } | null;
  netFlows30d: number | null;
  depositors: number;
  feesEarned: number;
  feesClaimed: number;
  /** Manager wallet's own LP value in this DTF. */
  stake: number;
};

export function managerSummary(rows: ManagerRowInput[]) {
  const priced = rows.filter((r) => finite(r.tvl));
  const sum = (pick: (r: ManagerRowInput) => number | null) => priced.reduce((s, r) => s + (pick(r) ?? 0), 0);
  const feesEarned = rows.reduce((s, r) => s + r.feesEarned, 0);
  const feesClaimed = rows.reduce((s, r) => s + r.feesClaimed, 0);
  return {
    aum: sum((r) => r.tvl),
    aumChange24h: sum((r) => r.aumChange24h?.change ?? 0),
    flows24h: sum((r) => r.aumChange24h?.flows ?? 0),
    performance24h: sum((r) => r.aumChange24h?.performance ?? 0),
    feesEarned,
    claimable: Math.max(0, feesEarned - feesClaimed),
    netFlows30d: sum((r) => r.netFlows30d),
    depositors: rows.reduce((s, r) => s + r.depositors, 0),
    weightedReturn: weightedAverage(priced.map((r) => ({ weight: r.tvl, value: r.ret.value }))),
    excluded: rows.length - priced.length,
  };
}

/** Largest depositor as a share of TVL, in percent. */
export function concentration(deposits: number[]) {
  const total = deposits.reduce((s, d) => s + Math.max(0, d), 0);
  if (total <= 0) return null;
  return (Math.max(...deposits) / total) * 100;
}
