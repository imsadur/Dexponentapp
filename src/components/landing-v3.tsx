"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CaretDown,
  ChartLineUp,
  CheckCircle,
  Coins,
  Compass,
  DiscordLogo,
  List,
  LockKey,
  ShieldCheck,
  Stack,
  TrendUp,
  UsersThree,
  X,
  XLogo,
} from "@phosphor-icons/react";
import {
  AnimatedValue,
  AssetIcon,
  Brand,
  NetworkIcon,
  PerformanceChart,
  Risk,
} from "./ui";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const protocolStats = [
  ["Protocol TVL", "$48.6M"],
  ["Active Farms", "42"],
  ["Strategies", "18"],
  ["Liquidity providers", "2,846"],
  ["30D volume", "$12.8M"],
] as const;

const farms = [
  { name: "ETH / USDC Balanced Yield", assets: ["ETH", "USDC"], apy: "18.4%", tvl: "$2.4M", network: "Ethereum", strategy: "LP + auto-compound", risk: "MEDIUM" as const, category: "ETH", points: [18, 22, 20, 29, 35, 41, 47] },
  { name: "Bitcoin Basis", assets: ["WBTC", "USDC"], apy: "14.2%", tvl: "$1.8M", network: "Arbitrum", strategy: "Delta neutral", risk: "MEDIUM" as const, category: "BTC", points: [20, 19, 23, 28, 26, 34, 38] },
  { name: "Stable Yield Reserve", assets: ["USDC", "USDT"], apy: "9.8%", tvl: "$4.1M", network: "Base", strategy: "Lending optimizer", risk: "LOW" as const, category: "Stablecoin", points: [20, 22, 24, 25, 27, 29, 31] },
] as const;

const filterOptions = ["All", "Stablecoin", "ETH", "BTC", "LP", "Index"] as const;

