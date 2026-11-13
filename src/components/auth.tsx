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
  CaretDown,
  CaretLeft,
  Check,
  Clock,
  CurrencyCircleDollar,
  Eye,
  EyeSlash,
  Globe,
  Medal,
  SealCheck,
  ShieldCheck,
  SpinnerGap,
  Stack,
  Timer,
  Wallet,
} from "@phosphor-icons/react";
import { useApp } from "./provider";
import { AnimatedValue, money } from "./ui";
import {
  createAccount,
  findByEmail,
  findByPhone,
  hashPassword,
  isStrongPassword,
  isValidEmail,
  isValidPhone,
  makeCode,
  normalizeEmail,
  normalizePhone,
  passwordRules,
  updateAccount,
  type AuthMethod,
  type Session,
} from "@/adapters/auth";

const DASHBOARD = "/app/dashboard/";
const LEGAL = {
  privacy: "https://dexponent.com/privacy",
  terms: "https://dexponent.com/terms",
};
const RESEND_SECONDS = 30;
const CODE_TTL_SECONDS = 300;
const countryCodes = [
  { code: "+91", flag: "🇮🇳" },
  { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+971", flag: "🇦🇪" },
  { code: "+65", flag: "🇸🇬" },
  { code: "+92", flag: "🇵🇰" },
  { code: "+61", flag: "🇦🇺" },
];
const dtfFeatures = [
  { icon: Stack, title: "Three strategy types", body: "Index for passive diversification, Spot for active management, Perpetual for leveraged trades." },
  { icon: Globe, title: "100% on-chain", body: "Every allocation, trade and withdrawal is recorded on Base and visible to everyone." },
  { icon: CurrencyCircleDollar, title: "USDC settlement", body: "Deposit and withdraw in USDC. Earn in DTF shares and withdraw the upside." },
  { icon: Clock, title: "No lockups", body: "Withdraw anytime, subject to each fund's liquidity and settlement period." },
  { icon: Medal, title: "Professional managers", body: "Expert strategists run each DTF within transparent, onchain-enforced limits." },
  { icon: ShieldCheck, title: "Security audited", body: "Smart contracts reviewed by Hacken. Non-custodial: only you control your funds." },
];

type View =
  | "login" | "login-otp" | "forgot" | "forgot-otp" | "forgot-reset"
  | "signup" | "mobile" | "mobile-otp" | "creating" | "ready" | "profile" | "email-otp" | "activate";
const onboardingViews: View[] = ["ready", "profile", "email-otp", "activate"];
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const app = useApp();
  const router = useRouter();
  const [view, setView] = useState<View>(mode === "login" ? "login" : "signup");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Shared form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [code, setCode] = useState("");
  const [codeSentAt, setCodeSentAt] = useState(0);
  const [profile, setProfile] = useState({ role: "", interest: "", experience: "", organisation: "" });
  const [showWhy, setShowWhy] = useState(false);

  const fullPhone = normalizePhone(country, phone);
  const go = (next: View) => {
    setError("");
    setOtp("");
    setView(next);
  };
  const sendCode = (next?: View) => {
    setCode(makeCode());
    setCodeSentAt(Date.now());
    setOtp("");
    setError("");
    if (next) setView(next);
  };
  const finish = (welcome: string) => {
    app.toast(welcome);
    router.push(DASHBOARD);
  };
  const run = async (fn: () => Promise<void> | void) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const checkCode = () => {
    if (Date.now() - codeSentAt > CODE_TTL_SECONDS * 1000) throw new Error("This code has expired. Request a new one.");
    if (otp !== code) throw new Error("That code is incorrect. Check it and try again.");
  };

  /* ---------- submit handlers ---------- */
  // Login is intentionally unvalidated (demo): whatever the user enters signs
  // them in. A matching saved account only supplies the display name.
  const submitLogin = (e: FormEvent) => {
    e.preventDefault();
    if (method === "mobile") return sendCode("login-otp");
    const account = email.trim() ? findByEmail(email) : undefined;
    const local = email.trim().split("@")[0].replace(/[._-]+/g, " ").trim();
    const displayName = account?.name || (local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : "Guest");
    app.signIn({ name: displayName, method: "email", identifier: email.trim() || "guest" });
    finish(`Welcome back, ${firstName(displayName)}`);
  };
  const submitLoginOtp = (e: FormEvent) => {
    e.preventDefault();
    const account = phone.trim() ? findByPhone(fullPhone) : undefined;
    const displayName = account?.name || "Guest";
    app.signIn({ name: displayName, method: "mobile", identifier: phone.trim() ? fullPhone : "guest" });
    finish(`Welcome back, ${firstName(displayName)}`);
  };
  const submitForgot = (e: FormEvent) => {
    e.preventDefault();
    run(() => {
      if (!findByEmail(email)) throw new Error("We couldn't find an account with this email.");
      sendCode("forgot-otp");
    });
  };
  const submitForgotOtp = (e: FormEvent) => {
    e.preventDefault();
    run(() => {
      checkCode();
      setPassword("");
      go("forgot-reset");
    });
  };
  const submitReset = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      updateAccount(email, { passwordHash: await hashPassword(password) });
      setPassword("");
      setMethod("email");
      go("login");
      app.toast("Password updated. Sign in with your new password.");
    });
  };
  const submitSignup = (e: FormEvent) => {
    e.preventDefault();
    run(() => {
      if (findByEmail(email)) throw new Error("An account with this email already exists. Sign in instead.");
      go("mobile");
    });
  };
  const submitMobile = (e: FormEvent) => {
    e.preventDefault();
    run(() => {
      if (findByPhone(fullPhone)) throw new Error("This mobile number is already linked to another account.");
      sendCode("mobile-otp");
    });
  };
  const submitMobileOtp = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      checkCode();
      const account = createAccount({
        name: name.trim(),
        email,
        phone: fullPhone,
        passwordHash: await hashPassword(password),
      });
      setPassword("");
      const session: Session = { name: account.name, method: "email", identifier: account.email };
      app.signIn(session);
      setView("creating");
      setTimeout(() => setView("ready"), 1600);
    });
  };
  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
    run(() => {
      updateAccount(email, { profile: { ...profile, organisation: profile.organisation.trim() || undefined } });
      sendCode("email-otp");
    });
  };
  const submitEmailOtp = (e: FormEvent) => {
    e.preventDefault();
    run(() => {
      checkCode();
      updateAccount(email, { emailVerified: true });
      go("activate");
    });
  };

  /* ---------- view rendering ---------- */
  const onboarding = onboardingViews.includes(view) || view === "creating";
  const step = view === "ready" || view === "creating" ? 1 : view === "activate" ? 3 : 2;
  let topRight: ReactNode = null;
  if (view === "signup")
    topRight = <>Already have an account? <Link href="/login/">Sign in</Link></>;
  if (view === "activate")
    topRight = <button type="button" onClick={() => finish(`Welcome to Dexponent, ${firstName(name)}`)}>Skip</button>;

  let body: ReactNode;

  if (view === "login" && app.ready && app.session) {
    body = (
      <section className="auth-step centered">
        <span className="auth-badge"><SealCheck size={26} weight="duotone" /></span>
        <h1>You&apos;re already signed in</h1>
        <p className="auth-sub">Signed in as {app.session.identifier}.</p>
        <Link href={DASHBOARD} className="auth-primary">Open workspace <ArrowRight size={16} /></Link>
        <button type="button" className="auth-outline" onClick={app.signOut}>Use a different account</button>
      </section>
    );
  } else if (view === "login") {
    body = (
      <form className="auth-step centered" onSubmit={submitLogin} noValidate>
        <h1>Welcome back <span aria-hidden>👋</span></h1>
        <p className="auth-sub">Sign in to your Dexponent workspace.</p>
        <div className="auth-tabs" role="tablist" aria-label="Sign in with">
          {(["email", "mobile"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={method === m} className={method === m ? "active" : ""} onClick={() => { setMethod(m); setError(""); }}>
              {m === "email" ? "Email" : "Mobile number"}
            </button>
          ))}
        </div>
        {method === "email" ? (
          <>
            <FloatInput label="Email address" type="email" autoComplete="email" value={email} onChange={setEmail} helper="For example 'you@company.com'" />
            <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
            <button type="button" className="auth-link right" onClick={() => go("forgot")}>Forgot password?</button>
          </>
        ) : (
          <PhoneInput country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} helper="We'll text a one-time code to this number." />
        )}
        <ErrorText error={error} />
        <SubmitButton busy={busy}>{method === "email" ? "Sign in" : "Send OTP"}</SubmitButton>
        <Divider>or continue with</Divider>
        <WalletButton />
        <p className="auth-switch">New to Dexponent? <Link href="/signup/">Create an account</Link></p>
        <Link href={DASHBOARD} className="auth-demo">Explore the demo workspace <ArrowRight size={13} /></Link>
      </form>
    );
  } else if (view === "login-otp" || view === "mobile-otp") {
    body = (
      <OtpStep
        title="Verify your mobile number"
        target={<>OTP sent to <strong>{countryCodes.find((c) => c.code === country)?.flag} {country} {phone}</strong>. <button type="button" className="auth-link inline" onClick={() => go(view === "login-otp" ? "login" : "mobile")}>Change number</button></>}
        otp={otp} setOtp={setOtp} code={code} sentAt={codeSentAt} error={error} busy={busy}
        onResend={() => sendCode()} onSubmit={view === "login-otp" ? submitLoginOtp : submitMobileOtp}
        anyCode={view === "login-otp"}
      />
    );
  } else if (view === "forgot") {
    body = (
      <form className="auth-step" onSubmit={submitForgot} noValidate>
        <BackLink onClick={() => go("login")}>Back to sign in</BackLink>
        <h1>Forgot password?</h1>
        <p className="auth-sub">Enter your account email and we&apos;ll send you a verification code.</p>
        <label className="auth-label-top">
          <span>ACCOUNT EMAIL</span>
          <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <ErrorText error={error} />
        <SubmitButton disabled={!isValidEmail(email)} busy={busy}>Send reset code</SubmitButton>
      </form>
    );
  } else if (view === "forgot-otp" || view === "email-otp") {
    body = (
      <OtpStep
        back={view === "email-otp" ? () => go("profile") : () => go("forgot")}
        title={view === "email-otp" ? "Verify your email" : "Check your email"}
        target={<>Enter the 6-digit code sent to <strong>{normalizeEmail(email)}</strong>.</>}
        otp={otp} setOtp={setOtp} code={code} sentAt={codeSentAt} error={error} busy={busy}
        onResend={() => sendCode()} onSubmit={view === "email-otp" ? submitEmailOtp : submitForgotOtp}
      />
    );
  } else if (view === "forgot-reset") {
    body = (
      <form className="auth-step" onSubmit={submitReset} noValidate>
        <h1>Set a new password</h1>
        <p className="auth-sub">Choose a strong password for {normalizeEmail(email)}.</p>
        <PasswordInput label="New password" autoComplete="new-password" value={password} onChange={setPassword} />
        <PasswordRules password={password} />
        <ErrorText error={error} />
        <SubmitButton disabled={!isStrongPassword(password)} busy={busy}>Update password</SubmitButton>
      </form>
    );
  } else if (view === "signup") {
    const canSubmit = name.trim().length > 1 && isValidEmail(email) && isStrongPassword(password);
    body = (
      <form className="auth-step centered" onSubmit={submitSignup} noValidate>
        <h1>Welcome to Dexponent <span aria-hidden>👋</span></h1>
        <p className="auth-sub">We just need a few details to set up your account.</p>
        <FloatInput label="Full legal name" autoComplete="name" value={name} onChange={setName} helper="Full name as it appears on your identification document" />
        <FloatInput label="Email address" type="email" autoComplete="email" value={email} onChange={setEmail} helper="For example 'you@company.com'" />
        <PasswordInput label="Create password" autoComplete="new-password" value={password} onChange={setPassword} />
        <PasswordRules password={password} />
        <ErrorText error={error} />
        <SubmitButton disabled={!canSubmit} busy={busy}>Sign up for free</SubmitButton>
        <p className="auth-fineprint">
          By signing up you agree to the <a href={LEGAL.terms} target="_blank" rel="noreferrer">Terms</a> and acknowledge the <a href="https://dexponent.com/risk" target="_blank" rel="noreferrer">Risk Disclosure</a>.
        </p>
      </form>
    );
  } else if (view === "mobile") {
    body = (
      <form className="auth-step" onSubmit={submitMobile} noValidate>
        <h1>Let&apos;s verify your contact number</h1>
        <p className="auth-sub">We&apos;ll send a one-time code to confirm your mobile number and secure your account. You can sign in with it later too.</p>
        <PhoneInput country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} />
        <ErrorText error={error} />
        <SubmitButton disabled={!isValidPhone(phone)} busy={busy}>Send OTP</SubmitButton>
      </form>
    );
  } else if (view === "creating") {
    body = (
      <section className="auth-step centered" aria-live="polite">
        <span className="auth-badge"><SpinnerGap size={26} className="auth-spin" /></span>
        <h2>Creating your account</h2>
        <p className="auth-sub">Securing your details and preparing the next step…</p>
      </section>
    );
  } else if (view === "ready") {
    body = (
      <section className="auth-step centered">
        <span className="auth-badge success"><SealCheck size={28} weight="duotone" /></span>
        <h2>Great! You&apos;re all set, {firstName(name)}!</h2>
        <p className="auth-sub">Your account is ready to go.</p>
        <button type="button" className="auth-primary" onClick={() => go("profile")}>Continue</button>
      </section>
    );
  } else if (view === "profile") {
    const canSubmit = !!(profile.role && profile.interest && profile.experience);
    const set = (key: keyof typeof profile) => (v: string) => setProfile((p) => ({ ...p, [key]: v }));
    body = (
      <form className="auth-step" onSubmit={submitProfile} noValidate>
        <h1>Tell us about yourself</h1>
        <p className="auth-sub">Personalise your Dexponent workspace with a few details.</p>
        <FloatSelect label="I'm joining as" placeholder="Select your role" value={profile.role} onChange={set("role")}
          options={["DTF Manager: launch and run DTFs", "Liquidity Provider: invest in DTFs", "Both"]} />
        <FloatSelect label="Strategy interest" placeholder="Select strategy type" value={profile.interest} onChange={set("interest")}
          options={["Index DTFs", "Spot DTFs", "Perpetual DTFs", "Exploring all three"]} />
        <FloatSelect label="DeFi experience" placeholder="Select experience" value={profile.experience} onChange={set("experience")}
          options={["New to DeFi", "Some experience", "Professional / institutional"]} />
        <FloatInput label="Organisation" optional autoComplete="organization" value={profile.organisation} onChange={set("organisation")} />
        <ErrorText error={error} />
        <SubmitButton disabled={!canSubmit} busy={busy}>Continue</SubmitButton>
      </form>
    );
  } else {
    // activate
    body = (
      <section className="auth-step">
        <h1>Activate your account</h1>
        <p className="auth-sub">Connect a wallet on Base to deposit USDC into DTFs or launch your own strategy.</p>
        <div className="auth-info-card">
          <div className="auth-info-head">
            <span className="auth-info-icon"><ShieldCheck size={20} /></span>
            <div>
              <strong>Non-custodial by design</strong>
              <p>Dexponent never holds your funds. You approve every deposit and withdrawal from your own wallet.</p>
            </div>
          </div>
          <ul>
            <li><span className="auth-info-icon sm"><CurrencyCircleDollar size={17} /></span><div><strong>Deposit and withdraw in USDC</strong><p>Earn in DTF shares and withdraw anytime, subject to fund liquidity.</p></div></li>
            <li><span className="auth-info-icon sm"><Globe size={17} /></span><div><strong>Settled on Base</strong><p>Low-cost, Ethereum-secured settlement with every action on-chain.</p></div></li>
            <li><span className="auth-info-icon sm"><SealCheck size={17} /></span><div><strong>Audited smart contracts</strong><p>Contracts reviewed by Hacken before going live.</p></div></li>
          </ul>
          <button type="button" className="auth-info-why" aria-expanded={showWhy} onClick={() => setShowWhy((v) => !v)}>
            Why is this needed? <CaretDown size={13} className={showWhy ? "open" : ""} />
          </button>
          {showWhy && <p className="auth-info-why-body">Your wallet is your account on-chain. DTF shares are minted to it when you deposit, and Farm deployments are signed by it when you launch. Connecting only shares your public address. It never requests your keys.</p>}
        </div>
        {app.walletError && <p role="alert" className="auth-error">{app.walletError}</p>}
        {app.wallet ? (
          <button type="button" className="auth-primary" onClick={() => finish(`Welcome to Dexponent, ${firstName(name)}`)}>
            Wallet connected · Go to dashboard <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="auth-primary" onClick={app.connect} disabled={app.connecting}>
            {app.connecting ? "Check your wallet…" : "Connect wallet"} <ArrowRight size={16} />
          </button>
        )}
        <p className="auth-fineprint center">You can also connect a wallet later from Settings.</p>
      </section>
    );
  }

  return (
    <main className="auth-shell">
      <aside className="auth-panel">
        <AuthLogo />
        {onboarding ? <OnboardingPanel step={step} /> : <MarketingPanel />}
        <footer className="auth-panel-foot">
          <span>© {new Date().getFullYear()} Dexponent</span>
          <span>Non-custodial · Audited by Hacken · Built on Base</span>
        </footer>
      </aside>
      <section className="auth-main">
        <header className="auth-top">
          <span className="auth-mobile-logo"><AuthLogo /></span>
          <div className="auth-top-right">{topRight}</div>
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
      { value: money(tvl, true), label: "Total TVL" },
      { value: String(live.length), label: "Live DTFs" },
      { value: `${apy.toFixed(1)}%`, label: "Avg. APY" },
      { value: lps.toLocaleString("en-US"), label: "Active LPs" },
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
      <p>Index, Spot and Perpetual DTFs, live in beta on Base. Managers launch strategies in minutes; LPs deposit USDC in one click.</p>
      <div className="auth-live"><span className="auth-live-dot" /> Live workspace stats</div>
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

function OnboardingPanel({ step }: { step: number }) {
  const steps = ["Account created", "Profile & verification", "Connect wallet"];
  return (
    <div className="auth-panel-content">
      <h2>Set up your Dexponent account in a few steps</h2>
      <p>A secure, guided setup to get you investing in or launching DTFs on Base.</p>
      <ol className="auth-stepper">
        {steps.map((label, i) => {
          const n = i + 1;
          const state = n < step || (n === 1 && step === 1) ? "done" : n === step ? "current" : "todo";
          return (
            <li key={label} className={state}>
              <span className="auth-step-dot">
                {state === "done" ? <Check size={13} weight="bold" /> : state === "current" ? <Timer size={14} /> : <i />}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
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

function PasswordInput({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-field">
      <label className="auth-float has-action">
        <input type={show ? "text" : "password"} placeholder=" " autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <span>{label}</span>
        <button type="button" className="auth-eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </label>
    </div>
  );
}

function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="auth-rules" aria-label="Password requirements">
      {passwordRules.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.id} className={ok ? "ok" : ""}>
            <span>{ok && <Check size={9} weight="bold" />}</span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

function FloatSelect({ label, placeholder, value, onChange, options }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="auth-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <CaretDown size={15} />
    </label>
  );
}

function PhoneInput({ country, setCountry, phone, setPhone, helper }: {
  country: string; setCountry: (v: string) => void; phone: string; setPhone: (v: string) => void; helper?: string;
}) {
  return (
    <div className="auth-field">
      <div className="auth-phone">
        <label className="auth-phone-code">
          <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country code">
            {countryCodes.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <CaretDown size={12} />
        </label>
        <label className="auth-float bare">
          <input type="tel" inputMode="tel" autoComplete="tel-national" placeholder=" " value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))} aria-label="Mobile number" />
          <span>Mobile number</span>
        </label>
      </div>
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

function OtpStep({ title, target, otp, setOtp, code, sentAt, error, busy, onResend, onSubmit, back, anyCode }: {
  title: string; target: ReactNode; otp: string; setOtp: (v: string) => void; code: string; sentAt: number;
  error: string; busy: boolean; onResend: () => void; onSubmit: (e: FormEvent) => void; back?: () => void;
  /** Login: accept any code (no validation) */
  anyCode?: boolean;
}) {
  const expires = useSecondsLeft(sentAt, CODE_TTL_SECONDS);
  const resend = useSecondsLeft(sentAt, RESEND_SECONDS);
  return (
    <form className="auth-step" onSubmit={onSubmit} noValidate>
      {back && <BackLink onClick={back}>Back</BackLink>}
      <h1>{title}</h1>
      <p className="auth-sub">{target}</p>
      <p className="auth-expiry">{expires > 0 ? `Code expires in ${Math.floor(expires / 60)}:${String(expires % 60).padStart(2, "0")}` : "Code expired. Request a new one."}</p>
      <OtpBoxes value={otp} onChange={setOtp} />
      <p className="auth-demo-code">
        {anyCode ? <>Demo mode: no message is sent. Enter any code to continue.</> : <>Demo mode: no message is sent. Use code <strong>{code}</strong></>}
      </p>
      <ErrorText error={error} />
      <SubmitButton disabled={!anyCode && otp.length !== 6} busy={busy}>Verify OTP</SubmitButton>
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

function WalletButton() {
  const app = useApp();
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        className="auth-outline"
        disabled={app.connecting}
        onClick={async () => {
          if (app.wallet) return router.push(DASHBOARD);
          await app.connect();
        }}
      >
        <Wallet size={18} />
        {app.connecting ? "Check your wallet…" : app.wallet ? `Wallet ${app.wallet.slice(0, 6)}…${app.wallet.slice(-4)} · Open workspace` : "Continue with wallet"}
      </button>
      {app.walletError && <p role="alert" className="auth-error">{app.walletError}</p>}
    </>
  );
}

const Divider = ({ children }: { children: ReactNode }) => <div className="auth-divider"><span>{children}</span></div>;
const ErrorText = ({ error }: { error: string }) => (error ? <p role="alert" className="auth-error">{error}</p> : null);
const BackLink = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" className="auth-back-link" onClick={onClick}><CaretLeft size={13} /> {children}</button>
);
