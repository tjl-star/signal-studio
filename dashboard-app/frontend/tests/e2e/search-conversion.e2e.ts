import { expect, test } from "@playwright/test";

test("搜索转化展示同口径真实漏斗和趋势", async ({ page }) => {
  const responsePromise = page.waitForResponse(response => response.url().includes("/api/v1/search-conversion"));
  await page.goto("/#/search-conversion");
  expect((await responsePromise).ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "搜索整体转化漏斗" })).toBeVisible();
  await expect(page.locator(".funnel-stage")).toHaveCount(5);
  await expect(page.locator(".funnel-stage").first()).toContainText("194,542");
  await expect(page.locator(".overall-rate-panel")).toContainText("96.39%");
  await expect(page.locator(".overall-rate-panel")).toContainText("67.30%");
  await expect(page.locator(".conversion-chart")).toBeVisible();
  await expect(page).toHaveURL(/date=2026-09-15/);
});

test("搜索转化数据说明标明 Quick BI 组件和原始字段", async ({ page }) => {
  await page.goto("/#/search-conversion");
  await page.getByRole("button", { name: "数据说明" }).click();
  const drawer = page.getByRole("dialog", { name: "搜索转化来源与口径" });
  await expect(drawer).toContainText("Quick BI MCP");
  await expect(drawer).toContainText("search_drama_conversion_data");
  await expect(drawer).toContainText("into_search_click_uv");
  await expect(drawer).toContainText("不与 data_provider");
});
