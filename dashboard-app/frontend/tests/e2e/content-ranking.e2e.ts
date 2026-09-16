import { expect, test } from "@playwright/test";

test("内容榜单加载真实 Top30 并支持榜单切换", async ({ page }) => {
  const totalResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/v1/content-rankings" && url.searchParams.get("list_type") === "总榜";
  });
  await page.goto("/#/content-rankings");
  expect((await totalResponse).ok()).toBe(true);

  await expect(page.getByRole("heading", { name: "站内播放排名 Top30" })).toBeVisible();
  await expect(page.locator(".ranking-table tbody tr")).toHaveCount(15);
  await expect(page.locator(".ranking-table tbody tr").first()).toContainText("请记住我的名字");
  await expect(page.locator(".ranking-summary-grid")).toContainText("30 条");
  await expect(page.locator(".freshness")).toContainText("seasonPlayVV");

  const newUserResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/v1/content-rankings" && url.searchParams.get("list_type") === "新用户榜";
  });
  await page.getByRole("tab", { name: "新用户榜" }).click();
  expect((await newUserResponse).ok()).toBe(true);
  await expect(page.locator(".freshness")).toContainText("playTop10");
  await expect(page).toHaveURL(/list_type=.*%E6%96%B0%E7%94%A8%E6%88%B7%E6%A6%9C/);
});

test("内容榜单使用服务端排序和分页", async ({ page }) => {
  await page.goto("/#/content-rankings");
  await expect(page.locator(".ranking-table tbody tr")).toHaveCount(15);

  const sortResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/v1/content-rankings" && url.searchParams.get("sort") === "play_vv";
  });
  await page.getByRole("button", { name: "播放 VV", exact: true }).click();
  expect((await sortResponse).ok()).toBe(true);
  await expect(page).toHaveURL(/sort=play_vv/);

  const pageResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/v1/content-rankings" && url.searchParams.get("page") === "2";
  });
  await page.getByRole("listitem", { name: "page 2" }).click();
  expect((await pageResponse).ok()).toBe(true);
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".ranking-table tbody tr")).toHaveCount(15);
});

test("内容榜单数据说明展示真实接口与能力边界", async ({ page }) => {
  await page.goto("/#/content-rankings");
  await page.getByRole("button", { name: "数据说明" }).click();

  const drawer = page.getByRole("dialog", { name: "内容榜单来源与口径" });
  await expect(drawer).toContainText("seasonPlayVV");
  await expect(drawer).toContainText("play_count");
  await expect(drawer).toContainText("“新增用户榜”没有独立真实接口");
});
