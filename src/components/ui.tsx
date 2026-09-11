"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Stack as Layers3,
  Graph as Network,
  Shield,
  TrendUp as TrendingUp,
  X,
  Lightning as Zap,
} from "@phosphor-icons/react";
import {
  type Allocation,
  type RiskLevel,
  type StrategyType,
  type Values,
} from "@/domain/strategy";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Dexponent home">
      <img src="/brand/dexponent-mark.svg" alt="" width="34" height="34" />
      <span>Dexponent</span>
    </Link>
  );
}
export function AssetIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const normalized = symbol.toUpperCase().replace("W", "");
  const labels: Record<string, string> = { USDC: "$", DAI: "◈", USDT: "₮", ETH: "Ξ", BTC: "₿", UNI: "U", AAVE: "A" };
  return (
    <span className={`asset-icon asset-${normalized.toLowerCase()}`} style={{ width: size, height: size }} aria-hidden="true">
      {labels[normalized] || normalized.slice(0, 1)}
    </span>
  );
}
export function NetworkIcon({ network, size = 24 }: { network: string; size?: number }) {
  const key = network.toLowerCase().replaceAll(" ", "-");
  const logos: Record<string, string> = {
    Arbitrum: "/brand/chains/arbitrum.png",
    Base: "/brand/chains/base.svg",
    Ethereum: "/brand/chains/ethereum.png",
  };
  return (
    <span
      className={`network-icon network-${key}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {logos[network] ? (
        <img src={logos[network]} alt="" />
      ) : (
        <Layers3 size={Math.max(12, size - 8)} />
      )}
    </span>
  );
}
export function StrategyIcon({
  type,
  size = 22,
}: {
  type: StrategyType;
  size?: number;
}) {
  return type === "INDEX" ? (
    <Layers3 size={size} />
  ) : type === "SPOT" ? (
    <TrendingUp size={size} />
  ) : (
    <Zap size={size} />
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Risk({ level }: { level: RiskLevel }) {
  return (
    <span className={`risk ${level.toLowerCase()}`}>
      <Shield size={12} />
      {level.charAt(0) + level.slice(1).toLowerCase()} risk
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  href,
  label = "Create farm",
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <span className="icon-tile">
        <Layers3 />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="button primary" href={href}>
          {label}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`notice ${tone}`}>
      <Shield size={16} />
      <div>{children}</div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Metric({
  label,
  value,
  change,
  caption,
}: {
  label: string;
  value: string;
  change?: string;
  caption?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <AnimatedValue value={value} />
      <small>
        {change && <b className="positive">{change}</b>} {caption}
      </small>
    </div>
  );
}
export function AnimatedValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const match = value.match(/-?[\d,.]+/);
    if (!match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = value;
      return;
    }
    const raw = match[0];
    const target = Number(raw.replaceAll(",", ""));
    if (!Number.isFinite(target)) return;
    const decimalPart = raw.split(".")[1];
    const decimals = decimalPart?.length || 0;
    const integerWidth = decimals ? 0 : raw.replace(/[^\d]/g, "").length;
    const start = match.index ?? 0;
    const prefix = value.slice(0, start);
    const suffix = value.slice(start + raw.length);
    const state = { current: 0 };
    const tween = gsap.to(state, {
      current: target,
      duration: 0.85,
      ease: "power2.out",
      onUpdate: () => {
        const absolute = Math.abs(state.current);
        let formatted = decimals
          ? absolute.toFixed(decimals)
          : Math.round(absolute).toLocaleString("en-US");
        if (integerWidth > 1 && !formatted.includes(",")) {
          formatted = formatted.padStart(integerWidth, "0");
        }
        element.textContent = `${prefix}${target < 0 ? "-" : ""}${formatted}${suffix}`;
      },
      onComplete: () => {
        element.textContent = value;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);
  return <strong ref={ref} className={className}>{value}</strong>;
}
export function money(n: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 2 : 0,
    ...(compact ? { notation: "compact" as const } : {}),
  }).format(n);
}
export function PerformanceChart({
  points,
  mini = false,
  label = "Demo portfolio value",
}: {
  points: number[];
  mini?: boolean;
  label?: string;
}) {
  const id = useId().replaceAll(":", "");
  const chartRef = useRef<SVGSVGElement>(null);
  const width = 800,
    height = mini ? 70 : 230;
  const min = Math.min(...points) * 0.99,
    max = Math.max(...points) * 1.01;
  const coords = points.map(
    (v, i) =>
      `${((i / (points.length - 1)) * width).toFixed(2)},${(height - 12 - ((v - min) / (max - min)) * (height - 24)).toFixed(2)}`,
  );
  const line = coords.join(" ");
  const up = points.at(-1)! >= points[0];
  useEffect(() => {
    const chart = chartRef.current;
    const trace = chart?.querySelector<SVGPolylineElement>(".chart-trace");
    const area = chart?.querySelector<SVGPolygonElement>(".chart-area");
    if (!chart || !trace || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const length = trace.getTotalLength();
    const context = gsap.context(() => {
      gsap.fromTo(
        trace,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: mini ? 0.65 : 1.15, ease: "power2.out" },
      );
      if (area) gsap.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: mini ? 0.1 : 0.3 });
    }, chart);
    return () => context.revert();
  }, [line, mini]);
  return (
    <svg
      ref={chartRef}
      className={mini ? "sparkline" : "performance-chart"}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}; starts at ${points[0].toFixed(0)}, ends at ${points.at(-1)!.toFixed(0)}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={up ? "#84d7b1" : "#eaa082"}
            stopOpacity="0.15"
          />
          <stop offset="100%" stopColor="#84d7b1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {!mini &&
        [0.2, 0.45, 0.7, 0.95].map((y) => (
          <line
            key={y}
            x1="0"
            x2={width}
            y1={height * y}
            y2={height * y}
            className="chart-grid"
          />
        ))}
      <polygon
        className="chart-area"
        points={`0,${height} ${line} ${width},${height}`}
        fill={`url(#${id})`}
      />
      <polyline
        className="chart-trace"
        points={line}
        fill="none"
        stroke={up ? "#84d7b1" : "#eaa082"}
        strokeWidth={mini ? 3 : 2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
export function StrategyFlow({
  type,
  values,
  allocations,
  compact = false,
}: {
  type: StrategyType;
  values: Values;
  allocations: Allocation[];
  compact?: boolean;
}) {
  const steps =
    type === "INDEX"
      ? ["Asset allocation", "Scheduled rebalance"]
      : type === "SPOT"
        ? [String(values.strategy || "Lending"), "Harvest & compound"]
        : [
            `${values.underlying || "ETH"} perpetual`,
            values.direction === "Delta Neutral"
              ? "Delta hedge"
              : "Manage exposure",
          ];
  return (
    <div className={`strategy-flow ${compact ? "compact" : ""}`}>
      <div className="flow-caption">
        <span className="eyebrow">STRATEGY FLOW</span>
        <span className="live-label">
          <span />
          Live preview
        </span>
      </div>
      <div className="flow-node deposit">
        <span className="coin usdc">$</span>
        <div>
          <small>DEPOSIT</small>
          <strong>{values.asset || "USDC"}</strong>
        </div>
        <span className="node-label">Base asset</span>
      </div>
      <div className="connector">
        <ArrowDown size={14} />
      </div>
      <div className="flow-node engine">
        <span className={`icon-tile ${type.toLowerCase()}`}>
          <StrategyIcon type={type} />
        </span>
        <div>
          <small>{type}</small>
          <strong>{steps[0]}</strong>
        </div>
      </div>
      {type === "INDEX" ? (
        <>
          <div className="flow-branches" />
          <div className="asset-branches">
            {allocations
              .filter((a) => a.weight > 0)
              .map((a, i) => (
                <div key={a.asset}>
                  <span className={`coin coin-${i}`}>
                    {a.asset === "WBTC"
                      ? "₿"
                      : a.asset === "ETH"
                        ? "Ξ"
                        : a.asset === "USDC"
                          ? "$"
                          : a.asset[0]}
                  </span>
                  <strong>{a.asset}</strong>
                  <small>{a.weight}%</small>
                </div>
              ))}
          </div>
        </>
      ) : (
        <>
          <div className="connector">
            <ArrowDown size={14} />
          </div>
          <div className="flow-node">
            <span className="icon-tile protocol">
              <Network size={18} />
            </span>
            <div>
              <small>{type === "PERPETUAL" ? "VENUE" : "PROTOCOL"}</small>
              <strong>
                {type === "PERPETUAL"
                  ? values.venue || "Hyperliquid"
                  : values.protocol || "Aave"}
              </strong>
            </div>
            {type === "PERPETUAL" && (
              <span className="node-label">{values.leverage}×</span>
            )}
          </div>
        </>
      )}
      <div className="connector">
        <ArrowDown size={14} />
      </div>
      <div className="flow-node output">
        <span className="icon-tile">
          <Check size={18} />
        </span>
        <div>
          <small>AUTOMATION</small>
          <strong>{steps[1]}</strong>
        </div>
      </div>
      <div className="flow-foot">
        <Shield size={13} /> Your parameters. Your strategy.
      </div>
    </div>
  );
}
