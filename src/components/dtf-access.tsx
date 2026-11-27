"use client";
import {
  ArrowRight,
  CheckCircle,
  Circle,
  Clock,
  LockSimple,
  PencilSimple,
  SealCheck,
  SignIn,
  Ticket,
  UserPlus,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ACCESS_CHANGE_EVENT,
  DEMO_INVITE_CODES,
  PLAN_MAX,
  accessKey,
  contactMethods,
  emptyRecord,
  formatInviteCode,
  isInviteFormat,
  profileComplete,
  profileErrors,
  redeemInvite,
  requestErrors,
  tradingBackgrounds,
  type AccessRecord,
  type AccessRequest,
  type ContactMethod,
  type ManagerProfile,
  type RequestField,
  type TradingBackground,
  safeReturnPath,
} from "@/domain/access";
import type { StrategyType } from "@/domain/strategy";
import { useApp } from "./provider";
import { formatDate } from "@/domain/format";
import { PageHeading } from "./ui";

const RETURN = "/app/access/";

/** Draft (or other in-app page) to return to once access is granted, from `?next=`. */
function useReturnTo() {
  const [returnTo, setReturnTo] = useState<string | null>(null);
  useEffect(() => {
    setReturnTo(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
  }, []);
  return returnTo;
}
const strategyOptions: { id: StrategyType; label: string }[] = [
  { id: "INDEX", label: "Index" },
  { id: "SPOT", label: "Spot" },
  { id: "PERPETUAL", label: "Perpetual" },
];

export function DtfAccess() {
  const app = useApp();
  return (
    <div className="access-page">
      <PageHeading
        title="DTF Access"
        description="Manager access to launch DTFs"
      />
      {!app.ready ? (
        <div className="access-card access-loading" aria-busy="true">Checking your account…</div>
      ) : app.session ? (
        <SignedInAccess key={app.session.identifier} />
      ) : (
        <SignedOutAccess />
      )}
    </div>
  );
}

function SignedOutAccess() {
  // Keep any draft return path through sign-in so the manager lands back on their DTF.
  const returnTo = useReturnTo();
  const next = `?next=${encodeURIComponent(returnTo ? `${RETURN}?next=${encodeURIComponent(returnTo)}` : RETURN)}`;
  return (
    <>
      <section className="access-card access-gate">
        <span className="access-gate-icon"><LockSimple size={22} /></span>
        <div>
          <h2>Sign in to request manager access</h2>
          <p>We need to know who&apos;s launching a DTF. Sign in with Google, X or email, and you&apos;ll come straight back here.</p>
        </div>
        <div className="access-gate-actions">
          <Link className="button primary" href={`/login/${next}`}><SignIn size={16} /> Sign in</Link>
        </div>
      </section>
      <ol className="access-preview" aria-label="How access works">
        <li><span>1</span><div><strong>Sign in</strong><small>Google, X or email</small></div></li>
        <li><span>2</span><div><strong>Manager profile</strong><small>Your name and verified email</small></div></li>
        <li><span>3</span><div><strong>Deployment access</strong><small>Redeem an invitation or request access</small></div></li>
      </ol>
      <p className="access-lp-note">
        LPs only need a connected wallet. <Link href="/app/strategies">Explore DTFs <ArrowRight size={13} /></Link>
      </p>
    </>
  );
}

function useAccessRecord() {
  const app = useApp();
  const session = app.session!;
  const key = accessKey(session.identifier);
  const [record, setRecord] = useState<AccessRecord>(() => emptyRecord(session.identifier, session.method, session.name));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setRecord(JSON.parse(raw) as AccessRecord);
    } catch {
      /* fall back to a fresh record */
    }
  }, [key]);

  function save(next: AccessRecord) {
    setRecord(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(ACCESS_CHANGE_EVENT));
    } catch {
      app.toast("Saved for this visit only. Browser storage is unavailable.");
    }
  }
  return [record, save] as const;
}

