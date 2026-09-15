"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CaretDown,
  ChartLineUp,
  CheckCircle,
  Coins,
  Compass,
  GearSix,
  Lifebuoy,
  List,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  Stack,
  Swap,
  TrendUp,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react";
import { AnimatedValue, AssetIcon, Brand, NetworkIcon, PerformanceChart, Risk } from "./ui";
import { useApp } from "./provider";

const navGroups = [
  { title: "Explore", items: [["Farms", Compass], ["Strategies", Stack], ["Pools", Coins], ["Managers", UsersThree]] },
  { title: "Trade", items: [["Swap", Swap], ["Liquidity", TrendUp]] },
  { title: "Portfolio", items: [["Overview", ChartLineUp], ["Positions", Wallet], ["Rewards", Coins], ["Activity", List]] },
  { title: "Manage", items: [["Overview", GearSix], ["Capital", Coins], ["Managed Farms", TrendUp], ["Strategies", Stack], ["Templates", Stack], ["LPs", UsersThree], ["Analytics", ChartLineUp], ["Create Farm", Plus]] },
] as const;

const dashboardViews: Record<string, { title: string; text: string }> = {
  "Portfolio / Overview": { title: "Your capital, clearly organized.", text: "Track positions, flows, rewards, and risk across every active Farm." },
  "Explore / Farms": { title: "Discover Farms with context.", text: "Compare return source, liquidity, risk, and manager history." },
  "Manage / Overview": { title: "Run your Farm business.", text: "Monitor managed capital, liquidity providers, and strategy execution." },
};

