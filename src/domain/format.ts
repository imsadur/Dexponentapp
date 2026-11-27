/**
 * Number and date formatting shared by the Positions page and the DTF detail page.
 * Rules: USD ≥ $1 → 2 decimals; USD < $1 → 4 significant digits; large table values → compact;
 * P&L and returns always signed; counts without leading zeros; dates as "24 Sep 2026";
 * missing data → an em dash, never $0.
 */

export const MISSING = "—";
const MINUS = "−";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isNum = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/** Plain USD: $10.18, $0.001310, $1,240.00. */
export function formatUsd(value: number | null | undefined): string {
  if (!isNum(value)) return MISSING;
  const abs = Math.abs(value);
  const sign = value < 0 ? MINUS : "";
  if (abs === 0) return "$0.00";
  if (abs < 1) {
    const text = abs.toLocaleString("en-US", { minimumSignificantDigits: 4, maximumSignificantDigits: 4, useGrouping: false });
    return `${sign}$${text}`;
  }
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Compact USD for tables and large totals: $12.4K, $5.37M. Values under $10K keep full precision. */
export function formatUsdCompact(value: number | null | undefined): string {
  if (!isNum(value)) return MISSING;
  const abs = Math.abs(value);
  if (abs < 10_000) return formatUsd(value);
  const text = abs.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: abs < 1_000_000 ? 1 : 2 });
  return `${value < 0 ? MINUS : ""}$${text}`;
}

/** Signed USD: +$1.22 / −$1.22. Zero reads $0.00. */
export function formatSignedUsd(value: number | null | undefined, compact = false): string {
  if (!isNum(value)) return MISSING;
  const abs = Math.abs(value);
  // Gains and losses are money amounts: under $1 they read in cents (+$0.01), not 4 significant digits.
  const body = abs < 1 ? `$${abs.toFixed(2)}` : (compact ? formatUsdCompact : formatUsd)(abs);
  if (body === "$0.00") return body; // nothing gained or lost: no sign
  return `${value < 0 ? MINUS : "+"}${body}`;
}

/** Signed percent: +2.56% / −3.24%. */
export function formatSignedPct(value: number | null | undefined, digits = 2): string {
  if (!isNum(value)) return MISSING;
  const rounded = Number(Math.abs(value).toFixed(digits));
  return `${value < 0 && rounded !== 0 ? MINUS : "+"}${rounded.toFixed(digits)}%`;
}

/** Unsigned percent, for rates such as APY or fee share: 12.40%. */
export function formatPct(value: number | null | undefined, digits = 2): string {
  if (!isNum(value)) return MISSING;
  return `${value < 0 ? MINUS : ""}${Math.abs(value).toFixed(digits)}%`;
}

/** Counts never carry leading zeros: 4, 1,204. */
export function formatCount(value: number | null | undefined): string {
  if (!isNum(value)) return MISSING;
  return Math.round(value).toLocaleString("en-US");
}

/** Unambiguous date: 24 Sep 2026. Accepts ISO strings, YYYY-MM-DD, or epoch ms. */
export function formatDate(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return MISSING;
  const time = typeof value === "number" ? value : Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  if (!Number.isFinite(time)) return MISSING;
  const d = new Date(time);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Full precision for tooltips: $10.18278. */
export function formatUsdPrecise(value: number | null | undefined): string {
  if (!isNum(value)) return MISSING;
  return `${value < 0 ? MINUS : ""}$${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

/** Tone class for a signed number; near-zero reads as neutral. */
export function toneOf(value: number | null | undefined, epsilon = 0.005): "positive" | "negative" | undefined {
  if (!isNum(value)) return undefined;
  return value > epsilon ? "positive" : value < -epsilon ? "negative" : undefined;
}
