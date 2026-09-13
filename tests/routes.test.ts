import assert from "node:assert/strict";
import test from "node:test";
import {
  farmDetailHref,
  farmEditHref,
  farmTradeHref,
  isFarmWizardRoute,
} from "../src/domain/routes";

test("Farm creation routes open the Wizard with or without a trailing slash", () => {
  assert.equal(isFarmWizardRoute("/app/farms/new".split("/").filter(Boolean)), true);
  assert.equal(isFarmWizardRoute("/app/farms/new/".split("/").filter(Boolean)), true);
});

test("Farm edit routes open the Wizard while Farm details remain separate", () => {
  assert.equal(isFarmWizardRoute("/app/farms/demo-0/edit".split("/").filter(Boolean)), true);
  assert.equal(isFarmWizardRoute("/app/farms/edit".split("/").filter(Boolean)), true);
  assert.equal(isFarmWizardRoute("/app/farms/demo-0".split("/").filter(Boolean)), false);
  assert.equal(isFarmWizardRoute("/app/farms".split("/").filter(Boolean)), false);
});

test("runtime Farm IDs use stable static-export routes", () => {
  assert.equal(farmDetailHref("farm 123"), "/app/farms/manage/?farm=farm%20123");
  assert.equal(farmEditHref("farm 123"), "/app/farms/edit/?farm=farm%20123");
  assert.equal(farmTradeHref("farm 123"), "/app/trade/?farm=farm%20123");
  assert.equal(
    farmTradeHref("farm 123", "BTC/USDC"),
    "/app/trade/?farm=farm%20123&market=BTC%2FUSDC",
  );
});
