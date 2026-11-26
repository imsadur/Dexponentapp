"use client";
import { ArrowDownRight, ArrowUpRight, CaretRight, Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { dtfDirectory } from "@/domain/dtf";
import { formatCount, formatSignedPct, formatSignedUsd, formatUsd, formatUsdCompact } from "@/domain/format";
import {
  DEFAULT_MARKET_CATEGORY,
  MARKET_CATEGORIES,
  categoryLabel,
  filterMarket,
  isReferenceToken,
  marketPulse,
  marketTokens,
  sortMarket,
  type MarketCategory,
  type MarketSort,
  type MarketToken,
} from "@/domain/market";
import { strategyHref } from "@/domain/routes";
import { DtfLogo, daysLabel } from "./dtf-shared";
import { useApp } from "./provider";
import { AssetIcon, EmptyState, NetworkIcon, PageHeading } from "./ui";

type Range = "24H" | "7D";
type AgeFilter = "any" | "new" | "established";
const sorts: { id: MarketSort; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "gainers", label: "Gainers" },
  { id: "losers", label: "Losers" },
  { id: "marketCap", label: "Market cap" },
  { id: "volume", label: "Volume" },
  { id: "newest", label: "Newest" },
];
const capFilters = [
  { id: 0, label: "Any size" },
  { id: 1_000_000, label: "$1M+" },
  { id: 100_000_000, label: "$100M+" },
  { id: 1_000_000_000, label: "$1B+" },
];
const ageFilters: { id: AgeFilter; label: string }[] = [
  { id: "any", label: "Any age" },
  { id: "new", label: "Under 30 days" },
  { id: "established", label: "180+ days" },
];

const signedMoney = (value: number) => formatSignedUsd(value, true);
const ageShort = (days: number) => (days < 30 ? `${days}d` : days < 365 ? `${Math.floor(days / 30)}mo` : `${Math.floor(days / 365)}y`);
const compactCount = (n: number) => (n >= 100_000 ? Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n) : formatCount(n));
const hrefFor = (t: MarketToken) => (t.dtf ? strategyHref(t.dtf.id) : null);

function Change({ value }: { value: number }) {
  const Icon = value < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={`mkt-change ${value < 0 ? "negative" : "positive"}`}>
      <Icon size={12} weight="bold" aria-hidden="true" />
      {formatSignedPct(value)}
    </span>
  );
}

function TokenLogo({ token, size = "md" }: { token: MarketToken; size?: "sm" | "md" }) {
  if (token.dtf) return <DtfLogo dtf={token.dtf} size={size} />;
  return (
    <span className={`mkt-logo ${token.category.toLowerCase()} ${size}`}>
      <AssetIcon symbol={token.symbol} size={size === "sm" ? 24 : 32} />
    </span>
  );
}

