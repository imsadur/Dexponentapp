"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, ChartDonut, ChartLineUp, Check, CheckCircle, Coins, Compass, List, LockKey, ShieldCheck, Stack, TrendUp, UsersThree, X } from "@phosphor-icons/react";
import { TokenETH, TokenUSDC, TokenUSDT, TokenWBTC } from "@web3icons/react";
import styles from "./styles/landingv3.module.css";

const farms = [
  { id: "eth-neutral", name: "ETH Delta Neutral", type: "Perpetual", source: "Funding capture", pair: "ETH / USDC", apy: "14.8%", tvl: "$2.84M", network: "Arbitrum", risk: "High", assets: ["ETH", "USDC"] },
  { id: "blue-chip", name: "Blue Chip Index", type: "Index", source: "Rules-based rebalancing", pair: "ETH / WBTC / SOL", apy: "12.6%", tvl: "$1.65M", network: "Ethereum", risk: "Moderate", assets: ["ETH", "WBTC"] },
  { id: "stable-yield", name: "Stablecoin Yield", type: "Spot", source: "Lending yield", pair: "USDC / USDT", apy: "7.2%", tvl: "$920K", network: "Base", risk: "Low", assets: ["USDC", "USDT"] },
] as const;

const strategyPaths = [
  { icon: ChartDonut, label: "Index", title: "Rules-based portfolios", copy: "Build multi-asset baskets with visible weights, thresholds, and scheduled rebalancing.", flow: "USDC → allocation → assets → rebalance" },
  { icon: Coins, label: "Spot", title: "Productive onchain assets", copy: "Route capital into lending and liquidity strategies with clear sources of return.", flow: "USDC → protocol → yield → compound" },
  { icon: TrendUp, label: "Perpetual", title: "Hedged market strategies", copy: "Manage margin, leverage, funding, and liquidation buffers from one workspace.", flow: "USDC → margin → hedge → funding" },
] as const;

const modelCards = [
  { icon: Stack, number: "01", title: "Choose a strategy", copy: "Start with Index, Spot, or Perpetual and a preconfigured template." },
  { icon: ShieldCheck, number: "02", title: "Set the guardrails", copy: "Define assets, risk limits, fees, and execution rules before capital moves." },
  { icon: ChartLineUp, number: "03", title: "Operate with context", copy: "Track performance, LP activity, positions, and manager actions in one place." },
];

const yieldCards = [
  { icon: Coins, title: "Lending yield", copy: "Interest paid by borrowers across supported money markets." },
  { icon: TrendUp, title: "Liquidity yield", copy: "Trading fees and incentives from onchain liquidity." },
  { icon: ChartLineUp, title: "Funding capture", copy: "Perpetual funding payments with an explicit hedge." },
  { icon: Stack, title: "Index rebalancing", copy: "Rules-based multi-asset exposure with scheduled allocation changes." },
];

export function LandingV3Root({ segments = ["home"] }: { segments?: string[] }) {
  const page = segments[0] || "home";
  const [mobile, setMobile] = useState(false);
  return <main className={styles.root}>
    <nav className={styles.nav} aria-label="Landing v3 navigation">
      <Brand />
      <div className={`${styles.navLinks} ${mobile ? styles.open : ""}`}>
        <Link href="/landingv3/yield">Yield</Link><Link href="/landingv3/farms">Farms</Link><Link href="/landingv3/networks">Networks</Link><Link href="/landingv3/home#how-it-works">How it works</Link>
      </div>
      <div><Link className={styles.ghost} href="/dbv3/dashboard">Open dashboard</Link><Link className={styles.primary} href="/dbv3/farms/create">Launch a Farm <ArrowRight size={16} /></Link><button className={styles.mobileMenu} aria-label={mobile ? "Close navigation" : "Open navigation"} onClick={() => setMobile((value) => !value)}>{mobile ? <X size={20} /> : <List size={20} />}</button></div>
    </nav>
    {page === "home" && <Home />}{page === "yield" && <Yield />}{page === "farms" && <Farms />}{page === "farm-details" && <FarmDetails farmId={segments[1]} />}{page === "networks" && <Networks />}
    <Footer />
  </main>;
}

