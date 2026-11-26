import type { StrategyType } from "./strategy";

/**
 * Manager access during beta. LPs only need a wallet; launching a DTF
 * needs a complete manager profile plus an invitation code or an approved
 * request. No review service is connected yet, so records live in the browser.
 */

export type ContactMethod = "email" | "telegram" | "x";
export type TradingBackground = "independent" | "professional" | "dao" | "quant";

export const tradingBackgrounds: { id: TradingBackground; label: string; hint: string }[] = [
  { id: "independent", label: "Independent trader", hint: "Trading your own capital" },
  { id: "professional", label: "Professional or fund", hint: "Managing capital for others" },
  { id: "dao", label: "DAO or protocol", hint: "Treasury or community fund" },
  { id: "quant", label: "Quant or developer", hint: "Systematic strategies" },
];

export const contactMethods: { id: ContactMethod; label: string; field: string; placeholder: string }[] = [
  { id: "email", label: "Email", field: "Email address", placeholder: "you@example.com" },
  { id: "telegram", label: "Telegram", field: "Telegram handle", placeholder: "@handle" },
  { id: "x", label: "X", field: "X handle", placeholder: "@handle" },
];

export type ManagerProfile = {
  firstName: string;
  lastName: string;
  contactEmail: string;
  emailVerified: boolean;
};

export type AccessRequest = {
  name: string;
  country: string;
  background: TradingBackground;
  strategies: StrategyType[];
  contactMethod: ContactMethod;
  contact: string;
  plan: string;
  submittedAt: string;
};

export type AccessRecord = {
  profile: ManagerProfile;
  status: "none" | "requested" | "granted";
  grantedVia?: "invitation";
  request?: AccessRequest;
};

export const PLAN_MIN = 20;
export const PLAN_MAX = 600;
/** Invitation codes the preview environment accepts. The first one is shown as a hint. */
export const DEMO_INVITE_CODES = ["DTF-BETA-2026", "DTF-DEMO-2026"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
const X_HANDLE = /^@?[a-zA-Z0-9_]{1,15}$/;

export const accessKey = (identifier: string) => `fm:dtf-access:${identifier.toLowerCase()}`;
/** Fired on window after the access record is saved, so the navigation can update without a reload. */
export const ACCESS_CHANGE_EVENT = "fm:access-change";

/** Deployment access status from a stored record. Anything unreadable counts as "none". */
export function parseAccessStatus(raw: string | null): AccessRecord["status"] {
  if (!raw) return "none";
  try {
    const status = (JSON.parse(raw) as Partial<AccessRecord>).status;
    return status === "granted" || status === "requested" ? status : "none";
  } catch {
    return "none";
  }
}

export function emptyRecord(identifier: string, method: "email" | "mobile", name: string): AccessRecord {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return {
    profile: {
      firstName,
      lastName: rest.join(" "),
      contactEmail: method === "email" ? identifier : "",
      // Email sign-in already proved ownership of the address.
      emailVerified: method === "email",
    },
    status: "none",
  };
}

export function isValidEmail(value: string) {
  return EMAIL.test(value.trim());
}

export function profileErrors(profile: ManagerProfile) {
  const errors: Partial<Record<"firstName" | "contactEmail", string>> = {};
  if (profile.firstName.trim().length < 2) errors.firstName = "Enter at least 2 characters.";
  if (!isValidEmail(profile.contactEmail)) errors.contactEmail = "Enter a valid email address.";
  return errors;
}

export const profileComplete = (profile: ManagerProfile) =>
  Object.keys(profileErrors(profile)).length === 0;

/** Uppercases and inserts dashes as people type: dtfdemo2026 → DTF-DEMO-2026. */
export function formatInviteCode(raw: string) {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
  return [chars.slice(0, 3), chars.slice(3, 7), chars.slice(7, 11)].filter(Boolean).join("-");
}

export const isInviteFormat = (code: string) => /^DTF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);

export function redeemInvite(code: string): { ok: true } | { ok: false; error: string } {
  if (!isInviteFormat(code)) return { ok: false, error: "Codes look like DTF-XXXX-XXXX." };
  if (!DEMO_INVITE_CODES.includes(code))
    return { ok: false, error: "This code isn't valid or has already been used. Check it and try again." };
  return { ok: true };
}

export type RequestField = "name" | "country" | "strategies" | "contact" | "plan";

export function requestErrors(request: Omit<AccessRequest, "submittedAt">) {
  const errors: Partial<Record<RequestField, string>> = {};
  if (request.name.trim().length < 2) errors.name = "Enter your name.";
  if (request.country.trim().length < 2) errors.country = "Enter your country or region.";
  if (!request.strategies.length) errors.strategies = "Choose at least one strategy type.";
  const contact = request.contact.trim();
  if (request.contactMethod === "email" && !isValidEmail(contact)) errors.contact = "Enter a valid email address.";
  if (request.contactMethod === "telegram" && !TELEGRAM.test(contact)) errors.contact = "Telegram handles are 5–32 letters, numbers, or underscores.";
  if (request.contactMethod === "x" && !X_HANDLE.test(contact)) errors.contact = "X handles are up to 15 letters, numbers, or underscores.";
  const plan = request.plan.trim().length;
  if (plan < PLAN_MIN) errors.plan = `Add a little more detail (at least ${PLAN_MIN} characters).`;
  if (plan > PLAN_MAX) errors.plan = `Keep it under ${PLAN_MAX} characters.`;
  return errors;
}

/** Only allows returning to in-app paths after sign-in (no open redirects). */
export function safeReturnPath(raw: string | null | undefined) {
  if (!raw) return null;
  if (!raw.startsWith("/app/") || raw.includes("//") || raw.includes("\\") || raw.includes(":")) return null;
  return raw;
}
