"use client";
import {
  ArrowRight,
  CaretRight,
  Info,
  ListBullets,
  MagnifyingGlass,
  ShieldWarning,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DTF_PAGE_SIZE,
  demoDtfCatalogue,
  dtfFromFarm,
  dtfTotals,
  filterDtfs,
  sortDtfs,
  type DtfSort,
  type PublicDtf,
} from "@/domain/dtf";
import { farmDetailHref } from "@/domain/routes";
import type { RiskLevel, StrategyType } from "@/domain/strategy";
import { useApp } from "./provider";
import { AssetIcon, EmptyState, NetworkIcon, PageHeading, Risk, StrategyIcon, money } from "./ui";

const typeLabel: Record<StrategyType, string> = { INDEX: "Index", SPOT: "Spot", PERPETUAL: "Perpetual" };
const typeFilters: (StrategyType | "ALL")[] = ["ALL", "INDEX", "SPOT", "PERPETUAL"];

const riskReason: Record<RiskLevel, string> = {
  LOW: "Mostly stablecoin exposure. Main risks are stablecoin de-pegs and smart contract or protocol failures.",
  MEDIUM: "Exposure to volatile assets or moderate leverage. Expect meaningful drawdowns in weak markets.",
  HIGH: "Concentrated or leveraged exposure. Value can fall quickly, and liquidity may be limited during stress.",
  CRITICAL: "Highly leveraged or directional. Losses can be large and fast, and a full loss of capital is possible.",
};

function flowFor(dtf: PublicDtf) {
  const held = dtf.assets.filter((a) => a !== dtf.baseAsset).slice(0, 3).join(" / ") || dtf.baseAsset;
  if (dtf.type === "INDEX") return [dtf.baseAsset, "Allocation", held, "Rebalance"];
  if (dtf.type === "SPOT") return [dtf.baseAsset, "Protocol", "Yield", "Compound"];
  return [dtf.baseAsset, "Margin", `${held} PERP`, "Hedge", "Funding"];
}

const VIEW_KEY = "fm:strategies-view";

const pct = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

