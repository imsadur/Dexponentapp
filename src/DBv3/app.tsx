"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  ChartLineUp,
  Check,
  Compass,
  GearSix,
  List,
  MagnifyingGlass,
  Pause,
  Plus,
  Stack,
  TrendUp,
  UserCircle,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { V3Provider, useV3 } from "./provider";
import { money, strategyOptions, templatesByStrategy, type V3Farm, type V3Risk, type V3Strategy } from "./model";
import { BrandV3, ChainV3, PairV3, RiskV3, StrategyMark } from "./visuals";
import styles from "./styles/dbv3.module.css";

const navigation = [
  { group: "Portfolio", items: [["Dashboard", "/dbv3/dashboard", ChartLineUp], ["Positions", "/dbv3/positions", Briefcase]] },
  { group: "Farms", items: [["Explore Farms", "/dbv3/explore", Compass], ["Managed Farms", "/dbv3/farms", TrendUp], ["Create Farm", "/dbv3/farms/create", Plus]] },
  { group: "Operations", items: [["Templates", "/dbv3/templates", Stack], ["Analytics", "/dbv3/analytics", ChartLineUp]] },
] as const;

export function DBv3Root({ segments = ["dashboard"] }: { segments?: string[] }) {
  return <V3Provider><DBv3App segments={segments} /></V3Provider>;
}

