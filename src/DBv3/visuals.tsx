import Link from "next/link";
import { Stack } from "@phosphor-icons/react";
import { TokenETH, TokenSOL, TokenUSDC, TokenUSDT, TokenWBTC } from "@web3icons/react";
import styles from "./styles/dbv3.module.css";
import type { V3Risk } from "./model";

const tokens = { ETH: TokenETH, SOL: TokenSOL, USDC: TokenUSDC, USDT: TokenUSDT, WBTC: TokenWBTC } as const;

export function BrandV3({ app = true }: { app?: boolean }) {
  return <Link className={styles.brand} href={app ? "/dbv3/dashboard" : "/landingv3/home"} aria-label="Dexponent v3 home"><img src="/brand/dexponent-mark.svg" alt="" /><span>Dexponent</span><small>V3</small></Link>;
}

export function TokenV3({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const Token = tokens[symbol as keyof typeof tokens];
  return <span className={styles.token} style={{ width: size, height: size }} aria-label={symbol}>{Token ? <Token variant="background" size={size} /> : <strong>{symbol.slice(0, 3)}</strong>}</span>;
}

export function ChainV3({ network }: { network: string }) {
  const src = network === "Base" ? "/brand/chains/base.svg" : network === "Ethereum" ? "/brand/chains/ethereum.png" : "/brand/chains/arbitrum.png";
  return <span className={styles.chain}><img src={src} alt="" />{network}</span>;
}

export function RiskV3({ level }: { level: V3Risk }) {
  return <span className={`${styles.risk} ${styles[level.toLowerCase()]}`}><i />{level.charAt(0) + level.slice(1).toLowerCase()} risk</span>;
}

export function PairV3({ assets }: { assets: string[] }) {
  return <span className={styles.pair}>{assets.slice(0, 3).map((asset) => <TokenV3 key={asset} symbol={asset} />)}</span>;
}

export function StrategyMark({ type }: { type: string }) {
  return <span className={styles.strategyMark}><Stack size={18} /><small>{type}</small></span>;
}
