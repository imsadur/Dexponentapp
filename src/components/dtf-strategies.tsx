"use client";
import { ArrowRight, CaretRight, ListBullets, MagnifyingGlass, SquaresFour, Wallet } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DTF_PAGE_SIZE,
  dtfDirectory,
  dtfReturn24h,
  dtfTotals,
  dtfUtilization,
  filterDtfs,
  sortDtfs,
  type DtfSort,
  type PublicDtf,
} from "@/domain/dtf";
import { portfolioSummary, positionValue, type DtfPortfolio } from "@/domain/dtf-portfolio";
import { strategyHref } from "@/domain/routes";
import type { StrategyType } from "@/domain/strategy";
import {
  AssetStack,
  DtfLogo,
  DtfAge,
  Return24h,
  TargetPace,
  signedPct,
  signedUsd,
  typeLabel,
  usd,
  UtilizationBar,
} from "./dtf-shared";
import { useApp } from "./provider";
import { useDtfPortfolio } from "./use-dtf-portfolio";
import { EmptyState, NetworkIcon, PageHeading, money } from "./ui";

const typeFilters: (StrategyType | "ALL")[] = ["ALL", "INDEX", "SPOT", "PERPETUAL"];
const VIEW_KEY = "fm:strategies-view";

type Holding = { value: number; earned: number };

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
  const { portfolio, signedIn } = useDtfPortfolio();
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
  const returns = useMemo(() => new Map(all.map((d) => [d.id, dtfReturn24h(d, now)])), [all, now]);
  const onNetwork = filterDtfs(all, { network });
  const results = sortDtfs(filterDtfs(onNetwork, { query, type }), sort, now).filter((d) => !mine || holdings.has(d.id));
  const totals = dtfTotals(onNetwork, now);
  const summary = useMemo(() => portfolioSummary(portfolio, all, now), [portfolio, all, now]);
  const shown = results.slice(0, visible);

  useEffect(() => setVisible(DTF_PAGE_SIZE), [query, type, sort, network, mine]);

  return (
    <>
      <PageHeading title="Dexponent DTFs" description="Yield strategies managed by DTF Asset Managers." />
      <div className={`dtf-overview ${summary.rows.length ? "with-yours" : ""}`}>
        <section className="dtf-stats" aria-labelledby="dtf-stats-title">
          <header>
            <h2 id="dtf-stats-title">Stats</h2>
          </header>
          <dl>
            <div><dt>Total deposits</dt><dd>{money(totals.tvl, true)}</dd></div>
            <div><dt>Total volume</dt><dd>{money(totals.volume, true)}</dd></div>
            <div><dt>Active DTFs</dt><dd>{totals.count}</dd></div>
            <div><dt>Asset Managers</dt><dd>{totals.managers}</dd></div>
          </dl>
          <p>Demo data{network === "All Chains" ? "" : ` · ${network}`} · not live on-chain</p>
        </section>
        {summary.rows.length > 0 && (
          <section className="dtf-yours" aria-labelledby="dtf-yours-title">
            <header>
              <h2 id="dtf-yours-title">Your positions <span>{summary.rows.length}</span></h2>
              <Link className="dtf-yours-link" href="/app/positions/#dtf-positions" aria-label="View your positions">
                <ArrowRight size={16} />
              </Link>
            </header>
            <dl>
              <div><dt>Value</dt><dd>{usd(summary.value)}</dd></div>
              <div><dt>Total yield</dt><dd className={summary.totalYield < 0 ? "negative" : "positive"}>{signedUsd(summary.totalYield)}</dd></div>
              <div>
                <dt>P&amp;L</dt>
                <dd className={summary.pnl < 0 ? "negative" : "positive"}>
                  {signedUsd(summary.pnl)} <small>{signedPct(summary.pnlPct)}</small>
                </dd>
              </div>
            </dl>
            <p>Simulated</p>
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
          {signedIn && (
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
            {shown.map((dtf) => <DtfCard key={dtf.id} dtf={dtf} ret={returns.get(dtf.id)!} now={now} holding={holdings.get(dtf.id)} />)}
          </div>
        ) : (
          <DtfTable dtfs={shown} returns={returns} now={now} holdings={holdings} />
        )
      ) : mine ? (
        <EmptyState title="No positions yet" description="Open a strategy and make a demo deposit to track it here." />
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
      <p className="dtf-footnote">
        <span className="dtf-dot" /> Demo data · not live on-chain. 24H return is simulated after fees. Target APR is the manager&apos;s goal, not a forecast or guarantee. Positions are simulated.
      </p>
    </>
  );
}

function PositionValue({ holding }: { holding?: Holding }) {
  if (!holding) return <span className="muted">—</span>;
  return (
    <span className="dtf-position-value">
      {usd(holding.value)}
      {Math.abs(holding.earned) >= 0.01 && (
        <small className={holding.earned < 0 ? "negative" : "positive"}>
          {holding.earned < 0 ? "−" : "+"}{usd(Math.abs(holding.earned))}
        </small>
      )}
    </span>
  );
}

function DtfCard({ dtf, ret, now, holding }: { dtf: PublicDtf; ret: number; now: number; holding?: Holding }) {
  return (
    <article className={`dtf-card ${holding ? "held" : ""}`}>
      <header className="dtf-card-head">
        <DtfLogo dtf={dtf} />
        <div className="dtf-card-title">
          <h2><Link className="dtf-card-link" href={strategyHref(dtf.id)}>{dtf.name}</Link></h2>
          <p>
            <span className="dtf-ticker">${dtf.symbol}</span>
            <span className={`dtf-type ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span>
          </p>
        </div>
      </header>
      <div className="dtf-card-apy">
        <div>
          <span>24H return</span>
          <Return24h value={ret} />
        </div>
        <div className="dtf-card-target">
          <span>Target APR</span>
          <strong>{dtf.targetApr.toFixed(2)}%</strong>
        </div>
      </div>
      <TargetPace ret={ret} targetApr={dtf.targetApr} />
      <UtilizationBar dtf={dtf} />
      <dl className="dtf-card-rows">
        <div><dt>Deposits</dt><dd>{money(dtf.tvl, true)}</dd></div>
        <div><dt>Holds</dt><dd className="dtf-card-holds"><AssetStack assets={dtf.assets} max={4} size={18} /></dd></div>
        <div><dt>Network</dt><dd className="dtf-network"><NetworkIcon network={dtf.network} size={14} /> {dtf.network}</dd></div>
        <div><dt>Age</dt><dd><DtfAge launchedAt={dtf.launchedAt} now={now} /></dd></div>
        <div className="dtf-card-position"><dt>Your position</dt><dd><PositionValue holding={holding} /></dd></div>
      </dl>
    </article>
  );
}

function DtfTable({ dtfs, returns, now, holdings }: { dtfs: PublicDtf[]; returns: Map<string, number>; now: number; holdings: Map<string, Holding> }) {
  const router = useRouter();
  return (
    <div className="dtf-table-wrap">
      <table className="dtf-table">
        <thead>
          <tr>
            <th scope="col">Strategy</th>
            <th scope="col">Type</th>
            <th scope="col" className="numeric">24H return</th>
            <th scope="col" className="numeric">Target APR</th>
            <th scope="col" className="numeric">Deposits</th>
            <th scope="col">Utilization</th>
            <th scope="col">Age</th>
            <th scope="col" className="numeric">Your position</th>
            <th scope="col"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          {dtfs.map((dtf) => (
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
              <td className="numeric"><Return24h value={returns.get(dtf.id)!} /></td>
              <td className="numeric">{dtf.targetApr.toFixed(2)}%</td>
              <td className="numeric">{money(dtf.tvl, true)}</td>
              <td>
                <span className="dtf-row-util">
                  <UtilizationBar dtf={dtf} compact />
                  <span>{Math.round(dtfUtilization(dtf))}%</span>
                </span>
              </td>
              <td><DtfAge launchedAt={dtf.launchedAt} now={now} /></td>
              <td className="numeric"><PositionValue holding={holdings.get(dtf.id)} /></td>
              <td className="dtf-row-caret"><CaretRight size={14} aria-hidden="true" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The LP's simulated DTF positions, shown on the Positions page. */
export function DtfPositions({ network }: { network: string }) {
  const app = useApp();
  const router = useRouter();
  const { portfolio, signedIn, loaded } = useDtfPortfolio();
  const [now] = useState(() => Date.now());
  const ref = useRef<HTMLElement>(null);
  const all = useMemo(() => dtfDirectory(app.farms, app.profile.name), [app.farms, app.profile.name]);
  const onNetwork = useMemo(() => filterDtfs(all, { network }), [all, network]);
  const summary = useMemo(() => portfolioSummary(portfolio, onNetwork, now), [portfolio, onNetwork, now]);

  useEffect(() => {
    if (loaded && window.location.hash === "#dtf-positions") ref.current?.scrollIntoView({ block: "start" });
  }, [loaded]);

  return (
    <section className="dtf-positions" id="dtf-positions" ref={ref} aria-labelledby="dtf-positions-title">
      <div className="section-heading">
        <div>
          <h2 id="dtf-positions-title">DTF positions</h2>
          <p>Your simulated deposits in Dexponent DTFs. Value accrues at each DTF&apos;s 7D APY.</p>
        </div>
      </div>
      {!signedIn || !summary.rows.length ? (
        <EmptyState
          title={signedIn ? "No DTF positions yet" : "Sign in to see DTF positions"}
          description={signedIn ? "Open a DTF and make a demo deposit to track it here." : "Demo DTF positions are saved to your account in this browser."}
          href={signedIn ? "/app/strategies/" : "/login/?next=%2Fapp%2Fpositions%2F"}
          label={signedIn ? "Explore DTFs" : "Sign in"}
        />
      ) : (
        <>
          <dl className="dtf-positions-totals">
            <div><dt>Value</dt><dd>{usd(summary.value)}</dd></div>
            <div><dt>Deposited</dt><dd>{usd(summary.costBasis)}</dd></div>
            <div><dt>Total yield</dt><dd className={summary.totalYield < 0 ? "negative" : "positive"}>{signedUsd(summary.totalYield)}</dd></div>
            <div><dt>P&amp;L</dt><dd className={summary.pnl < 0 ? "negative" : "positive"}>{signedUsd(summary.pnl)} <small>{signedPct(summary.pnlPct)}</small></dd></div>
          </dl>
          <div className="dtf-table-wrap">
            <table className="dtf-table">
              <thead>
                <tr>
                  <th scope="col">DTF</th>
                  <th scope="col" className="numeric">Deposited</th>
                  <th scope="col" className="numeric">Value</th>
                  <th scope="col" className="numeric">P&amp;L</th>
                  <th scope="col" className="numeric">7D APY</th>
                  <th scope="col"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map(({ dtf, value, costBasis, pnl, pnlPct }) => (
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
                    <td className="numeric">{usd(costBasis)}</td>
                    <td className="numeric">{usd(value)}</td>
                    <td className="numeric">
                      <span className={`dtf-position-value ${pnl < 0 ? "negative" : "positive"}`}>{signedUsd(pnl)} <small>{signedPct(pnlPct)}</small></span>
                    </td>
                    <td className="numeric">{dtf.apy7d === null ? <span className="muted">New</span> : `${dtf.apy7d.toFixed(2)}%`}</td>
                    <td className="dtf-row-caret"><CaretRight size={14} aria-hidden="true" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
