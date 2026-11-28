"use client";
import { ArrowRight, CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatUsdCompact } from "@/domain/format";
import { makeFarm, type Field, type StrategyTemplate, type StrategyType } from "@/domain/strategy";
import { typeLabel } from "./dtf-shared";
import { AssetIcon, AssetList, StrategyFlow } from "./ui";

/**
 * Template detail: what a template sets up before the manager touches anything.
 * Header (breadcrumb, name, type · complexity, primary action), a stats strip with the template's
 * defining numbers, the full configuration grouped by purpose, and the live strategy flow.
 * Everything is read from the template itself, so each template shows its own assets, venue,
 * allocations and defaults.
 */

type Section = { title: string; keys: string[] };

/**
 * The four groups shown under the Allocation table (a 2×2 grid). What the table already says
 * (basket weights, pool share, position legs) is left out of the groups. Missing keys are skipped.
 */
const SECTIONS: Record<StrategyType, Section[]> = {
  INDEX: [
    { title: "Basics", keys: ["name", "description", "visibility", "capacity"] },
    { title: "Market", keys: ["asset", "protocol", "allocationMethod", "rebalance"] },
    { title: "Weight limits", keys: ["minWeight", "maxWeight"] },
    { title: "Fees", keys: ["managementFee", "performanceFee", "assumedApr"] },
  ],
  SPOT: [
    { title: "Basics", keys: ["name", "description", "visibility", "capacity"] },
    { title: "Market", keys: ["asset", "protocol", "pool", "strategy"] },
    { title: "Yield & limits", keys: ["minApy", "harvest", "rebalanceThreshold", "slippage", "maxExposure"] },
    { title: "Fees", keys: ["managementFee", "performanceFee", "assumedApr"] },
  ],
  PERPETUAL: [
    { title: "Basics", keys: ["name", "description", "visibility", "capacity", "asset"] },
    { title: "Position", keys: ["direction", "leverage", "margin", "quoteAsset", "entry", "exit"] },
    { title: "Controls", keys: ["fundingThreshold", "stopLoss", "takeProfit", "maxDrawdown", "rebalanceThreshold"] },
    { title: "Fees", keys: ["managementFee", "performanceFee", "assumedApr"] },
  ],
};

type AllocationRow = { id: string; asset: string; label: string; venue: string; share: number };

/**
 * Where a deposit goes under this template's defaults:
 * - Index: the basket at its target weights.
 * - Spot: the pool at the capital allocation, the rest kept idle in the DTF contract.
 * - Perpetual: the position legs. Delta neutral holds spot and posts margin for an equal short,
 *   so at L× leverage spot is L / (L + 1) of capital and margin 1 / (L + 1). Directional
 *   templates post all capital as margin.
 */
function allocationRows(t: StrategyTemplate): AllocationRow[] {
  const d = t.defaults;
  if (t.type === "INDEX")
    return (t.allocations ?? []).map((a) => ({ id: a.asset, asset: a.asset, label: a.asset, venue: String(d.protocol), share: a.weight }));
  if (t.type === "SPOT") {
    const deployed = Math.min(100, Math.max(0, Number(d.allocation) || 0));
    const rows: AllocationRow[] = [{ id: "pool", asset: String(d.asset), label: String(d.pool), venue: `${d.protocol} · ${d.strategy}`, share: deployed }];
    if (deployed < 100) rows.push({ id: "idle", asset: String(d.asset), label: "Idle capital", venue: "DTF contract", share: 100 - deployed });
    return rows;
  }
  const leverage = Math.max(1, Number(d.leverage) || 1);
  const underlying = String(d.underlying);
  const venue = String(d.venue);
  if (d.direction === "Delta Neutral") {
    const spot = (leverage / (leverage + 1)) * 100;
    return [
      { id: "spot", asset: underlying, label: `${underlying} spot · long`, venue: "Held by the DTF", share: spot },
      { id: "perp", asset: underlying, label: `${underlying} perp · short`, venue: `${venue} · ${num(leverage)}× margin`, share: 100 - spot },
    ];
  }
  return [{ id: "perp", asset: underlying, label: `${underlying} perp · ${String(d.direction).toLowerCase()}`, venue: `${venue} · ${num(leverage)}× margin`, share: 100 }];
}

