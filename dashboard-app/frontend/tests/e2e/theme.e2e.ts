import { expect, test } from "@playwright/test";

test("支持靛蓝、玫红和绿色主题并持久化选择", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "选择网页色调" }).click();
  await expect(page.getByRole("menuitem", { name: "默认靛蓝" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "品牌玫红" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "库存绿色" })).toBeVisible();

  await page.getByRole("menuitem", { name: "品牌玫红" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "rose");
  await expect(page.getByRole("button", { name: "选择网页色调" })).toContainText("品牌玫红");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim())).toBe("#e61d4f");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "rose");
  await page.getByRole("button", { name: "选择网页色调" }).click();
  await page.getByRole("menuitem", { name: "库存绿色" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "green");
  expect(await page.evaluate(() => localStorage.getItem("signal_studio_theme"))).toBe("green");
});
