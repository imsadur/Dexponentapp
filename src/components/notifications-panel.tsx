"use client";
import { ArrowDownLeft, ArrowUpRight, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACCESS_CHANGE_EVENT, accessKey, parseAccessStatus } from "@/domain/access";
import { dtfActivity, dtfDirectory, dtfFromFarm, maskAddress } from "@/domain/dtf";
import { formatUsd } from "@/domain/format";
import {
  nudgesFor,
  relativeTime,
  sortActivity,
  unreadCount,
  type AccessStatus,
  type ActivityItem,
} from "@/domain/notifications";
import { farmDetailHref, strategyHref } from "@/domain/routes";
import { useApp } from "./provider";
import { useDtfPortfolio } from "./use-dtf-portfolio";
import "./notifications.css";

const seenKey = (identifier: string) => `fm:notifications-seen:${identifier.toLowerCase()}`;
/** LP flows shown per managed DTF; enough to feel live without flooding the feed. */
const FLOWS_PER_DTF = 4;

function useAccessStatus(identifier: string | undefined): AccessStatus {
  const [status, setStatus] = useState<AccessStatus>("none");
  useEffect(() => {
    if (!identifier) return setStatus("none");
    const read = () => {
      try {
        setStatus(parseAccessStatus(localStorage.getItem(accessKey(identifier))));
      } catch {
        setStatus("none");
      }
    };
    read();
    window.addEventListener(ACCESS_CHANGE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(ACCESS_CHANGE_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [identifier]);
  return status;
}

/** Nudges, activity and unread state for the signed-in user. */
export function useNotifications() {
  const app = useApp();
  const { portfolio, signedIn } = useDtfPortfolio();
  const identifier = app.session?.identifier;
  const access = useAccessStatus(identifier);
  const [now, setNow] = useState(() => Date.now());
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    if (!identifier) return;
    try {
      setSeenAt(Number(localStorage.getItem(seenKey(identifier))) || 0);
    } catch {
      setSeenAt(0);
    }
  }, [identifier]);

  const live = useMemo(() => app.farms.filter((f) => f.status === "ACTIVE"), [app.farms]);
  const drafts = app.farms.filter((f) => f.status === "DRAFT" || f.status === "SIMULATION").length;

  const items = useMemo(() => {
    if (!signedIn) return [];
    const names = new Map(dtfDirectory(app.farms, app.profile.name).map((d) => [d.id, d.name]));
    const own: ActivityItem[] = portfolio.ledger.map((e, i) => ({
      id: `lp-${e.dtfId}-${e.at}-${i}`,
      time: Date.parse(e.at),
      role: "lp",
      kind: e.kind,
      title: `${e.kind === "deposit" ? "Deposited into" : "Withdrew from"} ${names.get(e.dtfId) ?? "a DTF"}`,
      detail: formatUsd(e.usd),
      href: strategyHref(e.dtfId),
    }));
    const flows: ActivityItem[] = live.flatMap((farm) => {
      const dtf = dtfFromFarm(farm, app.profile.name);
      return dtfActivity(dtf, now, FLOWS_PER_DTF).map((a) => ({
        id: `mgr-${a.id}`,
        time: a.time,
        role: "manager" as const,
        kind: a.type === "Deposit" ? ("deposit" as const) : ("withdraw" as const),
        title: `${a.type === "Deposit" ? "New deposit in" : "Withdrawal from"} ${dtf.name}`,
        detail: `${a.amount.toLocaleString("en-US")} ${dtf.baseAsset} · ${maskAddress(a.wallet)}`,
        href: farmDetailHref(farm.id),
      }));
    });
    return sortActivity([...own, ...flows]);
  }, [signedIn, portfolio.ledger, live, app.farms, app.profile.name, now]);

  const nudges = nudgesFor({
    signedIn,
    positions: Object.keys(portfolio.positions).length,
    access,
    managedLive: live.length,
    drafts,
  });

  const markSeen = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setSeenAt(at);
    if (!identifier) return;
    try {
      localStorage.setItem(seenKey(identifier), String(at));
    } catch {
      /* unread state just won't persist */
    }
  }, [identifier]);

  return { nudges, items, unread: unreadCount(items, seenAt), seenAt, now, markSeen, hasManagerActivity: live.length > 0 };
}

type Filter = "all" | "lp" | "manager";

/** Right-side panel. Takes the state from `useNotifications()` so the bell's unread dot stays in sync. */
export function NotificationsPanel({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReturnType<typeof useNotifications> }) {
  const { nudges, items, seenAt, now, markSeen, hasManagerActivity } = data;
  const [filter, setFilter] = useState<Filter>("all");
  const [openedSeenAt, setOpenedSeenAt] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    // Remember what was unread at open time, then clear the badge.
    setOpenedSeenAt(seenAt);
    markSeen();
    returnFocus.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const shown = items.filter((i) => filter === "all" || i.role === filter);
  const filters: [Filter, string][] = [
    ["all", "All"],
    ["lp", "Positions"],
    ["manager", "Your DTFs"],
  ];

  return (
    <div className="ntf-root">
      <button className="ntf-scrim" aria-label="Close notifications" tabIndex={-1} onClick={onClose} />
      <div className="ntf-panel" role="dialog" aria-modal="true" aria-labelledby="ntf-title" ref={panelRef}>
        <header className="ntf-head">
          <h2 id="ntf-title">Notifications</h2>
          <button ref={closeRef} className="ntf-close" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="ntf-body">
          {nudges.length > 0 && (
            <section className="ntf-nudges" aria-label="Suggested">
              {nudges.map((n) => (
                <div className="ntf-nudge" key={n.id}>
                  <div>
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                  </div>
                  {n.cta && (
                    <Link className="button small primary" href={n.cta.href} onClick={onClose}>
                      {n.cta.label}
                    </Link>
                  )}
                </div>
              ))}
            </section>
          )}

          <section className="ntf-activity" aria-labelledby="ntf-activity-title">
            <div className="ntf-activity-head">
              <h3 id="ntf-activity-title">Activity</h3>
              {hasManagerActivity && (
                <div className="dtf-segment ntf-filter" role="group" aria-label="Filter activity">
                  {filters.map(([value, label]) => (
                    <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {shown.length ? (
              <ul>
                {shown.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} onClick={onClose} className={item.time > openedSeenAt ? "unread" : ""}>
                      <span className={`ntf-icon ${item.kind}`} aria-hidden="true">
                        {item.kind === "deposit" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </span>
                      <span className="ntf-text">
                        <strong>{item.title}</strong>
                        <small>
                          {item.detail} · {item.role === "lp" ? "Your position" : "Your DTF"}
                        </small>
                      </span>
                      <time dateTime={new Date(item.time).toISOString()}>{relativeTime(item.time, now)}</time>
                      {item.time > openedSeenAt && <span className="sr-only">Unread</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ntf-empty">No activity yet</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
