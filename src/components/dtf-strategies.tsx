"use client";
import { ArrowRight, CaretRight, ListBullets, MagnifyingGlass, SquaresFour, Wallet } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DTF_PAGE_SIZE,
  dtfDirectory,
  dtfReturn24h,
  dtfTotals,
  filterDtfs,
  sortDtfs,
  type DtfSort,
  type PublicDtf,
} from "@/domain/dtf";
import { portfolioSummary, positionValue, type DtfPortfolio } from "@/domain/dtf-portfolio";
import { formatCount, formatPct, formatSignedPct, formatSignedUsd, formatUsd, formatUsdCompact, toneOf } from "@/domain/format";
import type { ReturnMetric } from "@/domain/position-metrics";
import { dtfReturn } from "@/domain/positions";
import { strategyHref } from "@/domain/routes";
import type { StrategyType } from "@/domain/strategy";
import { DtfLogo, DtfAge, ReturnFigure, TargetPace, returnLabel, typeLabel } from "./dtf-shared";
import { useApp } from "./provider";
import { useDtfPortfolio } from "./use-dtf-portfolio";
import { EmptyState, NetworkIcon, PageHeading } from "./ui";

const typeFilters: (StrategyType | "ALL")[] = ["ALL", "INDEX", "SPOT", "PERPETUAL"];
const VIEW_KEY = "fm:strategies-view";

type Holding = { value: number; earned: number };
type Perf = { ret: ReturnMetric; change24h: number };
/** Position P&L is shown to the cent; sub-cent accruals read as $0.00. */
const cents = (value: number) => Math.round(value * 100) / 100;

function holdingsFor(dtfs: PublicDtf[], portfolio: DtfPortfolio) {
  const now = Date.now();
  const map = new Map<string, Holding>();
  for (const dtf of dtfs) {
    const position = portfolio.positions[dtf.id];
    if (!position) continue;
    const value = positionValue(position, dtf.apy7d, now);
    map.set(dtf.id, { value, earned: value - position.costBasis });
  }
  return map;
}

