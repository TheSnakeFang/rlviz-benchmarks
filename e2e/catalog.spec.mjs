import { expect, test } from "@playwright/test";

test("shows exact source and redistribution state without inventing results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "See the run. Check the benchmark." })).toBeVisible();
  await expect(page.locator(".benchmark")).toHaveCount(4);
  await expect(page.getByText("4 of 4 pinned benchmark records · 0 published trajectories · 1 external run")).toBeVisible();
  await expect(page.getByText("redistribution blocked", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "SWE-bench Verified" })).toBeVisible();
  await expect(page.getByText("audit priority", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "upstream" }).first()).toHaveAttribute("href", /^https:\/\//);
  await expect(page.getByRole("heading", { name: "Claims & repairs" })).toBeVisible();
  await expect(page.getByText("0", { exact: true })).toHaveCount(3);
  await expect(page.getByRole("link", { name: "file an evidence claim" })).toHaveAttribute("href", /claim\.yml/);
  await expect(page.getByRole("link", { name: "view pinned submission" })).toHaveAttribute("href", /github\.com\/harbor-framework\/harbor-index\/blob\/35f01ec/);
  await expect(page.getByText("source-reported · source record only")).toBeVisible();
});

test("filters records and remains readable at mobile width", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Filter" }).fill("swe");
  await expect(page.locator(".benchmark")).toHaveCount(2);
  await expect(page.getByText("2 of 4 pinned benchmark records · 0 published trajectories · 0 external runs")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  await expect(page.getByText("none published", { exact: true })).toHaveCount(2);
});
