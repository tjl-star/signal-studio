import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 2560, height: 1271 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`运营总览适配 ${viewport.name} 屏幕`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "运营总览", level: 1 })).toBeVisible();
    await expect(page.locator(".metric-item")).toHaveCount(5);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      content: Math.round(document.querySelector(".main-content")!.getBoundingClientRect().width)
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    if (viewport.name === "wide") expect(dimensions.content).toBeGreaterThan(2250);
    if (viewport.name === "mobile") {
      await expect(page.locator(".navigation")).toBeVisible();
      expect(dimensions.content).toBeLessThanOrEqual(viewport.width);
    }
  });
}

test("窄屏资源位宽表限制在局部滚动容器", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/resource-placements");
  await expect(page.locator(".resource-table tbody tr")).toHaveCount(15);
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    table: document.querySelector(".table-wrap")!.scrollWidth > document.querySelector(".table-wrap")!.clientWidth
  }));
  expect(overflow).toEqual({ document: true, table: true });
});