function SignedInAccess() {
  const app = useApp();
  const session = app.session!;
  const [record, save] = useAccessRecord();
  const returnTo = useReturnTo();
  const complete = profileComplete(record.profile);
  const [editingProfile, setEditingProfile] = useState(false);
  const showProfileForm = !complete || editingProfile;

  const accessState =
    record.status === "granted" ? undefined : record.status === "requested" ? undefined : "Invitation or approval needed";

  return (
    <>
      <ol className="access-steps" aria-label="Access progress">
        <Step done title="Account" detail={session.identifier} />
        <Step done={complete} title="Manager profile" detail={complete ? undefined : "Name and email needed"} />
        <Step
          done={record.status === "granted"}
          pending={record.status === "requested"}
          title="Deployment access"
          detail={accessState}
        />
      </ol>

      <section className="access-card" aria-labelledby="access-profile-title">
        <header className="access-card-head">
          <div>
            <h2 id="access-profile-title">Manager profile</h2>
            <p>Shown to LPs on your DTFs. Required to launch, including with an invitation.</p>
          </div>
          {!showProfileForm && (
            <button className="button" onClick={() => setEditingProfile(true)}><PencilSimple size={15} /> Edit</button>
          )}
        </header>
        {showProfileForm ? (
          <ProfileForm
            initial={record.profile}
            canCancel={complete}
            onCancel={() => setEditingProfile(false)}
            onSave={(profile) => {
              save({ ...record, profile });
              setEditingProfile(false);
              app.toast("Manager profile saved");
            }}
          />
        ) : (
          <div className="access-identity">
            <span className="avatar">{initials(record.profile)}</span>
            <div>
              <strong>{[record.profile.firstName, record.profile.lastName].filter(Boolean).join(" ")}</strong>
              <span>
                {record.profile.contactEmail}
                <EmailBadge verified={record.profile.emailVerified} />
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="access-card" aria-labelledby="access-deploy-title">
        <header className="access-card-head">
          <div>
            <h2 id="access-deploy-title">Deployment access</h2>
            <p>Redeem an invitation to start right away, or tell us what you plan to launch.</p>
          </div>
        </header>
        {record.status === "granted" ? (
          <div className="access-result success">
            <SealCheck size={24} weight="fill" />
            <div>
              <strong>You can launch DTFs</strong>
              <p>Access granted with an invitation code. Start from a template and review everything before deploying.</p>
            </div>
            {returnTo ? (
              <Link className="button primary" href={returnTo}>Back to your DTF <ArrowRight size={15} /></Link>
            ) : (
              <Link className="button primary" href="/app/farms/new">Create your first DTF <ArrowRight size={15} /></Link>
            )}
          </div>
        ) : !complete ? (
          <div className="access-result muted">
            <LockSimple size={20} />
            <div>
              <strong>Complete your manager profile first</strong>
              <p>Add your name and contact email above to continue.</p>
            </div>
          </div>
        ) : record.status === "requested" && record.request ? (
          <RequestSummary
            request={record.request}
            onEdit={() => save({ ...record, status: "none" })}
            onWithdraw={() => {
              save({ ...record, status: "none", request: undefined });
              app.toast("Access request withdrawn");
            }}
          />
        ) : (
          <AccessOptions
            record={record}
            onGranted={() => {
              save({ ...record, status: "granted", grantedVia: "invitation" });
              app.toast("Invitation redeemed. You can now launch DTFs.");
            }}
            onRequested={(request) => {
              save({ ...record, status: "requested", request });
              app.toast("Access request submitted");
            }}
          />
        )}
      </section>
    </>
  );
}

function Step({ done, pending, title, detail }: { done: boolean; pending?: boolean; title: string; detail?: string }) {
  const state = done ? "done" : pending ? "pending" : "todo";
  const status = done ? "Complete" : pending ? "In review" : "Not started";
  return (
    <li className={`access-step ${state}`}>
      {done ? <CheckCircle size={20} weight="fill" /> : pending ? <Clock size={20} weight="fill" /> : <Circle size={20} />}
      <div>
        <strong>{title}</strong>
        <small>{detail ? `${status} · ${detail}` : status}</small>
      </div>
    </li>
  );
}

function EmailBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="access-badge ok"><SealCheck size={12} weight="fill" /> Verified</span>
  ) : (
    <span className="access-badge warn">Unverified</span>
  );
}

const initials = (p: ManagerProfile) =>
  `${p.firstName.charAt(0)}${p.lastName.charAt(0) || p.firstName.charAt(1) || ""}`.toUpperCase();

function Field({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className={`access-field ${error ? "invalid" : ""}`}>
      <label htmlFor={htmlFor}>
        {label} {optional && <span>Optional</span>}
      </label>
      {children}
      {error ? (
        <p className="access-error" id={`${htmlFor}-error`}><WarningCircle size={13} /> {error}</p>
      ) : (
        hint && <p className="access-hint">{hint}</p>
      )}
    </div>
  );
}

