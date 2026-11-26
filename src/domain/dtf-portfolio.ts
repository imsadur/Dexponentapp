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
  /** DTF shares held. When present, value is shares × NAV per share; older positions accrue at the 7D APY. */
  shares?: number;
};

/** One deposit or withdrawal, in USD at transaction time. Kept after a position closes, for realised P&L. */
export type LedgerEntry = {
  dtfId: string;
  kind: "deposit" | "withdraw";
  usd: number;
  shares: number | null;
  nav: number | null;
  at: string;
  ref: string;
};

export type DtfPortfolio = {
  balances: Record<string, number>;
  positions: Record<string, DtfPosition>;
  /** Gains (or losses) locked in by withdrawals, in USD. */
  realized: number;
  ledger: LedgerEntry[];
};

export const DEMO_BALANCES: Record<string, number> = { USDC: 25_000, USDT: 10_000 };
export const MIN_DEPOSIT = 10;

export const portfolioKey = (identifier: string) => `fm:dtf-portfolio:${identifier.toLowerCase()}`;

const cents = (n: number) => Math.round(n * 100) / 100;

export function emptyPortfolio(): DtfPortfolio {
  return { balances: { ...DEMO_BALANCES }, positions: {}, realized: 0, ledger: [] };
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
          ...(finite(p.shares) && p.shares > 0 ? { shares: p.shares } : {}),
        };
    }
    const realized = typeof data.realized === "number" && Number.isFinite(data.realized) ? data.realized : 0;
    const ledger: LedgerEntry[] = [];
    for (const e of Array.isArray(data.ledger) ? data.ledger : []) {
      if (
        e && typeof e.dtfId === "string" && (e.kind === "deposit" || e.kind === "withdraw") &&
        finite(e.usd) && typeof e.at === "string" && !Number.isNaN(Date.parse(e.at))
      )
        ledger.push({
          dtfId: e.dtfId,
          kind: e.kind,
          usd: e.usd,
          shares: finite(e.shares) ? e.shares : null,
          nav: finite(e.nav) ? e.nav : null,
          at: e.at,
          ref: typeof e.ref === "string" ? e.ref : "",
        });
    }
    return { balances, positions, realized, ledger };
  } catch {
    return emptyPortfolio();
  }
}

export const balanceOf = (portfolio: DtfPortfolio, asset: string) => portfolio.balances[asset] ?? 0;

const validNav = (nav: number | null | undefined): nav is number => typeof nav === "number" && Number.isFinite(nav) && nav > 0;

/**
 * Current simulated value. Positions with shares are worth shares × NAV; a missing NAV makes the
 * value unknown (null), never zero. Older positions without shares accrue at the 7D APY.
 */
export function positionValueAt(position: DtfPosition | undefined, apy7d: number | null, now: number, nav: number | null | undefined): number | null {
  if (!position) return 0;
  if (position.shares !== undefined) return validNav(nav) ? position.shares * nav : null;
  return positionValue(position, apy7d, now);
}

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

type TxOptions = { nav?: number | null; ref?: string };

function entry(dtfId: string, kind: LedgerEntry["kind"], usd: number, nav: number | null | undefined, now: number, ref = ""): LedgerEntry {
  return { dtfId, kind, usd: cents(usd), shares: validNav(nav) ? usd / nav : null, nav: validNav(nav) ? nav : null, at: new Date(now).toISOString(), ref };
}

/** Lifetime deposits and withdrawals for one DTF. Positions opened before the ledger existed count their cost basis as deposited. */
export function flowsFor(portfolio: DtfPortfolio, dtfId: string) {
  const entries = portfolio.ledger.filter((e) => e.dtfId === dtfId);
  if (!entries.length) return { deposited: portfolio.positions[dtfId]?.costBasis ?? 0, withdrawn: 0, entries };
  return {
    deposited: entries.filter((e) => e.kind === "deposit").reduce((s, e) => s + e.usd, 0),
    withdrawn: entries.filter((e) => e.kind === "withdraw").reduce((s, e) => s + e.usd, 0),
    entries,
  };
}

/** Every DTF the user has ever held, open or closed. */
export const heldDtfIds = (portfolio: DtfPortfolio) => [...new Set([...Object.keys(portfolio.positions), ...portfolio.ledger.map((e) => e.dtfId)])];

export function applyDeposit(portfolio: DtfPortfolio, dtf: DtfRef, amount: number, now = Date.now(), opts: TxOptions = {}): DtfPortfolio {
  const current = portfolio.positions[dtf.id];
  const value = positionValueAt(current, dtf.apy7d, now, opts.nav) ?? positionValue(current, dtf.apy7d, now);
  const shares = validNav(opts.nav) ? { shares: (value + amount) / opts.nav } : {};
  return {
    ...portfolio,
    ledger: [...portfolio.ledger, entry(dtf.id, "deposit", amount, opts.nav, now, opts.ref)],
    balances: { ...portfolio.balances, [dtf.baseAsset]: cents(balanceOf(portfolio, dtf.baseAsset) - amount) },
    positions: {
      ...portfolio.positions,
      [dtf.id]: {
        costBasis: cents((current?.costBasis ?? 0) + amount),
        value: cents(value + amount),
        valuedAt: new Date(now).toISOString(),
        ...lockFor(current, dtf.lockupDays, now),
        ...shares,
      },
    },
  };
}

export function applyWithdraw(portfolio: DtfPortfolio, dtf: DtfRef, amount: number, now = Date.now(), opts: TxOptions = {}): DtfPortfolio {
  const current = portfolio.positions[dtf.id];
  // Never price a withdrawal off a missing NAV.
  const value = positionValueAt(current, dtf.apy7d, now, opts.nav);
  if (!current || value === null || value <= 0) return portfolio;
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
      ...(current.shares !== undefined ? { shares: current.shares * (remaining / value) } : {}),
    };
  return {
    balances: { ...portfolio.balances, [dtf.baseAsset]: cents(balanceOf(portfolio, dtf.baseAsset) + taken) },
    positions,
    realized: cents(portfolio.realized + taken - costOut),
    ledger: [...portfolio.ledger, entry(dtf.id, "withdraw", taken, opts.nav, now, opts.ref)],
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
