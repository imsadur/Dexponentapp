/**
 * Builds Positions rows for the LP and Asset Manager views. The Positions page and the
 * DTF detail page both read from here, so a DTF shows the same value, P&L, TVL and fees
 * in both places. All inputs are simulated demo data.
 */
import { dtfFromFarm, dtfStats, type PublicDtf } from "./dtf";
import { flowsFor, heldDtfIds, isLocked, positionValueAt, type DtfPortfolio, type LedgerEntry } from "./dtf-portfolio";
import {
  concentration,
  lpPositionMetrics,
  performanceFees,
  returnMetric,
  splitTvlChange,
  type LpPositionMetrics,
  type ManagerRowInput,
} from "./position-metrics";
import type { Farm, FarmStatus } from "./strategy";

/** Farms a manager has taken past drafting. Drafts and simulations stay on the My DTFs page. */
export const MANAGED_STATUSES: FarmStatus[] = ["READY", "DEPLOYING", "ACTIVE", "PAUSED", "FAILED"];
export const isManagedFarm = (farm: Farm) => MANAGED_STATUSES.includes(farm.status);
const isLive = (farm: Farm) => farm.status === "ACTIVE" || farm.status === "PAUSED";

export type LpRow = LpPositionMetrics & {
  dtf: PublicDtf;
  nav: number | null;
  shares: number | null;
  lockedUntil?: string;
  /** The signed-in user also manages this DTF. */
  yourDtf: boolean;
  entries: LedgerEntry[];
  /** Your value as a share of the DTF's TVL, percent. */
  shareOfDtf: number | null;
};

export function dtfReturn(dtf: PublicDtf, now: number) {
  const stats = dtfStats(dtf, now);
  return returnMetric({ ageDays: stats.ageDays, apy: dtf.apy7d, sinceLaunch: stats.sinceLaunchPct });
}

export function lpRow(dtf: PublicDtf, portfolio: DtfPortfolio, now: number, managedFarmIds: Set<string>): LpRow {
  const stats = dtfStats(dtf, now);
  const position = portfolio.positions[dtf.id];
  const value = position ? positionValueAt(position, dtf.apy7d, now, stats.nav) : 0;
  const flows = flowsFor(portfolio, dtf.id);
  const locked = isLocked(position, now);
  const metrics = lpPositionMetrics({
    id: dtf.id,
    value,
    costBasis: position?.costBasis ?? 0,
    deposited: flows.deposited,
    withdrawn: flows.withdrawn,
    change24hPct: stats.change24hPct,
    ret: dtfReturn(dtf, now),
    lockedValue: locked && value !== null ? value : 0,
  });
  const shares = position?.shares ?? (value !== null && stats.nav ? value / stats.nav : null);
  return {
    ...metrics,
    dtf,
    nav: stats.nav,
    shares: position ? shares : 0,
    lockedUntil: locked ? position?.lockedUntil : undefined,
    yourDtf: Boolean(dtf.farmId && managedFarmIds.has(dtf.farmId)),
    entries: flows.entries,
    shareOfDtf: value !== null && dtf.tvl > 0 ? (value / dtf.tvl) * 100 : null,
  };
}

/** One row per DTF the user has ever held. Closed positions are included and flagged `closed`. */
export function lpRows(portfolio: DtfPortfolio, directory: PublicDtf[], now: number, managedFarmIds: Set<string>): LpRow[] {
  const byId = new Map(directory.map((d) => [d.id, d]));
  return heldDtfIds(portfolio)
    .map((id) => byId.get(id))
    .filter((d): d is PublicDtf => Boolean(d))
    .map((dtf) => lpRow(dtf, portfolio, now, managedFarmIds))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}

export type ManagerRow = ManagerRowInput & {
  farm: Farm;
  dtf: PublicDtf;
  live: boolean;
  feeRate: number;
  /** Yield earned for LPs since launch (positive or negative), USD. Null until the DTF is live. */
  yieldGenerated: number | null;
  /** Largest depositor's share of TVL, percent. */
  topDepositorPct: number | null;
};

export function managerRow(farm: Farm, managerName: string, portfolio: DtfPortfolio, now: number): ManagerRow {
  const dtf = dtfFromFarm(farm, managerName);
  const live = isLive(farm);
  const stats = live ? dtfStats(dtf, now) : null;
  const position = portfolio.positions[dtf.id];
  const stake = position && stats ? positionValueAt(position, dtf.apy7d, now, stats.nav) ?? 0 : 0;
  let netFlows30d: number | null = null;
  if (stats)
    netFlows30d =
      stats.tvl30dAgo > 0
        ? splitTvlChange(stats.tvl30dAgo, stats.tvl, stats.return30dPct).flows
        : stats.tvl - stats.yieldGenerated; // launched within 30 days: everything not earned came in as deposits
  return {
    id: dtf.id,
    farm,
    dtf,
    live,
    tvl: stats ? stats.tvl : null,
    ret: live ? dtfReturn(dtf, now) : { kind: "sinceLaunch", value: null, label: "Since launch" },
    change24hPct: stats?.change24hPct ?? null,
    aumChange24h: stats && stats.tvl24hAgo > 0 ? splitTvlChange(stats.tvl24hAgo, stats.tvl, stats.change24hPct ?? 0) : null,
    netFlows30d,
    depositors: live ? dtf.lps : 0,
    feesEarned: stats ? performanceFees(stats.yieldGenerated, dtf.performanceFee) : 0,
    // TODO(backend): fees claimed per DTF. Nothing can be claimed in the demo, so claimed is zero.
    feesClaimed: 0,
    stake,
    feeRate: dtf.performanceFee,
    yieldGenerated: stats ? stats.yieldGenerated : null,
    topDepositorPct: concentration((farm.lpPositions ?? []).map((p) => p.depositedUsd)),
  };
}

export function managerRows(farms: Farm[], managerName: string, portfolio: DtfPortfolio, now: number, network = "All Chains") {
  return farms
    .filter((farm) => isManagedFarm(farm) && (network === "All Chains" || farm.network === network))
    .map((farm) => managerRow(farm, managerName, portfolio, now))
    .sort((a, b) => (b.tvl ?? -1) - (a.tvl ?? -1));
}
