"use client";
import { ArrowClockwise, ArrowRight, Compass, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { dtfDirectory, filterDtfs, sortDtfs, type PublicDtf } from "@/domain/dtf";
import {
  formatDate,
  formatPct,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  formatUsdPrecise,
  MISSING,
  toneOf,
} from "@/domain/format";
import { lpSummary, type ReturnMetric } from "@/domain/position-metrics";
import { isManagedFarm, lpRows, managerRows, type LpRow } from "@/domain/positions";
import { strategyHref } from "@/domain/routes";
import type { StrategyType } from "@/domain/strategy";
import { DtfLogo, typeLabel } from "./dtf-shared";
import { useApp } from "./provider";
import { useDtfPortfolio } from "./use-dtf-portfolio";
import { Metric, NetworkIcon, PageHeading, Tip } from "./ui";

type TypeFilter = StrategyType | "ALL";

/** Search and type filters only earn their space once a list is long. */
const FILTER_THRESHOLD = 8;
const SMALL_BALANCE = 1;

const typeFilters: TypeFilter[] = ["ALL", "PERPETUAL", "SPOT", "INDEX"];
const typeFilterLabel: Record<TypeFilter, string> = { ALL: "All types", PERPETUAL: "Perp", SPOT: "Spot", INDEX: "Index" };
const shortDate = (iso: string) => formatDate(iso);
export const positionsDetailHref = (id: string, view: "position" | "manage", extra = "") =>
  `${strategyHref(id)}&view=${view}&from=${view === "manage" ? "manager" : "lp"}${extra}`;
const matches = (dtf: Pick<PublicDtf, "name" | "symbol" | "type">, type: TypeFilter, query: string) => {
  const q = query.trim().replace(/^\$/, "").toLowerCase();
  return (type === "ALL" || dtf.type === type) && (!q || dtf.name.toLowerCase().includes(q) || dtf.symbol.toLowerCase().includes(q));
};

/** Positions data and the roles the signed-in user plays. */
export function usePortfolioRoles(network: string) {
  const app = useApp();
  const { portfolio, signedIn, loaded } = useDtfPortfolio();
  const [now, setNow] = useState(() => Date.now());
  const managedIds = useMemo(() => new Set(app.farms.filter(isManagedFarm).map((f) => f.id)), [app.farms]);
  const directory = useMemo(() => filterDtfs(dtfDirectory(app.farms, app.profile.name), { network }), [app.farms, app.profile.name, network]);
  const lp = useMemo(() => lpRows(portfolio, directory, now, managedIds), [portfolio, directory, now, managedIds]);
  const managed = useMemo(() => managerRows(app.farms, app.profile.name, portfolio, now, network), [app.farms, app.profile.name, portfolio, now, network]);
  return {
    ready: app.ready && loaded,
    signedIn,
    isLP: lp.length > 0,
    isManager: managed.length > 0,
    lp,
    managed,
    directory,
    now,
    refresh: () => setNow(Date.now()),
  };
}

/** Investor view: the signed-in user's DTF holdings. Manager figures live on Overview and Analytics. */
export function Positions({ network }: { network: string }) {
  const data = usePortfolioRoles(network);
  if (!data.ready) return <PositionsSkeleton />;
  return (
    <div className="positions-page">
      <PageHeading
        title="Positions"
        description="Your DTF holdings"
        action={
          <Link className="button primary" href="/app/strategies/">
            <Compass size={16} /> Explore DTFs
          </Link>
        }
      />
      <LpView rows={data.lp} directory={data.directory} now={data.now} signedIn={data.signedIn} />
      <PricesUpdated at={data.now} onRefresh={data.refresh} />
    </div>
  );
}

/* --------------------------------- States --------------------------------- */

function PositionsSkeleton() {
  return (
    <div className="positions-page" aria-busy="true" aria-label="Loading positions">
      <PageHeading title="Positions" />
      <div className="positions-skeleton">
        <div className="skeleton positions-skeleton-cards" />
        <div className="skeleton positions-skeleton-table" />
      </div>
    </div>
  );
}

function PricesUpdated({ at, onRefresh }: { at: number; onRefresh: () => void }) {
  const [clock, setClock] = useState(at);
  useEffect(() => {
    setClock(Date.now());
    const id = window.setInterval(() => setClock(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, [at]);
  const seconds = Math.max(0, Math.round((clock - at) / 1000));
  const stale = seconds > 300;
  const ago = seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
  return (
    <p className={`positions-updated ${stale ? "stale" : ""}`}>
      {stale && <WarningCircle size={13} aria-hidden="true" />}
      Updated {ago}
      {stale && " · may be out of date"}
      <button className="text-link" onClick={onRefresh}>
        <ArrowClockwise size={12} /> Refresh
      </button>
    </p>
  );
}

/* --------------------------------- Shared --------------------------------- */

function Toolbar({ type, setType, query, setQuery, label }: { type: TypeFilter; setType: (t: TypeFilter) => void; query: string; setQuery: (q: string) => void; label: string }) {
  return (
    <div className="dtf-toolbar positions-toolbar">
      <div className="dtf-segment" role="group" aria-label="Filter by strategy type">
        {typeFilters.map((value) => (
          <button key={value} aria-pressed={type === value} onClick={() => setType(value)}>
            {typeFilterLabel[value]}
          </button>
        ))}
      </div>
      <label className="dtf-search">
        <MagnifyingGlass size={16} />
        <span className="sr-only">{label}</span>
        <input type="search" placeholder="Search name or $ticker" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
    </div>
  );
}

function DtfCell({ dtf, href, children }: { dtf: PublicDtf; href: string; children?: ReactNode }) {
  return (
    <span className="farm-name positions-dtf">
      <DtfLogo dtf={dtf} />
      <span>
        <Link href={href} onClick={(event) => event.stopPropagation()}>
          <strong>{dtf.name}</strong>
        </Link>
        <small>
          <span className={`strategy-tag ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span>
          <span className="dtf-ticker">${dtf.symbol}</span>
          <span className="positions-chain" title={dtf.network}>
            <NetworkIcon network={dtf.network} size={12} />
            <span className="sr-only">{dtf.network}</span>
          </span>
          {children}
        </small>
      </span>
    </span>
  );
}

export function Signed({ value, compact = false }: { value: number | null; compact?: boolean }) {
  if (value === null) return <Missing />;
  return <span className={toneOf(value) ?? ""}>{formatSignedUsd(value, compact)}</span>;
}

export function Pct({ value }: { value: number | null }) {
  if (value === null) return <Missing />;
  return <span className={toneOf(value) ?? ""}>{formatSignedPct(value)}</span>;
}

export function Missing({ why = "Price unavailable" }: { why?: string }) {
  return (
    <Tip tip={why} className="muted">
      {MISSING}
    </Tip>
  );
}

export function ReturnCell({ ret }: { ret: ReturnMetric }) {
  if (ret.value === null) return <Missing why="Not enough history" />;
  return (
    <Tip tip={ret.kind === "apy" ? "Annualised from the trailing 7 days" : "Not annualised: this DTF is under 90 days old"}>
      <span className="positions-stack">
        <span className={ret.kind === "apy" ? "" : toneOf(ret.value) ?? ""}>{ret.kind === "apy" ? formatPct(ret.value) : formatSignedPct(ret.value)}</span>
        <small>{ret.kind === "apy" ? "APY" : "since launch"}</small>
      </span>
    </Tip>
  );
}

/* ----------------------------------- LP ----------------------------------- */

function LpView({ rows, directory, now, signedIn }: { rows: LpRow[]; directory: PublicDtf[]; now: number; signedIn: boolean }) {
  const router = useRouter();
  const [type, setType] = useState<TypeFilter>("ALL");
  const [query, setQuery] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [hideSmall, setHideSmall] = useState(false);

  const summary = lpSummary(rows);
  const empty = rows.length === 0;
  const open = rows.filter((r) => !r.closed);
  const closedCount = rows.length - open.length;
  const base = (showClosed ? rows : open).filter((r) => !hideSmall || r.closed || r.value === null || r.value >= SMALL_BALANCE);
  const filtered = open.length > FILTER_THRESHOLD;
  const shown = filtered ? base.filter((r) => matches(r.dtf, type, query)) : base;
  const withdrawableDiffers = Math.abs(summary.withdrawable - summary.value) >= 0.005;
  const nextUnlock = open.filter((r) => r.lockedUntil).sort((a, b) => Date.parse(a.lockedUntil!) - Date.parse(b.lockedUntil!))[0];

  return (
    <section id="dtf-positions" className="positions-section" aria-label="Your DTF holdings">
      {summary.excluded > 0 && (
        <p className="positions-warning" role="status">
          <WarningCircle size={14} /> {summary.excluded} position{summary.excluded === 1 ? "" : "s"} excluded: price unavailable
        </p>
      )}
      <div className="overview-metrics capital-metrics positions-metrics">
        <Metric
          label="Portfolio value"
          value={formatUsd(summary.value)}
          hint="Sum of shares × NAV per share across open positions. Positions without a price are left out."
          caption={
            <>
              <Signed value={summary.change24h} /> (<Pct value={summary.change24hPct ?? (empty ? 0 : null)} />) 24h
              {withdrawableDiffers && (
                <span className="positions-sub">
                  {formatUsd(summary.withdrawable)} withdrawable{nextUnlock ? ` · rest unlocks ${shortDate(nextUnlock.lockedUntil!)}` : ""}
                </span>
              )}
            </>
          }
        />
        <Metric
          label="Net deposited"
          value={formatUsd(summary.netDeposited)}
          hint={`Deposited ${formatUsd(summary.deposited)} − withdrawn ${formatUsd(summary.withdrawn)}, in USD at the time of each transaction.`}
          caption={`${formatUsd(summary.deposited)} in · ${formatUsd(summary.withdrawn)} out`}
        />
        <Metric
          label="Total P&L"
          value={`${formatSignedUsd(summary.totalPnl)} · ${formatSignedPct(summary.totalPnlPct ?? 0, 1)}`}
          tone={toneOf(summary.totalPnl)}
          hint={`Value + withdrawn − deposited. The % is over total deposits. Realised ${formatSignedUsd(summary.realizedPnl)}, unrealised ${formatSignedUsd(summary.unrealizedPnl)}.`}
          caption={`Realised ${formatSignedUsd(summary.realizedPnl)} · unrealised ${formatSignedUsd(summary.unrealizedPnl)}`}
        />
        <Metric
          label="Avg return"
          value={summary.avgReturn === null ? (empty ? formatPct(0) : MISSING) : formatPct(summary.avgReturn)}
          tone={summary.avgReturn !== null && summary.avgReturn < 0 ? "negative" : undefined}
          hint="Value-weighted. APY for DTFs 90+ days old; return since launch (not annualised) for younger DTFs."
          caption="value-weighted · APY or since launch"
        />
      </div>

      <div className="positions-table-head">
        <h2>
          Positions <span className="muted">({open.length})</span>
        </h2>
        {!empty && <div className="positions-toggles">
          {closedCount > 0 && (
            <label>
              <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show closed positions ({closedCount})
            </label>
          )}
          <label>
            <input type="checkbox" checked={hideSmall} onChange={(e) => setHideSmall(e.target.checked)} /> Hide small balances (&lt; $1)
          </label>
        </div>}
      </div>
      {filtered && <Toolbar type={type} setType={setType} query={query} setQuery={setQuery} label="Search your positions" />}

      {empty ? (
        <DepositNudge directory={directory} now={now} signedIn={signedIn} />
      ) : !shown.length ? (
        <div className="empty-state positions-nomatch">
          <h3>No positions match</h3>
          <p>Try another filter, or show small balances again.</p>
          <button
            className="button"
            onClick={() => {
              setType("ALL");
              setQuery("");
              setHideSmall(false);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="farm-table-wrap positions-table-wrap">
          <table className="farm-table positions-table">
            <thead>
              <tr>
                <th scope="col">DTF</th>
                <th scope="col" className="numeric">Value</th>
                <th scope="col" className="numeric">Net deposited</th>
                <th scope="col" className="numeric">P&amp;L</th>
                <th scope="col" className="numeric">24h</th>
                <th scope="col" className="numeric">APY / Return</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const href = positionsDetailHref(r.dtf.id, "position");
                return (
                  <tr key={r.dtf.id} className={r.closed ? "closed" : ""} onClick={() => router.push(href)}>
                    <td data-label="DTF">
                      <DtfCell dtf={r.dtf} href={href}>
                        {r.yourDtf && <span className="positions-pill own">Your DTF</span>}
                        {r.closed && <span className="positions-pill">Closed</span>}
                        {r.lockedUntil && <span className="positions-pill amber">Locked until {shortDate(r.lockedUntil)}</span>}
                      </DtfCell>
                    </td>
                    <td className="numeric" data-label="Value">
                      {r.value === null ? (
                        <Missing />
                      ) : (
                        <Tip
                          tip={
                            r.shares !== null && r.nav !== null && !r.closed
                              ? `${r.shares.toLocaleString("en-US", { maximumFractionDigits: 6 })} shares × ${formatUsdPrecise(r.nav)} NAV = ${formatUsdPrecise(r.value)}`
                              : formatUsdPrecise(r.value)
                          }
                        >
                          {formatUsd(r.value)}
                        </Tip>
                      )}
                    </td>
                    <td className="numeric" data-label="Net deposited">
                      {formatUsd(r.netDeposited)}
                    </td>
                    <td className="numeric" data-label="P&L">
                      {r.totalPnl === null ? (
                        <Missing />
                      ) : (
                        <Tip tip={`Realised ${formatSignedUsd(r.realizedPnl)} · unrealised ${formatSignedUsd(r.unrealizedPnl)}`}>
                          <span className={`positions-stack ${toneOf(r.totalPnl) ?? ""}`}>
                            {formatSignedUsd(r.totalPnl)}
                            <small>{formatSignedPct(r.totalPnlPct)}</small>
                          </span>
                        </Tip>
                      )}
                    </td>
                    <td className="numeric" data-label="24h">
                      {r.closed ? <span className="muted">{MISSING}</span> : <Pct value={r.change24hPct} />}
                    </td>
                    <td className="numeric" data-label="APY / Return">
                      <ReturnCell ret={r.ret} />
                    </td>
                    <td className="positions-actions">
                      <Link className="button small" href={positionsDetailHref(r.dtf.id, "position", "&action=deposit")} onClick={(e) => e.stopPropagation()}>
                        Deposit
                      </Link>
                      {!r.closed && (
                        <Link className="button small" href={positionsDetailHref(r.dtf.id, "position", "&action=withdraw")} onClick={(e) => e.stopPropagation()}>
                          Withdraw
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Empty LP state: same page structure, with a nudge toward any DTF (not only ones you manage). */
function DepositNudge({ directory, now, signedIn }: { directory: PublicDtf[]; now: number; signedIn: boolean }) {
  // Suggest DTFs from other managers.
  const picks = useMemo(() => sortDtfs(directory.filter((d) => !d.farmId), "trending", now).slice(0, 3), [directory, now]);
  const href = (id: string) => (signedIn ? positionsDetailHref(id, "position", "&action=deposit") : `/login/?next=${encodeURIComponent(strategyHref(id))}`);
  return (
    <div className="positions-nudge">
      <div className="positions-nudge-copy">
        <h3>No positions yet</h3>
        <p>Deposit into a DTF to see its value, P&amp;L and return here.</p>
        <Link className="button primary" href={signedIn ? "/app/strategies/" : "/login/?next=%2Fapp%2Fpositions%2F"}>
          {signedIn ? "Explore DTFs" : "Sign in to deposit"} <ArrowRight size={15} />
        </Link>
      </div>
      {picks.length > 0 && (
        <ul className="positions-nudge-picks" aria-label="Popular DTFs">
          {picks.map((dtf) => (
            <li key={dtf.id}>
              <Link href={href(dtf.id)}>
                <DtfLogo dtf={dtf} size="sm" />
                <span>
                  <strong>{dtf.name}</strong>
                  <small>
                    ${dtf.symbol} · {typeLabel[dtf.type]}
                  </small>
                </span>
                <span className="positions-preview-stat">
                  <small>Target APR</small>
                  <strong>{formatPct(dtf.targetApr)}</strong>
                </span>
                <span className="button small">Deposit</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
