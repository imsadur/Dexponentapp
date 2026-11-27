"use client";
import { ArrowDownLeft, ArrowUpRight, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACCESS_CHANGE_EVENT, accessKey, parseAccessStatus } from "@/domain/access";
import { dtfActivity, dtfDirectory, dtfFromFarm, maskAddress } from "@/domain/dtf";
import { formatUsd } from "@/domain/format";
import {
  isUnread,
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
const readKey = (identifier: string) => `fm:notifications-read:${identifier.toLowerCase()}`;
/** LP flows shown per managed DTF; enough to feel live without flooding the feed. */
const FLOWS_PER_DTF = 4;

export function useAccessStatus(identifier: string | undefined): AccessStatus {
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
  // LP and manager activity both follow the wallet; access nudges follow the sign-in.
  const { portfolio, connected } = useDtfPortfolio();
  const signedIn = Boolean(app.session);
  const identifier = app.session?.identifier;
  const access = useAccessStatus(identifier);
  const [now, setNow] = useState(() => Date.now());
  const [seenAt, setSeenAt] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!identifier) return;
    try {
      setSeenAt(Number(localStorage.getItem(seenKey(identifier))) || 0);
      const ids = JSON.parse(localStorage.getItem(readKey(identifier)) || "[]");
      setReadIds(new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : []));
    } catch {
      setSeenAt(0);
    }
  }, [identifier]);

  const persist = useCallback(
    (at: number, ids: Set<string>) => {
      if (!identifier) return;
      try {
        localStorage.setItem(seenKey(identifier), String(at));
        localStorage.setItem(readKey(identifier), JSON.stringify([...ids]));
      } catch {
        /* read state just won't persist */
      }
    },
    [identifier],
  );

  const live = useMemo(() => app.myFarms.filter((f) => f.status === "ACTIVE"), [app.myFarms]);
  const drafts = app.myFarms.filter((f) => f.status === "DRAFT" || f.status === "SIMULATION").length;

  const items = useMemo(() => {
    const names = new Map(dtfDirectory(app.farms, app.profile.name).map((d) => [d.id, d.name]));
    const own: ActivityItem[] = (connected ? portfolio.ledger : []).map((e, i) => ({
      id: `lp-${e.dtfId}-${e.at}-${i}`,
      time: Date.parse(e.at),
      role: "lp",
      kind: e.kind,
      title: `${e.kind === "deposit" ? "Deposited into" : "Withdrew from"} ${names.get(e.dtfId) ?? "a DTF"}`,
      detail: formatUsd(e.usd),
      href: strategyHref(e.dtfId),
    }));
    // Manager activity follows the connected wallet, like the manager pages.
    const flows: ActivityItem[] = (connected ? live : []).flatMap((farm) => {
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
  }, [connected, portfolio.ledger, live, app.farms, app.profile.name, now]);

  const nudges = nudgesFor({
    signedIn,
    access,
    managedLive: live.length,
    drafts,
  });

  const markAllRead = useCallback(() => {
    const at = Date.now();
    const none = new Set<string>();
    setSeenAt(at);
    setReadIds(none);
    persist(at, none);
  }, [persist]);

  const markRead = useCallback(
    (id: string) => {
      setReadIds((current) => {
        if (current.has(id)) return current;
        const next = new Set(current).add(id);
        persist(seenAt, next);
        return next;
      });
    },
    [persist, seenAt],
  );

  return {
    nudges,
    items,
    unread: unreadCount(items, seenAt, readIds),
    unreadOf: (item: ActivityItem) => isUnread(item, seenAt, readIds),
    now,
    refresh: () => setNow(Date.now()),
    markAllRead,
    markRead,
    hasManagerActivity: connected && live.length > 0,
  };
}

type Filter = "all" | "lp" | "manager";

/** Right-side panel. Takes the state from `useNotifications()` so the bell's unread dot stays in sync. */
export function NotificationsPanel({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReturnType<typeof useNotifications> }) {
  const { nudges, items, unread, unreadOf, now, refresh, markAllRead, markRead, hasManagerActivity } = data;
  const [filter, setFilter] = useState<Filter>("all");
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    refresh();
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
          <div className="ntf-head-actions">
            {unread > 0 && (
              <button className="text-link ntf-mark" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
            <button ref={closeRef} className="ntf-close" aria-label="Close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
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
                {shown.map((item) => {
                  const unreadItem = unreadOf(item);
                  return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        markRead(item.id);
                        onClose();
                      }}
                      className={unreadItem ? "unread" : "read"}
                    >
                      <span className={`ntf-icon ${item.kind}`} aria-hidden="true">
                        {item.kind === "deposit" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </span>
                      <span className="ntf-text">
                        <strong>
                          <span>{item.title}</span>
                          {unreadItem && <i className="ntf-dot" aria-hidden="true" />}
                        </strong>
                        <small>
                          {item.detail} · {item.role === "lp" ? "Your position" : "Your DTF"}
                        </small>
                      </span>
                      <time dateTime={new Date(item.time).toISOString()}>{relativeTime(item.time, now)}</time>
                      {unreadItem && <span className="sr-only">Unread</span>}
                    </Link>
                  </li>
                  );
                })}
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
