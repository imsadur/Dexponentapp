"use client";
import {
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  CaretRight,
  Copy,
  Info,
  SealCheck,
  SealWarning,
  LinkSimple,
  ShareNetwork,
  TelegramLogo,
  Wallet,
  XLogo,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DTF_RANGES,
  ageInDays,
  demoHash,
  dtfStats,
  dtfActivity,
  dtfAllocation,
  dtfContract,
  dtfDirectory,
  dtfDocuments,
  dtfHistory,
  dtfLongDescription,
  dtfReturn24h,
  dtfSeries,
  dtfUtilization,
  explorerUrl,
  maskAddress,
  txExplorerUrl,
  managerSummary,
  similarDtfs,
  type DtfMetric,
  type DtfRange,
  type PublicDtf,
  type SeriesPoint,
} from "@/domain/dtf";
import {
  MIN_DEPOSIT,
  applyDeposit,
  applyWithdraw,
  balanceOf,
  depositError,
  isLocked,
  parseAmount,
  withdrawError,
} from "@/domain/dtf-portfolio";
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
import { isManagedFarm, lpRow, type LpRow } from "@/domain/positions";
import { farmDetailHref, strategyHref } from "@/domain/routes";
import { DtfChart } from "./dtf-chart";
import {
  AssetStack,
  DtfLogo,
  DtfAge,
  UtilizationBar,
  signedPct,
  tokenAmount,
  typeLabel,
} from "./dtf-shared";
import { useApp } from "./provider";
import { useDtfPortfolio } from "./use-dtf-portfolio";
import { Missing, Pct, ReturnCell, Signed } from "./positions";
import { AssetIcon, EmptyState, InfoTip, LabelTip, NetworkIcon, Tip } from "./ui";

const withdrawHelp = (dtf: PublicDtf) =>
  `${dtf.lockupDays > 0 ? `Each deposit unlocks ${dtf.lockupDays} days after it is made; a new deposit restarts the lock. ` : ""}Paid from the ${dtf.bufferPct}% buffer. Larger requests are paid as the manager unwinds positions.`;

const shortHash = (value: string, start = 6, end = 4) => `${value.slice(0, start)}…${value.slice(-end)}`;
const dateLabel = (launchedAt: string) => formatDate(launchedAt);

export function DtfDetail({ id }: { id: string }) {
  const app = useApp();
  const dtfs = useMemo(() => dtfDirectory(app.farms, app.profile.name), [app.farms, app.profile.name]);
  const dtf = dtfs.find((d) => d.id === id);
  if (!app.ready) return <div className="dtfd-loading" aria-busy="true"><div className="skeleton" /></div>;
  if (!dtf)
    return (
      <EmptyState
        title="DTF not found"
        description="This DTF may have been retired, or the link is incomplete."
        href="/app/strategies/"
        label="Explore DTFs"
      />
    );
  return <DtfProfile key={dtf.id} dtf={dtf} dtfs={dtfs} />;
}

function useCopy() {
  const app = useApp();
  return async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      app.toast(`${what} copied.`);
    } catch {
      app.toast(`Couldn't copy the ${what.toLowerCase()}. Select it and copy manually.`);
    }
  };
}

function ShareMenu({ title }: { title: string }) {
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const url = () => window.location.href;
  const text = `${title} on Dexponent`;
  function openWindow(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  }
  async function nativeShare() {
    try {
      await navigator.share({ title: text, url: url() });
    } catch {
      /* dismissed by the user */
    }
    setOpen(false);
  }
  return (
    <div className="dtfd-share-wrap" ref={ref}>
      <button
        className="button small dtfd-share-btn"
        aria-label="Share this DTF"
        title="Share"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <ShareNetwork size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="dtfd-share-menu" id={menuId} role="menu">
          <button role="menuitem" onClick={() => { copy(url(), "Link"); setOpen(false); }}><LinkSimple size={16} /> Copy link</button>
          <button role="menuitem" onClick={() => openWindow(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url())}`)}><XLogo size={16} /> Share on X</button>
          <button role="menuitem" onClick={() => openWindow(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(text)}`)}><TelegramLogo size={16} /> Share on Telegram</button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button role="menuitem" onClick={nativeShare}><ShareNetwork size={16} /> More options…</button>
          )}
        </div>
      )}
    </div>
  );
}

type Panel = "position" | "manage";

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const action = params.get("action");
  return {
    view: view === "manage" ? "manage" : view === "position" ? "position" : null,
    action: action === "withdraw" ? "withdraw" : action === "deposit" ? "deposit" : null,
  } as { view: Panel | null; action: Mode | null };
}

