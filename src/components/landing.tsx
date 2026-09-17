"use client";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle as CircleCheck,
  Stack as Layers3,
  Shield,
  Wallet,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Brand, StrategyFlow, StrategyIcon, Notice } from "./ui";
import {
  families,
  templates,
  defaultAllocations,
  type StrategyType,
} from "@/domain/strategy";
import { useApp } from "./provider";
gsap.registerPlugin(ScrollTrigger, useGSAP);
export function Landing({ release = "v2" }: { release?: string }) {
  const [type, setType] = useState<StrategyType>("INDEX");
  const root = useRef<HTMLElement>(null);
  const t = templates.find((t) => t.type === type)!;
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".hero-copy > *", { opacity: 0, y: 26, duration: 0.8, stagger: 0.09, ease: "power3.out" });
    gsap.from(".hero-visual", { opacity: 0, scale: 0.9, y: 40, duration: 1, ease: "power3.out" });
    gsap.utils.toArray<HTMLElement>(".motion-reveal").forEach((element) => {
      gsap.fromTo(element, { opacity: 0.58, y: 28 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: element, start: "top 85%", end: "top 52%", scrub: true } });
    });
    const media = gsap.matchMedia();
    media.add("(min-width: 901px)", () => {
      ScrollTrigger.create({ trigger: ".how-section", start: "top 100px", end: "bottom 70%", pin: ".how-section .section-intro", pinSpacing: false, invalidateOnRefresh: true });
    });
    return () => media.revert();
  }, { scope: root });
  return (
    <main className={`landing release-${release}`} ref={root}>
      <nav className="landing-nav">
        <Brand />
        <div className="landing-links">
          <a href="#strategies">Strategies</a>
          <a href="#workflow">How it works</a>
          <Link href="/app/resources">Resources</Link>
        </div>
        <Link className="button" href="/login">
          Launch app <ArrowRight size={15} />
        </Link>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Launch and run onchain Farms with <img src="/brand/dexponent-mark.svg" alt="" /> <span>clarity.</span>
          </h1>
          <p>
            A professional workspace for Farm Managers and Liquidity Providers to create, evaluate, fund, and monitor transparent DeFi strategies.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" href="/signup">
              Create a Farm <ArrowRight size={17} />
            </Link>
            <a className="text-link" href="#strategies">
              Explore Farms <ArrowRight size={16} />
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-top">
            <span className="tiny-logo">
              <Layers3 size={15} /> STRATEGY WORKSPACE
            </span>
            <span className="badge">INTERACTIVE PREVIEW</span>
          </div>
          <div className="segmented">
            {families.map((f) => (
              <button
                aria-pressed={type === f.type}
                className={type === f.type ? "active" : ""}
                key={f.type}
                onClick={() => setType(f.type)}
              >
                {f.title}
              </button>
            ))}
          </div>
          <StrategyFlow
            type={type}
            values={t.defaults}
            allocations={defaultAllocations(t)}
          />
          <div className="visual-bottom">
            <CircleCheck size={15} />
            <span>Six clear stages from intent to deployment</span>
          </div>
        </div>
      </section>
      <div className="landing-divider marquee" aria-label="Dexponent capabilities">
        <div className="marquee-track">
          {[0, 1].map((copy) => <span key={copy}>Farm creation <i>·</i> Index <i>·</i> Spot yield <i>·</i> Perpetuals <i>·</i> LP discovery <i>·</i> Risk visibility <i>·</i></span>)}
        </div>
      </div>
      <section className="landing-section" id="strategies">
        <div className="section-intro">
          <h2>Start with a proven Farm structure.</h2>
          <p>Choose the return source, then make the controls your own.</p>
        </div>
        <div className="family-grid">
          {families.map((f) => (
            <Link
              href={`/app/templates?type=${f.type}`}
              className={`family-card ${f.type.toLowerCase()}`}
              key={f.type}
            >
              <span className="icon-tile">
                <StrategyIcon type={f.type} />
              </span>
              <h3>{f.title}</h3>
              <p className="motion-reveal">{f.description}</p>
              <span className="family-bottom">
                {f.use}
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="landing-section how-section" id="workflow">
        <div className="section-intro">
          <h2>
            Sophisticated strategies,
            <br />explained step by step.
          </h2>
        </div>
        <div className="how-grid">
          {[
            {
              icon: Layers3,
              title: "Start with a template",
              text: "A thoughtful starting point, with the controls to make it yours.",
            },
            {
              icon: Zap,
              title: "See the whole strategy",
              text: "Understand allocations, protocols, and risk as you configure.",
            },
            {
              icon: Shield,
              title: "Review before you commit",
              text: "Explore hypothetical scenarios and prepare a clear deployment plan.",
            },
          ].map((s) => (
            <article key={s.title}>
              <s.icon size={24} />
              <h3>{s.title}</h3>
              <p className="motion-reveal">{s.text}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="landing-footer">
        <Brand />
        <span>Transparent Farms for managers and liquidity providers</span>
        <Link href="/app/dashboard">
          Enter demo workspace <ArrowRight size={14} />
        </Link>
      </footer>
    </main>
  );
}
export function Login({ signup = false }: { signup?: boolean }) {
  const app = useApp();
  return (
    <main className="auth-page">
      <Brand />
      <div className="auth-card">
        <span className="icon-tile">
          <LeafIcon />
        </span>
        <span className="eyebrow">YOUR NEXT STRATEGY STARTS HERE</span>
        <h1>
          {signup
            ? "Make room for your next idea."
            : "Welcome to your workspace."}
        </h1>
        <p>Connect a browser wallet or explore the Dexponent demo.</p>
        <button
          className="button primary full"
          onClick={app.connect}
          disabled={app.connecting}
        >
          <Wallet size={17} />
          {app.connecting
            ? "Check your wallet…"
            : app.wallet
              ? "Wallet connected"
              : "Connect browser wallet"}
        </button>
        {app.walletError && (
          <p role="alert" className="field-error">
            {app.walletError}
          </p>
        )}
        {app.wallet && (
          <Link href="/app/dashboard" className="button full">
            Open workspace <ArrowRight size={16} />
          </Link>
        )}
        <div className="or-divider">or</div>
        <Link className="button full" href="/app/dashboard">
          Explore demo workspace <ArrowRight size={16} />
        </Link>
        <Notice>
          Demo access is local to this browser. Wallet connection requests your
          public address; it does not create an authenticated account or request
          a signature.
        </Notice>
        <Link href="/" className="muted small">
          ← Back to Dexponent
        </Link>
      </div>
    </main>
  );
}
function LeafIcon() {
  return <Layers3 size={23} />;
}
