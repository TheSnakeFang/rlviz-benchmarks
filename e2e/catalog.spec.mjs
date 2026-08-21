import { expect, test } from "@playwright/test";

test("shows exact source and redistribution state without inventing results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Benchmark catalog" })).toBeVisible();
  await expect(page.locator(".benchmark")).toHaveCount(4);
  await expect(page.getByText("4 of 4 pinned benchmark records · 4 published trajectories · 1 external run")).toBeVisible();
  await expect(page.getByText("redistribution blocked", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "SWE-bench Verified" })).toBeVisible();
  await expect(page.getByText("audit priority", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "upstream" }).first()).toHaveAttribute("href", /^https:\/\//);
  await expect(page.getByRole("heading", { name: "Evidence claims" })).toBeVisible();
  await expect(page.locator("#claims-status")).toHaveText("1 claim · 0 resolved · 1 contributor");
  await expect(page.getByRole("link", { name: "Review policy" })).toHaveAttribute("href", /README\.md#publication-boundary/);
  await expect(page.locator(".benchmark").first().getByRole("heading", { name: "Terminal-Bench 2.0" })).toBeVisible();
  await expect(page.getByRole("link", { name: "adaptive-rejection-sampler · reward 0" })).toHaveAttribute("href", /trajectory\.html\?benchmark=terminal-bench-2/);
  await expect(page.getByRole("link", { name: "Open in RLViz" })).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Open in RLViz" }).first()).toHaveAttribute("href", /sha256=3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1/);
  await expect(page.getByRole("link", { name: "view pinned submission" })).toHaveAttribute("href", /github\.com\/harbor-framework\/harbor-index\/blob\/35f01ec/);
  await expect(page.getByText(/job 5fab3f7b/)).toBeVisible();
  await expect(page.getByText("source-reported · source record only")).toBeVisible();
});

test("uses the compact RLViz visual system without landing-page decoration", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".eyebrow, .principles, .claim-metrics, .intro-actions")).toHaveCount(0);
  const presentation = await page.evaluate(() => ({
    backgroundImage: getComputedStyle(document.body).backgroundImage,
    headingSize: Number.parseFloat(getComputedStyle(document.querySelector("h1")).fontSize),
  }));
  expect(presentation.backgroundImage).toBe("none");
  expect(presentation.headingSize).toBeLessThanOrEqual(32);
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
  await expect(page.getByText("No claims recorded. This is not a quality review.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("hands a reviewed trajectory to RLViz with its full digest", async ({ page }) => {
  await page.goto("/benchmark.html?slug=terminal-bench-2");
  await expect(page.getByRole("heading", { level: 1, name: "Terminal-Bench 2.0" })).toBeVisible();
  const link = page.getByRole("link", { name: "Open in RLViz" });
  await expect(link).toHaveCount(4);
  await expect(link.first()).toHaveAttribute("href", /sha256=3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1/);
  await expect(link.nth(1)).toHaveAttribute("href", /sha256=a60152d61c996b47329708e48601a102e9ccf7549ec5882c29e2d9f061faac01/);
  await expect(link.nth(2)).toHaveAttribute("href", /sha256=f36ad76baa42a7dead2bf1cf0247b07e8886b43e9ee0e71c757559dd0984c8ce/);
  await expect(link.nth(3)).toHaveAttribute("href", /sha256=a38b2273d2a9ae7845574456285c9af17345dbe1bd14ca7bab69d9df2909cd9f/);
  await expect(page.getByText(/mini-swe-agent; version unavailable in source/)).toHaveCount(2);
  await expect(page.getByText(/terminus-2; version unavailable in source/)).toHaveCount(2);
  await expect(page.getByText(/pinned verifier may accept a solution/)).toBeVisible();
});

test("moves from benchmark to task to exact trajectory evidence", async ({ page }) => {
  await page.goto("/benchmark.html?slug=terminal-bench-2");
  await page.getByRole("link", { name: "adaptive-rejection-sampler" }).first().click();
  await expect(page).toHaveURL(/task\.html\?benchmark=terminal-bench-2&task=adaptive-rejection-sampler/);
  await expect(page.getByText("source-reported reward 0", { exact: true })).toBeVisible();
  await page.locator(".detail-item").filter({ hasText: "source-reported reward 0" }).getByRole("link", { name: "Trajectory details" }).click();
  await expect(page).toHaveURL(/trajectory\.html\?benchmark=terminal-bench-2&id=adaptive-rejection-sampler-mini-swe-agent-gpt-oss-120b/);
  await expect(page.getByRole("heading", { level: 2, name: "Execution" })).toBeVisible();
  await expect(page.getByText("3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in RLViz" })).toHaveAttribute("href", /sha256=3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1/);
  await expect(page.getByRole("link", { name: "Download .rlviz" })).toHaveAttribute("href", /\.rlviz$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("keeps the second reviewed task pair deep and readable", async ({ page }) => {
  await page.goto("/task.html?benchmark=terminal-bench-2&task=qemu-startup");
  await expect(page.getByRole("heading", { level: 1, name: "qemu-startup" })).toBeVisible();
  await expect(page.getByText("source-reported reward 0", { exact: true })).toBeVisible();
  await expect(page.getByText("source-reported reward 1", { exact: true })).toBeVisible();
  await page.locator(".detail-item").filter({ hasText: "source-reported reward 1" }).getByRole("link", { name: "Trajectory details" }).click();
  await expect(page).toHaveURL(/trajectory\.html\?benchmark=terminal-bench-2&id=qemu-startup-terminus-2-gpt-oss-120b-trial-0f174334/);
  await expect(page.getByText(/executed image digest unavailable in source/)).toBeVisible();
  await expect(page.getByText("a38b2273d2a9ae7845574456285c9af17345dbe1bd14ca7bab69d9df2909cd9f", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in RLViz" })).toHaveAttribute("href", /sha256=a38b2273d2a9ae7845574456285c9af17345dbe1bd14ca7bab69d9df2909cd9f/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