function Home() {
  return <>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.kicker}>Onchain capital infrastructure</span>
        <h1>Launch, raise and run onchain funds.</h1>
        <p>Dexponent turns Index, Spot, and Perpetual strategies into transparent Farms—giving managers one operating system and LPs the context to decide with confidence.</p>
        <div className={styles.heroActions}><Link className={styles.primary} href="/landingv3/farms">Explore demo Farms <Compass size={17} /></Link><Link className={styles.darkButton} href="/dbv3/farms/create">Create a Farm <ArrowRight size={17} /></Link></div>
        <div className={styles.heroTrust}><span><Check size={14} weight="bold" /> No wallet required</span><span><Check size={14} weight="bold" /> Explicit risk context</span><span><Check size={14} weight="bold" /> Demo data clearly labeled</span></div>
      </div>
      <MarketPreview />
    </section>
    <section className={styles.proof} aria-label="Illustrative platform snapshot"><span><i /> Illustrative demo snapshot</span>{[["Demo capital", "$5.41M"], ["LP positions", "$184K"], ["Active Farms", "03"], ["Networks", "03"]].map(([label, value]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</section>
    <section className={styles.opportunities}><Heading level="section" kicker="Opportunity set" title="Understand the return before the headline APY." copy="Each Farm shows its strategy, network, liquidity, and risk in the same decision-ready view." /><FarmRows /></section>
    <section className={styles.strategySection}>
      <header><span className={styles.kicker}>Three strategy systems</span><h2>One product model. Three ways to put capital to work.</h2><p>Every strategy uses the same creation, review, deployment, and monitoring workflow.</p></header>
      <div className={styles.strategyGrid}>{strategyPaths.map(({ icon: Icon, label, title, copy, flow }) => <article key={label}><div><Icon size={23} /><span>{label}</span></div><h3>{title}</h3><p>{copy}</p><code>{flow}</code><Link href="/landingv3/farms">Explore {label} Farms <ArrowRight size={15} /></Link></article>)}</div>
    </section>
    <section className={styles.model} id="how-it-works">
      <div><span className={styles.kicker}>From intent to operation</span><h2>Launch quickly. Keep every decision visible.</h2><p>Templates handle the starting configuration while progressive controls keep risk, fees, and execution rules understandable.</p><Link className={styles.inlineLink} href="/dbv3/farms/create">Open the Farm builder <ArrowUpRight size={16} /></Link></div>
      <div className={styles.modelStack}>{modelCards.map(({ icon: Icon, number, title, copy }) => <article key={title}><Icon size={25} /><span>{number}</span><strong>{title}</strong><p>{copy}</p></article>)}</div>
    </section>
    <section className={styles.audiences}>
      <article><div className={styles.audienceIcon}><UsersThree size={27} /></div><span className={styles.kicker}>For liquidity providers</span><h2>Understand. Compare. Decide.</h2><p>Review strategy, performance, risk, documents, manager activity, and liquidity before making a demo deposit.</p><ul><li>Comparable Farm profiles</li><li>Clear return sources</li><li>Visible transaction activity</li></ul><Link href="/landingv3/farms">Explore capital opportunities <ArrowRight size={16} /></Link></article>
      <article><div className={styles.audienceIcon}><LockKey size={27} /></div><span className={styles.kicker}>For Farm managers</span><h2>Create. Deploy. Operate.</h2><p>Move from a template to an active demo Farm, then manage performance, positions, LP flows, and risk.</p><ul><li>Guided Farm creation</li><li>Strategy-specific controls</li><li>Actionable operating workspace</li></ul><Link href="/dbv3/farms/create">Open the v3 builder <ArrowRight size={16} /></Link></article>
    </section>
    <section className={styles.cta}><span className={styles.kicker}>Start with the demo</span><h2>See a Farm from both sides of the market.</h2><p>Explore as an LP, then open the manager workspace to understand how the strategy is operated.</p><div><Link className={styles.primary} href="/landingv3/farms">Explore Farms</Link><Link className={styles.darkButton} href="/dbv3/farms/create">Launch a Farm</Link></div></section>
  </>;
}

function Yield() { return <section className={styles.page}><Heading kicker="Yield" title="Understand where returns come from." copy="Explore lending, liquidity, funding, and rebalancing strategies with plain-language risk context." /><div className={styles.yieldGrid}>{yieldCards.map(({ icon: Icon, title, copy }) => <article key={title}><Icon size={25} /><h2>{title}</h2><p>{copy}</p><Link href="/landingv3/farms">View matching Farms <ArrowRight size={15} /></Link></article>)}</div></section>; }
function Farms() { return <section className={styles.page}><Heading kicker="Farm directory" title="Opportunities with enough context to decide." copy="Compare strategy, liquidity, risk, and network before opening the full Farm profile." /><FarmRows /></section>; }
function FarmDetails({ farmId }: { farmId?: string }) { const farm = farms.find((item) => item.id === farmId) || farms[0]; const isPerpetual = farm.id === "eth-neutral"; return <section className={styles.page}><Link className={styles.back} href="/landingv3/farms">← All Farms</Link><div className={styles.detailHero}><AssetPair assets={farm.assets} /><div><span className={styles.kicker}>{farm.network} · {farm.type}</span><h1>{farm.name}</h1><p>{isPerpetual ? "Captures funding while maintaining a market-neutral ETH hedge." : farm.id === "blue-chip" ? "Allocates across established crypto assets with rules-based rebalancing." : "Routes stablecoin liquidity to an adaptive lending allocation."} All figures are demo and estimated.</p></div><Link className={styles.primary} href={`/dbv3/farms/manage?farm=${isPerpetual ? "v3-eth-neutral" : farm.id === "blue-chip" ? "v3-blue-chip" : "v3-stable-yield"}`}>Open Farm workspace</Link></div><div className={styles.detailMetrics}>{[["Estimated APY", farm.apy], ["Demo TVL", farm.tvl], ["Risk", farm.risk], ["Settlement", "USDC"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><section className={styles.detailGrid}><article><h2>How it works</h2><div className={styles.flow}><span>USDC deposit</span><ArrowRight size={16} /><span>{isPerpetual ? "Hedged funding" : farm.id === "blue-chip" ? "Asset allocation" : "Lending markets"}</span><ArrowRight size={16} /><span>{farm.pair}</span></div></article><article><h2>Risk summary</h2>{[isPerpetual ? "Leverage and liquidation risk" : "Market and allocation risk", "Returns can change", "Protocol and smart-contract risk"].map((item) => <p key={item}><ShieldCheck size={16} />{item}</p>)}</article></section></section>; }
function Networks() { return <section className={styles.page}><Heading kicker="Networks" title="One product model across leading DeFi ecosystems." copy="V3 keeps network context visible without changing the core Farm and Position language." /><div className={styles.networks}>{["Ethereum", "Base", "Arbitrum"].map((network) => <article key={network}><NetworkMark network={network} /><h2>{network}</h2><p>Farm discovery, deposits, positions, and manager operations.</p><CheckCircle size={18} /></article>)}</div></section>; }

function MarketPreview() {
  const [selected, setSelected] = useState(0);
  const farm = farms[selected];
  return <aside className={styles.marketPreview} aria-label="Interactive demo Farm preview">
    <div className={styles.previewHead}><span>Demo Farm monitor</span><small><i /> Simulated data</small></div>
    <div className={styles.previewTabs} role="tablist" aria-label="Featured Farms">{farms.map((item, index) => <button key={item.id} role="tab" aria-selected={selected === index} onClick={() => setSelected(index)}>{item.type}</button>)}</div>
    <div className={styles.previewFlow}><AssetPair assets={["USDC"]} /><ArrowRight size={18} /><span>{farm.source}</span><ArrowRight size={18} /><AssetPair assets={farm.assets} /></div>
    <div className={styles.previewFarm}><div className={styles.previewFarmHead}><span>FEATURED FARM</span><NetworkMark network={farm.network} /></div><h2>{farm.name}</h2><p>{farm.pair} · {farm.network}</p><div className={styles.previewMetrics}><div><strong>{farm.apy}</strong><small>Estimated APY</small></div><div><strong>{farm.tvl}</strong><small>Demo TVL</small></div></div><Link href={`/landingv3/farm-details/${farm.id}`}>View Farm profile <ArrowUpRight size={15} /></Link></div>
    <div className={styles.previewFooter}><span><i /> Active demo</span><strong>{farm.risk} risk</strong></div>
  </aside>;
}

function FarmRows() { return <div className={styles.farmRows}>{farms.map((farm) => <Link href={`/landingv3/farm-details/${farm.id}`} key={farm.id}><AssetPair assets={farm.assets} /><span><strong>{farm.name}</strong><small>{farm.type} · {farm.source}</small></span><span className={styles.rowNetwork}><small>Network</small><strong><NetworkMark network={farm.network} />{farm.network}</strong></span><span><small>Estimated APY</small><strong>{farm.apy}</strong></span><span><small>Demo TVL</small><strong>{farm.tvl}</strong></span><span className={`${styles.risk} ${styles[`risk${farm.risk}`]}`}>{farm.risk} risk</span><ArrowRight size={17} /></Link>)}</div>; }
function Heading({ kicker, title, copy, level = "page" }: { kicker: string; title: string; copy: string; level?: "page" | "section" }) { const Title = level === "section" ? "h2" : "h1"; return <header className={styles.heading}><span className={styles.kicker}>{kicker}</span><Title>{title}</Title><p>{copy}</p></header>; }
function Brand() { return <Link className={styles.brand} href="/landingv3/home" aria-label="Dexponent V3 home"><img src="/brand/dexponent-mark.svg" alt="" /><span>Dexponent</span><small>V3</small></Link>; }
function AssetPair({ assets }: { assets: readonly string[] }) { const map = { ETH: TokenETH, USDC: TokenUSDC, USDT: TokenUSDT, WBTC: TokenWBTC } as const; return <span className={styles.assetPair}>{assets.map((asset) => { const Token = map[asset as keyof typeof map]; return <span key={asset}>{Token ? <Token variant="background" size={32} /> : asset}</span>; })}</span>; }
function NetworkMark({ network }: { network: string }) { const src = network === "Base" ? "/brand/chains/base.svg" : network === "Ethereum" ? "/brand/chains/ethereum.png" : "/brand/chains/arbitrum.png"; return <span className={styles.networkMark}><img src={src} alt="" /></span>; }
function Footer() { return <footer className={styles.footer}><div><Brand /><p>Infrastructure for transparent onchain managed products.</p><small>V3 demo experience · Figures are illustrative.</small></div><div><strong>Explore</strong><Link href="/landingv3/yield">Yield</Link><Link href="/landingv3/farms">Farms</Link><Link href="/landingv3/networks">Networks</Link></div><div><strong>Product</strong><Link href="/dbv3/dashboard">Dashboard</Link><Link href="/dbv3/positions">Positions</Link><Link href="/dbv3/farms/create">Create Farm</Link></div><div><strong>Company</strong><a href="https://dexponent.com/aboutus" target="_blank" rel="noreferrer">About <ArrowUpRight size={12} /></a><a href="https://docs.dexponent.com" target="_blank" rel="noreferrer">Documentation <ArrowUpRight size={12} /></a><a href="https://dexponent.com/privacy" target="_blank" rel="noreferrer">Privacy</a><a href="https://dexponent.com/terms" target="_blank" rel="noreferrer">Terms</a></div></footer>; }