export function DtfStrategies({ network }: { network: string }) {
  const app = useApp();
  const { portfolio, connected } = useDtfPortfolio();
  const [sort, setSort] = useState<DtfSort>("trending");
  const [type, setType] = useState<StrategyType | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [mine, setMine] = useState(false);
  const [visible, setVisible] = useState(DTF_PAGE_SIZE);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {
      /* storage unavailable: keep grid */
    }
  }, []);
  function changeView(next: "grid" | "list") {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* preference lasts for this visit only */
    }
  }

  const all = useMemo(() => dtfDirectory(app.farms, app.profile.name), [app.farms, app.profile.name]);
  const holdings = useMemo(() => holdingsFor(all, portfolio), [all, portfolio]);
  const [now] = useState(() => Date.now());
  const perf = useMemo(() => new Map<string, Perf>(all.map((d) => [d.id, { ret: dtfReturn(d, now), change24h: dtfReturn24h(d, now) }])), [all, now]);
  const onNetwork = filterDtfs(all, { network });
  const results = sortDtfs(filterDtfs(onNetwork, { query, type }), sort, now).filter((d) => !mine || holdings.has(d.id));
  const totals = dtfTotals(onNetwork, now);
  const summary = useMemo(() => portfolioSummary(portfolio, all, now), [portfolio, all, now]);
  const shown = results.slice(0, visible);

  useEffect(() => setVisible(DTF_PAGE_SIZE), [query, type, sort, network, mine]);

  return (
    <>
      <PageHeading title="Dexponent DTFs" description="Strategies run by independent managers." />
      <div className={`dtf-overview ${summary.rows.length ? "with-yours" : ""}`}>
        <section className="dtf-stats" aria-labelledby="dtf-stats-title">
          <header>
            <h2 id="dtf-stats-title" className="panel-kicker">Stats</h2>
          </header>
          <dl>
            <div><dt>TVL</dt><dd>{formatUsdCompact(totals.tvl)}</dd></div>
            <div><dt>Active DTFs</dt><dd>{formatCount(totals.count)}</dd></div>
            <div><dt>Managers</dt><dd>{formatCount(totals.managers)}</dd></div>
          </dl>
          {network !== "All Chains" && <p>{network}</p>}
        </section>
        {summary.rows.length > 0 && (
          <section className="dtf-yours" aria-labelledby="dtf-yours-title">
            <header>
              <h2 id="dtf-yours-title" className="panel-kicker">Your positions <span>{summary.rows.length}</span></h2>
              <Link className="dtf-yours-link" href="/app/positions/" aria-label="View your positions">
                <ArrowRight size={16} />
              </Link>
            </header>
            <dl>
              <div><dt>Value</dt><dd>{formatUsd(summary.value)}</dd></div>
              <div><dt>Total yield</dt><dd className={toneOf(cents(summary.totalYield)) ?? ""}>{formatSignedUsd(cents(summary.totalYield))}</dd></div>
              <div>
                <dt>P&amp;L</dt>
                <dd className={toneOf(cents(summary.pnl)) ?? ""}>
                  {formatSignedUsd(cents(summary.pnl))} <small>{formatSignedPct(summary.pnlPct)}</small>
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>
      <div className="dtf-toolbar">
        <div className="dtf-filters">
          <div className="dtf-segment" role="group" aria-label="Sort strategies">
            {(["trending", "top"] as DtfSort[]).map((value) => (
              <button key={value} aria-pressed={sort === value} onClick={() => setSort(value)}>
                {value === "trending" ? "Trending" : "Top 24H return"}
              </button>
            ))}
          </div>
          <div className="dtf-segment" role="group" aria-label="Filter by strategy type">
            {typeFilters.map((value) => (
              <button key={value} aria-pressed={type === value} onClick={() => setType(value)}>
                {value === "ALL" ? "All" : typeLabel[value]}
              </button>
            ))}
          </div>
          {connected && (
            <button className="dtf-mine" aria-pressed={mine} onClick={() => setMine((on) => !on)}>
              <Wallet size={15} /> My positions{holdings.size > 0 && <span>{holdings.size}</span>}
            </button>
          )}
        </div>
        <div className="dtf-toolbar-end">
          <div className="dtf-segment dtf-view" role="group" aria-label="Layout">
            <button aria-pressed={view === "grid"} aria-label="Grid view" title="Grid view" onClick={() => changeView("grid")}>
              <SquaresFour size={16} weight={view === "grid" ? "fill" : "regular"} />
            </button>
            <button aria-pressed={view === "list"} aria-label="List view" title="List view" onClick={() => changeView("list")}>
              <ListBullets size={16} weight={view === "list" ? "bold" : "regular"} />
            </button>
          </div>
          <label className="dtf-search">
            <MagnifyingGlass size={16} />
            <span className="sr-only">Search strategies</span>
            <input
              type="search"
              placeholder="Search name, $ticker, asset, chain"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </div>
      {shown.length ? (
        view === "grid" ? (
          <div className="dtf-grid">
            {shown.map((dtf) => <DtfCard key={dtf.id} dtf={dtf} perf={perf.get(dtf.id)!} now={now} holding={holdings.get(dtf.id)} />)}
          </div>
        ) : (
          <DtfTable dtfs={shown} perf={perf} now={now} holdings={holdings} />
        )
      ) : mine ? (
        <EmptyState title="No positions yet" description="Deposit into a DTF to track it here." />
      ) : (
        <EmptyState
          title="No strategies match"
          description={network === "All Chains" ? "Try another token, manager, or strategy type." : `No DTFs match on ${network}. Try All Chains or another search.`}
        />
      )}
      {results.length > 0 && (
        <div className="dtf-more">
          <span>Showing {shown.length} of {results.length}</span>
          {visible < results.length && (
            <button className="button" onClick={() => setVisible((count) => count + DTF_PAGE_SIZE)}>Load more</button>
          )}
        </div>
      )}
      <p className="dtf-footnote">Returns are after fees. Target APR is the manager&apos;s goal, not a forecast or guarantee.</p>
    </>
  );
}

function PositionValue({ holding }: { holding?: Holding }) {
  if (!holding) return <span className="muted">—</span>;
  return (
    <span className="dtf-position-value">
      {formatUsd(holding.value)}
      {Math.abs(holding.earned) >= 0.01 && <small className={toneOf(holding.earned) ?? ""}>{formatSignedUsd(cents(holding.earned))}</small>}
    </span>
  );
}

function DtfCard({ dtf, perf, now, holding }: { dtf: PublicDtf; perf: Perf; now: number; holding?: Holding }) {
  return (
    <article className={`dtf-card ${holding ? "held" : ""}`}>
      <header className="dtf-card-head">
        <DtfLogo dtf={dtf} />
        <div className="dtf-card-title">
          <h2><Link className="dtf-card-link" href={strategyHref(dtf.id)}>{dtf.name}</Link></h2>
          <p>
            <span className="dtf-ticker">${dtf.symbol}</span>
            <span className={`dtf-type ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span>
            <span className="dtf-card-network" title={dtf.network}>
              <NetworkIcon network={dtf.network} size={14} />
              <span className="sr-only">{dtf.network}</span>
            </span>
          </p>
        </div>
      </header>
      <div className="dtf-card-apy">
        <div>
          <span>{returnLabel(perf.ret)}</span>
          <ReturnFigure ret={perf.ret} change24h={perf.change24h} />
        </div>
        <div className="dtf-card-target">
          <span>Target APR</span>
          <strong>{formatPct(dtf.targetApr)}</strong>
          <TargetPace ret={perf.change24h} targetApr={dtf.targetApr} />
        </div>
      </div>
      <dl className="dtf-card-rows">
        <div><dt>TVL</dt><dd>{formatUsdCompact(dtf.tvl)}</dd></div>
        <div><dt>LPs</dt><dd>{formatCount(dtf.lps)}</dd></div>
        <div><dt>Age</dt><dd><DtfAge launchedAt={dtf.launchedAt} now={now} /></dd></div>
        {holding && <div className="dtf-card-position"><dt>Your position</dt><dd><PositionValue holding={holding} /></dd></div>}
      </dl>
    </article>
  );
}

function DtfTable({ dtfs, perf, now, holdings }: { dtfs: PublicDtf[]; perf: Map<string, Perf>; now: number; holdings: Map<string, Holding> }) {
  const router = useRouter();
  return (
    <div className="dtf-table-wrap">
      <table className="dtf-table">
        <thead>
          <tr>
            <th scope="col">DTF</th>
            <th scope="col">Type</th>
            <th scope="col" className="numeric">Return</th>
            <th scope="col" className="numeric">Target APR</th>
            <th scope="col" className="numeric">TVL</th>
            <th scope="col" className="numeric">LPs</th>
            <th scope="col">Age</th>
            <th scope="col" className="numeric">Your position</th>
            <th scope="col"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          {dtfs.map((dtf) => {
            const p = perf.get(dtf.id)!;
            return (
              <tr key={dtf.id} onClick={() => router.push(strategyHref(dtf.id))}>
                <td>
                  <span className="dtf-row-name">
                    <DtfLogo dtf={dtf} />
                    <span>
                      <Link className="dtf-row-link" href={strategyHref(dtf.id)} onClick={(event) => event.stopPropagation()}>{dtf.name}</Link>
                      <small><span className="dtf-ticker">${dtf.symbol}</span> · <NetworkIcon network={dtf.network} size={11} /> {dtf.network}</small>
                    </span>
                  </span>
                </td>
                <td><span className={`dtf-type ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span></td>
                <td className="numeric">
                  <span className="dtf-row-return">
                    <ReturnFigure ret={p.ret} change24h={p.change24h} />
                    <small>{p.ret.kind === "apy" ? "APY" : "Since launch"}</small>
                  </span>
                </td>
                <td className="numeric">{formatPct(dtf.targetApr)}</td>
                <td className="numeric">{formatUsdCompact(dtf.tvl)}</td>
                <td className="numeric">{formatCount(dtf.lps)}</td>
                <td><DtfAge launchedAt={dtf.launchedAt} now={now} /></td>
                <td className="numeric"><PositionValue holding={holdings.get(dtf.id)} /></td>
                <td className="dtf-row-caret"><CaretRight size={14} aria-hidden="true" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