export function DashboardV3() {
  const app = useApp();
  const [active, setActive] = useState("Portfolio / Overview");
  const [menu, setMenu] = useState(false);
  const [chain, setChain] = useState("All chains");
  const copy = dashboardViews[active] || { title: active.split(" / ")[1], text: "A focused operational view for this part of Dexponent." };

  return <div className="dashboard-v3-shell">
    {menu && <button className="v3-app-overlay" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <aside className={`v3-app-sidebar ${menu ? "open" : ""}`}>
      <Brand />
      <nav aria-label="Application navigation">
        {navGroups.map((group) => <div className="v3-app-nav-group" key={group.title}><span>{group.title}</span>{group.items.map(([label, Icon]) => { const key = `${group.title} / ${label}`; return label === "Create Farm" ? <Link href="/app/farms/new" key={key}><Icon size={17} />{label}</Link> : <button className={active === key ? "active" : ""} key={key} onClick={() => { setActive(key); setMenu(false); }}><Icon size={17} />{label}</button>; })}</div>)}
      </nav>
      <div className="v3-app-more"><span>Data and more</span><Link href="/app/analytics"><ChartLineUp size={17} />Market</Link><Link href="/app/analytics"><TrendUp size={17} />Farm rankings</Link><Link href="/app/analytics"><Coins size={17} />Protocol stats</Link><Link href="/app/resources"><BookOpen size={17} />Docs</Link><Link href="/app/resources"><BookOpen size={17} />Learn</Link><Link href="/app/resources"><ShieldCheck size={17} />Security</Link><button><Lifebuoy size={17} />Support</button></div>
      <button className="v3-profile"><span>AM</span><span><strong>{app.profile.name}</strong><small>Fund manager</small></span><CaretDown size={14} /></button>
    </aside>
    <div className="v3-app-main">
      <header className="v3-app-topbar"><div><button className="icon-button v3-app-menu" aria-label="Open navigation" onClick={() => setMenu(true)}><List size={20} /></button><span>{active.split(" / ")[0]}</span><strong>{active.split(" / ")[1]}</strong></div><div><label className="v3-app-search"><MagnifyingGlass size={16} /><input aria-label="Search Farms, positions, and markets" placeholder="Search Dexponent" /></label><label className="v3-chain-select"><NetworkIcon network={chain === "All chains" ? "All" : chain} size={20} /><select value={chain} onChange={(e) => setChain(e.target.value)}>{["All chains","Ethereum","Base","Arbitrum"].map((item) => <option key={item}>{item}</option>)}</select></label><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><button className="button"><Wallet size={16} />Connect wallet</button></div></header>
      <main className="v3-dashboard-main">
        <section className="v3-dashboard-heading"><div><span>Demo workspace</span><h1>{copy.title}</h1><p>{copy.text}</p></div><Link className="button primary" href="/app/farms/new"><Plus size={16} />Create Farm</Link></section>
        <section className="v3-dashboard-stats">
          {[['Portfolio value','$184,260','+4.8% this month'],['Net deposits','$152,000','$8,400 in 30 days'],['Claimable rewards','$2,846','Across 4 Farms'],['Managed capital','$4.72M','3 active Farms']].map(([label,value,note]) => <article key={label}><span>{label}</span><AnimatedValue value={value} /><small>{note}</small></article>)}
        </section>
        <div className="v3-dashboard-grid">
          <section className="v3-app-panel v3-capital-panel"><div className="v3-panel-head"><div><span>Portfolio performance</span><strong><AnimatedValue value="$184,260" /></strong></div><div className="v3-range"><button>7D</button><button className="active">30D</button><button>90D</button><button>1Y</button></div></div><PerformanceChart points={[129,134,132,141,146,144,153,158,162,159,170,176,184]} label="Simulated portfolio performance over 30 days" /><div className="v3-chart-label"><span><i /> Portfolio value</span><small>Simulated data · Updated 2 min ago</small></div></section>
          <section className="v3-app-panel v3-allocation-panel"><div className="v3-panel-head"><strong>Capital allocation</strong><Link href="/app/positions">View positions</Link></div>{[["ETH",42,"$77,389"],["USDC",31,"$57,121"],["WBTC",18,"$33,167"],["SOL",9,"$16,583"]].map(([asset,weight,value]) => <div className="v3-allocation-row" key={asset}><AssetIcon symbol={String(asset)} size={27} /><span><strong>{asset}</strong><i><b style={{ width: `${weight}%` }} /></i></span><span><strong>{weight}%</strong><small>{value}</small></span></div>)}</section>
        </div>
        <section className="v3-app-panel v3-position-panel"><div className="v3-panel-head"><div><strong>Active positions</strong><span>Capital currently deployed across Farms</span></div><Link href="/app/positions">View all <ArrowRight size={15} /></Link></div><div className="v3-position-table"><div className="head"><span>Farm</span><span>Position</span><span>APY</span><span>Performance</span><span>Risk</span><span /></div>{[
          ["ETH / USDC Balanced Yield",["ETH","USDC"],"$72,480","18.4%","+$4,842","MEDIUM"],
          ["Stable Yield Reserve",["USDC","USDT"],"$64,200","9.8%","+$1,420","LOW"],
          ["Bitcoin Basis",["WBTC","USDC"],"$47,580","14.2%","+$2,306","MEDIUM"],
        ].map(([name,assets,value,apy,pnl,risk]) => <div key={name as string}><span className="v3-table-farm"><span>{(assets as string[]).map((asset) => <AssetIcon symbol={asset} size={24} key={asset} />)}</span><strong>{name as string}</strong></span><strong>{value as string}</strong><strong>{apy as string}</strong><strong className="positive">{pnl as string}</strong><Risk level={risk as "LOW" | "MEDIUM"} /><button aria-label={`Open ${name}`}><ArrowRight size={16} /></button></div>)}</div></section>
        <div className="v3-dashboard-bottom"><section className="v3-app-panel"><div className="v3-panel-head"><strong>Managed Farms</strong><Link href="/app/farms">Manage all</Link></div>{[["ETH Funding Capture","ACTIVE","$2.84M"],["Blue Chip Index","ACTIVE","$1.65M"],["Stablecoin Yield","PAUSED","$920K"]].map(([name,status,tvl]) => <div className="v3-managed-row" key={name}><span><i className={status.toLowerCase()} />{name}</span><span>{status}</span><strong>{tvl}</strong></div>)}</section><section className="v3-app-panel"><div className="v3-panel-head"><strong>Recent activity</strong><Link href="/app/positions">View activity</Link></div>{[["Deposit confirmed","12,400 USDC","4 min"],["Farm rebalanced","ETH Funding Capture","2 hr"],["Rewards accrued","284.60 USDC","6 hr"]].map(([event,detail,time]) => <div className="v3-activity-row" key={event}><CheckCircle size={17} /><span><strong>{event}</strong><small>{detail}</small></span><small>{time}</small></div>)}</section></div>
      </main>
    </div>
  </div>;
}
