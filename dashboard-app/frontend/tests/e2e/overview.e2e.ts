import { expect, test } from "@playwright/test";

test("运营总览加载真实快照并展示完整状态", async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedResources: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      consoleErrors.push(`${message.text()} ${location.url}`.trim());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`);
  });

  const overviewResponse = page.waitForResponse((response) =>
    response.url().includes("/api/v1/overview") && response.request().method() === "GET"
  );
  await page.goto("/");
  const response = await overviewResponse;

  expect(response.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "运营总览", level: 1 })).toBeVisible();
  await expect(page.locator(".metric-item")).toHaveCount(5);
  await expect(page.locator(".metric-grid")).not.toContainText("--");
  await expect(page.locator(".status-panel")).toContainText("7 天");
  await expect(page.locator(".status-panel")).toContainText("data_provider/coreData");
  await expect(page.locator(".trend-chart")).toBeVisible();
  await expect(page.locator(".client-table tbody tr")).toHaveCount(3);
  await expect(page.locator(".client-table tbody")).toContainText("572,153");
  await expect(page.locator(".client-table tbody")).toContainText("76.41%");
  await expect(page.locator(".client-table tbody")).toContainText("8.426");
  expect({ consoleErrors, failedResources }).toEqual({ consoleErrors: [], failedResources: [] });
});

test("客户端筛选驱动真实请求并同步页面状态", async ({ page }) => {
  await page.goto("/");
  await page.locator(".filter-bar .el-select").click();
  await page.getByRole("option", { name: "iOS", exact: true }).click();

  const refreshed = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/v1/overview" && url.searchParams.get("client") === "iOS";
  });
  await page.getByRole("button", { name: "更新视图" }).click();
  const response = await refreshed;

  expect(response.ok()).toBe(true);
  await expect(page.locator(".status-panel")).toContainText("iOS");
  await expect(page.locator(".client-table tbody tr.is-selected")).toContainText("iOS");
  await expect(page.locator(".freshness")).toContainText("截至 2026-09-15");
});

test("数据说明抽屉暴露来源、组件和原始字段", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "数据说明" }).click();

  const drawer = page.getByRole("dialog", { name: "数据来源与口径" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("data_provider/coreData");
  await expect(drawer).toContainText("coreData / perCapitaWatchDuration / perCapitaPlayCount");
  for (const field of ["device_dau", "new_device", "play_rate", "total_avg_watch_duration", "total_avg_play_count"]) {
    await expect(drawer).toContainText(field);
  }
});
