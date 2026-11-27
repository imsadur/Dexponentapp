"use client";
import { ArrowRight, LockSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { type ReactNode } from "react";
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
