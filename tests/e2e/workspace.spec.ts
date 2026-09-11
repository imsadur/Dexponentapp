import { test, expect } from "@playwright/test";

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
  await page.locator('a[href="/preview/landing/v2"]').click();
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
    page.getByRole("heading", { name: /Capital overview/i }),
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
      await expect(page).toHaveURL(/\/app\/farms\/drafts$/);
      await expect(
        page.getByRole("heading", { name: "Test Index" }),
      ).toBeVisible();
      await page.reload();
      await page.getByRole("link", { name: "Continue draft" }).click();
      await expect(
        page.getByRole("textbox", { name: "Farm name", exact: true }),
      ).toHaveValue("Test Index");
      await page.screenshot({
        path: "docs/screenshots/configure-desktop.png",
        fullPage: true,
      });
    }
    await page
      .getByRole("button", { name: "Continue to risk & fees", exact: true })
      .click();
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
      await page.getByRole("link", { name: "Trade", exact: true }).click();
      await expect(page.getByText("DEMO TRADING", { exact: true })).toBeVisible();
      await page.getByRole("spinbutton", { name: "Position size" }).fill("2500");
      await page.getByRole("button", { name: "Long ETH · Demo" }).click();
      await expect(page.getByText(/Long ETH\/USDC demo order filled/)).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
test("LP can discover a Farm and complete a deposit preview", async ({ page }) => {
  await page.goto("/app/explore");
  await expect(page.getByRole("heading", { name: "Find a Farm you can understand." })).toBeVisible();
  await page.getByRole("link", { name: "Review Farm" }).first().click();
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Deposit to Farm" })).toBeVisible();
  await page.getByRole("spinbutton", { name: "Deposit amount" }).fill("2500");
  await page.getByRole("button", { name: "Confirm demo deposit" }).click();
  await expect(page.getByText(/deposited in demo mode/)).toBeVisible();
});
test("workspace menu switches users and adds a local profile", async ({ page }) => {
  await page.goto("/app/dashboard");
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
        () => document.documentElement.scrollWidth <= window.innerWidth,
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