export function DtfStrategies({ network }: { network: string }) {
  const app = useApp();
  const [sort, setSort] = useState<DtfSort>("trending");
  const [type, setType] = useState<StrategyType | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(DTF_PAGE_SIZE);
  const [selected, setSelected] = useState<PublicDtf | null>(null);
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

  const all = useMemo(
    () => [
      ...app.farms
        .filter((farm) => farm.status === "ACTIVE")
        .map((farm) => dtfFromFarm(farm, app.profile.name)),
      ...demoDtfCatalogue,
    ],
    [app.farms, app.profile.name],
  );
  const onNetwork = filterDtfs(all, { network });
  const results = sortDtfs(filterDtfs(onNetwork, { query, type }), sort);
  const totals = dtfTotals(onNetwork);
  const shown = results.slice(0, visible);

  useEffect(() => setVisible(DTF_PAGE_SIZE), [query, type, sort, network]);

  return (
    <>
      <PageHeading
        eyebrow="LIQUIDITY PROVIDER"
        title="Strategies"
        description="Explore public DTFs on Dexponent and find a strategy that fits your capital."
      />
      <section className="dtf-hero" aria-label="Strategy directory summary">
        <div>
          <h2>Onchain funds, run in the open</h2>
          <p>Compare each DTF&apos;s strategy, holdings, risk, and performance before you deposit.</p>
        </div>
        <dl>
          <div><dt>Demo TVL</dt><dd>{money(totals.tvl, true)}</dd></div>
          <div><dt>Public DTFs</dt><dd>{totals.count}</dd></div>
          <div><dt>Managers</dt><dd>{totals.managers}</dd></div>
        </dl>
      </section>
      <div className="dtf-toolbar">
        <div className="dtf-filters">
          <div className="dtf-segment" role="group" aria-label="Sort strategies">
            {(["trending", "top"] as DtfSort[]).map((value) => (
              <button key={value} aria-pressed={sort === value} onClick={() => setSort(value)}>
                {value === "trending" ? "Trending" : "Top performing"}
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
            placeholder="Search tokens, asset, chain, manager"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        </div>
      </div>
      {shown.length ? (
        view === "grid" ? (
          <div className="dtf-grid">
            {shown.map((dtf) => <DtfCard key={dtf.id} dtf={dtf} onOpen={() => setSelected(dtf)} />)}
          </div>
        ) : (
          <DtfTable dtfs={shown} onOpen={setSelected} />
        )
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
        <span className="dtf-dot" /> Demo data · not live on-chain. Figures are illustrative and are not performance claims.
      </p>
      {selected && <DtfQuickView dtf={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function DtfLogo({ dtf, size = "md" }: { dtf: PublicDtf; size?: "md" | "lg" }) {
  const app = useApp();
  const icon = dtf.farmId ? app.farms.find((farm) => farm.id === dtf.farmId)?.icon : undefined;
  return (
    <span className={`dtf-logo ${dtf.type.toLowerCase()} ${size}`}>
      {icon ? <img src={icon} alt="" /> : <StrategyIcon type={dtf.type} size={size === "lg" ? 22 : 18} />}
    </span>
  );
}

function AssetStack({ assets, max = 5 }: { assets: string[]; max?: number }) {
  const extra = assets.length - max;
  return (
    <span className="dtf-assets" aria-label={`Holdings: ${assets.join(", ")}`}>
      {assets.slice(0, max).map((asset) => <AssetIcon key={asset} symbol={asset} size={22} />)}
      {extra > 0 && <span className="dtf-assets-more">+{extra}</span>}
    </span>
  );
}

function DtfCard({ dtf, onOpen }: { dtf: PublicDtf; onOpen: () => void }) {
  return (
    <article className="dtf-card">
      <div className="dtf-card-top">
        <DtfLogo dtf={dtf} />
        <span className={`dtf-type ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span>
      </div>
      <h2>
        <button className="dtf-card-link" onClick={onOpen}>{dtf.name}</button>
      </h2>
      <p className="dtf-card-desc">{dtf.description}</p>
      <dl className="dtf-card-metrics">
        <div><dt>TVL</dt><dd>{money(dtf.tvl, true)}</dd></div>
        <div>
          <dt>APY</dt>
          <dd className={dtf.apy === null ? "" : dtf.apy < 0 ? "negative" : "positive"}>
            {dtf.apy === null ? <span title="Not enough history to report APY">—</span> : `${dtf.apy.toFixed(2)}%`}
          </dd>
        </div>
        <div><dt>Base</dt><dd>{dtf.baseAsset}</dd></div>
      </dl>
      <div className="dtf-card-foot">
        <AssetStack assets={dtf.assets} />
        <span className="dtf-network"><NetworkIcon network={dtf.network} size={14} /> {dtf.network}</span>
      </div>
    </article>
  );
}

function ApyValue({ apy }: { apy: number | null }) {
  if (apy === null) return <span title="Not enough history to report APY">—</span>;
  return <span className={apy < 0 ? "negative" : ""}>{apy.toFixed(2)}%</span>;
}

function DtfTable({ dtfs, onOpen }: { dtfs: PublicDtf[]; onOpen: (dtf: PublicDtf) => void }) {
  return (
    <div className="dtf-table-wrap">
      <table className="dtf-table">
        <thead>
          <tr>
            <th scope="col">Strategy</th>
            <th scope="col">Type</th>
            <th scope="col" className="numeric">TVL</th>
            <th scope="col" className="numeric">APY</th>
            <th scope="col" className="numeric">30D</th>
            <th scope="col">Risk</th>
            <th scope="col">Holdings</th>
            <th scope="col">Network</th>
            <th scope="col"><span className="sr-only">Details</span></th>
          </tr>
        </thead>
        <tbody>
          {dtfs.map((dtf) => (
            <tr key={dtf.id} onClick={() => onOpen(dtf)}>
              <td>
                <span className="dtf-row-name">
                  <DtfLogo dtf={dtf} />
                  <span>
                    <button className="dtf-row-link" onClick={(event) => { event.stopPropagation(); onOpen(dtf); }}>{dtf.name}</button>
                    <small>{dtf.manager} · {dtf.baseAsset}</small>
                  </span>
                </span>
              </td>
              <td><span className={`dtf-type ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span></td>
              <td className="numeric">{money(dtf.tvl, true)}</td>
              <td className="numeric"><ApyValue apy={dtf.apy} /></td>
              <td className={`numeric ${dtf.change30d < 0 ? "negative" : "positive"}`}>{pct(dtf.change30d)}</td>
              <td><Risk level={dtf.risk} /></td>
              <td><AssetStack assets={dtf.assets} max={4} /></td>
              <td><span className="dtf-network"><NetworkIcon network={dtf.network} size={14} /> {dtf.network}</span></td>
              <td className="dtf-row-caret"><CaretRight size={14} aria-hidden="true" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DtfQuickView({ dtf, onClose }: { dtf: PublicDtf; onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="side-layer">
      <button className="side-backdrop" aria-label="Close strategy details" tabIndex={-1} onClick={onClose} />
      <aside className="side-panel dtf-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="side-panel-head">
          <div className="dtf-panel-title">
            <DtfLogo dtf={dtf} size="lg" />
            <div>
              <span className={`dtf-type ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span>
              <h2 id={titleId}>{dtf.name}</h2>
              <p>by {dtf.manager} · {dtf.network}</p>
            </div>
          </div>
          <button ref={closeRef} className="icon-button" aria-label="Close strategy details" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="side-panel-body">
          <dl className="dtf-panel-metrics">
            <div><dt>TVL</dt><dd>{money(dtf.tvl, true)}</dd></div>
            <div><dt>APY</dt><dd className={dtf.apy !== null && dtf.apy < 0 ? "negative" : ""}>{dtf.apy === null ? "—" : `${dtf.apy.toFixed(2)}%`}</dd></div>
            <div><dt>30D change</dt><dd className={dtf.change30d < 0 ? "negative" : "positive"}>{pct(dtf.change30d)}</dd></div>
            <div><dt>LPs</dt><dd>{dtf.lps.toLocaleString()}</dd></div>
          </dl>
          <p className="dtf-panel-note"><Info size={14} /> Historical demo figures. Past performance does not predict future returns.</p>

          <h3>How it works</h3>
          <ol className="dtf-flow" aria-label="Strategy flow">
            {flowFor(dtf).map((step, index) => (
              <li key={`${step}-${index}`}>{index > 0 && <CaretRight size={12} aria-hidden="true" />}<span>{step}</span></li>
            ))}
          </ol>
          <p className="dtf-panel-text">{dtf.description}</p>

          <h3>Risk</h3>
          <div className="dtf-risk">
            <Risk level={dtf.risk} />
            <p>{riskReason[dtf.risk]}</p>
          </div>

          <h3>Holdings</h3>
          <ul className="dtf-holdings">
            {dtf.assets.map((asset) => <li key={asset}><AssetIcon symbol={asset} size={20} /> {asset}</li>)}
          </ul>

          <h3>Details</h3>
          <dl className="dtf-details">
            <div><dt>Manager</dt><dd>{dtf.manager}</dd></div>
            <div><dt>Network</dt><dd><NetworkIcon network={dtf.network} size={14} /> {dtf.network}</dd></div>
            <div><dt>Settled in</dt><dd>{dtf.baseAsset}</dd></div>
            <div><dt>Launched</dt><dd>{new Date(`${dtf.launchedAt}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</dd></div>
          </dl>
        </div>
        <footer className="dtf-panel-foot">
          {dtf.farmId ? (
            <Link className="button primary full" href={farmDetailHref(dtf.farmId)}>
              Open Farm profile <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <button className="button primary full" disabled>Deposit</button>
              <p><ShieldWarning size={14} /> Demo listing. Deposits open once this DTF is live on-chain.</p>
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}
