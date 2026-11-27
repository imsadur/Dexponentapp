/**
 * Notifications: a short list of next-step nudges plus an activity feed covering the
 * user's own LP transactions and LP flows into DTFs they manage. Pure functions only.
 */

export type AccessStatus = "none" | "requested" | "granted";

export type Nudge = {
  id: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

export type ActivityKind = "deposit" | "withdraw";

export type ActivityItem = {
  id: string;
  time: number;
  /** Whose perspective: the user's own position, or a DTF the user manages. */
  role: "lp" | "manager";
  kind: ActivityKind;
  title: string;
  detail: string;
  href: string;
};

export type NudgeInput = {
  signedIn: boolean;
  access: AccessStatus;
  /** Live DTFs the user manages. */
  managedLive: number;
  drafts: number;
};

/**
 * Status notes for people already on the manager path. Promotional nudges (deposit, get
 * access) are not shown here; the notification center is for things that happened.
 */
export function nudgesFor(input: NudgeInput): Nudge[] {
  if (!input.signedIn) return [];
  if (input.access === "requested")
    return [{ id: "access-review", title: "Access request in review", body: "We'll email you once it's approved." }];
  if (input.access !== "granted" || input.managedLive > 0) return [];
  return [
    input.drafts > 0
      ? {
          id: "continue-draft",
          title: "Finish your first DTF",
          body: `${input.drafts} draft${input.drafts === 1 ? "" : "s"} ready to continue.`,
          cta: { label: "Continue", href: "/app/farms/drafts/" },
        }
      : {
          id: "first-dtf",
          title: "Create and launch your first DTF",
          body: "Start from a template. It takes a few minutes.",
          cta: { label: "Create DTF", href: "/app/farms/new/" },
        },
  ];
}

/** Newest first, capped. */
export function sortActivity(items: ActivityItem[], limit = 30): ActivityItem[] {
  return [...items].sort((a, b) => b.time - a.time).slice(0, limit);
}

/** Unread = newer than the last "mark all as read" and not opened individually since. */
export const isUnread = (item: ActivityItem, seenAt: number, readIds: ReadonlySet<string> = new Set()) =>
  item.time > seenAt && !readIds.has(item.id);

export const unreadCount = (items: ActivityItem[], seenAt: number, readIds?: ReadonlySet<string>) =>
  items.filter((i) => isUnread(i, seenAt, readIds)).length;

export function relativeTime(time: number, now: number) {
  const minutes = Math.max(0, Math.round((now - time) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