function AllocationTable({ t }: { t: StrategyTemplate }) {
  const rows = allocationRows(t);
  if (!rows.length) return null;
  return (
    <section className="tpl-allocation" aria-label="Allocation">
      <div className="dtfd-table-wrap">
        <table className="dtfd-table">
          <thead>
            <tr>
              <th scope="col">Allocation</th>
              <th scope="col" className="numeric">Target share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="dtfd-market">
                    <AssetIcon symbol={row.asset} size={26} />
                    <span>
                      <strong>{row.label}</strong>
                      <small>{row.venue}</small>
                    </span>
                  </span>
                </td>
                <td className="numeric">
                  <span className="dtfd-share">
                    <strong>{`${num(Math.round(row.share * 10) / 10)}%`}</strong>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Shorter row labels where the builder's label is long. */
const SHORT_LABEL: Record<string, string> = {
  assumedApr: "Assumed gross return",
  rebalanceThreshold: "Rebalance threshold",
  maxExposure: "Max protocol exposure",
};

/** Fields the manager always fills in: shown as a prompt, not the template's placeholder text. */
const YOURS: Record<string, string> = { name: "Your DTF name", description: "One line on the strategy" };

const num = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

function formatValue(field: Field, value: string | number | undefined): string {
  if (value === undefined || value === "") return "—";
  if (typeof value !== "number") return String(value);
  switch (field.unit) {
    case "USD":
      return formatUsdCompact(value);
    case "USDC":
      return `${num(value)} USDC`;
    case "×":
      return `${num(value)}×`;
    case "%":
      return `${num(value)}%`;
    case undefined:
    case "":
      return num(value);
    default:
      return `${num(value)}${field.unit.startsWith("%") ? "" : " "}${field.unit}`;
  }
}

/** The one number that best describes each type, for the stats strip. */
function keyStat(t: StrategyTemplate): { label: string; value: string } {
  const d = t.defaults;
  if (t.type === "INDEX") return { label: "Rebalance", value: String(d.rebalance) };
  if (t.type === "SPOT") return { label: "Strategy", value: String(d.strategy) };
  return { label: "Leverage", value: `${d.leverage}×` };
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

export function TemplateDetail({ t }: { t: StrategyTemplate }) {
  const fields = new Map(t.fields.map((f) => [f.key, f]));
  const venue = t.type === "PERPETUAL" ? String(t.defaults.venue) : t.protocols.join(", ");
  const stat = keyStat(t);

  const rows = (keys: string[]) =>
    keys
      .map((key) => fields.get(key))
      .filter((f): f is Field => Boolean(f))
      .map((f) => (
        <div key={f.key}>
          <dt>{SHORT_LABEL[f.key] ?? f.label}</dt>
          <dd className={YOURS[f.key] ? "tpl-yours" : undefined}>{YOURS[f.key] ?? formatValue(f, t.defaults[f.key])}</dd>
        </div>
      ));

  return (
    <div className="tpl-detail">
      <nav className="tpl-crumbs" aria-label="Breadcrumb">
        <Link href="/app/templates/">DTF Templates</Link>
        <CaretRight size={11} aria-hidden="true" />
        <span aria-current="page">{t.name}</span>
      </nav>

      <header className="tpl-head">
        <div>
          <h1>{t.name}</h1>
          <p>{t.description}</p>
          <div className="tpl-meta">
            <span className={`dtf-type ${t.type.toLowerCase()}`}>{typeLabel[t.type]}</span>
            <span aria-hidden="true">·</span>
            <span>{t.complexity}</span>
          </div>
        </div>
        <Link className="button primary" href={`/app/farms/new?template=${t.id}`}>
          Start from template <ArrowRight size={16} />
        </Link>
      </header>

      <section className="overview-metrics capital-metrics positions-metrics tpl-stats" aria-label="Template at a glance">
        <Stat label="Assets">
          <AssetList symbols={t.assets} size={18} />
        </Stat>
        <Stat label={t.type === "PERPETUAL" ? "Venue" : "Protocol"}>{venue}</Stat>
        <Stat label="Networks">{t.networks.join(", ")}</Stat>
        <Stat label={stat.label}>{stat.value}</Stat>
        <Stat label="Management fee">{`${num(Number(t.defaults.managementFee))}%`}</Stat>
      </section>

      <div className="tpl-body">
        {/* Configuration: one card per group, the same cards as the DTF details page. */}
        <section className="tpl-config" aria-labelledby="tpl-config-title">
          <div className="tpl-section-head">
            <h2 id="tpl-config-title">Configuration</h2>
            <p>Template defaults · you can change any of them in the builder</p>
          </div>
          <AllocationTable t={t} />
          <div className="dtfd-groups">
            {SECTIONS[t.type].map((section) => (
              <section className="dtfd-group" key={section.title}>
                <h3>{section.title}</h3>
                <dl>{rows(section.keys)}</dl>
              </section>
            ))}
          </div>
        </section>

        <aside className="tpl-side" aria-labelledby="tpl-flow-title">
          <div className="tpl-section-head">
            <h2 id="tpl-flow-title">Strategy flow</h2>
          </div>
          <div className="tpl-flow-card">
            <StrategyFlow type={t.type} values={t.defaults} allocations={makeFarm(t, "preview").allocations} />
            <p className="tpl-note">Templates are starting points you can change before you launch.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
