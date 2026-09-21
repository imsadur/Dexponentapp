import { test, expect } from "@playwright/test";

test("page index exposes independent v3 and preserved v2 products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("6 available page versions")).toBeVisible();

  await page.getByRole("link", { name: /Landing page v3/ }).click();
  await expect(page).toHaveURL(/\/landingv3\/home\/?$/);
  await expect(page.getByRole("heading", { name: "Investment strategies become transparent products." })).toBeVisible();
  await page.getByRole("link", { name: "Explore Farms", exact: true }).first().click();
  await page.getByRole("link", { name: /Blue Chip Index/ }).click();
  await expect(page).toHaveURL(/\/landingv3\/farm-details\/blue-chip\/?$/);
  await expect(page.getByRole("heading", { name: "Blue Chip Index" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: /Dashboard v3/ }).click();
  await expect(page).toHaveURL(/\/dbv3\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: "Capital decisions, without the clutter." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "DBv3 navigation" }).getByRole("link")).toHaveCount(7);

  await page.goto("/preview/landing/v2");
  await expect(page.getByRole("heading", { name: "Launch and run onchain Farms with clarity." })).toBeVisible();
  await page.goto("/preview/dashboard/v2");
  await expect(page.getByRole("heading", { name: "Farm overview" })).toBeVisible();
});

