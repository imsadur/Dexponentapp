"use client";
import { ArrowRight, Check, LockSimple, Wallet } from "@phosphor-icons/react";
import Link from "next/link";
import { type ReactNode } from "react";
import { useAccessStatus } from "./notifications-panel";
import { useApp } from "./provider";

/** Sign-in link that returns the user to `path` (defaults to the current page). */
export function signInHref(path?: string) {
  const next = path ?? (typeof window === "undefined" ? "/app/dashboard/" : window.location.pathname + window.location.search);
  return `/login/?next=${encodeURIComponent(next)}`;
}

type Secondary = { label: string; href: string };

/**
 * Visitor state for pages that need an account. Explains what the page is for and offers one
 * clear next step, plus an optional way to keep exploring.
 */
export function SignInGate({
  title,
  body,
  secondary,
  next,
  children,
}: {
  title: string;
  body: string;
  secondary?: Secondary;
  /** Where to return after sign-in. Defaults to the current page. */
  next?: string;
  children?: ReactNode;
}) {
  return (
    <section className="signin-gate" aria-labelledby="signin-gate-title">
      <span className="signin-gate-icon" aria-hidden="true">
        <LockSimple size={18} />
      </span>
      <h2 id="signin-gate-title">{title}</h2>
      <p>{body}</p>
      <div className="signin-gate-actions">
        <Link className="button primary" href={signInHref(next)}>
          Sign in <ArrowRight size={15} />
        </Link>
        {secondary && (
          <Link className="button" href={secondary.href}>
            {secondary.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Connects a browser wallet. If none is installed, offers the preview wallet so the flow can
 * still be explored in this environment.
 */
export function ConnectWalletButton({ className = "button primary", label = "Connect wallet" }: { className?: string; label?: string }) {
  const app = useApp();
  return (
    <span className="connect-wallet">
      <button type="button" className={className} onClick={() => app.connect()} disabled={app.connecting}>
        {app.connecting ? "Check your wallet…" : label}
      </button>
      {app.walletError && (
        <small className="connect-wallet-error" role="alert">
          {app.walletError.startsWith("No browser wallet") ? "No wallet found." : app.walletError}{" "}
          <button type="button" className="text-link" onClick={app.connectDemo}>
            Use preview wallet
          </button>
        </small>
      )}
    </span>
  );
}

/**
 * Empty-state nudge used inside tables and panels: a short title, one line of context and
 * up to two actions. Keeps the page structure in place while it explains the next step.
 */
export function Nudge({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="positions-nudge">
      <div className="positions-nudge-copy">
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="positions-nudge-actions">{children}</div>
      </div>
    </div>
  );
}

type StepState = "done" | "current" | "todo";

/**
 * Manager pages with nothing to list yet: one flat card with a clear next action on the left and
 * the path to a live DTF on the right, ticking off what's already done (wallet, draft, access).
 */
export function ManagerNudge({ connected }: { connected: boolean }) {
  const app = useApp();
  const access = useAccessStatus(app.session?.identifier);
  const drafts = connected ? app.myFarms.filter((f) => f.status === "DRAFT" || f.status === "SIMULATION").length : 0;
  const cleared = Boolean(app.session) && access === "granted";

  const done = [connected, drafts > 0, false];
  const current = done.findIndex((d) => !d);
  const state = (i: number): StepState => (done[i] ? "done" : i === current ? "current" : "todo");
  const steps = [
    { title: "Connect your wallet", body: connected && app.wallet ? `Connected · ${app.wallet.slice(0, 6)}…${app.wallet.slice(-4)}` : "The wallet you'll manage DTFs from." },
    { title: "Build from a template", body: drafts ? `${drafts} draft${drafts === 1 ? "" : "s"} in progress` : "Index, Spot or Perpetual, mostly preconfigured." },
    { title: "Launch", body: cleared ? "You're cleared to launch." : "Sign in and get DTF access when you launch." },
  ];

  const copy = !connected
    ? { title: "Your DTFs will show here", body: "Connect the wallet you manage DTFs from to see their TVL, flows and fees in one place." }
    : drafts
      ? { title: "Finish your first DTF", body: `You have ${drafts} draft${drafts === 1 ? "" : "s"} in progress. Pick up where you left off and go live.` }
      : { title: "Launch your first DTF", body: "Start from a template, set your fees and terms, and go live. Most of the setup is done for you." };

  return (
    <section className="manager-empty" aria-label="Get started managing DTFs">
      <div className="manager-empty-copy">
        <h3>{copy.title}</h3>
        <p>{copy.body}</p>
        <div className="positions-nudge-actions">
          {!connected ? (
            <ConnectWalletButton />
          ) : drafts ? (
            <Link className="button primary" href="/app/farms/drafts/">
              Continue draft <ArrowRight size={15} />
            </Link>
          ) : (
            <Link className="button primary" href="/app/farms/new/">
              Create DTF <ArrowRight size={15} />
            </Link>
          )}
          <Link className="button" href={drafts ? "/app/farms/new/" : "/app/templates/"}>
            {drafts ? "Start a new DTF" : "Browse templates"}
          </Link>
        </div>
      </div>
      <ol className="manager-steps" aria-label="Path to your first DTF">
        {steps.map((step, i) => (
          <li key={step.title} className={state(i)}>
            <span className="manager-step-mark" aria-hidden="true">
              {state(i) === "done" ? <Check size={13} weight="bold" /> : i + 1}
            </span>
            <span>
              <strong>{step.title}</strong>
              <small>{step.body}</small>
            </span>
            <span className="sr-only">{state(i) === "done" ? "(done)" : state(i) === "current" ? "(next step)" : "(to do)"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Full-page state for a manager page that needs a connected wallet. */
export function WalletGate({ title, body, secondary }: { title: string; body: string; secondary?: Secondary }) {
  return (
    <section className="signin-gate" aria-labelledby="wallet-gate-title">
      <span className="signin-gate-icon" aria-hidden="true">
        <Wallet size={18} />
      </span>
      <h2 id="wallet-gate-title">{title}</h2>
      <p>{body}</p>
      <div className="signin-gate-actions">
        <ConnectWalletButton />
        {secondary && (
          <Link className="button" href={secondary.href}>
            {secondary.label}
          </Link>
        )}
      </div>
    </section>
  );
}

/** Centered empty card: icon tile, title, one line, up to two actions and an optional footnote. */
export function EmptyPanel({ icon, title, body, children, note }: { icon: ReactNode; title: string; body: string; children?: ReactNode; note?: string }) {
  return (
    <section className="empty-panel" aria-label={title}>
      <span className="empty-panel-icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{body}</p>
      {children && <div className="connect-empty-actions">{children}</div>}
      {note && <small>{note}</small>}
    </section>
  );
}
