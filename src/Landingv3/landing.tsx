"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChartLineUp, CheckCircle, Coins, Compass, List, ShieldCheck, Stack, TrendUp, X } from "@phosphor-icons/react";
import { TokenETH, TokenUSDC, TokenUSDT, TokenWBTC } from "@web3icons/react";
import styles from "./styles/landingv3.module.css";

const farms = [
  { id: "eth-neutral", name: "ETH Delta Neutral", pair: "ETH / USDC", apy: "14.8%", tvl: "$2.84M", network: "Arbitrum", risk: "High", assets: ["ETH", "USDC"] },
  { id: "blue-chip", name: "Blue Chip Index", pair: "ETH / WBTC / SOL", apy: "12.6%", tvl: "$1.65M", network: "Ethereum", risk: "Moderate", assets: ["ETH", "WBTC"] },
  { id: "stable-yield", name: "Stablecoin Yield", pair: "USDC / USDT", apy: "7.2%", tvl: "$920K", network: "Base", risk: "Low", assets: ["USDC", "USDT"] },
] as const;
const modelCards = [
  { icon: Stack, title: "Strategy", copy: "Logic and guardrails" },
  { icon: TrendUp, title: "Farm", copy: "A managed on-chain product" },
  { icon: Coins, title: "Position", copy: "An LP balance and its history" },
];
const yieldCards = [
  { icon: Coins, title: "Lending yield", copy: "Interest paid by borrowers across supported money markets." },
  { icon: TrendUp, title: "Liquidity yield", copy: "Trading fees and incentives from on-chain liquidity." },
  { icon: ChartLineUp, title: "Funding capture", copy: "Perpetual funding payments with an explicit hedge." },
  { icon: Stack, title: "Index rebalancing", copy: "Rules-based multi-asset exposure with scheduled allocation changes." },
];

export function LandingV3Root({ segments = ["home"] }: { segments?: string[] }) {
  const page = segments[0] || "home";
  const [mobile, setMobile] = useState(false);
  return <main className={styles.root}>
    <nav className={styles.nav} aria-label="Landing v3 navigation"><Brand /><div className={`${styles.navLinks} ${mobile ? styles.open : ""}`}><Link href="/landingv3/yield">Yield</Link><Link href="/landingv3/farms">Farms</Link><Link href="/landingv3/networks">Networks</Link><Link href="/landingv3/home#model">How it works</Link></div><div><Link className={styles.ghost} href="/dbv3/dashboard">Open dashboard</Link><Link className={styles.primary} href="/dbv3/farms/create">Launch a Farm <ArrowRight size={16} /></Link><button className={styles.mobileMenu} aria-label={mobile ? "Close navigation" : "Open navigation"} onClick={() => setMobile((value) => !value)}>{mobile ? <X size={20} /> : <List size={20} />}</button></div></nav>
    {page === "home" && <Home />}
    {page === "yield" && <Yield />}
    {page === "farms" && <Farms />}
    {page === "farm-details" && <FarmDetails farmId={segments[1]} />}
    {page === "networks" && <Networks />}
    <Footer />
  </main>;
}

