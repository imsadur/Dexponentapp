import assert from "node:assert/strict";
import test from "node:test";
import { nudgesFor, relativeTime, sortActivity, unreadCount, type ActivityItem } from "../src/domain/notifications";

const base = { signedIn: true, positions: 0, access: "none" as const, managedLive: 0, drafts: 0 };
const ids = (input: Parameters<typeof nudgesFor>[0]) => nudgesFor(input).map((n) => n.id);

test("visitors get the deposit nudge and a path to manager access through sign-in", () => {
  const nudges = nudgesFor({ ...base, signedIn: false });
  assert.deepEqual(nudges.map((n) => n.id), ["first-deposit", "manager-access"]);
  assert.equal(nudges[1].cta?.href, "/login/?next=%2Fapp%2Faccess%2F");
});

test("LP-only user with no positions is nudged to deposit and to get manager access", () => {
  assert.deepEqual(ids(base), ["first-deposit", "manager-access"]);
});

test("LP with positions only sees the manager access nudge", () => {
  assert.deepEqual(ids({ ...base, positions: 2 }), ["manager-access"]);
});

test("pending request shows a status note without a CTA", () => {
  const [, review] = nudgesFor({ ...base, access: "requested" });
  assert.equal(review.id, "access-review");
  assert.equal(review.cta, undefined);
});

test("approved manager without a DTF is nudged to create one, or to finish a draft", () => {
  assert.deepEqual(ids({ ...base, positions: 1, access: "granted" }), ["first-dtf"]);
  assert.deepEqual(ids({ ...base, positions: 1, access: "granted", drafts: 2 }), ["continue-draft"]);
});

test("an active manager with positions gets no nudges", () => {
  assert.deepEqual(ids({ ...base, positions: 1, access: "granted", managedLive: 3 }), []);
});

test("activity sorts newest first and counts unread since last seen", () => {
  const item = (id: string, time: number): ActivityItem => ({ id, time, role: "lp", kind: "deposit", title: id, detail: "", href: "/" });
  const sorted = sortActivity([item("a", 1), item("b", 3), item("c", 2)]);
  assert.deepEqual(sorted.map((i) => i.id), ["b", "c", "a"]);
  assert.equal(unreadCount(sorted, 1), 2);
  assert.equal(unreadCount(sorted, 1, new Set(["b"])), 1);
  assert.equal(unreadCount(sorted, 3), 0);
});

test("relative time", () => {
  const now = Date.UTC(2026, 10, 26, 12);
  assert.equal(relativeTime(now - 20_000, now), "Just now");
  assert.equal(relativeTime(now - 5 * 60_000, now), "5m ago");
  assert.equal(relativeTime(now - 3 * 3_600_000, now), "3h ago");
  assert.equal(relativeTime(now - 2 * 86_400_000, now), "2d ago");
});
