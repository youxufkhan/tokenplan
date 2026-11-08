import { test, expect } from "@playwright/test";

test("saves, loads, renames and deletes a comparison", async ({ page }) => {
  await page.goto("/?q=Claude");
  await page.getByRole("checkbox", { name: "Compare Claude Pro", exact: true }).check();
  await page.getByRole("checkbox", { name: "Compare Claude Max", exact: true }).check();
  const panel = page.locator(".saved-comparisons");
  await panel.getByLabel("Name for comparisons").fill("My shortlist");
  await panel.getByRole("button", { name: "Save", exact: true }).click();
  await page.locator(".tray").getByRole("button", { name: "Clear", exact: true }).click();
  await panel.getByLabel("Saved comparisons").selectOption({ label: "My shortlist" });
  await panel.getByRole("button", { name: "Load", exact: true }).click();
  await page.getByRole("button", { name: "Compare side by side" }).click();
  await expect(page.getByRole("dialog")).toContainText("Claude Pro");
  await expect(page.getByRole("dialog")).toContainText("Claude Max");
  await page.getByRole("button", { name: "Close comparison" }).click();
  await panel.getByLabel("Name for comparisons").fill("Renamed");
  await panel.getByRole("button", { name: "Rename", exact: true }).click();
  await panel.getByLabel("Saved comparisons").selectOption({ label: "Renamed" });
  await panel.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(panel.getByLabel("Saved comparisons").locator("option")).toHaveCount(1);
});

test("workloads recalculate and shared URLs survive market switching", async ({ page }) => {
  await page.goto("/?max=0&apiIn=0&apiOut=0&apiCache=0");
  await expect(page.getByRole("slider")).toHaveValue("0");
  await expect(page.locator(".arow").first()).toContainText("$0.00");
  await expect(page.locator(".alist")).not.toContainText("NaN");
  const panel = page.locator("#api .saved-controls");
  await panel.getByLabel("Name for workloads").fill("Zero workload");
  await panel.getByRole("button", { name: "Save", exact: true }).click();
  const input = page.getByLabel("Input millions of tokens per month");
  await input.fill("5");
  await panel.getByLabel("Saved workloads").selectOption({ label: "Zero workload" });
  await panel.getByRole("button", { name: "Load", exact: true }).click();
  await expect(input).toHaveValue("0");
  await input.fill("");
  await expect(page.locator("#api")).toContainText("Enter valid usage amounts");
  await input.fill("7");
  for (const label of ["Pakistan · PKR", "UAE · AED", "Saudi · SAR", "US · USD"]) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(input).toHaveValue("7");
    await expect(page.locator(".arow").first()).toBeVisible();
  }
  await page.reload();
  await expect(input).toHaveValue("7");
  await page.setViewportSize({ width: 375, height: 820 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("explicit workload URL takes precedence over browser restoration", async ({ page }) => {
  await page.goto("/?apiIn=5&apiOut=1&apiCache=0");
  await expect(page.locator(".arow").first()).toBeVisible();
  await page.goto("/?apiIn=12&apiOut=3&apiCache=100");
  await expect(page.getByLabel("Input millions of tokens per month")).toHaveValue("12");
  await page.getByLabel("Cached share of input in percent").fill("101");
  await expect(page.locator("#api")).toContainText("Enter valid usage amounts");
});

test("regional offers preserve web and App Store channels", async ({ page }) => {
  await page.route("**/data/markets.json", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.quotes.push({ market: "PK", planId: "claude-pro", amount: 5500, currency: "PKR", channel: "Web", sourceUrl: "https://claude.com/pricing", verifiedAt: "2026-11-09" });
    await route.fulfill({ response, json: data });
  });
  await page.goto("/?market=pk&q=Claude+Pro");
  const row = page.locator('.row[data-plan="claude-pro"]');
  await expect(row.locator(".row__local")).toContainText("Apple App Store");
  await expect(row.locator(".row__local")).toContainText("Web");
  await expect(row.locator(".row__local")).toContainText("5,500");
});
