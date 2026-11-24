/**
 * Simulated LP positions in DTFs, kept per signed-in user in this browser.
 * No wallet is debited and no transaction is sent: balances start from a demo
 * allowance and position value accrues at the DTF's 7D APY. The UI must label
 * every figure from here as simulated.
 */

export type DtfPosition = {
  /** Net amount deposited (deposits minus the cost share of withdrawals). */
  costBasis: number;
  /** Position value at `valuedAt`. */
  value: number;
  valuedAt: string;
  /** Withdrawals are blocked until this time when the DTF has a lock-in period. */
  lockedUntil?: string;
};

export type DtfPortfolio = {
  balances: Record<string, number>;
  positions: Record<string, DtfPosition>;
  /** Gains (or losses) locked in by withdrawals, in USD. */
  realized: number;
};

export const DEMO_BALANCES: Record<string, number> = { USDC: 25_000, USDT: 10_000 };
export const MIN_DEPOSIT = 10;

export const portfolioKey = (identifier: string) => `fm:dtf-portfolio:${identifier.toLowerCase()}`;

const cents = (n: number) => Math.round(n * 100) / 100;

export function emptyPortfolio(): DtfPortfolio {
  return { balances: { ...DEMO_BALANCES }, positions: {}, realized: 0 };
}

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

/** Reads stored JSON defensively; anything malformed falls back to a fresh demo portfolio. */
export function parsePortfolio(raw: string | null): DtfPortfolio {
  if (!raw) return emptyPortfolio();
  try {
    const data = JSON.parse(raw) as Partial<DtfPortfolio>;
    const balances = { ...DEMO_BALANCES };
    for (const [asset, amount] of Object.entries(data.balances ?? {})) if (finite(amount)) balances[asset] = amount;
    const positions: Record<string, DtfPosition> = {};
    for (const [id, p] of Object.entries(data.positions ?? {})) {
      if (p && finite(p.costBasis) && finite(p.value) && !Number.isNaN(Date.parse(p.valuedAt)))
        positions[id] = {
          costBasis: p.costBasis,
          value: p.value,
          valuedAt: p.valuedAt,
          ...(typeof p.lockedUntil === "string" && !Number.isNaN(Date.parse(p.lockedUntil)) ? { lockedUntil: p.lockedUntil } : {}),
        };
    }
    const realized = typeof data.realized === "number" && Number.isFinite(data.realized) ? data.realized : 0;
    return { balances, positions, realized };
  } catch {
    return emptyPortfolio();
  }
}

export const balanceOf = (portfolio: DtfPortfolio, asset: string) => portfolio.balances[asset] ?? 0;

/** Current simulated value, accrued at the 7D APY since the last action. */
export function positionValue(position: DtfPosition | undefined, apy7d: number | null, now = Date.now()) {
  if (!position) return 0;
  const days = Math.max(0, (now - Date.parse(position.valuedAt)) / 86_400_000);
  return Math.max(0, position.value * (1 + ((apy7d ?? 0) / 100) * (days / 365)));
}

export function parseAmount(text: string) {
  const cleaned = text.replace(/,/g, "").trim();
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === "" || cleaned === ".") return NaN;
  return Number(cleaned);
}

/** Short, button-sized validation copy. Null means the amount is valid. */
export function depositError(amount: number, { balance, asset }: { balance: number; asset: string }) {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount";
  if (amount < MIN_DEPOSIT) return `Minimum ${MIN_DEPOSIT} ${asset}`;
  if (amount > balance) return `Insufficient ${asset} balance`;
  return null;
}

export const isLocked = (position: DtfPosition | undefined, now = Date.now()) =>
  Boolean(position?.lockedUntil && Date.parse(position.lockedUntil) > now);

export function withdrawError(amount: number, available: number, { lockedUntil, now = Date.now() }: { lockedUntil?: string; now?: number } = {}) {
  if (available <= 0) return "No position to withdraw";
  if (lockedUntil && Date.parse(lockedUntil) > now)
    return `Locked until ${new Date(lockedUntil).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount";
  if (amount > cents(available) + 1e-9) return "Exceeds your position";
  return null;
}

type DtfRef = { id: string; baseAsset: string; apy7d: number | null; lockupDays?: number };

/** A new deposit restarts the lock-in for the whole position; it never shortens an existing lock. */
function lockFor(current: DtfPosition | undefined, days = 0, now: number) {
  const until = days > 0 ? now + days * 86_400_000 : 0;
  const existing = current?.lockedUntil ? Date.parse(current.lockedUntil) : 0;
  const latest = Math.max(until, existing);
  return latest > now ? { lockedUntil: new Date(latest).toISOString() } : {};
}

export function applyDeposit(portfolio: DtfPortfolio, dtf: DtfRef, amount: number, now = Date.now()): DtfPortfolio {
  const current = portfolio.positions[dtf.id];
  const value = positionValue(current, dtf.apy7d, now);
  return {
    ...portfolio,
    balances: { ...portfolio.balances, [dtf.baseAsset]: cents(balanceOf(portfolio, dtf.baseAsset) - amount) },
    positions: {
      ...portfolio.positions,
      [dtf.id]: {
        costBasis: cents((current?.costBasis ?? 0) + amount),
        value: cents(value + amount),
        valuedAt: new Date(now).toISOString(),
        ...lockFor(current, dtf.lockupDays, now),
      },
    },
  };
}

export function applyWithdraw(portfolio: DtfPortfolio, dtf: DtfRef, amount: number, now = Date.now()): DtfPortfolio {
  const current = portfolio.positions[dtf.id];
  const value = positionValue(current, dtf.apy7d, now);
  if (!current || value <= 0) return portfolio;
  const taken = Math.min(amount, value);
  const remaining = cents(value - taken);
  const positions = { ...portfolio.positions };
  const costOut = current.costBasis * (taken / value);
  if (remaining < 0.01) delete positions[dtf.id];
  else
    positions[dtf.id] = {
      costBasis: cents(current.costBasis - costOut),
      value: remaining,
      valuedAt: new Date(now).toISOString(),
      ...(current.lockedUntil ? { lockedUntil: current.lockedUntil } : {}),
    };
  return {
    balances: { ...portfolio.balances, [dtf.baseAsset]: cents(balanceOf(portfolio, dtf.baseAsset) + taken) },
    positions,
    realized: cents(portfolio.realized + taken - costOut),
  };
}

export type PortfolioRow<T> = { dtf: T; value: number; costBasis: number; pnl: number; pnlPct: number };

/**
 * Totals across open positions. P&L is unrealised (open positions only);
 * total yield adds gains already locked in by withdrawals.
 */
export function portfolioSummary<T extends DtfRef>(portfolio: DtfPortfolio, dtfs: T[], now = Date.now()) {
  const rows: PortfolioRow<T>[] = [];
  for (const dtf of dtfs) {
    const position = portfolio.positions[dtf.id];
    if (!position) continue;
    const value = positionValue(position, dtf.apy7d, now);
    const pnl = value - position.costBasis;
    rows.push({ dtf, value, costBasis: position.costBasis, pnl, pnlPct: position.costBasis > 0 ? (pnl / position.costBasis) * 100 : 0 });
  }
  const value = rows.reduce((sum, r) => sum + r.value, 0);
  const costBasis = rows.reduce((sum, r) => sum + r.costBasis, 0);
  const pnl = value - costBasis;
  return {
    rows: rows.sort((a, b) => b.value - a.value),
    value,
    costBasis,
    pnl,
    pnlPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
    totalYield: pnl + portfolio.realized,
  };
}