test("dbv3 navigation and complete demo Farm lifecycle stay isolated", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dbv3/dashboard");

  for (const [label, route] of [
    ["Positions", /\/dbv3\/positions\/?$/],
    ["Explore Farms", /\/dbv3\/explore\/?$/],
    ["Managed Farms", /\/dbv3\/farms\/?$/],
    ["Templates", /\/dbv3\/templates\/?$/],
    ["Analytics", /\/dbv3\/analytics\/?$/],
  ] as const) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/dbv3/dashboard");
  }

  await page.getByRole("link", { name: "Notifications" }).click();
  await expect(page).toHaveURL(/\/dbv3\/notifications\/?$/);
  await page.goto("/dbv3/dashboard");
  await page.getByRole("button", { name: "90D" }).click();
  await expect(page.getByRole("button", { name: "90D" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("textbox", { name: "Search v3 positions" }).fill("no matching farm");
  await expect(page.getByRole("heading", { name: "No matching positions" })).toBeVisible();

  await page.goto("/dbv3/templates");
  await page.getByRole("link", { name: /Blue Chip Index/ }).click();
  await expect(page).toHaveURL(/\/dbv3\/farms\/create\/?\?template=Blue%20Chip%20Index$/);
  await expect(page.getByRole("button", { name: /Blue Chip Index/ })).toHaveClass(/chosen/);
  await page.getByRole("button", { name: /Spot/ }).click();
  await page.getByRole("button", { name: /Stablecoin Yield/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("textbox", { name: "V3 Farm name" }).fill("Lifecycle Yield Farm");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("heading", { name: "Review risk and economics." })).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("checkbox", { name: "I understand this is a demo deployment." }).check();
  await page.getByRole("button", { name: "Deploy demo Farm" }).click();

  await expect(page).toHaveURL(/\/dbv3\/farms\/manage\/?\?farm=v3-/);
  await expect(page.getByRole("heading", { name: "Lifecycle Yield Farm" })).toBeVisible();
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Deposit to Farm" })).toBeVisible();
  await page.getByRole("spinbutton", { name: "V3 deposit amount" }).fill("1000");
  await page.getByRole("button", { name: "Confirm demo deposit" }).click();

  await page.goto("/dbv3/positions");
  await expect(page.getByText("Lifecycle Yield Farm", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "$1,000" })).toBeVisible();
  await page.getByRole("link", { name: /Lifecycle Yield Farm/ }).first().click();
  await page.getByRole("button", { name: "Withdraw", exact: true }).click();
  await page.getByRole("spinbutton", { name: "V3 withdrawal amount" }).fill("500");
  await page.getByRole("button", { name: "Confirm demo withdrawal" }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Pause this Farm?" })).toBeVisible();
  await page.getByRole("button", { name: "Yes, pause Farm" }).click();
  await expect(page.getByText("PAUSED", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Deposit", exact: true })).toBeDisabled();
  await page.goto("/dbv3/positions");
  await expect(page.getByRole("cell", { name: "$500" })).toBeVisible();

  const v3Links = await page.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(v3Links.every((href) => !href?.startsWith("/app/"))).toBeTruthy();
  expect(errors).toEqual([]);
});

test("landing, dashboard, every strategy, draft recovery and honest deployment", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Choose a page/,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Landing page v2/ }).click();
  await expect(
    page.getByRole("heading", {
      name: /Launch and run onchain Farms with clarity/,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create a Farm" }).click();
  await expect(
    page.getByRole("heading", { name: "Make room for your next idea." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore demo workspace" }).click();
  await expect(
    page.getByRole("heading", { name: /Farm overview/i }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/dashboard-desktop.png",
    fullPage: true,
  });
  for (const [family, template] of [
    ["Index", "Blue Chip Index"],
    ["Spot", "Single Asset Yield"],
    ["Perpetual", "Delta Neutral"],
  ]) {
    await page.goto("/app/farms/new");
    await page.getByRole("button", { name: new RegExp(`${family} `) }).click();
    await page
      .getByRole("button", {
        name: new RegExp(
          `${template} Build|${template} Allocate|${template} Configure`,
        ),
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Make this Farm yours." }),
    ).toBeVisible();
    await expect(page.getByLabel("Base token")).toHaveValue("USDC");
    if (family === "Index") {
      await page.locator('input[accept*="image/png"]').setInputFiles({
        name: "test-farm.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#8cecff"/></svg>'),
      });
      await expect(page.getByAltText("Farm artwork preview")).toBeVisible();
      await page.locator('input[accept="application/pdf"]').setInputFiles({
        name: "farm-factsheet.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n% demo factsheet"),
      });
      await expect(page.getByText("farm-factsheet.pdf")).toBeVisible();
    }
    await page
      .getByRole("textbox", { name: "Farm name", exact: true })
      .fill(`Test ${family}`);
    if (family === "Index") {
      await page
        .getByRole("spinbutton", { name: "WBTC weight", exact: true })
        .fill("10");
      await page
        .getByRole("button", { name: "Continue to risk & fees", exact: true })
        .click();
      await expect(
        page.getByText("Asset weights must total exactly 100%."),
      ).toBeVisible();
      await page
        .getByRole("spinbutton", { name: "WBTC weight", exact: true })
        .fill("40");
      await page.getByRole("button", { name: "Save & exit" }).click();
      await expect(page).toHaveURL(/\/app\/farms\/drafts\/?$/);
      await expect(
        page.getByRole("heading", { name: "Test Index" }),
      ).toBeVisible();
      await page.reload();
      await page.getByRole("link", { name: "Continue draft" }).click();
      await expect(page.getByRole("heading", { name: "Set the guardrails." })).toBeVisible();
      await expect(page.getByText("Test Index", { exact: true })).toBeVisible();
      await page.screenshot({
        path: "docs/screenshots/configure-desktop.png",
        fullPage: true,
      });
    }
    if (family !== "Index") {
      await page
        .getByRole("button", { name: "Continue to risk & fees", exact: true })
        .click();
    }
    await expect(page.getByRole("heading", { name: "Set the guardrails." })).toBeVisible();
    await page.getByRole("button", { name: "Review Farm", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Every detail, in perspective." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Explore simulation" }).click();
    await expect(
      page.getByRole("button", { name: "Continue to deploy" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Stress", exact: true }).click();
    await page.getByRole("button", { name: "Review this scenario" }).click();
    await page.getByRole("button", { name: "Continue to deploy" }).click();
    await expect(
      page.getByRole("button", { name: "Deploy demo Farm" }),
    ).toBeDisabled();
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Deploy demo Farm" })
      .click();
    await expect(
      page.getByRole("heading", { name: `Test ${family}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("ACTIVE", { exact: true })).toBeVisible();
    if (family === "Index") {
      await page.getByRole("button", { name: "Documents", exact: true }).click();
      await expect(page.getByText("farm-factsheet.pdf")).toBeVisible();
    }
    if (family === "Perpetual") {
      await expect(page.getByRole("heading", { name: "ETH/USDC" })).toBeVisible();
      await page.getByRole("link", { name: "Trade", exact: true }).first().click();
      await expect(page.getByRole("textbox", { name: "Search market pairs" })).toBeVisible();
      await page.getByRole("spinbutton", { name: "Position size" }).fill("2500");
      await page.getByRole("button", { name: "Review Long order" }).click();
      await page.getByRole("button", { name: "Confirm Long" }).click();
      await expect(page.getByText(/Long \w+\/USDC demo order filled/)).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
test("LP can discover and review a Farm without manager controls", async ({ page }) => {
  await page.goto("/app/explore");
  await expect(page.getByRole("heading", { name: "Find a Farm you can understand." })).toBeVisible();
  await page.getByRole("link", { name: "Review Farm" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit farm" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Deposit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Withdraw", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
});
test("dashboard v2 reconciles capital metrics and exposes strategy actions", async ({ page }) => {
  await page.goto("/preview/dashboard/v2");
  await expect(page.getByRole("heading", { name: "Farm overview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create farm" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export report" })).toHaveCount(0);
  await expect(page.getByText("Capital allocation")).toBeVisible();
  await expect(page.getByText("Withdrawable capital")).toBeVisible();
  await expect(page.getByText("Total LPs", { exact: true })).toBeVisible();
  await expect(page.locator(".chart-summary")).toContainText("3.68%");
  await expect(page.getByText("03", { exact: true })).toBeVisible();

  await page.goto("/app/farms");
  await expect(page.getByRole("columnheader", { name: "Farm", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Base token" })).toBeVisible();
  await expect(page.getByText("USDC", { exact: true }).first()).toBeVisible();
  const firstFarmRow = page.getByRole("row").filter({ hasText: "ETH Delta Neutral" });
  await expect(firstFarmRow).toContainText("PERPETUAL");
  await expect(firstFarmRow).toContainText("Arbitrum Network");

  await page.goto("/app/farms/manage?farm=demo-0");
  await expect(page.getByRole("heading", { name: "ETH Delta Neutral" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All farms" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit farm" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Deposit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Withdraw", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Interactive performance history chart")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
  await expect(page.getByText("Liquidity Provider", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Risk", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Liquidity", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toHaveCount(0);
  await expect(page.getByText("Period start")).toHaveCount(0);
  await expect(page.getByText("Strategy health")).toHaveCount(0);
  await page.getByRole("button", { name: "Strategy", exact: true }).click();
  await expect(page.getByText("STRATEGY FLOW", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Strategy controls" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manager guardrails" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Liquidity & fees" })).toBeVisible();
  await expect(page.getByRole("button", { name: /View contract/ })).toBeVisible();
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Farm transactions" })).toBeVisible();
  await expect(page.getByLabel("Seven day capital activity summary")).toContainText("Total inflows (7d)");
  await expect(page.getByText("Showing 1–5 of 42 transactions")).toBeVisible();
  for (const header of ["Transaction hash", "LP wallet", "Type", "Amount", "Status", "Date & time · UTC"]) {
    await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
  }
  await expect(page.locator(".transaction-table").getByText("Confirmed", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Transaction status").selectOption("Reverted");
  await expect(page.getByText("View error").first()).toBeVisible();
  await expect(page.getByText("Showing 1–2 of 2 transactions")).toBeVisible();
  await page.getByRole("button", { name: "View error" }).first().click();
  await expect(page.getByRole("dialog", { name: "Transaction reverted" })).toContainText(
    "no Farm balance changed",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByLabel("Transaction status").selectOption("All");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("eth-delta-neutral-transactions.csv");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByText("Margin health", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Trade on Hyperliquid/ })).toBeVisible();

  await page.goto("/app/farms/manage?farm=demo-1");
  await expect(page.getByRole("button", { name: "Rebalance", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Liquidate", exact: true })).toBeVisible();
  await expect(page.getByText(/rebalance due/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Asset weights vs. target" })).toBeVisible();
  await page.getByRole("button", { name: "Rebalance", exact: true }).click();
  await expect(page.getByRole("heading", { name: /asset.*outside target/ })).toBeVisible();
  await page.getByRole("button", { name: "Execute demo rebalance" }).click();
  await expect(page.getByText(/rebalance due/i)).toHaveCount(0);
  await expect(page.getByText("Portfolio rebalanced", { exact: true })).toBeVisible();

  await page.goto("/app/farms/manage?farm=demo-2");
  await expect(page.getByRole("button", { name: "Swap", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buy / sell", exact: true })).toBeVisible();
  await expect(page.getByText("Impermanent loss")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Asset composition" })).toBeVisible();
});
test("legacy workspace menu switches users and adds a local profile", async ({ page }) => {
  await page.goto("/preview/dashboard/v1");
  await page.getByRole("button", { name: /Personal workspace Strategist workspace/ }).click();
  await expect(page.getByText("Switch user", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Priya Shah Growth workspace/ }).click();
  await expect(page.getByText("Switched to Priya Shah")).toBeVisible();
  await page.getByRole("button", { name: /Growth workspace Strategist workspace/ }).click();
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await page.getByRole("textbox", { name: "User name" }).fill("Sam Rivera");
  await page.getByRole("textbox", { name: "Workspace name" }).fill("Treasury workspace");
  await page.getByRole("button", { name: "Add and switch" }).click();
  await expect(page.getByRole("button", { name: /Treasury workspace Strategist workspace/ })).toBeVisible();
});
test("mobile routes, filters, theme, wallet absence and confirmation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/landingv3/home",
    "/landingv3/farms",
    "/dbv3/dashboard",
    "/dbv3/farms/create",
    "/app/dashboard",
    "/app/explore",
    "/app/farms",
    "/app/templates",
    "/app/analytics",
    "/app/settings",
    "/app/farms/new",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => {
          const start = window.scrollX;
          window.scrollTo({ left: document.documentElement.scrollWidth });
          const horizontallyScrollable = window.scrollX !== start;
          window.scrollTo({ left: start });
          return !horizontallyScrollable;
        },
      ),
      path,
    ).toBeTruthy();
  }
  await page.screenshot({
    path: "docs/screenshots/create-mobile.png",
    fullPage: true,
  });
  await page.goto("/app/templates");
  await page
    .getByRole("textbox", { name: "Search templates" })
    .fill("no-such-template");
  await expect(
    page.getByRole("heading", { name: "No matching templates" }),
  ).toBeVisible();
  await page.goto("/app/settings");
  await page.getByRole("button", { name: "Switch theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Connect browser wallet", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "No browser wallet found",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto("/app/settings/security");
  await page
    .getByRole("button", { name: "Reset workspace", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
