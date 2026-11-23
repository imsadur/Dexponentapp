import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyRecord,
  formatInviteCode,
  isInviteFormat,
  profileComplete,
  redeemInvite,
  requestErrors,
  safeReturnPath,
} from "../src/domain/access";

test("email sign-in prefills a verified contact email; mobile does not", () => {
  const email = emptyRecord("ava@example.com", "email", "Ava Chen");
  assert.equal(email.profile.firstName, "Ava");
  assert.equal(email.profile.lastName, "Chen");
  assert.equal(email.profile.emailVerified, true);
  assert.ok(profileComplete(email.profile));
  const mobile = emptyRecord("+447700900000", "mobile", "Ava");
  assert.equal(mobile.profile.contactEmail, "");
  assert.equal(profileComplete(mobile.profile), false);
});

test("invite codes format as people type and validate", () => {
  assert.equal(formatInviteCode("dtf demo 2026"), "DTF-DEMO-2026");
  assert.equal(formatInviteCode("dtf-de"), "DTF-DE");
  assert.ok(isInviteFormat("DTF-DEMO-2026"));
  assert.equal(isInviteFormat("DTF-DEMO"), false);
  assert.deepEqual(redeemInvite("DTF-DEMO-2026"), { ok: true });
  assert.equal(redeemInvite("DTF-AAAA-BBBB").ok, false);
});

test("request validation covers each contact method", () => {
  const base = { name: "Ava", country: "UK", background: "independent" as const, strategies: ["INDEX" as const], contactMethod: "email" as const, contact: "ava@example.com", plan: "A weekly rebalanced BTC/ETH index." };
  assert.deepEqual(requestErrors(base), {});
  assert.ok(requestErrors({ ...base, strategies: [] }).strategies);
  assert.ok(requestErrors({ ...base, plan: "too short" }).plan);
  assert.ok(requestErrors({ ...base, contact: "nope" }).contact);
  assert.deepEqual(requestErrors({ ...base, contactMethod: "telegram", contact: "@ava_trades" }), {});
  assert.ok(requestErrors({ ...base, contactMethod: "telegram", contact: "@ab" }).contact);
  assert.deepEqual(requestErrors({ ...base, contactMethod: "x", contact: "@ava" }), {});
});

test("return paths stay inside the app", () => {
  assert.equal(safeReturnPath("/app/access/"), "/app/access/");
  assert.equal(safeReturnPath("https://evil.example"), null);
  assert.equal(safeReturnPath("//evil.example/app/"), null);
  assert.equal(safeReturnPath("/app//evil"), null);
  assert.equal(safeReturnPath("/login"), null);
  assert.equal(safeReturnPath(null), null);
});