function ProfileForm({
  initial,
  canCancel,
  onCancel,
  onSave,
}: {
  initial: ManagerProfile;
  canCancel: boolean;
  onCancel: () => void;
  onSave: (profile: ManagerProfile) => void;
}) {
  const id = useId();
  const [profile, setProfile] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? profileErrors(profile) : {};
  const emailLocked = initial.emailVerified;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const found = profileErrors(profile);
    if (Object.keys(found).length) {
      document.getElementById(`${id}-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    onSave({ ...profile, firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), contactEmail: profile.contactEmail.trim() });
  }

  return (
    <form className="access-form" onSubmit={submit} noValidate>
      <div className="access-grid">
        <Field label="Display name" htmlFor={`${id}-firstName`} error={errors.firstName}>
          <input
            id={`${id}-firstName`}
            value={profile.firstName}
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? `${id}-firstName-error` : undefined}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
          />
        </Field>
        <Field label="Last name" optional htmlFor={`${id}-lastName`}>
          <input
            id={`${id}-lastName`}
            value={profile.lastName}
            autoComplete="family-name"
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
          />
        </Field>
      </div>
      <Field
        label="Contact email"
        htmlFor={`${id}-contactEmail`}
        error={errors.contactEmail}
        hint={emailLocked ? "Verified when you signed in. Used for access decisions and LP inquiries." : "We'll verify this address before approving access."}
      >
        <div className="access-input-badge">
          <input
            id={`${id}-contactEmail`}
            type="email"
            value={profile.contactEmail}
            readOnly={emailLocked}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.contactEmail)}
            aria-describedby={errors.contactEmail ? `${id}-contactEmail-error` : undefined}
            onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
          />
          <EmailBadge verified={emailLocked} />
        </div>
      </Field>
      <div className="access-actions">
        <button className="button primary" type="submit">Save profile</button>
        {canCancel && <button className="button" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function AccessOptions({
  record,
  onGranted,
  onRequested,
}: {
  record: AccessRecord;
  onGranted: () => void;
  onRequested: (request: AccessRequest) => void;
}) {
  const [mode, setMode] = useState<"request" | "invite">("request");
  return (
    <>
      <div className="access-switch" role="tablist" aria-label="How do you want to get access?">
        <button role="tab" aria-selected={mode === "request"} onClick={() => setMode("request")}>
          <UserPlus size={16} /> Request access
        </button>
        <button role="tab" aria-selected={mode === "invite"} onClick={() => setMode("invite")}>
          <Ticket size={16} /> I have an invitation
        </button>
      </div>
      <div role="tabpanel">
        {mode === "invite" ? <InviteForm onGranted={onGranted} /> : <RequestForm record={record} onSubmit={onRequested} />}
      </div>
    </>
  );
}

function InviteForm({ onGranted }: { onGranted: () => void }) {
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    timer.current = setTimeout(() => {
      const result = redeemInvite(code);
      setBusy(false);
      if (result.ok) onGranted();
      else setError(result.error);
    }, 500);
  }

  return (
    <form className="access-form access-invite" onSubmit={submit} noValidate>
      <Field
        label="Invitation code"
        htmlFor={`${id}-code`}
        error={error}
        hint={<>Each code works once. Preview: use code <code>{DEMO_INVITE_CODES[0]}</code></>}
      >
        <div className="access-invite-row">
          <input
            id={`${id}-code`}
            className="access-code-input"
            value={code}
            placeholder="DTF-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-code-error` : undefined}
            onChange={(e) => {
              setCode(formatInviteCode(e.target.value));
              setError("");
            }}
          />
          <button className="button primary" type="submit" disabled={!isInviteFormat(code) || busy}>
            {busy ? "Checking…" : "Redeem"}
          </button>
        </div>
      </Field>
    </form>
  );
}