/** Tiny line chart of recent price. Colour follows direction; the change text says the same. */
function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <span className="mkt-spark-empty">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    .join(" ");
  const down = values[values.length - 1] < values[0];
  return (
    <svg className={`mkt-spark ${down ? "negative" : "positive"}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Wraps a row's content in a link when the token has a page (Dexponent DTFs). */
function MaybeLink({ token, children }: { token: MarketToken; children: ReactNode }) {
  const href = hrefFor(token);
  return href ? <Link href={href}>{children}</Link> : <div className="mkt-static">{children}</div>;
}

export function DtfMarket({ network }: { network: string }) {
  const app = useApp();
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const [category, setCategory] = useState<MarketCategory | "ALL">(DEFAULT_MARKET_CATEGORY);
  const [range, setRange] = useState<Range>("24H");
  const [sort, setSort] = useState<MarketSort>("popular");
  const [query, setQuery] = useState("");
  const [minCap, setMinCap] = useState(0);
  const [age, setAge] = useState<AgeFilter>("any");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const dtfs = useMemo(() => dtfDirectory(app.farms, app.profile.name), [app.farms, app.profile.name]);
  const tokens = useMemo(() => filterMarket(marketTokens(dtfs, now), { network }), [dtfs, now, network]);
  const pulse = marketPulse(tokens);
  const dtfTokens = tokens.filter((t) => t.category === "DTF");
  const featured = sortMarket(dtfTokens, "popular").slice(0, 3);
  const inflows = [...dtfTokens].sort((a, b) => b.netFlow24h - a.netFlow24h).filter((t) => t.netFlow24h > 0).slice(0, 5);

  const ranked = sortMarket(filterMarket(tokens, { category, query, minCap, age }), sort, range);
  const activeFilters = (minCap > 0 ? 1 : 0) + (age !== "any" ? 1 : 0);
  const counts = useMemo(() => {
    const map = new Map<string, number>([["ALL", tokens.length]]);
    for (const t of tokens) map.set(t.category, (map.get(t.category) ?? 0) + 1);
    return map;
  }, [tokens]);

  useEffect(() => {
    if (!filtersOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !filtersRef.current?.contains(event.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [filtersOpen]);

  return (
    <>
      <PageHeading title="Market" description="DTF token prices, flows and TVL." />

      <div className="mkt-top">
        <section className="mkt-card mkt-pulse" aria-labelledby="mkt-pulse-title">
          <header>
            <h2 id="mkt-pulse-title" className="panel-kicker">Market pulse</h2>
          </header>
          <dl>
            <div><dt>DTFs up / down · 24H</dt><dd><span className="positive">{formatCount(pulse.up)}</span> / <span className="negative">{formatCount(pulse.down)}</span></dd></div>
            <div><dt>DTF TVL</dt><dd>{formatUsdCompact(pulse.tvl)}</dd></div>
            <div><dt>DTF net flow · 24H</dt><dd className={pulse.netFlow24h < 0 ? "negative" : "positive"}>{signedMoney(pulse.netFlow24h)}</dd></div>
          </dl>
        </section>

        <section className="mkt-card mkt-spotlight" aria-labelledby="mkt-spotlight-title">
          <header>
            <h2 id="mkt-spotlight-title" className="panel-kicker">Featured</h2>
          </header>
          <ul>
            {featured.map((t) => (
              <li key={t.id}>
                <MaybeLink token={t}>
                  <TokenLogo token={t} />
                  <span className="mkt-name"><strong>{t.name}</strong><small>${t.symbol} · {t.dtf ? `${t.dtf.type.charAt(0)}${t.dtf.type.slice(1).toLowerCase()}` : categoryLabel[t.category]}</small></span>
                  <Sparkline values={t.spark} width={80} height={26} />
                  <span className="mkt-num"><strong>{formatUsd(t.price)}</strong><Change value={t.change24h} /></span>
                </MaybeLink>
              </li>
            ))}
          </ul>
        </section>

        <section className="mkt-card mkt-picks" aria-labelledby="mkt-picks-title">
          <header>
            <h2 id="mkt-picks-title" className="panel-kicker">Top inflows · 24h</h2>
          </header>
          {inflows.length ? (
            <ol>
              {inflows.map((t, i) => (
                <li key={t.id}>
                  <MaybeLink token={t}>
                    <span className="mkt-rank">{i + 1}</span>
                    <TokenLogo token={t} size="sm" />
                    <span className="mkt-name"><strong>${t.symbol}</strong><small>{t.name}</small></span>
                    <span className="mkt-num"><strong className="positive">{signedMoney(t.netFlow24h)}</strong><small>{formatCount(t.holders)} LPs</small></span>
                  </MaybeLink>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mkt-empty">No DTF took in net deposits in the last 24 hours.</p>
          )}
        </section>
      </div>

      <section className="mkt-rankings" aria-labelledby="mkt-rankings-title">
        <div className="mkt-rank-head">
          <h2 id="mkt-rankings-title">Token rankings</h2>
        </div>
        <div className="mkt-categories" role="group" aria-label="Category">
          {MARKET_CATEGORIES.map((c) => (
            <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label} <span>{counts.get(c.id) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="dtf-toolbar">
          <div className="dtf-filters">
            <div className="dtf-segment" role="group" aria-label="Sort tokens">
              {sorts.map((s) => (
                <button key={s.id} aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="dtf-toolbar-end">
            <div className="dtf-segment" role="group" aria-label="Change period">
              {(["24H", "7D"] as Range[]).map((value) => (
                <button key={value} aria-pressed={range === value} onClick={() => setRange(value)}>{value}</button>
              ))}
            </div>
            <div className="mkt-filter-wrap" ref={filtersRef}>
              <button className="dtf-mine" aria-expanded={filtersOpen} aria-haspopup="dialog" aria-pressed={activeFilters > 0} onClick={() => setFiltersOpen((o) => !o)}>
                <Funnel size={15} /> Filters{activeFilters > 0 && <span>{activeFilters}</span>}
              </button>
              {filtersOpen && (
                <div className="mkt-filters" role="dialog" aria-label="Filters">
                  <fieldset>
                    <legend>Market cap</legend>
                    {capFilters.map((f) => (
                      <label key={f.id}><input type="radio" name="mkt-cap" checked={minCap === f.id} onChange={() => setMinCap(f.id)} /> {f.label}</label>
                    ))}
                  </fieldset>
                  <fieldset>
                    <legend>Age</legend>
                    {ageFilters.map((f) => (
                      <label key={f.id}><input type="radio" name="mkt-age" checked={age === f.id} onChange={() => setAge(f.id)} /> {f.label}</label>
                    ))}
                  </fieldset>
                  <button className="text-link" disabled={!activeFilters} onClick={() => { setMinCap(0); setAge("any"); }}>Clear filters</button>
                </div>
              )}
            </div>
            <label className="dtf-search">
              <MagnifyingGlass size={16} />
              <span className="sr-only">Search tokens</span>
              <input type="search" placeholder="Search name or $ticker" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
        </div>
        <p className="mkt-summary">
          {[
            MARKET_CATEGORIES.find((c) => c.id === category)?.label,
            sorts.find((s) => s.id === sort)?.label,
            range,
            network !== "All Chains" ? network : null,
            activeFilters ? `${activeFilters} filter${activeFilters > 1 ? "s" : ""} applied` : "No filters applied",
            `${ranked.length} token${ranked.length === 1 ? "" : "s"}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {ranked.length ? (
          <div className="dtf-table-wrap">
            <table className="dtf-table mkt-table">
              <thead>
                <tr>
                  <th scope="col">Token / Age</th>
                  <th scope="col" className="numeric">Price</th>
                  <th scope="col" className="numeric">{range} change</th>
                  <th scope="col" className="numeric">Market cap</th>
                  <th scope="col" className="numeric">24H vol / Net</th>
                  <th scope="col" className="numeric">Liquidity</th>
                  <th scope="col" className="numeric">{category === "DTF" ? "LPs" : "Holders"}</th>
                  <th scope="col" className="numeric">Last 7D</th>
                  <th scope="col"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((t) => (
                  <MarketRow key={t.id} token={t} range={range} onOpen={hrefFor(t) ? () => router.push(hrefFor(t)!) : undefined} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No tokens match" description="Try another category, search, or clear the filters." />
        )}
      </section>

      <p className="dtf-footnote">
        DTF token price is the value of one DTF token, $1.00 at launch. Net is deposits minus withdrawals for DTFs and buy minus sell volume for reference tokens. Reference tokens are not tradable here.
      </p>
    </>
  );
}

function MarketRow({ token: t, range, onOpen }: { token: MarketToken; range: Range; onOpen?: () => void }) {
  const href = hrefFor(t);
  return (
    <tr onClick={onOpen} className={onOpen ? "" : "static"}>
      <td>
        <span className="dtf-row-name">
          <TokenLogo token={t} />
          <span>
            {href ? (
              <Link className="dtf-row-link" href={href} onClick={(event) => event.stopPropagation()}>${t.symbol}</Link>
            ) : (
              <strong className="dtf-row-link">${t.symbol}</strong>
            )}
            {isReferenceToken(t) && <span className="mkt-ref-tag">Reference</span>}
            <small>
              {t.name} · <span className={`mkt-cat ${t.category.toLowerCase()}`}>{categoryLabel[t.category]}</span> · <NetworkIcon network={t.network} size={11} /> · <span title={`${daysLabel(t.ageDays)} old`}>{ageShort(t.ageDays)}</span>
            </small>
          </span>
        </span>
      </td>
      <td className="numeric">{formatUsd(t.price)}</td>
      <td className="numeric"><Change value={range === "24H" ? t.change24h : t.change7d} /></td>
      <td className="numeric">{formatUsdCompact(t.marketCap)}</td>
      <td className="numeric">
        <span className="mkt-stack">
          <span>{formatUsdCompact(t.volume24h)}</span>
          <small className={t.netFlow24h < 0 ? "negative" : "positive"}>{signedMoney(t.netFlow24h)}</small>
        </span>
      </td>
      <td className="numeric">{formatUsdCompact(t.liquidity)}</td>
      <td className="numeric">
        <span className="mkt-stack">
          <span>{compactCount(t.holders)}</span>
          <small className={t.holdersChange24h < 0 ? "negative" : "positive"}>{formatSignedPct(t.holdersChange24h)}</small>
        </span>
      </td>
      <td className="numeric"><Sparkline values={t.spark} /></td>
      <td className="dtf-row-caret">{href && <CaretRight size={14} aria-hidden="true" />}</td>
    </tr>
  );
}
