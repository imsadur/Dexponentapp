"use client";
import { useId } from "react";
import { ageInDays, dtfUtilization, targetPace24h, type PublicDtf } from "@/domain/dtf";
import { formatPct, formatSignedPct, MISSING, toneOf } from "@/domain/format";
import type { ReturnMetric } from "@/domain/position-metrics";
import type { StrategyType } from "@/domain/strategy";
import { useApp } from "./provider";
import { AssetIcon } from "./ui";

export const typeLabel: Record<StrategyType, string> = { INDEX: "Index", SPOT: "Spot", PERPETUAL: "Perpetual" };

export const signedPct = (value: number, digits = 2) => `${value > 0 ? "+" : value < 0 && Number(Math.abs(value).toFixed(digits)) !== 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}%`;

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

/** "APY" for DTFs 90+ days old, "Return since launch" for younger ones. */
export const returnLabel = (ret: ReturnMetric) => (ret.kind === "apy" ? "APY" : "Return since launch");

/** Headline return (APY, or signed return since launch) with the last 24h change beside it. */
export function ReturnFigure({ ret, change24h }: { ret: ReturnMetric; change24h: number | null }) {
  const main = ret.value === null ? MISSING : ret.kind === "apy" ? formatPct(ret.value) : formatSignedPct(ret.value);
  return (
    <span className="dtf-retfig">
      <strong className={ret.kind === "apy" ? "" : toneOf(ret.value) ?? ""}>{main}</strong>
      {change24h !== null && (
        <small className={toneOf(change24h) ?? ""} aria-label={`${formatSignedPct(change24h)} in the last 24 hours`}>
          {formatSignedPct(change24h)} <span>24h</span>
        </small>
      )}
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
  const tipId = useId();
  return (
    <div className={`dtf-util ${compact ? "compact" : ""}`}>
      <span className="dtf-util-hit" tabIndex={0} aria-describedby={tipId}>
        <span
          className="dtf-util-track"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(used)}
          aria-label={`${Math.round(used)}% of deposits utilized`}
        >
          <i style={{ width: `${Math.max(2, used)}%` }} />
          <b style={{ left: `${max}%` }} aria-hidden="true" />
        </span>
        <span className="dtf-util-tip" role="tooltip" id={tipId}>
          Share of deposits the manager has put to work. At least {dtf.bufferPct}% stays idle for withdrawals.
        </span>
      </span>
      {!compact && (
        <span className="dtf-util-legend">
          <strong>{Math.round(used)}% utilized</strong>
          <span>Buffer {dtf.bufferPct}%</span>
        </span>
      )}
    </div>
  );
}