function DtfProfile({ dtf, dtfs }: { dtf: PublicDtf; dtfs: PublicDtf[] }) {
  const app = useApp();
  const { portfolio, save, connected, loaded } = useDtfPortfolio();
  const [now, setNow] = useState(() => Date.now());
  const history = useMemo(() => dtfHistory(dtf, now), [dtf, now]);
  const stats = useMemo(() => dtfStats(dtf, now), [dtf, now]);
  const contract = dtfContract(dtf);
  const ret24h = useMemo(() => dtfReturn24h(dtf, now), [dtf, now]);
  const managedIds = useMemo(() => new Set(app.farms.filter(isManagedFarm).map((f) => f.id)), [app.farms]);
  // Manager data is gated on this workspace owning the DTF, never on the URL.
  const farm = dtf.farmId ? app.farms.find((f) => f.id === dtf.farmId && isManagedFarm(f)) : undefined;
  const lp = useMemo(() => lpRow(dtf, portfolio, now, managedIds), [dtf, portfolio, now, managedIds]);
  const isLP = connected && (Boolean(portfolio.positions[dtf.id]) || lp.entries.length > 0);
  const [params, setParams] = useState<{ view: Panel | null; action: Mode | null }>({ view: null, action: null });
  useEffect(() => setParams(readParams()), []);

  return (
    <div className="dtfd">

      <div className="dtfd-layout">
        <div className="dtfd-primary">
          <header className="dtfd-head">
            <div className="dtfd-title">
              <DtfLogo dtf={dtf} size="lg" />
              <div>
                <h1>{dtf.name}</h1>
                <div className="dtfd-tags">
                  <span className="dtf-ticker">${dtf.symbol}</span>
                  <span className={`dtf-type ${dtf.type.toLowerCase()}`}>{typeLabel[dtf.type]}</span>
                  <span className="dtfd-network" title={dtf.network} role="img" aria-label={`Network: ${dtf.network}`}>
                    <NetworkIcon network={dtf.network} size={18} />
                  </span>
                </div>
              </div>
              <ShareMenu title={dtf.name} />
            </div>
            <dl className="dtfd-meta">
              <div>
                <dt>CA:</dt>
                <dd>
                  <ContractLink network={dtf.network} address={contract} />
                </dd>
              </div>
              <div><dt>Deposit</dt><dd><AssetIcon symbol={dtf.baseAsset} size={16} /> {dtf.baseAsset}</dd></div>
              <div><dt>Holds</dt><dd><AssetStack assets={dtf.assets} max={4} size={16} /> {formatCount(dtf.assets.length)} token{dtf.assets.length === 1 ? "" : "s"}</dd></div>
              <div>
                <dt><LabelTip label="NAV">Value of one ${dtf.symbol} share in USD. Started at $1.00 at launch.</LabelTip></dt>
                <dd className="dtfd-nav">{stats.nav === null ? MISSING : `$${stats.nav.toFixed(4)}`}</dd>
              </div>
              <div className="dtfd-updated"><UpdatedAgo at={now} /></div>
            </dl>
          </header>

          <dl className="dtfd-stats three">
            <div>
              <dt>
                <LabelTip label="TVL">Total value deposited by LPs, at the latest NAV. Not the manager&apos;s own funds.</LabelTip>
              </dt>
              <dd><Tip tip={formatUsdPrecise(dtf.tvl)}>{formatUsdCompact(dtf.tvl)}</Tip></dd>
            </div>
            <div>
              <dt>
                <LabelTip label="Return">
                  {lp.ret.kind === "apy"
                    ? "APY from the last 7 days, after fees. Small figure is the last 24h. Not guaranteed."
                    : "Return since launch, after fees. Not annualised: under 90 days old. Small figure is the last 24h."}
                </LabelTip>
              </dt>
              <dd className="dtfd-return">
                <span className={lp.ret.kind === "apy" ? "" : toneOf(lp.ret.value) ?? ""}>
                  {lp.ret.value === null ? MISSING : lp.ret.kind === "apy" ? formatPct(lp.ret.value) : formatSignedPct(lp.ret.value)}
                </span>
                <small className={toneOf(ret24h) ?? ""} aria-label={`${formatSignedPct(ret24h)} in the last 24 hours`}>{formatSignedPct(ret24h)}</small>
              </dd>
            </div>
            <div>
              <dt>
                <LabelTip label="Target APR">Manager&apos;s yearly target. Returns are not guaranteed.</LabelTip>
              </dt>
              <dd>{formatPct(dtf.targetApr)}</dd>
            </div>
          </dl>

          <div className="dtfd-main">
            <PerformanceSection dtf={dtf} history={history} />
            <UtilizationSummary dtf={dtf} />
            <AllocationSection dtf={dtf} />
            <DetailsSection dtf={dtf} contract={contract} now={now} />
            <ActivitySection dtf={dtf} now={now} />
          </div>
        </div>

        <div className="dtfd-side">
          <div className="dtfd-trade">
            <TradeCard
                  key={params.action ?? "deposit"}
                  dtf={dtf}
                  nav={stats.nav}
                  held={lp.value}
                  initialMode={params.action ?? "deposit"}
                  connected={connected}
                  loaded={loaded}
                  portfolio={portfolio}
                  save={save}
                  onRecorded={() => setNow(Date.now())}
                />
            {isLP && <PositionCard dtf={dtf} row={lp} />}
          </div>
          <div className="dtfd-about">
            {/* Manage link only for the DTF's own manager; gated on workspace ownership, not the URL. */}
            <ManagerCard dtfs={dtfs} manager={dtf.manager} manageHref={farm ? farmDetailHref(farm.id) : undefined} />
            <SimilarCard items={similarDtfs(dtfs, dtf)} />
          </div>
        </div>
      </div>

    </div>
  );
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="dtfd-desc">
      <p id={id} className={open ? "open" : ""}>{text}</p>
      <button className="text-link" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

/* ------------------------------- Performance ------------------------------ */

const metricTabs: { id: DtfMetric; label: string }[] = [
  { id: "return", label: "Return" },
  { id: "tvl", label: "TVL" },
  { id: "apy", label: "APY" },
];
const rangeText: Record<DtfRange, string> = { "24H": "past 24 hours", "7D": "past 7 days", "30D": "past 30 days", ALL: "time since launch" };

function PerformanceSection({ dtf, history }: { dtf: PublicDtf; history: ReturnType<typeof dtfHistory> }) {
  const [metric, setMetric] = useState<DtfMetric>("return");
  // Young DTFs default to their whole history; older ones to the last 30 days.
  const [range, setRange] = useState<DtfRange>(() => (ageInDays(dtf.launchedAt) < 90 ? "ALL" : "30D"));
  const [hover, setHover] = useState<SeriesPoint | null>(null);
  const points = useMemo(() => dtfSeries(history, metric, range), [history, metric, range]);
  const last = points.at(-1);
  const first = points[0];
  const target = useMemo(() => {
    if (points.length < 2 || metric === "tvl") return undefined;
    const start = points[0];
    const end = points[points.length - 1];
    if (metric === "apy")
      return { points: [{ time: start.time, value: dtf.targetApr }, { time: end.time, value: dtf.targetApr }], label: `Target APR ${dtf.targetApr.toFixed(2)}%` };
    // Return the DTF would have earned growing exactly at its target APR over this range.
    const pace = (time: number) => (dtf.targetApr / 365) * ((time - start.time) / 86_400_000);
    const line = points.map((p) => ({ time: p.time, value: pace(p.time) }));
    return { points: line, label: `Target pace ${signedPct(pace(end.time))}` };
  }, [points, metric, dtf.targetApr]);
  const shown = hover ?? last;
  const format = (value: number) =>
    metric === "tvl" ? formatUsdCompact(value) : metric === "return" ? signedPct(value) : `${value.toFixed(2)}%`;
  const tone = metric === "tvl" ? (last && first && last.value < first.value ? "down" : "up") : (last?.value ?? 0) < 0 ? "down" : "up";
  const tvlChange = metric === "tvl" && first && shown ? (shown.value / first.value - 1) * 100 : null;
  const when = hover
    ? new Date(hover.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: range === "24H" || range === "7D" ? "numeric" : undefined, minute: range === "24H" ? "2-digit" : undefined })
    : metric === "apy" ? "trailing 7 days, annualised" : rangeText[range];

  return (
    <section className="dtfd-section" aria-labelledby="dtf-performance">
      <div className="dtfd-section-head">
        <h2 id="dtf-performance">Performance</h2>
      </div>
      <div className="dtfd-chart-card">
        <div className="dtfd-chart-top">
          <div className="segmented" role="group" aria-label="Chart metric">
            {metricTabs.map((tab) => (
              <button key={tab.id} className={metric === tab.id ? "active" : ""} aria-pressed={metric === tab.id} onClick={() => setMetric(tab.id)}>{tab.label}</button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Time range">
            {DTF_RANGES.map((value) => (
              <button key={value} className={range === value ? "active" : ""} aria-pressed={range === value} onClick={() => setRange(value)}>{value === "ALL" ? "All" : value}</button>
            ))}
          </div>
        </div>
        {points.length > 1 && shown ? (
          <>
            <div className="dtfd-chart-head" aria-live="polite">
              <span>{metric === "return" ? "Return" : metric === "tvl" ? "TVL" : "APY"}</span>
              <strong className={metric === "tvl" ? "" : shown.value < 0 ? "negative" : "positive"}>{format(shown.value)}</strong>
              <small>
                {tvlChange !== null && <b className={tvlChange < 0 ? "negative" : "positive"}>{signedPct(tvlChange)} </b>}
                {when}
              </small>
            </div>
            <DtfChart
              points={points}
              tone={tone}
              format={format}
              intraday={range === "24H" || range === "7D"}
              label={`${metricTabs.find((t) => t.id === metric)?.label} over the ${rangeText[range]}`}
              target={target}
              onHover={setHover}
            />
          </>
        ) : (
          <div className="dtfd-chart-empty">
            <Info size={18} />
            <strong>Not enough history yet</strong>
            <span>{metric === "apy" ? "APY needs 7 days of history." : "This DTF launched recently. Try a shorter range."}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------- Allocation ------------------------------ */

const allocationColors = ["var(--accent)", "var(--purple)", "var(--pink)", "var(--warning)", "#61a5fa", "#a78bfa", "#2dd4bf", "#fb923c"];

function AllocationSection({ dtf }: { dtf: PublicDtf }) {
  const rows = useMemo(() => dtfAllocation(dtf), [dtf]);
  const hasRates = rows.some((row) => row.apy !== null);
  const color = (index: number, rowId: string) => (rowId === "idle" ? "var(--text-muted)" : allocationColors[index % allocationColors.length]);
  return (
    <section className="dtfd-section" aria-labelledby="dtf-allocation">
      <div className="dtfd-section-head">
        <h2 id="dtf-allocation">Allocation</h2>
      </div>
      <div className="dtfd-table-wrap">
        <table className="dtfd-table">
          <thead>
            <tr>
              <th scope="col">Market</th>
              {hasRates && <th scope="col" className="numeric">APY</th>}
              <th scope="col" className="numeric">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td>
                  <span className="dtfd-market">
                    <i className="dtfd-swatch" style={{ background: color(i, row.id) }} aria-hidden="true" />
                    <AssetIcon symbol={row.asset} size={26} />
                    <span><strong>{row.label}</strong><small>{row.venue}</small></span>
                  </span>
                </td>
                {hasRates && <td className="numeric">{row.apy === null ? <span className="muted" title={row.id === "idle" ? "Idle capital earns no yield" : "Spot holdings earn price movement, not yield"}>—</span> : `${row.apy.toFixed(2)}%`}</td>}
                <td className="numeric">
                  <span className="dtfd-share"><strong>{row.share.toFixed(2)}%</strong><small>{formatUsdCompact((row.share / 100) * dtf.tvl)}</small></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="dtfd-note"><Info size={13} /> {hasRates ? "Market rates are shown before DTF fees." : "Spot holdings earn price movement rather than yield."}</p>
    </section>
  );
}

function UtilizationSummary({ dtf }: { dtf: PublicDtf }) {
  const used = dtfUtilization(dtf);
  return (
    <div className="dtfd-util">
      <dl>
        <div><dt>Deployed</dt><dd>{formatUsdCompact((used / 100) * dtf.tvl)}</dd></div>
        <div><dt>Idle</dt><dd>{formatUsdCompact(((100 - used) / 100) * dtf.tvl)}</dd></div>
        <div><dt>Minimum buffer</dt><dd>{dtf.bufferPct}% · {formatUsdCompact((dtf.bufferPct / 100) * dtf.tvl)}</dd></div>
      </dl>
      <UtilizationBar dtf={dtf} />
      <p className="dtfd-note"><Info size={13} /> At least {dtf.bufferPct}% of TVL stays idle to pay withdrawals.</p>
    </div>
  );
}

const docSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function ContractLink({ network, address, start = 6, end = 4 }: { network: string; address: string; start?: number; end?: number }) {
  const href = explorerUrl(network, address);
  const text = shortHash(address, start, end);
  if (!href) return <code className="dtfd-ca">{text}</code>;
  return (
    <a className="dtfd-ca" href={href} target="_blank" rel="noreferrer" title={`View on ${network} explorer`}>
      <code>{text}</code>
      <ArrowSquareOut size={12} aria-hidden="true" />
      <span className="sr-only"> (opens {network} explorer in a new tab)</span>
    </a>
  );
}

function DetailsSection({ dtf, contract, now }: { dtf: PublicDtf; contract: string; now: number }) {
  const app = useApp();
  const copy = useCopy();
  const uploads = dtf.farmId ? app.farms.find((farm) => farm.id === dtf.farmId)?.documents : undefined;
  const docs = dtfDocuments(dtf, uploads);
  return (
    <section className="dtfd-section" id="dtf-terms" aria-labelledby="dtf-details-title">
      <div className="dtfd-section-head"><h2 id="dtf-details-title">DTF details</h2></div>
      <Description text={dtfLongDescription(dtf)} />
      <div className="dtfd-groups">
        <DetailGroup title="Token">
          <div><dt>Token name</dt><dd>{dtf.name}</dd></div>
          <div><dt>Ticker</dt><dd className="dtf-ticker">${dtf.symbol}</dd></div>
          <div><dt>Network</dt><dd className="dtfd-inline"><NetworkIcon network={dtf.network} size={14} /> {dtf.network}</dd></div>
          <div>
            <dt>Contract</dt>
            <dd className="dtfd-contract-row">
              <ContractLink network={dtf.network} address={contract} />
              <button className="dtfd-icon-btn" aria-label="Copy contract address" title="Copy" onClick={() => copy(contract, "Contract address")}><Copy size={13} /></button>
            </dd>
          </div>
        </DetailGroup>
        <DetailGroup title="Terms">
          <div id="dtf-fees"><dt><LabelTip label="Management fee">Charged yearly on TVL.</LabelTip></dt><dd>{formatPct(dtf.managementFee, dtf.managementFee % 1 ? 2 : 0)} / year</dd></div>
          <div><dt><LabelTip label="Performance fee">Share of positive yield taken by the manager. Returns shown are after fees.</LabelTip></dt><dd>{formatPct(dtf.performanceFee, dtf.performanceFee % 1 ? 2 : 0)} of gains</dd></div>
          <div><dt>Minimum deposit</dt><dd>{formatCount(MIN_DEPOSIT)} {dtf.baseAsset}</dd></div>
        </DetailGroup>
        <DetailGroup title="Liquidity">
          <div>
            <dt><LabelTip label="Withdrawals">{withdrawHelp(dtf)}</LabelTip></dt>
            <dd>{dtf.lockupDays > 0 ? `${formatCount(dtf.lockupDays)}-day lock-in` : "Anytime"}</dd>
          </div>
          <div><dt><LabelTip label="Liquidity buffer">Share of TVL always kept idle to pay withdrawals.</LabelTip></dt><dd>{dtf.bufferPct}% minimum</dd></div>
          <div><dt>Deposits</dt><dd>Open · no cap</dd></div>
        </DetailGroup>
        <DetailGroup title="Trust">
          <div>
            <dt>Audit</dt>
            <dd>
              {dtf.audit ? (
                <span className="dtfd-audit"><SealCheck size={15} weight="fill" aria-hidden="true" /> {dtf.audit.by}</span>
              ) : (
                <span className="dtfd-audit none"><SealWarning size={15} aria-hidden="true" /> Pending</span>
              )}
            </dd>
          </div>
          <div><dt>Total LPs</dt><dd>{formatCount(dtf.lps)}</dd></div>
          <div><dt>Age</dt><dd><Tip tip={`Launched ${dateLabel(dtf.launchedAt)}`}><DtfAge launchedAt={dtf.launchedAt} now={now} /></Tip></dd></div>
          <div><dt>Documents</dt><dd>{docs.length ? <a className="text-link" href="#dtf-docs">{formatCount(docs.length)} file{docs.length === 1 ? "" : "s"}</a> : MISSING}</dd></div>
        </DetailGroup>
      </div>
      <div className="dtfd-docs-block" id="dtf-risks">
        <h3 id="dtf-docs">Documents</h3>
        {docs.length ? (
          <ul className="dtfd-docs">
            {docs.map((doc) => (
              <li key={doc.name}>
                <span className={`dtfd-doc-type ${doc.type.toLowerCase()}`}>{doc.type}</span>
                <span><strong>{doc.name}</strong><small>{docSize(doc.size)}</small></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dtfd-empty-line">The manager hasn&apos;t published any documents yet.</p>
        )}
      </div>
    </section>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="dtfd-group" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

/** "Updated just now" / "Updated 4m ago", ticking while the page is open. */
function UpdatedAgo({ at }: { at: number }) {
  const [clock, setClock] = useState(at);
  useEffect(() => {
    setClock(Date.now());
    const id = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [at]);
  const minutes = Math.floor(Math.max(0, clock - at) / 60_000);
  const text = minutes < 1 ? "just now" : minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`;
  return <span className="dtfd-updated-text">Updated {text}</span>;
}

/* -------------------------------- Activity -------------------------------- */

const ACTIVITY_PAGE = 6;

function activityTime(time: number, now: number) {
  const date = new Date(time);
  const recent = now - time < 6 * 86_400_000;
  return date.toLocaleString("en-US", recent
    ? { weekday: "short", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function TxLink({ network, hash }: { network: string; hash: string }) {
  const href = txExplorerUrl(network, hash);
  const text = shortHash(hash);
  if (!href) return <code>{text}</code>;
  return (
    <a className="dtfd-ca dtfd-tx" href={href} target="_blank" rel="noreferrer" title={`View on ${network} explorer`}>
      <code>{text}</code>
      <ArrowSquareOut size={12} aria-hidden="true" />
      <span className="sr-only"> (opens {network} explorer in a new tab)</span>
    </a>
  );
}

function ActivitySection({ dtf, now }: { dtf: PublicDtf; now: number }) {
  const items = useMemo(() => dtfActivity(dtf, now), [dtf, now]);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / ACTIVITY_PAGE));
  const shown = items.slice(page * ACTIVITY_PAGE, page * ACTIVITY_PAGE + ACTIVITY_PAGE);
  return (
    <section className="dtfd-section" aria-labelledby="dtf-activity">
      <div className="dtfd-section-head">
        <h2 id="dtf-activity">LP activity</h2>
      </div>
      {items.length ? (
        <>
          <div className="dtfd-table-wrap">
            <table className="dtfd-table dtfd-activity">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">LP</th>
                  <th scope="col" className="numeric">Amount</th>
                  <th scope="col" className="numeric">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td>{activityTime(item.time, now)}</td>
                    <td>
                      <span className={`dtfd-action ${item.type === "Deposit" ? "in" : "out"}`}>
                        {item.type === "Deposit" ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                        {item.type}
                      </span>
                    </td>
                    <td><code aria-label="LP wallet, masked">{maskAddress(item.wallet)}</code></td>
                    <td className="numeric">
                      <span className={item.type === "Deposit" ? "positive" : "negative"}>
                        {item.type === "Deposit" ? "+" : "−"}{tokenAmount(item.amount, dtf.baseAsset)}
                      </span>
                    </td>
                    <td className="numeric"><TxLink network={dtf.network} hash={item.hash} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dtfd-pager">
            <button className="button small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {page + 1} of {pages}</span>
            <button className="button small" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </>
      ) : (
        <div className="dtfd-chart-empty"><strong>No LP activity yet</strong></div>
      )}
    </section>
  );
}

/* ------------------------------ Side column ------------------------------- */

function PositionCard({ dtf, row }: { dtf: PublicDtf; row: LpRow }) {
  const withdrawableDiffers = row.lockedUntil && row.value !== null && row.value > 0;
  return (
    <section className="dtfd-card dtfd-position" aria-labelledby="dtf-position">
      <div className="dtfd-card-head">
        <h2 id="dtf-position" className="eyebrow">YOUR POSITION</h2>
      </div>
      <div className="dtfd-position-top">
        <strong className="dtfd-position-value">
          {row.value === null ? (
            <Missing />
          ) : (
            <Tip tip={row.shares !== null && row.nav !== null ? `${row.shares.toLocaleString("en-US", { maximumFractionDigits: 6 })} shares × ${formatUsdPrecise(row.nav)} NAV` : formatUsdPrecise(row.value)}>
              {formatUsd(row.value)}
            </Tip>
          )}
        </strong>
        {!row.closed && (
          <small>
            <Signed value={row.change24hUsd} /> <Pct value={row.change24hPct} /> 24h
          </small>
        )}
      </div>
      <dl>
        <div>
          <dt>Net deposited <InfoTip label="About net deposited">Deposited {formatUsd(row.deposited)} − withdrawn {formatUsd(row.withdrawn)}</InfoTip></dt>
          <dd>{formatUsd(row.netDeposited)}</dd>
        </div>
        <div>
          <dt>Total P&amp;L <InfoTip label="About total P&L">Value + withdrawn − deposited. Realised {formatSignedUsd(row.realizedPnl)} · unrealised {formatSignedUsd(row.unrealizedPnl)}</InfoTip></dt>
          <dd className={toneOf(row.totalPnl) ?? ""}>
            {formatSignedUsd(row.totalPnl)} <small>{formatSignedPct(row.totalPnlPct)}</small>
          </dd>
        </div>
        {withdrawableDiffers && (
          <div>
            <dt>Withdrawable</dt>
            <dd>{formatUsd(0)} · unlocks {formatDate(row.lockedUntil!)}</dd>
          </div>
        )}
        <div>
          <dt>Share of DTF</dt>
          <dd>{row.shareOfDtf === null ? MISSING : `${row.shareOfDtf < 0.01 ? "<0.01" : row.shareOfDtf.toFixed(2)}%`}</dd>
        </div>
        <div>
          <dt>Return</dt>
          <dd><ReturnCell ret={row.ret} /></dd>
        </div>
      </dl>
    </section>
  );
}

type Mode = "deposit" | "withdraw";

const unlockDate = (iso: string) => formatDate(iso);

function TradeCard({
  dtf,
  nav,
  held: heldValue,
  initialMode,
  connected,
  loaded,
  portfolio,
  save,
  onRecorded,
}: {
  dtf: PublicDtf;
  nav: number | null;
  held: number | null;
  initialMode: Mode;
  onRecorded: () => void;
  /** A wallet is connected. Depositing never needs a sign-in. */
  connected: boolean;
  loaded: boolean;
  portfolio: ReturnType<typeof useDtfPortfolio>["portfolio"];
  save: ReturnType<typeof useDtfPortfolio>["save"];
}) {
  const app = useApp();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const errorId = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const asset = dtf.baseAsset;
  const position = portfolio.positions[dtf.id];
  const balance = balanceOf(portfolio, asset);
  // A missing NAV means the position cannot be priced: block withdrawals instead of treating it as $0.
  const priceMissing = heldValue === null;
  const held = heldValue ?? 0;
  const amount = parseAmount(text);
  const error =
    mode === "deposit"
      ? depositError(amount, { balance, asset })
      : priceMissing
        ? "Price unavailable"
        : withdrawError(amount, held, { lockedUntil: position?.lockedUntil });
  // "Enter an amount" is the resting state, not a mistake: don't paint the input red for it.
  const invalid = Boolean(error) && text !== "" && error !== "Enter an amount";
  const locked = mode === "withdraw" && isLocked(position);
  const pickBase = mode === "deposit" ? balance : held;
  const verb = mode === "deposit" ? "Deposit" : "Withdraw";

  function switchMode(next: Mode) {
    if (pending) return;
    setMode(next);
    setText("");
  }
  function onChange(raw: string) {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const [whole, ...rest] = cleaned.split(".");
    setText(rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole);
  }
  function pick(fraction: number) {
    const value = Math.floor(pickBase * fraction * 100) / 100;
    setText(value > 0 ? value.toFixed(2) : "");
  }
  function submit() {
    if (error || pending) {
      inputRef.current?.focus();
      return;
    }
    setPending(true);
    const current = mode;
    const value = amount;
    timer.current = window.setTimeout(() => {
      try {
        const now = Date.now();
        const ref = demoHash(`${dtf.id}:${current}:${now}`);
        save(
          current === "deposit"
            ? applyDeposit(portfolio, dtf, value, now, { nav, ref })
            : applyWithdraw(portfolio, dtf, value, now, { nav, ref }),
        );
        onRecorded();
        app.notify({
          kind: "success",
          title: current === "deposit" ? "Deposit recorded" : "Withdrawal recorded",
          body: `${tokenAmount(value, asset)} · ${dtf.name}`,
        });
        setText("");
      } catch {
        app.notify({ kind: "error", title: `${current === "deposit" ? "Deposit" : "Withdrawal"} failed`, body: "Nothing was recorded. Allow site storage and try again." });
      } finally {
        setPending(false);
      }
    }, 900);
  }

  let cta: ReactNode;
  if (!connected) {
    cta = (
      <button className="button primary full large" onClick={app.connect} disabled={app.connecting}>
        {app.connecting ? "Check your wallet…" : "Connect wallet"}
      </button>
    );
  } else {
    // No amount yet: keep the action's own label and show it as inactive, not as an error.
    const empty = error === "Enter an amount";
    cta = (
      <button
        className={`button primary full large ${empty ? "idle" : ""}`}
        onClick={submit}
        disabled={!loaded || pending || Boolean(error)}
        aria-describedby={invalid ? errorId : undefined}
      >
        {pending ? <><SpinnerGap size={16} className="spin" /> {mode === "deposit" ? "Depositing…" : "Withdrawing…"}</> : empty ? verb : error ?? verb}
      </button>
    );
  }

  return (
    <section className="dtfd-card dtfd-trade-card" aria-label="Deposit or withdraw">
      <div className="dtfd-trade-tabs" role="tablist" aria-label="Action">
        {(["deposit", "withdraw"] as Mode[]).map((value) => (
          <button key={value} role="tab" aria-selected={mode === value} disabled={pending} onClick={() => switchMode(value)}>
            {value === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        ))}
      </div>

      <div className="dtfd-trade-body">
        <div className="dtfd-amount-top">
          <span className="dtfd-wallet" title={mode === "deposit" ? "Wallet balance" : "Your position"}>
            <Wallet size={15} aria-hidden="true" />
            <span className="sr-only">{mode === "deposit" ? "Wallet balance" : "Your position"}</span>
            {connected ? tokenAmount(mode === "deposit" ? balance : held, asset) : "—"}
          </span>
          {connected && (
            <span className="dtfd-picks">
              <button onClick={() => pick(1)} disabled={pickBase <= 0 || pending || locked}>MAX</button>
              <button onClick={() => pick(0.5)} disabled={pickBase <= 0 || pending || locked}>50%</button>
            </span>
          )}
        </div>
        <div className={`dtfd-amount ${invalid ? "invalid" : ""}`}>
          <input
            ref={inputRef}
            aria-label={`Amount of ${asset} to ${mode}`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={text}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            disabled={!connected || pending || locked}
          />
          <span className="dtfd-token"><AssetIcon symbol={asset} size={20} /> {asset}</span>
        </div>
        {invalid && <span className="sr-only" id={errorId} role="alert">{error}</span>}
        {app.walletError && !app.wallet && (
          <p className="dtfd-error" role="alert">
            <WarningCircle size={14} /> {app.walletError.startsWith("No browser wallet") ? "No wallet found." : app.walletError}{" "}
            <button className="text-link" onClick={app.connectDemo}>Use preview wallet</button>
          </p>
        )}

        <dl className="dtfd-summary">
          {Number.isFinite(amount) && amount > 0 && nav !== null && !error && (
            <div>
              <dt>{mode === "deposit" ? "You receive" : "Shares redeemed"}</dt>
              <dd>
                <Tip tip={`At ${formatUsdPrecise(nav)} NAV per share`}>
                  ≈ {(amount / nav).toLocaleString("en-US", { maximumFractionDigits: 4 })} ${dtf.symbol}
                </Tip>
              </dd>
            </div>
          )}
          {mode === "deposit" ? (
            <div><dt>Withdrawals</dt><dd>{dtf.lockupDays > 0 ? `Lock-in ${dtf.lockupDays} days` : "Anytime"}</dd></div>
          ) : (
            <>
              {position?.lockedUntil && locked ? (
                <div><dt>Unlocks</dt><dd>{unlockDate(position.lockedUntil)}</dd></div>
              ) : (
                <div><dt>You receive</dt><dd>{Number.isFinite(amount) && amount > 0 ? `≈ ${tokenAmount(amount, asset)}` : "—"}</dd></div>
              )}
            </>
          )}
        </dl>

        {cta}
        <p className="dtfd-hint center">
          By continuing, I confirm I&apos;ve read the{" "}
          <a href="https://dexponent.com/terms" target="_blank" rel="noopener noreferrer">Terms</a>,{" "}
          <a href="https://docs.dexponent.com/beta-scope-and-risks" target="_blank" rel="noopener noreferrer">Risks</a>, and{" "}
          <a href="https://docs.dexponent.com/fees-and-costs" target="_blank" rel="noopener noreferrer">Fees</a>.
        </p>
      </div>
    </section>
  );
}

function ManagerCard({ dtfs, manager, manageHref }: { dtfs: PublicDtf[]; manager: string; manageHref?: string }) {
  const summary = managerSummary(dtfs, manager);
  const initials = manager.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <section className="dtfd-card" aria-labelledby="dtf-manager">
      <div className="dtfd-card-head">
        <span className="eyebrow">MANAGED BY</span>
        {manageHref && (
          <Link className="button small dtfd-manage-link" href={manageHref}>
            Manage
          </Link>
        )}
      </div>
      <div className="dtfd-manager">
        <span className="dtfd-avatar" aria-hidden="true">{initials}</span>
        <div><h2 id="dtf-manager">{manager}</h2><small>Manager</small></div>
      </div>
      {summary.bio && <p className="dtfd-manager-bio">{summary.bio}</p>}
      <dl className="dtfd-manager-stats">
        <div><dt>DTFs</dt><dd>{formatCount(summary.count)}</dd></div>
        <div><dt>TVL</dt><dd>{formatUsdCompact(summary.tvl)}</dd></div>
        <div><dt>Since</dt><dd>{summary.since}</dd></div>
      </dl>
    </section>
  );
}

function SimilarCard({ items }: { items: PublicDtf[] }) {
  if (!items.length) return null;
  return (
    <section className="dtfd-card" aria-labelledby="dtf-similar">
      <h2 id="dtf-similar" className="dtfd-card-title">Similar DTFs</h2>
      <ul className="dtfd-similar">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={strategyHref(item.id)}>
              <DtfLogo dtf={item} size="sm" />
              <span><strong>{item.name}</strong><small><span className="dtf-ticker">${item.symbol}</span> · {typeLabel[item.type]}</small></span>
              <span className="dtfd-similar-apy"><small>Target APR</small><strong>{formatPct(item.targetApr)}</strong></span>
              <CaretRight size={13} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