function DBv3App({ segments }: { segments: string[] }) {
  const [menu, setMenu] = useState(false);
  const section = segments[0] || "dashboard";
  const sub = segments[1] || "";
  return <div className={styles.shell}>
    {menu && <button className={styles.overlay} aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <aside className={`${styles.sidebar} ${menu ? styles.open : ""}`}>
      <BrandV3 />
      <nav aria-label="DBv3 navigation">{navigation.map((group) => <div className={styles.navGroup} key={group.group}><span>{group.group}</span>{group.items.map(([label, href, Icon]) => <Link className={isActiveRoute(section, sub, href) ? styles.active : ""} href={href} key={href} onClick={() => setMenu(false)}><Icon size={18} />{label}</Link>)}</div>)}</nav>
      <div className={styles.sideUtility}><Link href="/dbv3/resources"><BookOpen size={18} />Resources</Link><Link href="/dbv3/settings"><GearSix size={18} />Settings</Link></div>
      <Link className={styles.profile} href="/dbv3/profile"><span>AM</span><span><strong>Alex Morgan</strong><small>Fund manager</small></span><UserCircle size={18} /></Link>
    </aside>
    <div className={styles.appMain}>
      <header className={styles.topbar}><div><button className={styles.menuButton} aria-label="Open navigation" onClick={() => setMenu(true)}><List size={20} /></button><span>V3 workspace</span><strong>{pageLabel(section, sub)}</strong></div><div><Link className={styles.iconButton} href="/dbv3/notifications" aria-label="Notifications"><Bell size={19} /></Link><Link className={styles.button} href="/dbv3/settings"><Wallet size={17} />Demo wallet</Link></div></header>
      <main className={styles.content} id="dbv3-main"><Page section={section} sub={sub} /></main>
    </div>
  </div>;
}

function isActiveRoute(section: string, sub: string, href: string) {
  if (href === "/dbv3/farms/create") return section === "farms" && sub === "create";
  if (href === "/dbv3/farms") return section === "farms" && sub !== "create";
  return section === href.split("/")[2];
}

function pageLabel(section: string, sub: string) {
  if (section === "farms" && sub === "create") return "Create Farm";
  if (section === "farms" && sub === "manage") return "Manage Farm";
  return ({ dashboard: "Dashboard", positions: "Positions", explore: "Explore Farms", farms: "Managed Farms", templates: "Templates", analytics: "Analytics", profile: "Profile", settings: "Settings", notifications: "Notifications", resources: "Resources", trade: "Trade" } as Record<string, string>)[section] || "Dashboard";
}

function Page({ section, sub }: { section: string; sub: string }) {
  if (section === "dashboard") return <Dashboard />;
  if (section === "positions") return <Positions />;
  if (section === "explore") return <FarmDirectory explore />;
  if (section === "farms" && sub === "create") return <CreateFarm />;
  if (section === "farms" && sub === "manage") return <ManageFarm />;
  if (section === "farms") return <FarmDirectory />;
  if (section === "templates") return <Templates />;
  if (section === "analytics") return <Analytics />;
  if (section === "trade") return <Trade />;
  if (section === "profile") return <SimplePage title="Profile" copy="Manager identity and public track record for the v3 concept." icon={UserCircle} />;
  if (section === "settings") return <SimplePage title="Workspace settings" copy="V3 preferences, wallet state, security, and local demo controls." icon={GearSix} />;
  if (section === "notifications") return <Notifications />;
  if (section === "resources") return <SimplePage title="Resources" copy="Product documentation, risk language, and demo environment guidance." icon={BookOpen} />;
  return <Dashboard />;
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <header className={styles.pageHeading}><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</header>;
}

function Dashboard() {
  const { farms, ready } = useV3();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("30D");
  if (!ready) return <Loading />;
  const positions = farms.filter((farm) => farm.position > 0);
  const visible = positions.filter((farm) => farm.name.toLowerCase().includes(query.toLowerCase()));
  const portfolio = positions.reduce((sum, farm) => sum + farm.position, 0);
  const managed = farms.reduce((sum, farm) => sum + farm.tvl, 0);
  return <>
    <PageHeading eyebrow="DEMO CAPITAL WORKSPACE" title="Capital decisions, without the clutter." copy="Track personal positions separately from managed Farms, then move directly into the task that needs attention." action={<Link className={`${styles.button} ${styles.primary}`} href="/dbv3/farms/create"><Plus size={17} />Create Farm</Link>} />
    <section className={styles.metrics}>{[["Portfolio value", money(portfolio), `${positions.length} demo positions`], ["Managed capital", money(managed, true), `${farms.length} Farms`], ["Estimated rewards", money(portfolio * .0154), "Demo accrual"], ["Risk alerts", "02", "Review recommended"]].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
    <section className={styles.dashboardGrid}>
      <article className={`${styles.panel} ${styles.chartPanel}`}><div className={styles.panelHead}><div><span>Portfolio performance</span><strong>{money(portfolio)}</strong></div><div className={styles.segment}>{["7D", "30D", "90D", "1Y"].map((item) => <button className={range === item ? styles.selected : ""} aria-pressed={range === item} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div><div className={styles.chart} aria-label={`Simulated portfolio chart for ${range}`}><i /><i /><i /><svg viewBox="0 0 700 220" preserveAspectRatio="none"><polyline points="0,190 80,168 155,176 235,124 315,103 395,118 475,70 550,88 625,41 700,18" /></svg></div><small>Simulated data · {range}</small></article>
      <article className={`${styles.panel} ${styles.quickPanel}`}><div className={styles.panelHead}><strong>Next actions</strong></div><Link href="/dbv3/farms/create"><Plus size={18} /><span><strong>Create a Farm</strong><small>Launch a manager-controlled demo</small></span><ArrowRight size={16} /></Link><Link href="/dbv3/explore"><Compass size={18} /><span><strong>Explore Farms</strong><small>Compare return source and risk</small></span><ArrowRight size={16} /></Link><Link href="/dbv3/positions"><Briefcase size={18} /><span><strong>Review Positions</strong><small>Deposit and withdrawal balances</small></span><ArrowRight size={16} /></Link></article>
    </section>
    <section className={styles.panel}><div className={styles.panelHead}><div><strong>Positions</strong><span>LP balances in this v3 workspace</span></div><label className={styles.search}><MagnifyingGlass size={16} /><input aria-label="Search v3 positions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search positions" />{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}</label></div><FarmTable farms={visible} position /></section>
  </>;
}

function FarmTable({ farms, position = false }: { farms: V3Farm[]; position?: boolean }) {
  if (!farms.length) return <Empty title={position ? "No matching positions" : "No Farms yet"} href={position ? "/dbv3/explore" : "/dbv3/farms/create"} label={position ? "Explore Farms" : "Create Farm"} />;
  return <div className={styles.tableWrap}><table><thead><tr><th>Farm</th><th>Status</th><th>{position ? "Your position" : "TVL"}</th><th>Estimated APY</th><th>Risk</th><th>Network</th><th /></tr></thead><tbody>{farms.map((farm) => <tr key={farm.id}><td><Link className={styles.farmIdentity} href={`/dbv3/farms/manage?farm=${farm.id}`}><PairV3 assets={farm.assets} /><span><strong>{farm.name}</strong><small>{farm.type} · {farm.template}</small></span></Link></td><td><Status farm={farm} /></td><td><strong>{money(position ? farm.position : farm.tvl)}</strong></td><td>{farm.apy}%</td><td><RiskV3 level={farm.risk} /></td><td><ChainV3 network={farm.network} /></td><td><Link className={styles.rowAction} aria-label={`Open ${farm.name}`} href={`/dbv3/farms/manage?farm=${farm.id}`}><ArrowRight size={16} /></Link></td></tr>)}</tbody></table></div>;
}

function Status({ farm }: { farm: V3Farm }) { return <span className={`${styles.status} ${farm.status === "PAUSED" ? styles.paused : ""}`}><i />{farm.status}</span>; }

function Positions() {
  const { farms, ready } = useV3();
  if (!ready) return <Loading />;
  const positions = farms.filter((farm) => farm.position > 0);
  return <><PageHeading eyebrow="PORTFOLIO" title="Positions" copy="Your own demo balances, kept separate from total Farm liquidity." action={<Link className={styles.button} href="/dbv3/explore">Explore Farms</Link>} /><section className={styles.metrics}>{[["Portfolio value", money(positions.reduce((sum, farm) => sum + farm.position, 0)), "Demo balance"], ["Open positions", String(positions.length).padStart(2, "0"), "Active and paused"], ["Networks", String(new Set(positions.map((farm) => farm.network)).size).padStart(2, "0"), "Connected ecosystems"], ["Withdrawable", money(positions.reduce((sum, farm) => sum + farm.position, 0)), "Immediate in demo"]].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section><section className={styles.panel}><div className={styles.panelHead}><strong>Portfolio positions</strong></div><FarmTable farms={positions} position /></section></>;
}

function FarmDirectory({ explore = false }: { explore?: boolean }) {
  const { farms, ready } = useV3();
  const [query, setQuery] = useState("");
  if (!ready) return <Loading />;
  const visible = farms.filter((farm) => farm.name.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeading eyebrow={explore ? "DISCOVERY" : "MANAGER WORKSPACE"} title={explore ? "Explore Farms" : "Managed Farms"} copy={explore ? "Compare strategy, network, liquidity, and risk before opening a position." : "Operate deployed Farms and move directly into liquidity, controls, or performance."} action={<Link className={`${styles.button} ${styles.primary}`} href="/dbv3/farms/create"><Plus size={17} />Create Farm</Link>} /><section className={styles.panel}><div className={styles.panelHead}><strong>{explore ? "Available opportunities" : "Farm registry"}</strong><label className={styles.search}><MagnifyingGlass size={16} /><input aria-label="Search v3 Farms" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Farms" /></label></div><FarmTable farms={visible} /></section></>;
}

function CreateFarm() {
  const { saveFarm } = useV3();
  const router = useRouter();
  const params = useSearchParams();
  const requestedTemplate = params.get("template");
  const requestedType = strategyOptions.find((strategy) =>
    templatesByStrategy[strategy.type].includes(requestedTemplate || ""),
  )?.type;
  const [step, setStep] = useState(0);
  const [type, setType] = useState<V3Strategy>(requestedType || "SPOT");
  const [template, setTemplate] = useState(requestedTemplate || "Stablecoin Yield");
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<V3Farm["network"]>("Base");
  const [asset, setAsset] = useState("USDC");
  const [risk, setRisk] = useState<V3Risk>("LOW");
  const [accepted, setAccepted] = useState(false);
  function chooseType(next: V3Strategy) { setType(next); setTemplate(templatesByStrategy[next][0]); setRisk(next === "PERPETUAL" ? "HIGH" : next === "INDEX" ? "MEDIUM" : "LOW"); }
  function deploy() {
    const id = `v3-${Date.now()}`;
    const assets = type === "INDEX" ? ["ETH", "WBTC", "SOL"] : type === "PERPETUAL" ? ["ETH", "USDC"] : [asset, asset === "USDC" ? "USDT" : "USDC"];
    saveFarm({ id, name, description: `${template} configured in the independent v3 Farm builder.`, type, template, network, assets, depositAsset: asset, risk, status: "ACTIVE", apy: type === "PERPETUAL" ? 13.8 : type === "INDEX" ? 10.4 : 7.6, tvl: 0, position: 0, managerCanPause: true, events: ["Farm deployed in DBv3 demo mode"] });
    router.push(`/dbv3/farms/manage?farm=${id}`);
  }
  return <><PageHeading eyebrow={`CREATE FARM · ${step + 1} OF 4`} title={["Choose the operating model.", "Define the essentials.", "Review risk and economics.", "Deploy the demo Farm."][step]} copy={["Select a strategy family and a template in one decision.", "Name the Farm and confirm its network and deposit asset.", "Check the final LP-facing summary before deployment.", "Create a manager-controlled Farm inside the isolated v3 workspace."][step]} action={<Link className={styles.button} href="/dbv3/farms">Save and exit</Link>} /><ol className={styles.stepper}>{["Strategy", "Configure", "Review", "Deploy"].map((label, index) => <li className={index <= step ? styles.current : ""} key={label}><span>{index + 1}</span>{label}</li>)}</ol>
    {step === 0 && <section className={styles.builder}><div className={styles.strategyChoices}>{strategyOptions.map((option) => <button className={type === option.type ? styles.chosen : ""} onClick={() => chooseType(option.type)} key={option.type}><StrategyMark type={option.type} /><h2>{option.title}</h2><p>{option.copy}</p><RiskV3 level={option.risk} /></button>)}</div><div className={styles.templateStrip}><span>Template</span>{templatesByStrategy[type].map((item) => <button className={template === item ? styles.chosen : ""} onClick={() => setTemplate(item)} key={item}><Check size={15} />{item}</button>)}</div></section>}
    {step === 1 && <section className={styles.formPanel}><label><span>Farm name</span><input aria-label="V3 Farm name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Base Stable Yield" /></label><label><span>Network</span><select aria-label="V3 network" value={network} onChange={(event) => setNetwork(event.target.value as V3Farm["network"])}>{["Base", "Arbitrum", "Ethereum"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Deposit asset</span><select aria-label="V3 deposit asset" value={asset} onChange={(event) => setAsset(event.target.value)}>{["USDC", "ETH", "WBTC"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Farm logo or icon</span><input aria-label="V3 Farm logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" /></label></section>}
    {step === 2 && <section className={styles.reviewGrid}><article className={styles.panel}><span>Farm</span><h2>{name || "Untitled Farm"}</h2><p>{template}</p><div className={styles.reviewFacts}><span><small>Strategy</small><strong>{type}</strong></span><span><small>Network</small><strong>{network}</strong></span><span><small>Deposit asset</small><strong>{asset}</strong></span><span><small>Estimated APY</small><strong>{type === "PERPETUAL" ? "13.8%" : type === "INDEX" ? "10.4%" : "7.6%"}</strong></span></div></article><article className={styles.panel}><span>Risk review</span><RiskV3 level={risk} /><p>Estimated returns are simulated. Smart-contract, liquidity, market, protocol, and execution risk can cause loss.</p><label className={styles.field}><span>Risk profile</span><select aria-label="V3 risk profile" value={risk} onChange={(event) => setRisk(event.target.value as V3Risk)}>{["LOW", "MEDIUM", "HIGH"].map((item) => <option key={item}>{item}</option>)}</select></label></article></section>}
    {step === 3 && <section className={styles.deployPanel}><Check size={24} /><div><span>DEMO DEPLOYMENT</span><h2>{name}</h2><p>The Farm will be stored only in the DBv3 browser workspace. No wallet signature or blockchain transaction is used.</p></div><label><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />I understand this is a demo deployment.</label></section>}
    <footer className={styles.builderFooter}><button className={styles.button} disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft size={16} />Back</button>{step < 3 ? <button className={`${styles.button} ${styles.primary}`} disabled={(step === 0 && !template) || (step === 1 && !name.trim())} onClick={() => setStep((value) => value + 1)}>Continue <ArrowRight size={16} /></button> : <button className={`${styles.button} ${styles.primary}`} disabled={!accepted || !name.trim()} onClick={deploy}>Deploy demo Farm <ArrowRight size={16} /></button>}</footer>
  </>;
}

function ManageFarm() {
  const { farms, ready, deposit, withdraw, togglePause } = useV3();
  const params = useSearchParams();
  const farm = farms.find((item) => item.id === params.get("farm")) || farms[0];
  const [action, setAction] = useState<"" | "deposit" | "withdraw" | "pause">("");
  const [amount, setAmount] = useState("1000");
  const [error, setError] = useState("");
  if (!ready || !farm) return <Loading />;
  function complete() {
    try {
      if (action === "deposit") deposit(farm.id, Number(amount));
      if (action === "withdraw") withdraw(farm.id, Number(amount));
      if (action === "pause") togglePause(farm.id);
      setAction(""); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update Farm."); }
  }
  return <><Link className={styles.backLink} href="/dbv3/farms"><ArrowLeft size={15} />Managed Farms</Link><PageHeading eyebrow={`${farm.type} · ${farm.network}`} title={farm.name} copy={farm.description} action={<div className={styles.actions}><Status farm={farm} />{farm.type === "PERPETUAL" && <Link className={styles.button} href={`/dbv3/trade?farm=${farm.id}`}>Trade</Link>}<button className={`${styles.button} ${styles.primary}`} disabled={farm.status !== "ACTIVE"} onClick={() => { setAmount("1000"); setAction("deposit"); }}>Deposit</button><button className={styles.button} onClick={() => { setAmount(String(farm.position)); setAction("withdraw"); }}>Withdraw</button><button className={styles.button} disabled={!farm.managerCanPause} onClick={() => setAction("pause")}>{farm.status === "PAUSED" ? "Resume" : "Pause"}</button></div>} /><section className={styles.metrics}>{[["Total value locked", money(farm.tvl), "Demo Farm liquidity"], ["Your position", money(farm.position), "Withdrawable demo balance"], ["Estimated APY", `${farm.apy}%`, "Not guaranteed"], ["Risk", farm.risk, "Illustrative category"]].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section><section className={styles.manageGrid}><article className={styles.panel}><div className={styles.panelHead}><strong>Strategy overview</strong><RiskV3 level={farm.risk} /></div><div className={styles.flow}><span>{farm.depositAsset}</span><ArrowRight size={16} /><span>{farm.template}</span><ArrowRight size={16} /><span>{farm.assets.join(" / ")}</span></div><div className={styles.reviewFacts}><span><small>Network</small><ChainV3 network={farm.network} /></span><span><small>Strategy</small><strong>{farm.type}</strong></span><span><small>Manager pause</small><strong>{farm.managerCanPause ? "Enabled" : "Unavailable"}</strong></span></div></article><article className={styles.panel}><div className={styles.panelHead}><strong>Recent activity</strong></div>{farm.events.map((event) => <div className={styles.activity} key={event}><Check size={15} /><span>{event}</span></div>)}</article></section>{action && <div className={styles.modalBackdrop}><section className={styles.modal} role="dialog" aria-label={action === "pause" ? `${farm.status === "PAUSED" ? "Resume" : "Pause"} this Farm?` : action === "deposit" ? "Deposit to Farm" : "Withdraw from Farm"}><button className={styles.close} aria-label="Close dialog" onClick={() => setAction("")}><X size={18} /></button><span>DEMO ACTION</span><h2>{action === "pause" ? `${farm.status === "PAUSED" ? "Resume" : "Pause"} this Farm?` : action === "deposit" ? "Deposit to Farm" : "Withdraw from Farm"}</h2>{action === "pause" ? <p>{farm.status === "PAUSED" ? "Resume deposits for this manager-controlled demo Farm." : "Pause new deposits. Existing positions will remain withdrawable."}</p> : <label className={styles.field}><span>{action === "deposit" ? "Deposit amount" : `Withdrawal amount · ${money(farm.position)} available`}</span><input aria-label={action === "deposit" ? "V3 deposit amount" : "V3 withdrawal amount"} type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>}{error && <p className={styles.error} role="alert">{error}</p>}<button className={`${styles.button} ${action === "pause" && farm.status !== "PAUSED" ? styles.danger : styles.primary}`} onClick={complete}>{action === "pause" ? farm.status === "PAUSED" ? "Resume Farm" : "Yes, pause Farm" : action === "deposit" ? "Confirm demo deposit" : "Confirm demo withdrawal"}</button></section></div>}</>;
}

function Templates() { return <><PageHeading eyebrow="BUILD" title="Templates" copy="Preconfigured starting points for the independent v3 Farm builder." action={<Link className={`${styles.button} ${styles.primary}`} href="/dbv3/farms/create">Create Farm</Link>} /><section className={styles.templateGrid}>{strategyOptions.map((strategy) => <article className={styles.panel} key={strategy.type}><StrategyMark type={strategy.type} /><h2>{strategy.title}</h2><p>{strategy.copy}</p>{templatesByStrategy[strategy.type].map((item) => <Link key={item} href={`/dbv3/farms/create?template=${encodeURIComponent(item)}`}>{item}<ArrowRight size={15} /></Link>)}</article>)}</section></>; }

function Analytics() { const { farms } = useV3(); return <><PageHeading eyebrow="MANAGER ANALYTICS" title="Performance and flows" copy="Simulated manager metrics with explicit data labels." /><section className={styles.metrics}>{[["Managed TVL", money(farms.reduce((sum, farm) => sum + farm.tvl, 0), true), "Demo"], ["LP capital", money(farms.reduce((sum, farm) => sum + farm.position, 0)), "Demo positions"], ["Deposits", "$18,400", "Simulated 30D"], ["Withdrawals", "$6,200", "Simulated 30D"]].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section><section className={`${styles.panel} ${styles.chartPanel}`}><div className={styles.panelHead}><strong>Net flows · 30D</strong><span>Simulated</span></div><div className={styles.barChart}>{[42,58,35,72,66,84,62,91,78,96].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}</div></section></>; }

function Notifications() { const { farms } = useV3(); const events = farms.flatMap((farm) => farm.events.slice(0, 2).map((event) => ({ farm, event }))); return <><PageHeading eyebrow="WORKSPACE" title="Notifications" copy="Recent local demo activity that may need review." /><section className={styles.panel}>{events.map(({ farm, event }) => <Link className={styles.notification} href={`/dbv3/farms/manage?farm=${farm.id}`} key={`${farm.id}-${event}`}><Check size={16} /><span><strong>{event}</strong><small>{farm.name}</small></span><ArrowRight size={15} /></Link>)}</section></>; }

function Trade() { const { farms } = useV3(); const params = useSearchParams(); const farm = farms.find((item) => item.id === params.get("farm")) || farms.find((item) => item.type === "PERPETUAL"); const [side, setSide] = useState("Long"); const [size, setSize] = useState("1000"); const [filled, setFilled] = useState(false); if (!farm) return <Empty title="No Perpetual Farm" href="/dbv3/explore" label="Explore Farms" />; return <><PageHeading eyebrow="PERPETUAL TRADING" title={`${farm.assets[0]}/USDC`} copy={`${farm.name} · isolated v3 demo execution`} action={<Link className={styles.button} href={`/dbv3/farms/manage?farm=${farm.id}`}>Back to Farm</Link>} /><section className={styles.tradeGrid}><article className={`${styles.panel} ${styles.tradeChart}`}><div className={styles.panelHead}><strong>{farm.assets[0]}/USDC</strong><span className={styles.positive}>+2.14%</span></div><div className={styles.candles}>{[44,58,51,72,64,80,71,92,86,104,96,118].map((value, index) => <i key={index} style={{ height: value }} />)}</div></article><article className={styles.panel}><div className={styles.segment}>{["Long", "Short"].map((item) => <button key={item} className={side === item ? styles.selected : ""} onClick={() => setSide(item)}>{item}</button>)}</div><label className={styles.field}><span>Position size</span><input aria-label="V3 position size" value={size} onChange={(event) => setSize(event.target.value)} type="number" /></label><button className={`${styles.button} ${styles.primary}`} disabled={Number(size) <= 0} onClick={() => setFilled(true)}>Review {side} order</button>{filled && <p className={styles.success}>{side} {farm.assets[0]}/USDC demo order filled for {money(Number(size))}.</p>}</article></section></>; }

function SimplePage({ title, copy, icon: Icon }: { title: string; copy: string; icon: typeof GearSix }) { return <><PageHeading eyebrow="DBV3" title={title} copy={copy} /><section className={`${styles.panel} ${styles.simplePanel}`}><Icon size={28} /><h2>{title}</h2><p>{copy}</p><Link className={styles.button} href="/dbv3/dashboard">Return to dashboard</Link></section></>; }
function Empty({ title, href, label }: { title: string; href: string; label: string }) { return <div className={styles.empty}><Briefcase size={24} /><h2>{title}</h2><Link className={styles.button} href={href}>{label}</Link></div>; }
function Loading() { return <div className={styles.loading}><i /><i /><i /></div>; }
