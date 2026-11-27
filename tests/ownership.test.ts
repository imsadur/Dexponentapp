import assert from "node:assert/strict";
import test from "node:test";
import { ownsFarm, type Farm } from "../src/domain/strategy";

const PREVIEW = "0x7a3F9c21B4e8D05a6C1f2E9b8D3c4A5e6F7b8C9d";
const farm = (extra: Partial<Farm>) => ({ id: "f", source: "local", ...extra }) as Farm;

test("a recorded owner must match the connected wallet, case-insensitively", () => {
  const f = farm({ owner: "0xABCdef0000000000000000000000000000000001" });
  assert.equal(ownsFarm(f, "0xabcdef0000000000000000000000000000000001", PREVIEW), true);
  assert.equal(ownsFarm(f, "0x0000000000000000000000000000000000000002", PREVIEW), false);
});

test("sample DTFs belong to the preview wallet only", () => {
  const f = farm({ source: "demo" });
  assert.equal(ownsFarm(f, PREVIEW, PREVIEW), true);
  assert.equal(ownsFarm(f, "0x0000000000000000000000000000000000000002", PREVIEW), false);
});

test("no wallet manages nothing; unowned local drafts go to whoever connects", () => {
  assert.equal(ownsFarm(farm({}), "", PREVIEW), false);
  assert.equal(ownsFarm(farm({}), "0x0000000000000000000000000000000000000002", PREVIEW), true);
});