export function LandingV3() {
  const root = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<(typeof filterOptions)[number]>("All");
  const [mobileNav, setMobileNav] = useState(false);
  const visibleFarms = farms.filter((farm) => filter === "All" || farm.category === filter || (filter === "LP" && farm.strategy.startsWith("LP")));

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".v3-hero-copy > *", { opacity: 0, y: 24, duration: 0.72, stagger: 0.08, ease: "power3.out" });
    gsap.from(".v3-capital-map", { opacity: 0, scale: 0.94, duration: 0.9, ease: "power3.out" });
    gsap.utils.toArray<HTMLElement>(".v3-reveal").forEach((element) => {
      gsap.fromTo(element, { opacity: 0.35, y: 28 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: element, start: "top 90%", end: "top 64%", scrub: true } });
    });
    const media = gsap.matchMedia();
    media.add("(min-width: 961px)", () => {
      ScrollTrigger.create({ trigger: ".v3-model-section", start: "top 110px", end: "bottom 78%", pin: ".v3-model-intro", pinSpacing: false });
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <main className="landing-v3" ref={root}>
      <nav className="v3-nav" aria-label="Primary navigation">
        <Brand />
        <div className={`v3-nav-links ${mobileNav ? "open" : ""}`}>
          <a href="#explore">Explore</a>
          <a href="#workflow">How it works</a>
          <a href="#investors">For investors</a>
          <a href="#strategists">For strategists</a>
          <a href="#resources">Resources <CaretDown size={13} /></a>
        </div>
        <div className="v3-nav-actions">
          <Link className="button v3-nav-cta" href="/login">Launch app <ArrowRight size={15} /></Link>
          <button className="icon-button v3-mobile-menu" aria-label={mobileNav ? "Close navigation" : "Open navigation"} aria-expanded={mobileNav} onClick={() => setMobileNav((open) => !open)}>
            {mobileNav ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </nav>

      <section className="v3-hero">
        <div className="v3-hero-copy">
          <span className="v3-kicker">On-chain strategy infrastructure</span>
          <h1>Build and invest in <span>on-chain strategies.</span></h1>
          <p>Dexponent gives strategists the infrastructure to launch transparent DeFi Farms and gives liquidity providers a clearer way to discover, compare, and access them.</p>
          <div className="v3-hero-actions">
            <Link className="button primary large" href="/app/explore">Explore Farms <Compass size={18} /></Link>
            <Link className="button large" href="/app/farms/new">Launch a Farm <ArrowRight size={18} /></Link>
          </div>
          <div className="v3-hero-proof"><span><CheckCircle size={16} /> Public discovery</span><span><CheckCircle size={16} /> Transparent risk</span><span><CheckCircle size={16} /> On-chain execution</span></div>
        </div>
        <CapitalMap />
      </section>

      <section className="v3-stats" aria-labelledby="live-heading">
        <div className="v3-section-heading compact"><div><span className="v3-kicker">Demo protocol snapshot</span><h2 id="live-heading">Live on Dexponent</h2></div><span className="v3-data-label"><i /> Simulated data</span></div>
        <div className="v3-stat-grid">
          {protocolStats.map(([label, value]) => <div key={label}><span>{label}</span><AnimatedValue value={value} /></div>)}
          <div className="v3-stat-chart"><PerformanceChart mini points={[40, 44, 42, 49, 55, 53, 61, 66, 72, 70, 79]} label="Simulated protocol TVL trend" /></div>
        </div>
      </section>

      <section className="v3-section" id="explore">
        <SectionHeader kicker="Explore what is running" title="Capital opportunities with context." text="Compare return source, risk, liquidity, and network before opening a Farm." action={<Link href="/app/explore">View all Farms <ArrowRight size={16} /></Link>} />
        <div className="v3-filters" role="group" aria-label="Filter Farms">
          {filterOptions.map((item) => <button key={item} className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        <div className="v3-farm-grid">
          {visibleFarms.map((farm, index) => <FarmCard key={farm.name} farm={farm} featured={index === 0 && filter === "All"} />)}
        </div>
      </section>

      <section className="v3-section v3-workflow" id="workflow">
        <SectionHeader kicker="How Dexponent works" title="From investment logic to managed capital." text="One connected system for launching a Farm and understanding every position it creates." />
        <div className="v3-steps">
          {[['Create strategy','Define the return source and guardrails.'],['Deploy Farm','Turn the strategy into an investable product.'],['Attract capital','Liquidity providers deposit into positions.'],['Manage and rebalance','Monitor risk, liquidity, and execution.'],['Measure performance','See where returns and costs came from.']].map(([title,text], index) => <article className="v3-reveal" key={title}><span>{String(index + 1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
      </section>

      <section className="v3-section v3-audiences">
        <SectionHeader kicker="Use Dexponent" title="One protocol. Two clear paths." text="Explore freely, then connect when you are ready to deposit, create, or manage." />
        <div className="v3-audience-grid">
          <AudienceCard id="investors" icon={Coins} title="For liquidity providers" text="Discover strategies, compare performance and risk, deposit capital, and track positions." items={["Explore without signing in","Compare TVL, risk, and return source","Track deposits and withdrawals"]} cta="Explore Farms" href="/app/explore" />
          <AudienceCard id="strategists" icon={TrendUp} title="For Farm managers" text="Build strategy logic, deploy a Farm, manage capital, and monitor LP activity." items={["Start from tested templates","Publish a clear Farm profile","Manage liquidity and performance"]} cta="Launch a Farm" href="/app/farms/new" />
        </div>
      </section>

      <section className="v3-section v3-model-section">
        <div className="v3-model-intro"><span className="v3-kicker">Understand the model</span><h2>Strategy becomes a Farm. Capital becomes a Position.</h2><p>Three terms describe the full lifecycle without exposing unnecessary protocol complexity.</p></div>
        <div className="v3-model-flow">
          <FlowModel icon={Stack} title="Strategy" text="Investment logic and execution rules" />
          <ArrowRight size={24} />
          <FlowModel icon={TrendUp} title="Farm" text="A live, investable on-chain product" featured />
          <ArrowRight size={24} />
          <div className="v3-position-stack"><FlowModel icon={Coins} title="Position" text="LP ownership and performance" /><FlowModel icon={UsersThree} title="Position" text="Each provider has a clear record" /></div>
        </div>
      </section>

      <section className="v3-section" id="resources">
        <SectionHeader kicker="Why Dexponent" title="Infrastructure that makes capital understandable." text="Built for clear decisions before capital moves and precise controls after it does." />
        <div className="v3-benefit-grid">
          {[['Strategy infrastructure',Stack,'Reusable logic and configurable guardrails.'],['On-chain transparency',ChartLineUp,'Activity and performance visible in context.'],['Permissionless deployment',TrendUp,'Turn an investment thesis into a live Farm.'],['Capital management',Coins,'Liquidity, LPs, and positions in one workspace.'],['Investor discovery',Compass,'Farms that explain how returns are produced.'],['Risk visibility',ShieldCheck,'Plain-language risk factors and transaction states.']].map(([title,Icon,text]) => <article className="v3-reveal" key={title as string}><Icon size={23} /><h3>{title as string}</h3><p>{text as string}</p></article>)}
        </div>
        <div className="v3-security"><LockKey size={25} /><div><strong>Security information, without unsupported promises.</strong><span>Review contract references, risk methodology, documents, and on-chain activity before acting.</span></div><Link href="/app/resources">Security and docs <ArrowRight size={15} /></Link></div>
      </section>

      <section className="v3-section v3-ecosystem">
        <SectionHeader kicker="Built with the ecosystem" title="Connected to the networks where DeFi operates." text="Dexponent organizes multi-chain opportunities through one consistent product model." />
        <div className="v3-chain-row">{["Ethereum","Base","Arbitrum"].map((chain) => <div key={chain}><NetworkIcon network={chain} size={31} /><span>{chain}</span></div>)}</div>
        <div className="v3-community-proof"><div><AnimatedValue value="8" /><span>supported market categories</span></div><div><AnimatedValue value="24/7" /><span>on-chain activity visibility</span></div><div><AnimatedValue value="3" /><span>strategy families</span></div><a href="https://discord.com/invite/yermEKz6rc" target="_blank" rel="noreferrer">Join the community <DiscordLogo size={17} /></a></div>
      </section>

      <section className="v3-final-cta"><span className="v3-kicker">Ready to move on-chain?</span><h2>Explore strategies or launch your own.</h2><div><Link className="button primary large" href="/app/explore">Explore Farms <ArrowRight size={17} /></Link><Link className="button large" href="/app/farms/new">Launch a Farm</Link></div></section>

      <footer className="v3-footer">
        <div><Brand /><p>Transparent Farms for managers and liquidity providers.</p></div>
        <div><strong>Explore</strong><Link href="/app/explore">Farms</Link><Link href="/app/templates">Strategies</Link><Link href="/app/explore">Managers</Link></div>
        <div><strong>Build</strong><Link href="/app/farms/new">Launch a Farm</Link><Link href="/app/templates">Templates</Link><Link href="/app/dashboard">Manage</Link></div>
        <div><strong>Resources</strong><Link href="/app/resources">Docs</Link><Link href="/app/resources">Security</Link><a href="https://dexponent.com/privacy">Privacy</a></div>
        <div><strong>Community</strong><a href="https://discord.com/invite/yermEKz6rc">Discord</a><a href="https://x.com/Dexponentx">X <XLogo size={13} /></a></div>
      </footer>
    </main>
  );
}

function SectionHeader({ kicker, title, text, action }: { kicker: string; title: string; text: string; action?: React.ReactNode }) {
  return <div className="v3-section-heading"><div><span className="v3-kicker">{kicker}</span><h2>{title}</h2><p>{text}</p></div>{action}</div>;
}

function CapitalMap() {
  return <div className="v3-capital-map" aria-label="Animated strategy to Farm capital flow">
    <div className="v3-map-head"><span>Capital flow</span><span><i /> Demo preview</span></div>
    <div className="v3-map-assets"><span><AssetIcon symbol="USDC" size={34} />USDC</span><ArrowRight size={19} /><span><Stack size={22} />Balanced strategy</span></div>
    <div className="v3-map-rail"><i /><i /><i /></div>
    <div className="v3-map-farm"><div><span>LIVE FARM</span><strong>ETH / USDC Yield</strong><small>Rules, risk, and execution</small></div><AssetIcon symbol="ETH" size={44} /></div>
    <div className="v3-map-output"><span><strong>18.4%</strong><small>Estimated APY</small></span><span><strong>$2.4M</strong><small>Demo TVL</small></span><Risk level="MEDIUM" /></div>
  </div>;
}

function FarmCard({ farm, featured }: { farm: (typeof farms)[number]; featured?: boolean }) {
  return <Link href="/app/explore" className={`v3-farm-card ${featured ? "featured" : ""}`}>
    <div className="v3-farm-head"><span className="v3-pair">{farm.assets.map((asset, i) => <AssetIcon key={asset} symbol={asset} size={i ? 28 : 34} />)}</span><span><NetworkIcon network={farm.network} size={19} />{farm.network}</span></div>
    <div><span className="v3-kicker">{farm.strategy}</span><h3>{farm.name}</h3></div>
    <div className="v3-farm-metrics"><span><small>Estimated APY</small><strong>{farm.apy}</strong></span><span><small>Demo TVL</small><strong>{farm.tvl}</strong></span></div>
    {featured && <PerformanceChart mini points={[...farm.points]} label={`${farm.name} simulated performance`} />}
    <div className="v3-farm-foot"><Risk level={farm.risk} /><span>View Farm <ArrowRight size={15} /></span></div>
  </Link>;
}

function AudienceCard({ id, icon: Icon, title, text, items, cta, href }: { id: string; icon: typeof Coins; title: string; text: string; items: string[]; cta: string; href: string }) {
  return <article className="v3-audience-card" id={id}><Icon size={29} /><h3>{title}</h3><p>{text}</p><ul>{items.map((item) => <li key={item}><CheckCircle size={16} />{item}</li>)}</ul><Link href={href}>{cta} <ArrowRight size={16} /></Link></article>;
}

function FlowModel({ icon: Icon, title, text, featured }: { icon: typeof Stack; title: string; text: string; featured?: boolean }) {
  return <article className={`v3-model-card ${featured ? "featured" : ""}`}><Icon size={25} /><span className="v3-kicker">{title}</span><strong>{title}</strong><p>{text}</p></article>;
}
