"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
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
  const glyph = network === "Ethereum" ? "◆" : network === "Base" ? "B" : network === "Arbitrum" ? "A" : "◎";
  return <span className={`network-icon network-${key}`} style={{ width: size, height: size }} aria-hidden="true">{glyph}</span>;
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
      <strong>{value}</strong>
      <small>
        {change && <b className="positive">{change}</b>} {caption}
      </small>
    </div>
  );
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
  return (
    <svg
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
        points={`0,${height} ${line} ${width},${height}`}
        fill={`url(#${id})`}
      />
      <polyline
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
              <small>PROTOCOL</small>
              <strong>{values.protocol || "Aave"}</strong>
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
