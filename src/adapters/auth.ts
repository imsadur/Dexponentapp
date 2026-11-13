// Local-only demo auth. This app is a static export with no backend, so accounts
// live in this browser's localStorage. Passwords are stored as SHA-256 hashes,
// never in plain text, and verification codes are generated client-side.
// Replace this adapter with a real auth API + SMS/email provider before launch.

export type AuthMethod = "email" | "mobile";
export type Session = {
  name: string;
  method: AuthMethod;
  /** Email address or phone number used to sign in */
  identifier: string;
};
export type AccountProfile = {
  role: string;
  interest: string;
  experience: string;
  organisation?: string;
};
export type Account = {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  emailVerified?: boolean;
  profile?: AccountProfile;
  createdAt: string;
};

const ACCOUNTS_KEY = "fm:accounts";
export const SESSION_KEY = "fm:session";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const normalizePhone = (code: string, number: string) =>
  `${code}${number.replace(/\D/g, "")}`;

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
export const isValidPhone = (number: string) => {
  const digits = number.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

export const passwordRules = [
  { id: "lower", label: "Lowercase character", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "Uppercase character", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Number", test: (p: string) => /\d/.test(p) },
  { id: "length", label: "12 characters minimum", test: (p: string) => p.length >= 12 },
];
export const isStrongPassword = (p: string) => passwordRules.every((r) => r.test(p));

export const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function hashPassword(password: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Drop records from the earlier single-identifier format.
    return Array.isArray(parsed) ? parsed.filter((a) => typeof a?.email === "string") : [];
  } catch {
    return [];
  }
}
function writeAccounts(accounts: Account[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    throw new Error("Browser storage is unavailable, so your account could not be saved.");
  }
}

export const findByEmail = (email: string) =>
  readAccounts().find((a) => a.email === normalizeEmail(email));
export const findByPhone = (phone: string) => readAccounts().find((a) => a.phone === phone);

export function createAccount(account: Omit<Account, "createdAt">): Account {
  if (findByEmail(account.email))
    throw new Error("An account with this email already exists. Sign in instead.");
  if (account.phone && findByPhone(account.phone))
    throw new Error("This mobile number is already linked to another account.");
  const next = { ...account, email: normalizeEmail(account.email), createdAt: new Date().toISOString() };
  writeAccounts([...readAccounts(), next]);
  return next;
}

export function updateAccount(email: string, patch: Partial<Account>) {
  const key = normalizeEmail(email);
  writeAccounts(readAccounts().map((a) => (a.email === key ? { ...a, ...patch } : a)));
}