function RequestForm({ record, onSubmit }: { record: AccessRecord; onSubmit: (request: AccessRequest) => void }) {
  const id = useId();
  const previous = record.request;
  const [name, setName] = useState(previous?.name ?? [record.profile.firstName, record.profile.lastName].filter(Boolean).join(" "));
  const [country, setCountry] = useState(previous?.country ?? "");
  const [background, setBackground] = useState<TradingBackground>(previous?.background ?? "independent");
  const [strategies, setStrategies] = useState<StrategyType[]>(previous?.strategies ?? []);
  const [contactMethod, setContactMethod] = useState<ContactMethod>(previous?.contactMethod ?? "email");
  const [contact, setContact] = useState(previous?.contact ?? record.profile.contactEmail);
  const [plan, setPlan] = useState(previous?.plan ?? "");
  const [submitted, setSubmitted] = useState(false);

  const draft = { name, country, background, strategies, contactMethod, contact, plan };
  const errors = submitted ? requestErrors(draft) : {};
  const method = contactMethods.find((m) => m.id === contactMethod)!;
  const fieldId = (field: RequestField) => `${id}-${field}`;
  const describedBy = (field: RequestField) => (errors[field] ? `${fieldId(field)}-error` : undefined);

  function chooseContact(next: ContactMethod) {
    setContactMethod(next);
    setContact(next === "email" ? record.profile.contactEmail : "");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const found = requestErrors(draft);
    const first = Object.keys(found)[0] as RequestField | undefined;
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    onSubmit({
      ...draft,
      name: name.trim(),
      country: country.trim(),
      contact: contact.trim(),
      plan: plan.trim(),
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <form className="access-form" onSubmit={submit} noValidate>
      <div className="access-grid">
        <Field label="Name" htmlFor={fieldId("name")} error={errors.name}>
          <input id={fieldId("name")} value={name} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Country or region" htmlFor={fieldId("country")} error={errors.country}>
          <input id={fieldId("country")} value={country} autoComplete="country-name" placeholder="e.g. United Kingdom" aria-invalid={Boolean(errors.country)} aria-describedby={describedBy("country")} onChange={(e) => setCountry(e.target.value)} />
        </Field>
      </div>

      <fieldset className="access-fieldset">
        <legend>Trading background</legend>
        <div className="access-options">
          {tradingBackgrounds.map((item) => (
            <label key={item.id} className={`access-option ${background === item.id ? "selected" : ""}`}>
              <input type="radio" name={`${id}-background`} value={item.id} checked={background === item.id} onChange={() => setBackground(item.id)} />
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={`access-fieldset ${errors.strategies ? "invalid" : ""}`} aria-describedby={describedBy("strategies")}>
        <legend>What do you want to launch?</legend>
        <div className="access-chips">
          {strategyOptions.map((option, index) => {
            const on = strategies.includes(option.id);
            return (
              <label key={option.id} className={`access-chip ${on ? "selected" : ""}`}>
                <input
                  id={index === 0 ? fieldId("strategies") : undefined}
                  type="checkbox"
                  checked={on}
                  onChange={() => setStrategies(on ? strategies.filter((s) => s !== option.id) : [...strategies, option.id])}
                />
                {on && <CheckCircle size={14} weight="fill" />}
                {option.label}
              </label>
            );
          })}
        </div>
        {errors.strategies && <p className="access-error" id={`${fieldId("strategies")}-error`}><WarningCircle size={13} /> {errors.strategies}</p>}
      </fieldset>

      <Field
        label="Tell us about the strategy"
        htmlFor={fieldId("plan")}
        error={errors.plan}
        hint={<span className="access-counter">{plan.trim().length}/{PLAN_MAX}</span>}
      >
        <textarea
          id={fieldId("plan")}
          rows={4}
          value={plan}
          maxLength={PLAN_MAX + 50}
          placeholder="e.g. A BTC/ETH/SOL index rebalanced weekly, targeting LPs who want diversified large-cap exposure."
          aria-invalid={Boolean(errors.plan)}
          aria-describedby={describedBy("plan")}
          onChange={(e) => setPlan(e.target.value)}
        />
      </Field>

      <fieldset className="access-fieldset">
        <legend>How should we reach you?</legend>
        <div className="access-segment" role="radiogroup" aria-label="Preferred contact">
          {contactMethods.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={contactMethod === m.id} onClick={() => chooseContact(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <Field label={method.field} htmlFor={fieldId("contact")} error={errors.contact}>
          <input
            id={fieldId("contact")}
            type={contactMethod === "email" ? "email" : "text"}
            value={contact}
            placeholder={method.placeholder}
            autoComplete={contactMethod === "email" ? "email" : "off"}
            aria-invalid={Boolean(errors.contact)}
            aria-describedby={describedBy("contact")}
            onChange={(e) => setContact(e.target.value)}
          />
        </Field>
      </fieldset>

      <div className="access-actions split">
        <p>We only use these details to review your request. Background is self-reported.</p>
        <button className="button primary" type="submit">Submit request <ArrowRight size={15} /></button>
      </div>
    </form>
  );
}

function RequestSummary({ request, onEdit, onWithdraw }: { request: AccessRequest; onEdit: () => void; onWithdraw: () => void }) {
  const background = tradingBackgrounds.find((b) => b.id === request.background)?.label;
  const method = contactMethods.find((m) => m.id === request.contactMethod)?.label;
  return (
    <div className="access-review">
      <div className="access-result pending">
        <Clock size={22} weight="fill" />
        <div>
          <strong>Request under review</strong>
          <p>Submitted {formatDate(request.submittedAt)}</p>
        </div>
      </div>
      <dl className="access-summary">
        <div><dt>Background</dt><dd>{background}</dd></div>
        <div><dt>Strategy types</dt><dd>{request.strategies.map((s) => s.charAt(0) + s.slice(1).toLowerCase()).join(", ")}</dd></div>
        <div><dt>Contact</dt><dd>{request.contact}</dd></div>
        <div><dt>Plan</dt><dd>{request.plan}</dd></div>
      </dl>
      <p className="access-demo-note">We&apos;ll review your request and reply {request.contactMethod === "email" ? "by email" : `on ${method}`}.</p>
      <div className="access-actions">
        <button className="button" onClick={onEdit}><PencilSimple size={15} /> Edit request</button>
        <button className="button ghost-danger" onClick={onWithdraw}>Withdraw</button>
      </div>
    </div>
  );
}
