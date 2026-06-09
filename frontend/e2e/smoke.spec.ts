import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Symptra");
});

test("chat route is reachable", async ({ page }) => {
  const response = await page.goto("/chat");
  expect(response?.status()).toBeLessThan(500);
});
