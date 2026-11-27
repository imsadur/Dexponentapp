"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  CaretLeft,
  Clock,
  CurrencyCircleDollar,
  Globe,
  Medal,
  SealCheck,
  ShieldCheck,
  SpinnerGap,
  Stack,
  XLogo,
} from "@phosphor-icons/react";
import { useApp } from "./provider";
import { AnimatedValue } from "./ui";
import { formatCount, formatUsdCompact } from "@/domain/format";
import { safeReturnPath } from "@/domain/access";
import {
  completeEmailSignIn,
  isValidEmail,
  makeCode,
  normalizeEmail,
  previewSocialSession,
  type Session,
  type SocialProvider,
} from "@/adapters/auth";

const DASHBOARD = "/app/dashboard/";
const LEGAL = {
  privacy: "https://dexponent.com/privacy",
  terms: "https://dexponent.com/terms",
};
const RESEND_SECONDS = 30;
const CODE_TTL_SECONDS = 300;
const dtfFeatures = [
  { icon: Stack, title: "Three strategy types", body: "Index for passive diversification, Spot for active management, Perpetual for leveraged trades." },
  { icon: Globe, title: "Base and Solana", body: "DTFs run on Base or Solana, with allocations and withdrawals recorded on-chain." },
  { icon: CurrencyCircleDollar, title: "USDC settlement", body: "Deposit and withdraw in USDC. Earn in DTF shares and withdraw the upside." },
  { icon: Clock, title: "No lockups", body: "Withdraw anytime, subject to each fund's liquidity and settlement period." },
  { icon: Medal, title: "Accountable managers", body: "Each Manager runs a DTF within published fee and risk limits." },
  { icon: ShieldCheck, title: "Non-custodial", body: "Only you control your funds. You approve every deposit and withdrawal." },
];

type View = "start" | "code";
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/**
 * One passwordless entry point for sign-in and sign-up. Google and X sign in directly;
 * email sends a 6-digit code, and verifying it signs in or creates the account.
 * `/login` and `/signup` both render this page.
 */
