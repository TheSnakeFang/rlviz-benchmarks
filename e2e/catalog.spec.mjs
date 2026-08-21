import { expect, test } from "@playwright/test";

test("shows exact source and redistribution state without inventing results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "See the run. Check the benchmark." })).toBeVisible();
  await expect(page.locator(".benchmark")).toHaveCount(4);
  await expect(page.getByText("4 of 4 pinned benchmark records · 1 published trajectory · 1 external run")).toBeVisible();
  await expect(page.getByText("redistribution blocked", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "SWE-bench Verified" })).toBeVisible();
  await expect(page.getByText("audit priority", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "upstream" }).first()).toHaveAttribute("href", /^https:\/\//);
  await expect(page.getByRole("heading", { name: "Claims & repairs" })).toBeVisible();
  await expect(page.getByText("0", { exact: true })).toHaveCount(3);
  await expect(page.getByRole("link", { name: "file an evidence claim" })).toHaveAttribute("href", /claim\.yml/);
  await expect(page.getByRole("link", { name: "view pinned submission" })).toHaveAttribute("href", /github\.com\/harbor-framework\/harbor-index\/blob\/35f01ec/);
  await expect(page.getByText(/job 5fab3f7b/)).toBeVisible();
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

test("opens an exact benchmark detail without hiding provenance gaps", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Harbor-Index 1.4" }).click();
  await expect(page).toHaveURL(/benchmark\.html\?slug=harbor-index-1-4/);
  await expect(page.getByRole("heading", { level: 1, name: "Harbor-Index 1.4" })).toBeVisible();
  await expect(page.getByText("35f01ec42b14c2b5da476099f5b0d209240bca5b", { exact: true })).toBeVisible();
  await expect(page.getByText(/Harbor job 5fab3f7b-0e44-4924-bbed-026e8387ef84/)).toBeVisible();
  await expect(page.getByText(/source record only as of 2026-08-20/)).toBeVisible();
  await expect(page.getByText("Absence of a claim is not a quality endorsement.", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("hands a reviewed trajectory to RLViz with its full digest", async ({ page }) => {
  await page.goto("/benchmark.html?slug=terminal-bench-2");
  await expect(page.getByRole("heading", { level: 1, name: "Terminal-Bench 2.0" })).toBeVisible();
  const link = page.getByRole("link", { name: "inspect trajectory" });
  await expect(link).toHaveAttribute("href", /bundle=https%3A%2F%2Fraw\.githubusercontent\.com/);
  await expect(link).toHaveAttribute("href", /sha256=3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1/);
  await expect(page.getByText(/mini-swe-agent; version unavailable in source/)).toBeVisible();
});

test("moves from benchmark to task to exact trajectory evidence", async ({ page }) => {
  await page.goto("/benchmark.html?slug=terminal-bench-2");
  await page.getByRole("link", { name: "adaptive-rejection-sampler" }).click();
  await expect(page).toHaveURL(/task\.html\?benchmark=terminal-bench-2&task=adaptive-rejection-sampler/);
  await expect(page.getByText("source-reported reward 0", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "trajectory details" }).click();
  await expect(page).toHaveURL(/trajectory\.html\?benchmark=terminal-bench-2&id=adaptive-rejection-sampler-mini-swe-agent-gpt-oss-120b/);
  await expect(page.getByRole("heading", { level: 2, name: "Execution" })).toBeVisible();
  await expect(page.getByText("3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "inspect in RLViz" })).toHaveAttribute("href", /sha256=3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
