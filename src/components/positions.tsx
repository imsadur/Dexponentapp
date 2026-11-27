"use client";
import { ArrowClockwise, ArrowRight, CaretRight, Compass, MagnifyingGlass, Plus, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { dtfDirectory, filterDtfs, sortDtfs, type PublicDtf } from "@/domain/dtf";
import {
  formatCount,
  formatDate,
  formatPct,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  formatUsdCompact,
  formatUsdPrecise,
  MISSING,
  toneOf,
} from "@/domain/format";
import { lpSummary, managerSummary, type ReturnMetric } from "@/domain/position-metrics";
import { isManagedFarm, lpRows, managerRows, type LpRow, type ManagerRow } from "@/domain/positions";
import { farmDetailHref, strategyHref } from "@/domain/routes";
import type { StrategyType } from "@/domain/strategy";
import { DtfLogo, typeLabel } from "./dtf-shared";
import { useApp } from "./provider";
import { useDtfPortfolio } from "./use-dtf-portfolio";
import { ConnectWalletButton, SignInGate } from "./sign-in-gate";
import { LabelTip, Metric, NetworkIcon, PageHeading, Tip } from "./ui";

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
  // LP positions follow the connected wallet; managing DTFs needs a sign-in.
  const { portfolio, connected, wallet, loaded } = useDtfPortfolio();
  const signedIn = Boolean(app.session);
  const [now, setNow] = useState(() => Date.now());
  const managedIds = useMemo(() => new Set(app.farms.filter(isManagedFarm).map((f) => f.id)), [app.farms]);
  const directory = useMemo(() => filterDtfs(dtfDirectory(app.farms, app.profile.name), { network }), [app.farms, app.profile.name, network]);
  const lp = useMemo(() => lpRows(portfolio, directory, now, managedIds), [portfolio, directory, now, managedIds]);
  // DTFs in the workspace belong to the signed-in manager; visitors manage nothing.
  const managed = useMemo(
    () => (signedIn ? managerRows(app.farms, app.profile.name, portfolio, now, network) : []),
    [signedIn, app.farms, app.profile.name, portfolio, now, network],
  );
  return {
    ready: app.ready && loaded,
    signedIn,
    connected,
    wallet,
    isLP: lp.length > 0,
    isManager: managed.length > 0,
    lp,
    managed,
    directory,
    now,
    refresh: () => setNow(Date.now()),
  };
}

type Role = "lp" | "manager";
const ROLE_KEY = "fm:positions-view";
const roleLabel: Record<Role, string> = { lp: "Liquidity provider", manager: "Manager" };

/**
 * Positions, split by role: what you hold as an LP, and the DTFs you run as a manager
 * (yield generated and fees earned per DTF). The tab persists in ?view= and across visits.
 */