export function AuthPage(_props: { mode?: "login" | "signup" } = {}) {
  const app = useApp();
  const router = useRouter();
  const [view, setView] = useState<View>("start");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "email" | "verify" | SocialProvider>("");
  // Where to go after auth. Read on the client so the static page needs no Suspense.
  const [returnTo, setReturnTo] = useState<string | null>(null);
  useEffect(() => {
    setReturnTo(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
  }, []);
  const destination = returnTo || DASHBOARD;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [code, setCode] = useState("");
  const [codeSentAt, setCodeSentAt] = useState(0);

  const finish = (session: Session, welcome: string) => {
    app.signIn(session);
    app.toast(welcome);
    router.push(destination);
  };
  const sendCode = () => {
    setCode(makeCode());
    setCodeSentAt(Date.now());
    setOtp("");
    setError("");
  };

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy("email");
    sendCode();
    setView("code");
    setBusy("");
  };
  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    if (Date.now() - codeSentAt > CODE_TTL_SECONDS * 1000) return setError("This code has expired. Request a new one.");
    if (otp !== code) return setError("That code is incorrect. Check it and try again.");
    setBusy("verify");
    try {
      const { session, created } = completeEmailSignIn(email);
      finish(session, created ? "Welcome to Dexponent" : `Welcome back, ${firstName(session.name)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setBusy("");
    }
  };
  const social = (provider: SocialProvider) => {
    setError("");
    setBusy(provider);
    finish(previewSocialSession(provider), "Signed in");
  };

  let body: ReactNode;
  if (view === "start" && app.ready && app.session) {
    body = (
      <section className="auth-step centered">
        <span className="auth-badge"><SealCheck size={26} weight="duotone" /></span>
        <h1>You&apos;re signed in</h1>
        <p className="auth-sub">Signed in as {app.session.identifier}.</p>
        <Link href={destination} className="auth-primary">{returnTo ? "Continue" : "Open app"} <ArrowRight size={16} /></Link>
        <button type="button" className="auth-outline" onClick={app.signOut}>Use a different account</button>
      </section>
    );
  } else if (view === "start") {
    body = (
      <form className="auth-step centered" onSubmit={submitEmail} noValidate>
        <h1>Welcome to Dexponent</h1>
        <p className="auth-sub">Sign in or create an account.</p>
        <div className="auth-social">
          <button type="button" className="auth-outline auth-social-btn" onClick={() => social("google")} disabled={!!busy}>
            {busy === "google" ? <SpinnerGap size={18} className="auth-spin" /> : <GoogleMark />} Continue with Google
          </button>
          <button type="button" className="auth-outline auth-social-btn" onClick={() => social("x")} disabled={!!busy}>
            {busy === "x" ? <SpinnerGap size={18} className="auth-spin" /> : <XLogo size={18} weight="bold" />} Continue with X
          </button>
        </div>
        <Divider>or</Divider>
        <FloatInput label="Email address" type="email" autoComplete="email" value={email} onChange={(v) => { setEmail(v); setError(""); }} />
        <ErrorText error={error} />
        <SubmitButton disabled={!email.trim()} busy={busy === "email"}>Continue with email</SubmitButton>
        <p className="auth-fineprint center">
          By continuing, you agree to the <a href={LEGAL.terms} target="_blank" rel="noreferrer">Terms</a> and acknowledge the{" "}
          <a href="https://docs.dexponent.com/beta-scope-and-risks" target="_blank" rel="noreferrer">Risk Disclosure</a>.
        </p>
        <p className="auth-demo-code">Preview: Google and X sign in to a preview account.</p>
      </form>
    );
  } else {
    body = (
      <OtpStep
        back={() => { setView("start"); setError(""); setOtp(""); }}
        title="Check your email"
        target={<>Enter the 6-digit code sent to <strong>{normalizeEmail(email)}</strong>.</>}
        otp={otp} setOtp={(v) => { setOtp(v); setError(""); }} code={code} sentAt={codeSentAt} error={error} busy={busy === "verify"}
        onResend={sendCode} onSubmit={submitCode}
      />
    );
  }

  return (
    <main className="auth-shell">
      <aside className="auth-panel">
        <AuthLogo />
        <MarketingPanel />
        <footer className="auth-panel-foot">
          <span>© {new Date().getFullYear()} Dexponent</span>
          <span>Non-custodial · Base and Solana</span>
        </footer>
      </aside>
      <section className="auth-main">
        <header className="auth-top">
          <span className="auth-mobile-logo"><AuthLogo /></span>
          <div className="auth-top-right">
            <Link href={DASHBOARD} className="auth-skip">Continue without signing in <ArrowRight size={13} /></Link>
          </div>
        </header>
        <div className="auth-body" key={view}>{body}</div>
        <footer className="auth-legal">
          <a href={LEGAL.privacy} target="_blank" rel="noreferrer">Privacy Policy</a>
          <span aria-hidden>·</span>
          <a href={LEGAL.terms} target="_blank" rel="noreferrer">Terms and conditions</a>
        </footer>
      </section>
    </main>
  );
}

/** Google's multicolour "G", per its brand guidelines for sign-in buttons. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Left panel                                                          */
/* ------------------------------------------------------------------ */

function AuthLogo() {
  return (
    <Link href="/" className="auth-logo" aria-label="Dexponent home">
      <img src="/brand/dex-logo.svg" alt="" width="32" height="32" />
      <span>Dexponent</span>
    </Link>
  );
}

function MarketingPanel() {
  const app = useApp();
  const stats = useMemo(() => {
    const live = app.farms.filter((f) => f.status === "ACTIVE");
    const tvl = live.reduce((sum, f) => sum + f.tvl, 0);
    const apy = tvl ? live.reduce((sum, f) => sum + f.apy * f.tvl, 0) / tvl : 0;
    const lps = live.reduce((sum, f) => sum + (Number(f.values.activeLps) || 0), 0);
    return [
      { value: formatUsdCompact(tvl), label: "TVL" },
      { value: formatCount(live.length), label: "Active DTFs" },
      { value: `${apy.toFixed(1)}%`, label: "Avg. APY" },
      { value: formatCount(lps), label: "Total LPs" },
    ];
  }, [app.farms]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((i) => (i + 1) % dtfFeatures.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div className="auth-panel-content">
      <h2>Launch and invest in onchain funds</h2>
      <p>Index, Spot and Perpetual DTFs on Base and Solana. Managers launch strategies; LPs deposit USDC.</p>
      <div className="auth-live"><span className="auth-live-dot" /> Platform stats</div>
      <div className="auth-stats">
        {stats.map((s) => (
          <div key={s.label} className="auth-stat">
            {app.ready ? <AnimatedValue value={s.value} /> : <strong>{s.value}</strong>}
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="auth-feature-stack" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="DTF features">
        {dtfFeatures.map((f, i) => {
          const offset = (i - active + dtfFeatures.length) % dtfFeatures.length;
          const Icon = f.icon;
          return (
            <article key={f.title} className="auth-feature" data-offset={offset > 2 ? "hidden" : offset} aria-hidden={offset !== 0}>
              <span className="auth-feature-icon"><Icon size={20} weight="duotone" /></span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.body}</p>
              </div>
            </article>
          );
        })}
      </div>
      <div className="auth-feature-dots" role="tablist" aria-label="Choose feature">
        {dtfFeatures.map((f, i) => (
          <button key={f.title} type="button" role="tab" aria-selected={i === active} aria-label={f.title} className={i === active ? "active" : ""} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

function FloatInput({ label, value, onChange, helper, optional, type = "text", autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; helper?: string; optional?: boolean; type?: string; autoComplete?: string;
}) {
  return (
    <div className="auth-field">
      <label className="auth-float">
        <input type={type} placeholder=" " autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <span>{label}{optional && <em> (Optional)</em>}</span>
      </label>
      {helper && <small className="auth-helper">{helper}</small>}
    </div>
  );
}

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => refs.current[0]?.focus(), []);
  // The value is always a contiguous prefix of digits; typing past the end
  // jumps focus back to the next empty box, clearing a box truncates after it.
  const setAt = (i: number, digit: string) => {
    if (!digit) return onChange(value.slice(0, i));
    const chars = value.split("");
    chars[i] = digit;
    onChange(chars.join("").slice(0, 6));
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    refs.current[Math.min(digits.length, 5)]?.focus();
  };
  return (
    <div className="auth-otp" role="group" aria-label="One-time code">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`OTP digit ${i + 1}`}
          value={value[i] || ""}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            if (i > value.length) return refs.current[value.length]?.focus();
            setAt(i, d);
            if (d && i < 5) refs.current[i + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

function useSecondsLeft(from: number, total: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, total - Math.floor((now - from) / 1000));
}

function OtpStep({ title, target, otp, setOtp, code, sentAt, error, busy, onResend, onSubmit, back }: {
  title: string; target: ReactNode; otp: string; setOtp: (v: string) => void; code: string; sentAt: number;
  error: string; busy: boolean; onResend: () => void; onSubmit: (e: FormEvent) => void; back?: () => void;
}) {
  const expires = useSecondsLeft(sentAt, CODE_TTL_SECONDS);
  const resend = useSecondsLeft(sentAt, RESEND_SECONDS);
  return (
    <form className="auth-step" onSubmit={onSubmit} noValidate>
      {back && <BackLink onClick={back}>Use a different email</BackLink>}
      <h1>{title}</h1>
      <p className="auth-sub">{target}</p>
      <p className="auth-expiry">{expires > 0 ? `Code expires in ${Math.floor(expires / 60)}:${String(expires % 60).padStart(2, "0")}` : "Code expired. Request a new one."}</p>
      <OtpBoxes value={otp} onChange={setOtp} />
      <p className="auth-demo-code">
        Preview: use code <strong>{code}</strong>
      </p>
      <ErrorText error={error} />
      <SubmitButton disabled={otp.length !== 6} busy={busy}>Verify</SubmitButton>
      <p className="auth-resend">
        Didn&apos;t receive the code?{" "}
        {resend > 0 ? <span>Resend in {resend}s</span> : <button type="button" className="auth-link inline" onClick={onResend}>Resend code</button>}
      </p>
    </form>
  );
}

function SubmitButton({ children, disabled, busy }: { children: ReactNode; disabled?: boolean; busy?: boolean }) {
  return (
    <button type="submit" className="auth-primary" disabled={disabled || busy}>
      {busy ? <SpinnerGap size={18} className="auth-spin" /> : children}
    </button>
  );
}

const Divider = ({ children }: { children: ReactNode }) => <div className="auth-divider"><span>{children}</span></div>;
const ErrorText = ({ error }: { error: string }) => (error ? <p role="alert" className="auth-error">{error}</p> : null);
const BackLink = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" className="auth-back-link" onClick={onClick}><CaretLeft size={13} /> {children}</button>
);
