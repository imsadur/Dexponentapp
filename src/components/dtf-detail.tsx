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
  demoHash,
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
  positionValue,
  withdrawError,
  type DtfPosition,
} from "@/domain/dtf-portfolio";
import { strategyHref } from "@/domain/routes";
import { DtfChart } from "./dtf-chart";
import {
  Apy7d,
  AssetStack,
  DtfLogo,
  DtfAge,
  Return24h,
  UtilizationBar,
  signedPct,
  tokenAmount,
  typeLabel,
  usd,
} from "./dtf-shared";
import { useApp } from "./provider";
import { useDtfPortfolio } from "./use-dtf-portfolio";
import { AssetIcon, EmptyState, NetworkIcon, money } from "./ui";

const withdrawHelp = (dtf: PublicDtf) =>
  `Paid straight from the ${dtf.bufferPct}% buffer. Requests larger than the idle balance are paid as the manager unwinds positions.`;

const shortHash = (value: string, start = 6, end = 4) => `${value.slice(0, start)}…${value.slice(-end)}`;
const dateLabel = (launchedAt: string) =>
  new Date(`${launchedAt}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function DtfDetail({ id }: { id: string }) {
  const app = useApp();
  const dtfs = useMemo(() => dtfDirectory(app.farms, app.profile.name), [app.farms, app.profile.name]);
  const dtf = dtfs.find((d) => d.id === id);
  if (!app.ready) return <div className="dtfd-loading" aria-busy="true"><div className="skeleton" /></div>;
  if (!dtf)
    return (
      <EmptyState
        title="Strategy not found"
        description="This DTF may have been retired, or the link is incomplete."
        href="/app/strategies/"
        label="Browse strategies"
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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <ShareNetwork size={15} /> <span>Share</span>
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

function DtfProfile({ dtf, dtfs }: { dtf: PublicDtf; dtfs: PublicDtf[] }) {
  const { portfolio, save, signedIn, loaded } = useDtfPortfolio();
  const copy = useCopy();
  const [now] = useState(() => Date.now());
  const history = useMemo(() => dtfHistory(dtf, now), [dtf, now]);
  const position = portfolio.positions[dtf.id];
  const contract = dtfContract(dtf);
  const ret24h = useMemo(() => dtfReturn24h(dtf, now), [dtf, now]);

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
                  <span className="subtle-label">DEMO</span>
                </div>
              </div>
              <ShareMenu title={dtf.name} />
            </div>
            <dl className="dtfd-meta">
              <div>
                <dt>CA:</dt>
                <dd>
                  <ContractLink network={dtf.network} address={contract} />
                  <button className="dtfd-icon-btn" aria-label="Copy contract address" onClick={() => copy(contract, "Contract address")}><Copy size={13} /></button>
                </dd>
              </div>
              <div><dt>Deposit</dt><dd><AssetIcon symbol={dtf.baseAsset} size={16} /> {dtf.baseAsset}</dd></div>
              <div><dt>Holds</dt><dd><AssetStack assets={dtf.assets} max={4} size={16} /> {dtf.assets.length} token{dtf.assets.length === 1 ? "" : "s"}</dd></div>
            </dl>
          </header>

          <dl className="dtfd-stats">
            <div>
              <dt>Total deposits</dt>
              <dd>{money(dtf.tvl, true)}</dd>
            </div>
            <div>
              <dt>24H return</dt>
              <dd><Return24h value={ret24h} /></dd>
            </div>
            <div>
              <dt>Target APR</dt>
              <dd>{dtf.targetApr.toFixed(2)}%</dd>
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
            <TradeCard dtf={dtf} signedIn={signedIn} loaded={loaded} portfolio={portfolio} save={save} />
            {position && <PositionCard dtf={dtf} position={position} />}
          </div>
          <div className="dtfd-about">
            <ManagerCard dtfs={dtfs} manager={dtf.manager} />
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
const rangeText: Record<DtfRange, string> = { "24H": "past 24 hours", "7D": "past 7 days", "30D": "past 30 days", "90D": "past 90 days" };

function PerformanceSection({ dtf, history }: { dtf: PublicDtf; history: ReturnType<typeof dtfHistory> }) {
  const [metric, setMetric] = useState<DtfMetric>("return");
  const [range, setRange] = useState<DtfRange>("7D");
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
    metric === "tvl" ? money(value, true) : metric === "return" ? signedPct(value) : `${value.toFixed(2)}%`;
  const tone = metric === "tvl" ? (last && first && last.value < first.value ? "down" : "up") : (last?.value ?? 0) < 0 ? "down" : "up";
  const tvlChange = metric === "tvl" && first && shown ? (shown.value / first.value - 1) * 100 : null;
  const when = hover
    ? new Date(hover.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: range === "24H" || range === "7D" ? "numeric" : undefined, minute: range === "24H" ? "2-digit" : undefined })
    : metric === "apy" ? "trailing 7 days, annualised" : rangeText[range];

  return (
    <section className="dtfd-section" aria-labelledby="dtf-performance">
      <div className="dtfd-section-head">
        <h2 id="dtf-performance">Performance</h2>
        <span className="subtle-label">SIMULATED</span>
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
              <button key={value} className={range === value ? "active" : ""} aria-pressed={range === value} onClick={() => setRange(value)}>{value}</button>
            ))}
          </div>
        </div>
        {points.length > 1 && shown ? (
          <>
            <div className="dtfd-chart-head" aria-live="polite">
              <span>{metric === "return" ? "Return" : metric === "tvl" ? "Total deposits" : "APY"}</span>
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
        <span className="subtle-label">DEMO</span>
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
                  <span className="dtfd-share"><strong>{row.share.toFixed(2)}%</strong><small>{usd((row.share / 100) * dtf.tvl)}</small></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="dtfd-note"><Info size={13} /> {hasRates ? "Market rates are shown before DTF fees. " : "Spot holdings earn price movement rather than yield. "}Allocation is illustrative and not read on-chain.</p>
    </section>
  );
}

function UtilizationSummary({ dtf }: { dtf: PublicDtf }) {
  const used = dtfUtilization(dtf);
  return (
    <div className="dtfd-util">
      <dl>
        <div><dt>Deployed by manager</dt><dd>{money((used / 100) * dtf.tvl, true)}</dd></div>
        <div><dt>Idle in DTF</dt><dd>{money(((100 - used) / 100) * dtf.tvl, true)}</dd></div>
        <div><dt>Minimum buffer</dt><dd>{dtf.bufferPct}% · {money((dtf.bufferPct / 100) * dtf.tvl, true)}</dd></div>
      </dl>
      <UtilizationBar dtf={dtf} />
      <p className="dtfd-note"><Info size={13} /> The manager can deploy up to {100 - dtf.bufferPct}% of deposits. At least {dtf.bufferPct}% stays idle in the DTF to pay withdrawals.</p>
    </div>
  );
}

const docSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function ContractLink({ network, address, start = 6, end = 4 }: { network: string; address: string; start?: number; end?: number }) {
  const href = explorerUrl(network, address);
  const text = shortHash(address, start, end);
  if (!href) return <code className="dtfd-ca">{text}</code>;
  return (
    <a className="dtfd-ca" href={href} target="_blank" rel="noreferrer" title={`View on ${network} explorer · demo address, not deployed`}>
      <code>{text}</code>
      <ArrowSquareOut size={12} aria-hidden="true" />
      <span className="sr-only"> (opens {network} explorer in a new tab)</span>
    </a>
  );
}

function DetailsSection({ dtf, contract, now }: { dtf: PublicDtf; contract: string; now: number }) {
  const app = useApp();
  const uploads = dtf.farmId ? app.farms.find((farm) => farm.id === dtf.farmId)?.documents : undefined;
  const docs = dtfDocuments(dtf, uploads);
  return (
    <section className="dtfd-section" id="dtf-terms" aria-labelledby="dtf-details-title">
      <div className="dtfd-section-head"><h2 id="dtf-details-title">DTF details</h2></div>
      <Description text={dtfLongDescription(dtf)} />
      <dl className="dtfd-terms">
        <div><dt>Age</dt><dd><DtfAge launchedAt={dtf.launchedAt} now={now} /><small>Launched {dateLabel(dtf.launchedAt)}</small></dd></div>
        <div>
          <dt>Audit</dt>
          <dd>
            {dtf.audit ? (
              <>
                <span className="dtfd-audit"><SealCheck size={16} weight="fill" aria-hidden="true" /> Audited by {dtf.audit.by}</span>
                <small>Reviewed {dateLabel(dtf.audit.date)}{dtf.farmId ? "" : " · demo auditor"}</small>
              </>
            ) : (
              <>
                <span className="dtfd-audit none"><SealWarning size={16} aria-hidden="true" /> Not audited yet</span>
                <small>No published security review for this DTF.</small>
              </>
            )}
          </dd>
        </div>
        <div><dt>Contract</dt><dd><ContractLink network={dtf.network} address={contract} start={8} end={6} /><small>Demo address · not deployed</small></dd></div>
        <div id="dtf-fees"><dt>Management fee</dt><dd>{dtf.managementFee}% / year</dd></div>
        <div><dt>Performance fee</dt><dd>{dtf.performanceFee}% of gains</dd></div>
        <div><dt>Minimum deposit</dt><dd>{MIN_DEPOSIT} {dtf.baseAsset}</dd></div>
        <div><dt>Deposits</dt><dd>Always open<small>No deposit cap or target.</small></dd></div>
        <div>
          <dt>Withdrawals</dt>
          <dd>
            {dtf.lockupDays > 0 ? `Lock-in ${dtf.lockupDays} days` : "Anytime"}
            <small>{dtf.lockupDays > 0 ? `Each deposit unlocks ${dtf.lockupDays} days after it's made; a new deposit restarts the lock. ` : ""}{withdrawHelp(dtf)}</small>
          </dd>
        </div>
        <div><dt>Liquidity buffer</dt><dd>{dtf.bufferPct}% minimum<small>Share of deposits always kept idle for withdrawals.</small></dd></div>
      </dl>
      <div className="dtfd-docs-block" id="dtf-risks">
        <h3>Documents</h3>
        {docs.length ? (
          <ul className="dtfd-docs">
            {docs.map((doc) => (
              <li key={doc.name}>
                <span className={`dtfd-doc-type ${doc.type.toLowerCase()}`}>{doc.type}</span>
                <span><strong>{doc.name}</strong><small>{docSize(doc.size)} · {doc.demo ? "Sample document · preview not available in demo" : "Stored in this browser"}</small></span>
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
    <a className="dtfd-ca dtfd-tx" href={href} target="_blank" rel="noreferrer" title={`View on ${network} explorer · demo transaction, not on-chain`}>
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
        <span className="subtle-label">SIMULATED</span>
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

function PositionCard({ dtf, position }: { dtf: PublicDtf; position: DtfPosition }) {
  const value = positionValue(position, dtf.apy7d);
  const earned = value - position.costBasis;
  const earnedPct = position.costBasis > 0 ? (earned / position.costBasis) * 100 : 0;
  return (
    <section className="dtfd-card dtfd-position" aria-labelledby="dtf-position">
      <div className="dtfd-card-head">
        <h2 id="dtf-position" className="eyebrow">YOUR POSITION</h2>
        <span className="subtle-label">SIMULATED</span>
      </div>
      <strong className="dtfd-position-value">{usd(value)}</strong>
      <dl>
        <div><dt>Deposited</dt><dd>{tokenAmount(position.costBasis, dtf.baseAsset)}</dd></div>
        <div>
          <dt>Earnings</dt>
          <dd className={earned < 0 ? "negative" : "positive"}>{earned < 0 ? "−" : "+"}{usd(Math.abs(earned))} <small>({signedPct(earnedPct)})</small></dd>
        </div>
        <div><dt>Share of DTF</dt><dd>{((value / (dtf.tvl + value)) * 100).toFixed(4)}%</dd></div>
      </dl>
    </section>
  );
}

type Mode = "deposit" | "withdraw";

const unlockDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function TradeCard({
  dtf,
  signedIn,
  loaded,
  portfolio,
  save,
}: {
  dtf: PublicDtf;
  signedIn: boolean;
  loaded: boolean;
  portfolio: ReturnType<typeof useDtfPortfolio>["portfolio"];
  save: ReturnType<typeof useDtfPortfolio>["save"];
}) {
  const app = useApp();
  const [mode, setMode] = useState<Mode>("deposit");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const errorId = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const asset = dtf.baseAsset;
  const position = portfolio.positions[dtf.id];
  const balance = balanceOf(portfolio, asset);
  const held = positionValue(position, dtf.apy7d);
  const amount = parseAmount(text);
  const error =
    mode === "deposit"
      ? depositError(amount, { balance, asset })
      : withdrawError(amount, held, { lockedUntil: position?.lockedUntil });
  // "Enter an amount" is the resting state, not a mistake: don't paint the input red for it.
  const invalid = Boolean(error) && text !== "" && error !== "Enter an amount";
  const locked = mode === "withdraw" && isLocked(position);
  const pickBase = mode === "deposit" ? balance : held;
  const nextPath = strategyHref(dtf.id);
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
        save(current === "deposit" ? applyDeposit(portfolio, dtf, value, now) : applyWithdraw(portfolio, dtf, value, now));
        app.notify({
          kind: "success",
          title: current === "deposit" ? "Deposit recorded" : "Withdrawal recorded",
          body: `${tokenAmount(value, asset)} ${current === "deposit" ? "into" : "from"} ${dtf.name} · demo, no funds moved`,
          meta: `Ref ${shortHash(demoHash(`${dtf.id}:${current}:${now}`))}`,
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
  if (!signedIn) {
    cta = (
      <Link className="button primary full large" href={`/login/?next=${encodeURIComponent(nextPath)}`}>
        Sign in to {mode}
      </Link>
    );
  } else if (!app.wallet) {
    cta = (
      <button className="button primary full large" onClick={app.connect} disabled={app.connecting}>
        {app.connecting ? "Connecting…" : "Connect"}
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
          <span className="dtfd-wallet" title={mode === "deposit" ? "Demo wallet balance" : "Your position"}>
            <Wallet size={15} aria-hidden="true" />
            <span className="sr-only">{mode === "deposit" ? "Demo balance" : "Your position"}</span>
            {signedIn ? tokenAmount(mode === "deposit" ? balance : held, asset) : "—"}
          </span>
          {signedIn && (
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
            disabled={!signedIn || pending || locked}
          />
          <span className="dtfd-token"><AssetIcon symbol={asset} size={20} /> {asset}</span>
        </div>
        {invalid && <span className="sr-only" id={errorId} role="alert">{error}</span>}
        {app.walletError && signedIn && !app.wallet && (
          <p className="dtfd-error" role="alert">
            <WarningCircle size={14} /> {app.walletError.startsWith("No browser wallet") ? "No wallet found." : app.walletError}{" "}
            <button className="text-link" onClick={app.connectDemo}>Use demo wallet</button>
          </p>
        )}

        <dl className="dtfd-summary">
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
          By continuing, I confirm I&apos;ve read the <a href="#dtf-terms">Terms</a>, <a href="#dtf-risks">Risks</a>, and <a href="#dtf-fees">Fees</a>.
        </p>
      </div>
    </section>
  );
}

function ManagerCard({ dtfs, manager }: { dtfs: PublicDtf[]; manager: string }) {
  const summary = managerSummary(dtfs, manager);
  const initials = manager.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <section className="dtfd-card" aria-labelledby="dtf-manager">
      <span className="eyebrow">MANAGED BY</span>
      <div className="dtfd-manager">
        <span className="dtfd-avatar" aria-hidden="true">{initials}</span>
        <div><h2 id="dtf-manager">{manager}</h2><small>Farm Manager</small></div>
      </div>
      <p className="dtfd-manager-bio">{summary.bio}</p>
      <dl className="dtfd-manager-stats">
        <div><dt>DTFs</dt><dd>{summary.count}</dd></div>
        <div><dt>Managed</dt><dd>{money(summary.tvl, true)}</dd></div>
        <div><dt>Since</dt><dd>{summary.since}</dd></div>
      </dl>
    </section>
  );
}

function SimilarCard({ items }: { items: PublicDtf[] }) {
  if (!items.length) return null;
  return (
    <section className="dtfd-card" aria-labelledby="dtf-similar">
      <h2 id="dtf-similar" className="dtfd-card-title">Other strategies you might like</h2>
      <ul className="dtfd-similar">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={strategyHref(item.id)}>
              <DtfLogo dtf={item} size="sm" />
              <span><strong>{item.name}</strong><small><span className="dtf-ticker">${item.symbol}</span> · {typeLabel[item.type]}</small></span>
              <span className="dtfd-similar-apy"><small>Target APR</small><strong>{item.targetApr.toFixed(2)}%</strong></span>
              <CaretRight size={13} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