export function Positions({ network }: { network: string }) {
  const data = usePortfolioRoles(network);
  const [chosen, setChosen] = useState<Role | null>(null);
  const tabRefs = useRef<Record<Role, HTMLButtonElement | null>>({ lp: null, manager: null });

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "lp" || view === "manager") return setChosen(view);
    try {
      const stored = localStorage.getItem(ROLE_KEY);
      if (stored === "lp" || stored === "manager") setChosen(stored);
    } catch {
      /* storage blocked: default tab */
    }
  }, []);

  if (!data.ready) return <PositionsSkeleton />;
  // Default to the side where the user has something; LP otherwise.
  const role: Role = chosen ?? (!data.isLP && data.isManager ? "manager" : "lp");
  const choose = (next: Role) => {
    setChosen(next);
    try {
      localStorage.setItem(ROLE_KEY, next);
    } catch {
      /* not critical */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
  };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: Role = event.key === "Home" ? "lp" : event.key === "End" ? "manager" : role === "lp" ? "manager" : "lp";
    choose(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="positions-page">
      <PageHeading
        title="Positions"
        description={role === "lp" ? "DTFs you've invested in" : "Yield and fees for DTFs you manage"}
        action={
          role === "lp" ? (
            <Link className="button primary" href="/app/strategies/">
              <Compass size={16} /> Explore DTFs
            </Link>
          ) : data.signedIn ? (
            <Link className="button primary" href="/app/farms/new/">
              <Plus size={16} /> Create DTF
            </Link>
          ) : undefined
        }
      />
      <div className="tabs positions-tabs" role="tablist" aria-label="Positions by role">
        {(["lp", "manager"] as Role[]).map((value) => (
          <button
            key={value}
            ref={(el) => {
              tabRefs.current[value] = el;
            }}
            role="tab"
            id={`positions-tab-${value}`}
            aria-selected={role === value}
            aria-controls="positions-panel"
            tabIndex={role === value ? 0 : -1}
            className={role === value ? "active" : ""}
            onClick={() => choose(value)}
            onKeyDown={onTabKey}
          >
            {roleLabel[value]}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="positions-panel" aria-labelledby={`positions-tab-${role}`}>
        {role === "lp" ? (
          <LpView rows={data.lp} directory={data.directory} now={data.now} connected={data.connected} wallet={data.wallet} />
        ) : (
          <ManagerView rows={data.managed} signedIn={data.signedIn} />
        )}
      </div>
      {(role === "lp" ? data.connected : data.signedIn) && <PricesUpdated at={data.now} onRefresh={data.refresh} />}
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

function LpView({ rows, directory, now, connected, wallet }: { rows: LpRow[]; directory: PublicDtf[]; now: number; connected: boolean; wallet: string }) {
  const router = useRouter();
  const [type, setType] = useState<TypeFilter>("ALL");
  const [query, setQuery] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [hideSmall, setHideSmall] = useState(false);

  const summary = lpSummary(rows);
  const empty = rows.length === 0;
  // No wallet, no portfolio: show "—", never a $0 that reads like a real balance.
  const visitor = !connected;
  const open = rows.filter((r) => !r.closed);
  const closedCount = rows.length - open.length;
  const base = (showClosed ? rows : open).filter((r) => !hideSmall || r.closed || r.value === null || r.value >= SMALL_BALANCE);
  const filtered = open.length > FILTER_THRESHOLD;
  const shown = filtered ? base.filter((r) => matches(r.dtf, type, query)) : base;
  const withdrawableDiffers = Math.abs(summary.withdrawable - summary.value) >= 0.005;
  const nextUnlock = open.filter((r) => r.lockedUntil).sort((a, b) => Date.parse(a.lockedUntil!) - Date.parse(b.lockedUntil!))[0];

  return (
    <section id="dtf-positions" className="positions-section" aria-label="Your DTF holdings">
      {connected && (
        <p className="positions-wallet">
          Showing positions for <span className="mono">{wallet.slice(0, 6)}…{wallet.slice(-4)}</span>
        </p>
      )}
      {summary.excluded > 0 && (
        <p className="positions-warning" role="status">
          <WarningCircle size={14} /> {summary.excluded} position{summary.excluded === 1 ? "" : "s"} excluded: price unavailable
        </p>
      )}
      <div className="overview-metrics capital-metrics positions-metrics">
        <Metric
          label={<LabelTip label="Portfolio value">Sum of shares × NAV per share across open positions. Positions without a price are left out.</LabelTip>}
          value={visitor ? MISSING : formatUsd(summary.value)}
          caption={
            visitor ? "Connect a wallet to see your value" : <>
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
          label={<LabelTip label="Net deposited">{`Deposited ${formatUsd(summary.deposited)} − withdrawn ${formatUsd(summary.withdrawn)}, in USD at the time of each transaction.`}</LabelTip>}
          value={visitor ? MISSING : formatUsd(summary.netDeposited)}
          caption={visitor ? "Deposits minus withdrawals" : `${formatUsd(summary.deposited)} in · ${formatUsd(summary.withdrawn)} out`}
        />
        <Metric
          label={<LabelTip label="Total P&L">{`Value + withdrawn − deposited. The % is over total deposits. Realised ${formatSignedUsd(summary.realizedPnl)}, unrealised ${formatSignedUsd(summary.unrealizedPnl)}.`}</LabelTip>}
          value={visitor ? MISSING : formatSignedUsd(summary.totalPnl)}
          suffix={visitor ? undefined : `(${formatSignedPct(summary.totalPnlPct ?? 0, 1)})`}
          tone={visitor ? undefined : toneOf(summary.totalPnl)}
          caption={visitor ? "Realised and unrealised" : `Realised ${formatSignedUsd(summary.realizedPnl)} · unrealised ${formatSignedUsd(summary.unrealizedPnl)}`}
        />
        <Metric
          label={<LabelTip label="Avg return">Value-weighted. APY for DTFs 90+ days old; return since launch (not annualised) for younger DTFs.</LabelTip>}
          value={visitor ? MISSING : summary.avgReturn === null ? (empty ? formatPct(0) : MISSING) : formatPct(summary.avgReturn)}
          tone={summary.avgReturn !== null && summary.avgReturn < 0 ? "negative" : undefined}
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
        <DepositNudge directory={directory} now={now} connected={connected} />
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
function DepositNudge({ directory, now, connected }: { directory: PublicDtf[]; now: number; connected: boolean }) {
  // Suggest DTFs from other managers.
  const picks = useMemo(() => sortDtfs(directory.filter((d) => !d.farmId), "trending", now).slice(0, 3), [directory, now]);
  // Depositing needs only a wallet, which the DTF page can connect.
  const href = (id: string) => positionsDetailHref(id, "position", "&action=deposit");
  return (
    <div className="positions-nudge">
      <div className="positions-nudge-copy">
        <h3>{connected ? "No positions yet" : "Connect your wallet to view your positions"}</h3>
        <p>
          {connected
            ? "This wallet hasn't deposited into a DTF. Deposit and earn yield; value, P&L and return show up here."
            : "Your DTF holdings, returns and activity show up here once your wallet is connected. No sign-in needed."}
        </p>
        <div className="positions-nudge-actions">
          {connected ? (
            <Link className="button primary" href="/app/strategies/">
              Explore DTFs <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <ConnectWalletButton />
              <Link className="button" href="/app/strategies/">
                Explore DTFs
              </Link>
            </>
          )}
        </div>
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

/* --------------------------------- Manager -------------------------------- */

/** DTFs the user runs: TVL, yield generated for LPs, and the fees that yield earned the manager. */
function ManagerView({ rows, signedIn }: { rows: ManagerRow[]; signedIn: boolean }) {
  const router = useRouter();
  const live = rows.filter((r) => r.live);
  const s = managerSummary(live);
  const yieldTotal = live.reduce((sum, r) => sum + (r.yieldGenerated ?? 0), 0);
  const empty = !live.length;
  const dash = !signedIn || empty;
  const emptyCaption = signedIn ? "Appears once a DTF is live" : "Sign in to see your DTFs";

  return (
    <section className="positions-section" aria-label="DTFs you manage">
      <div className="overview-metrics capital-metrics positions-metrics">
        <Metric
          label={<LabelTip label="TVL">LP capital across your live DTFs. Not your funds.</LabelTip>}
          value={dash ? MISSING : formatUsdCompact(s.aum)}
          caption={dash ? emptyCaption : `${formatCount(live.length)} live DTF${live.length === 1 ? "" : "s"} · not your funds`}
        />
        <Metric
          label={<LabelTip label="Yield generated">Yield earned for LPs since each DTF launched, after fees. Estimated from simulated history.</LabelTip>}
          value={dash ? MISSING : formatSignedUsd(yieldTotal, true)}
          tone={dash ? undefined : toneOf(yieldTotal)}
          caption={dash ? emptyCaption : "For LPs · since launch"}
        />
        <Metric
          label={<LabelTip label="Fees earned">Your performance fee on positive yield, since launch. Estimated.</LabelTip>}
          value={dash ? MISSING : formatUsd(s.feesEarned)}
          caption={dash ? emptyCaption : s.feesEarned > 0 ? "Estimated · since launch" : "Fees accrue only on positive yield"}
        />
        <Metric
          label={<LabelTip label="Claimable">Fees earned minus fees already claimed. Claiming opens once the DTF contract is deployed.</LabelTip>}
          value={dash ? MISSING : formatUsd(s.claimable)}
          caption={dash ? emptyCaption : "Claim opens after contract deployment"}
        />
      </div>

      <div className="positions-table-head">
        <h2>
          DTFs <span className="muted">({formatCount(rows.length)})</span>
        </h2>
      </div>

      {!signedIn ? (
        <SignInGate
          title="Sign in to see DTFs you manage"
          body="Track TVL, yield generated and fees earned for every DTF you run."
          next="/app/positions/?view=manager"
          secondary={{ label: "Explore templates", href: "/app/templates/" }}
        />
      ) : !rows.length ? (
        <div className="positions-nudge">
          <div className="positions-nudge-copy">
            <h3>No live DTFs yet</h3>
            <p>Start from a template. Yield and fees for each DTF appear here once it&apos;s live.</p>
            <div className="positions-nudge-actions">
              <Link className="button primary" href="/app/farms/new/">
                <Plus size={15} /> Create DTF
              </Link>
              <Link className="button" href="/app/templates/">
                Explore templates
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="farm-table-wrap positions-table-wrap">
          <table className="farm-table positions-table">
            <thead>
              <tr>
                <th scope="col">DTF</th>
                <th scope="col" className="numeric">TVL</th>
                <th scope="col" className="numeric">Return</th>
                <th scope="col" className="numeric">Yield generated</th>
                <th scope="col" className="numeric">Fees earned</th>
                <th scope="col" className="numeric">Claimable</th>
                <th scope="col" className="numeric">LPs</th>
                <th scope="col">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const href = farmDetailHref(r.farm.id);
                const notLive = <Missing why="Not live yet" />;
                return (
                  <tr key={r.id} onClick={() => router.push(href)}>
                    <td data-label="DTF">
                      <DtfCell dtf={r.dtf} href={href}>
                        {!r.live && <span className="positions-pill">{r.farm.status === "READY" ? "Ready" : "Not live"}</span>}
                      </DtfCell>
                    </td>
                    <td className="numeric" data-label="TVL">
                      {r.tvl === null ? notLive : <Tip tip={formatUsdPrecise(r.tvl)}>{formatUsdCompact(r.tvl)}</Tip>}
                    </td>
                    <td className="numeric" data-label="Return">{r.live ? <ReturnCell ret={r.ret} /> : notLive}</td>
                    <td className="numeric" data-label="Yield generated">{r.live ? <Signed value={r.yieldGenerated} compact /> : notLive}</td>
                    <td className="numeric" data-label="Fees earned">{r.live ? formatUsd(r.feesEarned) : notLive}</td>
                    <td className="numeric" data-label="Claimable">{r.live ? formatUsd(Math.max(0, r.feesEarned - r.feesClaimed)) : notLive}</td>
                    <td className="numeric" data-label="LPs">{r.live ? formatCount(r.depositors) : notLive}</td>
                    <td className="positions-caret">
                      <CaretRight size={14} aria-hidden="true" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {signedIn && rows.length > 0 && (
        <p className="table-footnote">Yield and fees are estimated from each DTF&apos;s fee rate and history. Nothing has been claimed.</p>
      )}
    </section>
  );
}