function Home() {
  return <>
    <section className={styles.hero}><div><span className={styles.kicker}>On-chain capital infrastructure</span><h1>Investment strategies become transparent products.</h1><p>Dexponent gives Farm managers a focused operating system and gives liquidity providers the context to understand every position before capital moves.</p><div className={styles.heroActions}><Link className={styles.primary} href="/landingv3/farms">Explore Farms <Compass size={17} /></Link><Link className={styles.darkButton} href="/dbv3/farms/create">Create a Farm <ArrowRight size={17} /></Link></div></div><MarketPreview /></section>
    <section className={styles.proof}><span>Demo protocol snapshot</span>{[["Managed capital", "$5.41M"], ["LP positions", "$184K"], ["Active Farms", "03"], ["Networks", "03"]].map(([label, value]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</section>
    <section className={styles.opportunities}><Heading level="section" kicker="Opportunity set" title="Return source first. APY second." copy="Every Farm explains the operating model, network, liquidity, and risk beside the headline return." /><FarmRows /></section>
    <section className={styles.model} id="model"><div><span className={styles.kicker}>A simpler product model</span><h2>Strategy becomes a Farm. Capital becomes a Position.</h2><p>Three concepts describe the complete lifecycle without forcing LPs or managers to reason about contract internals.</p></div><div className={styles.modelStack}>{modelCards.map(({ icon: Icon, title, copy }) => <article key={title}><Icon size={25} /><span>{title}</span><strong>{title}</strong><p>{copy}</p></article>)}</div></section>
    <section className={styles.audiences}><article><Coins size={28} /><h2>For liquidity providers</h2><p>Compare Farms, review risks and documents, deposit in demo, and track positions.</p><Link href="/landingv3/farms">Explore capital opportunities <ArrowRight size={16} /></Link></article><article><TrendUp size={28} /><h2>For Farm managers</h2><p>Choose a strategy, deploy a Farm, manage liquidity, and monitor performance.</p><Link href="/dbv3/farms/create">Open the v3 builder <ArrowRight size={16} /></Link></article></section>
    <section className={styles.cta}><span className={styles.kicker}>Choose your path</span><h2>Explore a Farm or launch your own.</h2><div><Link className={styles.primary} href="/landingv3/farms">Explore Farms</Link><Link className={styles.darkButton} href="/dbv3/farms/create">Launch a Farm</Link></div></section>
  </>;
}

function Yield() { return <section className={styles.page}><Heading kicker="Yield" title="Understand where returns come from." copy="Explore lending, liquidity, funding, and rebalancing strategies with plain-language risk context." /><div className={styles.yieldGrid}>{yieldCards.map(({ icon: Icon, title, copy }) => <article key={title}><Icon size={25} /><h2>{title}</h2><p>{copy}</p><Link href="/landingv3/farms">View matching Farms <ArrowRight size={15} /></Link></article>)}</div></section>; }
function Farms() { return <section className={styles.page}><Heading kicker="Farm directory" title="Opportunities with enough context to decide." copy="Compare strategy, liquidity, risk, and network before opening the full Farm profile." /><FarmRows /></section>; }
function FarmDetails({ farmId }: { farmId?: string }) { const farm = farms.find((item) => item.id === farmId) || farms[0]; const isPerpetual = farm.id === "eth-neutral"; return <section className={styles.page}><Link className={styles.back} href="/landingv3/farms">← All Farms</Link><div className={styles.detailHero}><AssetPair assets={farm.assets} /><div><span className={styles.kicker}>{farm.network} · {isPerpetual ? "Perpetual" : farm.id === "blue-chip" ? "Index" : "Spot"}</span><h1>{farm.name}</h1><p>{isPerpetual ? "Captures funding while maintaining a market-neutral ETH hedge." : farm.id === "blue-chip" ? "Allocates across established crypto assets with rules-based rebalancing." : "Routes stablecoin liquidity to an adaptive lending allocation."} All figures are demo and estimated.</p></div><Link className={styles.primary} href={`/dbv3/farms/manage?farm=${isPerpetual ? "v3-eth-neutral" : farm.id === "blue-chip" ? "v3-blue-chip" : "v3-stable-yield"}`}>Open Farm workspace</Link></div><div className={styles.detailMetrics}>{[["Estimated APY",farm.apy],["Demo TVL",farm.tvl],["Risk",farm.risk],["Settlement","USDC"]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><section className={styles.detailGrid}><article><h2>How it works</h2><div className={styles.flow}><span>USDC deposit</span><ArrowRight size={16} /><span>{isPerpetual ? "Hedged funding" : farm.id === "blue-chip" ? "Asset allocation" : "Lending markets"}</span><ArrowRight size={16} /><span>{farm.pair}</span></div></article><article><h2>Risk summary</h2>{[isPerpetual ? "Leverage and liquidation risk" : "Market and allocation risk","Returns can change","Protocol and smart-contract risk"].map((item) => <p key={item}><ShieldCheck size={16} />{item}</p>)}</article></section></section>; }
function Networks() { return <section className={styles.page}><Heading kicker="Networks" title="One product model across leading DeFi ecosystems." copy="V3 keeps network context visible without changing the core Farm and Position language." /><div className={styles.networks}>{["Ethereum","Base","Arbitrum"].map((network) => <article key={network}><img src={network === "Base" ? "/brand/chains/base.svg" : network === "Ethereum" ? "/brand/chains/ethereum.png" : "/brand/chains/arbitrum.png"} alt="" /><h2>{network}</h2><p>Farm discovery, deposits, positions, and manager operations.</p><CheckCircle size={18} /></article>)}</div></section>; }

function MarketPreview() { return <aside className={styles.marketPreview}><div><span>Demo capital map</span><small>Updated locally</small></div><div className={styles.previewFlow}><AssetPair assets={["USDC"]} /><ArrowRight size={18} /><span>Delta neutral</span><ArrowRight size={18} /><AssetPair assets={["ETH","USDC"]} /></div><div className={styles.previewFarm}><span>FEATURED FARM</span><h2>ETH Delta Neutral</h2><p>Funding capture · Arbitrum</p><div><strong>14.8%</strong><small>Estimated APY</small></div></div><div className={styles.previewFooter}><span><i /> Active demo</span><strong>$2.84M TVL</strong></div></aside>; }
function FarmRows() { return <div className={styles.farmRows}>{farms.map((farm) => <Link href={`/landingv3/farm-details/${farm.id}`} key={farm.id}><AssetPair assets={farm.assets} /><span><strong>{farm.name}</strong><small>{farm.pair} · {farm.network}</small></span><span><small>Estimated APY</small><strong>{farm.apy}</strong></span><span><small>Demo TVL</small><strong>{farm.tvl}</strong></span><span className={styles.risk}>{farm.risk} risk</span><ArrowRight size={17} /></Link>)}</div>; }
function Heading({ kicker, title, copy, level = "page" }: { kicker: string; title: string; copy: string; level?: "page" | "section" }) { const Title = level === "section" ? "h2" : "h1"; return <header className={styles.heading}><span className={styles.kicker}>{kicker}</span><Title>{title}</Title><p>{copy}</p></header>; }
function Brand() { return <Link className={styles.brand} href="/landingv3/home"><img src="/brand/dexponent-mark.svg" alt="" /><span>Dexponent</span><small>V3</small></Link>; }
function AssetPair({ assets }: { assets: readonly string[] }) { const map = { ETH: TokenETH, USDC: TokenUSDC, USDT: TokenUSDT, WBTC: TokenWBTC } as const; return <span className={styles.assetPair}>{assets.map((asset) => { const Token = map[asset as keyof typeof map]; return <span key={asset}>{Token ? <Token variant="background" size={32} /> : asset}</span>; })}</span>; }
function Footer() { return <footer className={styles.footer}><div><Brand /><p>Independent v3 concept for transparent on-chain Farms.</p></div><div><strong>Explore</strong><Link href="/landingv3/yield">Yield</Link><Link href="/landingv3/farms">Farms</Link><Link href="/landingv3/networks">Networks</Link></div><div><strong>Product</strong><Link href="/dbv3/dashboard">Dashboard</Link><Link href="/dbv3/positions">Positions</Link><Link href="/dbv3/farms/create">Create Farm</Link></div><div><strong>Compare</strong><Link href="/preview/landing/v2">Landing v2</Link><Link href="/preview/dashboard/v2">Dashboard v2</Link></div></footer>; }
