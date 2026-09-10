"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ArrowUpRight,
  ChartDonut,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";
import { Brand } from "./ui";

const pages = [
  {
    name: "Landing page v1",
    href: "/preview/landing/v1",
    type: "Landing page",
    version: "v1",
    status: "Archive",
    icon: GlobeHemisphereWest,
  },
  {
    name: "Landing page v2",
    href: "/preview/landing/v2",
    type: "Landing page",
    version: "v2",
    status: "Current",
    icon: GlobeHemisphereWest,
  },
  {
    name: "Dashboard v1",
    href: "/preview/dashboard/v1",
    type: "Dashboard",
    version: "v1",
    status: "Archive",
    icon: ChartDonut,
  },
  {
    name: "Dashboard v2",
    href: "/preview/dashboard/v2",
    type: "Dashboard",
    version: "v2",
    status: "Current",
    icon: ChartDonut,
  },
] as const;

export function ProductIndex() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".index-intro > *", {
        opacity: 0,
        y: 20,
        duration: 0.65,
        stagger: 0.07,
        ease: "power3.out",
      });
      gsap.fromTo(
        ".release-row",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: "power2.out",
        },
      );
    },
    { scope: root },
  );

  return (
    <main className="product-index" ref={root}>
      <nav className="index-nav">
        <Brand />
        <span className="index-label">Page index</span>
      </nav>

      <header className="index-intro">
        <span className="eyebrow">DEXPONENT</span>
        <h1>Choose a page.</h1>
        <p>Open a landing page or dashboard version directly.</p>
      </header>

      <section className="release-registry" aria-labelledby="release-heading">
        <div className="registry-heading">
          <div>
            <h2 id="release-heading">Pages</h2>
            <p>{pages.length} available page versions</p>
          </div>
        </div>

        <div className="release-list">
          {pages.map((page) => (
            <Link
              className="release-row simple-release-row"
              href={page.href}
              key={page.name}
            >
              <span className="release-icon">
                <page.icon size={22} />
              </span>
              <span className="release-name">
                <strong>{page.name}</strong>
                <small>{page.type}</small>
              </span>
              <span className="release-version">{page.version}</span>
              <span className={`release-status ${page.status.toLowerCase()}`}>
                {page.status}
              </span>
              <span className="release-open">
                Open <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="index-footer">
        <span>Dexponent page versions</span>
        <Link href="/app/dashboard">
          Open current application <ArrowUpRight size={14} />
        </Link>
      </footer>
    </main>
  );
}
