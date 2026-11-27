"use client";
import { ArrowRight, Check, Circle, RocketLaunch, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { AccessStatus } from "@/domain/notifications";
import { ConnectWalletButton } from "./sign-in-gate";

export type LaunchReadiness = { signedIn: boolean; wallet: boolean; access: AccessStatus };

/** Everything a manager needs before a DTF can go live. */
export const readyToLaunch = (r: LaunchReadiness) => r.signedIn && r.wallet && r.access === "granted";

/**
 * Shown when someone who built a DTF tries to launch it without being onboarded.
 * The draft is already saved; this only explains the missing step and links to it.
 */
export function LaunchGate({
  open,
  onClose,
  dtfName,
  draftHref,
  readiness,
}: {
  open: boolean;
  onClose: () => void;
  dtfName: string;
  /** Where to come back to after onboarding. */
  draftHref: string;
  readiness: LaunchReadiness;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  const accessHref = `/app/access/?next=${encodeURIComponent(draftHref)}`;
  const name = dtfName.trim() || "your DTF";
  let body: string;
  let cta: React.ReactNode;
  if (!readiness.signedIn) {
    body = `Sign in and get DTF access to launch ${name}. Your draft is saved.`;
    cta = (
      <Link className="button primary" href={`/login/?next=${encodeURIComponent(accessHref)}`}>
        Get access <ArrowRight size={15} />
      </Link>
    );
  } else if (readiness.access === "none") {
    body = `Request DTF access to launch ${name}. Your draft is saved and will be waiting.`;
    cta = (
      <Link className="button primary" href={accessHref}>
        Get access <ArrowRight size={15} />
      </Link>
    );
  } else if (readiness.access === "requested") {
    body = `Your access request is under review. We'll email you once it's approved, and ${name} will be ready to launch.`;
    cta = (
      <Link className="button primary" href={accessHref}>
        View request <ArrowRight size={15} />
      </Link>
    );
  } else {
    body = `Connect the wallet you'll launch ${name} from.`;
    cta = <ConnectWalletButton />;
  }

  const steps: { label: string; state: "done" | "pending" | "todo" }[] = [
    { label: "Sign in", state: readiness.signedIn ? "done" : "todo" },
    { label: "Connect wallet", state: readiness.wallet ? "done" : "todo" },
    {
      label: readiness.access === "requested" ? "DTF access · under review" : "DTF access",
      state: readiness.access === "granted" ? "done" : readiness.access === "requested" ? "pending" : "todo",
    },
  ];

  return (
    <div className="signin-modal-root">
      <button className="signin-modal-scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className="signin-modal launch-gate" role="dialog" aria-modal="true" aria-labelledby="launch-gate-title">
        <button ref={close} className="launch-gate-close" aria-label="Close" onClick={onClose}>
          <X size={15} />
        </button>
        <span className="signin-gate-icon launch-gate-icon" aria-hidden="true">
          <RocketLaunch size={19} />
        </span>
        <h2 id="launch-gate-title">You&apos;re one step away from launching</h2>
        <p>{body}</p>
        <ul className="launch-gate-steps" aria-label="Launch checklist">
          {steps.map((step) => (
            <li key={step.label} className={step.state}>
              <span aria-hidden="true">{step.state === "done" ? <Check size={12} weight="bold" /> : <Circle size={10} weight={step.state === "pending" ? "fill" : "regular"} />}</span>
              {step.label}
              <span className="sr-only">{step.state === "done" ? " (done)" : step.state === "pending" ? " (in review)" : " (to do)"}</span>
            </li>
          ))}
        </ul>
        <div className="signin-gate-actions">
          {cta}
          <button className="button" onClick={onClose}>
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
}
