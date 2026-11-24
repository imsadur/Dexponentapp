"use client";
import { ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react";
import { ageInDays, dtfUtilization, targetPace24h, type PublicDtf } from "@/domain/dtf";
import type { StrategyType } from "@/domain/strategy";
import { useApp } from "./provider";
import { AssetIcon } from "./ui";

export const typeLabel: Record<StrategyType, string> = { INDEX: "Index", SPOT: "Spot", PERPETUAL: "Perpetual" };

export const signedPct = (value: number, digits = 2) => `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;

export const usd = (value: number, digits = 2) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });

export const signedUsd = (value: number) => `${value < 0 ? "−" : "+"}${usd(Math.abs(value))}`;

export const tokenAmount = (value: number, asset: string) =>
  `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${asset}`;

export function DtfLogo({ dtf, size = "md" }: { dtf: PublicDtf; size?: "sm" | "md" | "lg" }) {
  const app = useApp();
  const icon = dtf.farmId ? app.farms.find((farm) => farm.id === dtf.farmId)?.icon : undefined;
  return (
    <span className={`dtf-logo ${dtf.type.toLowerCase()} ${size} ${icon ? "has-img" : ""}`}>
      {icon ? <img src={icon} alt="" /> : <span className="dtf-monogram" aria-hidden="true">{dtf.symbol.slice(0, dtf.symbol.length > 3 ? 2 : 3)}</span>}
    </span>
  );
}

export function AssetStack({ assets, max = 5, size = 22 }: { assets: string[]; max?: number; size?: number }) {
  const extra = assets.length - max;
  return (
    <span className="dtf-assets" aria-label={`Holdings: ${assets.join(", ")}`}>
      {assets.slice(0, max).map((asset) => <AssetIcon key={asset} symbol={asset} size={size} />)}
      {extra > 0 && <span className="dtf-assets-more">+{extra}</span>}
    </span>
  );
}

/** 7D APY, or a clear "new" state while there is less than a week of history. */
export function Apy7d({ apy, className = "" }: { apy: number | null; className?: string }) {
  if (apy === null)
    return <span className={`dtf-apy new ${className}`} title="Less than 7 days of history">New</span>;
  return <span className={`dtf-apy ${apy < 0 ? "negative" : "positive"} ${className}`}>{apy.toFixed(2)}%</span>;
}

export const daysLabel = (days: number) => (days < 1 ? "Under 1 day" : `${days} day${days === 1 ? "" : "s"}`);

/** How old the DTF is: days since its launch date. */
export function DtfAge({ launchedAt, now }: { launchedAt: string; now?: number }) {
  const launched = new Date(`${launchedAt}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return (
    <span className="dtf-age" title={`Launched ${launched}`}>
      {daysLabel(ageInDays(launchedAt, now))}
    </span>
  );
}

/** Signed 24H return with an arrow, so direction is not shown by colour alone. */
export function Return24h({ value, className = "" }: { value: number; className?: string }) {
  const down = value < 0;
  const Icon = down ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={`dtf-return ${down ? "negative" : "positive"} ${className}`}>
      <Icon size={14} weight="bold" aria-hidden="true" />
      {signedPct(value)}
    </span>
  );
}

/** Compares a 24H return with the 24H return needed to stay on the target APR. */
export function TargetPace({ ret, targetApr }: { ret: number; targetApr: number }) {
  const pace = targetPace24h(targetApr);
  const ahead = ret >= pace;
  return (
    <span className={`dtf-pace ${ahead ? "ahead" : "behind"}`} title={`Target pace: ${signedPct(pace, 3)} per day`}>
      {ahead ? "Above" : "Below"} target pace
    </span>
  );
}

/** Share of deposits the manager has deployed, with a marker at the most it may deploy (100% − buffer). */
export function UtilizationBar({ dtf, compact = false }: { dtf: Pick<PublicDtf, "id" | "bufferPct">; compact?: boolean }) {
  const used = dtfUtilization(dtf);
  const max = 100 - dtf.bufferPct;
  return (
    <div className={`dtf-util ${compact ? "compact" : ""}`}>
      <div
        className="dtf-util-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(used)}
        aria-label={`${Math.round(used)}% of deposits utilized, ${dtf.bufferPct}% minimum buffer`}
      >
        <i style={{ width: `${Math.max(2, used)}%` }} />
        <b style={{ left: `${max}%` }} aria-hidden="true" />
      </div>
      {!compact && (
        <span>
          <strong>{Math.round(used)}% utilized</strong>
          <span>Buffer {dtf.bufferPct}%</span>
        </span>
      )}
    </div>
  );
}
