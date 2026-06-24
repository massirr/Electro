import { test, expect } from "@playwright/test";

test.describe("TakeoffForm", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("electro-takeoff-rows"));
    await page.reload();
  });

  test("catalog loads and dropdown button is visible", async ({ page }) => {
    await page.goto("/");
    // Wait for catalog to load (button text changes from Loading… to Search items…)
    const combobox = page.getByRole("combobox", { name: /Item, row 1/i });
    await expect(combobox).toBeVisible();
    await expect(combobox).toContainText("Search items…");
  });

  test("selecting item auto-fills h/u with correct default", async ({ page }) => {
    await page.goto("/");
    const combobox = page.getByRole("combobox", { name: /Item, row 1/i });
    await expect(combobox).toContainText("Search items…");

    // Open dropdown and select Duplex outlet
    await combobox.click();
    await page.getByRole("option", { name: "Duplex outlet" }).click();

    // h/u should be pre-filled with 0.25
    const huInput = page.getByLabel("Hours per unit").first();
    await expect(huInput).toHaveValue("0.25");
  });

  test("Tab moves between fields without mouse", async ({ page }) => {
    await page.goto("/");
    const combobox = page.getByRole("combobox", { name: /Item, row 1/i });
    await combobox.click();
    await page.getByRole("option").first().click();

    // Focus qty, Tab to h/u
    const qtyInput = page.getByLabel("Quantity").first();
    await qtyInput.focus();
    await qtyInput.fill("5");
    await page.keyboard.press("Tab");

    // h/u should now be focused
    const huInput = page.getByLabel("Hours per unit").first();
    await expect(huInput).toBeFocused();
  });

  test("Enter on last h/u appends a new row", async ({ page }) => {
    await page.goto("/");

    // Select an item in row 1
    await page.getByRole("combobox", { name: /Item, row 1/i }).click();
    await page.getByRole("option").first().click();

    // Fill qty and h/u, then press Enter on h/u
    await page.getByLabel("Quantity").first().fill("3");
    const huInput = page.getByLabel("Hours per unit").first();
    await huInput.fill("0.5");
    await huInput.press("Enter");

    // A second combobox should now exist
    await expect(page.getByRole("combobox", { name: /Item, row 2/i })).toBeVisible();
  });

  test("rows restore from localStorage on refresh", async ({ page }) => {
    await page.goto("/");

    // Select item and fill qty
    await page.getByRole("combobox", { name: /Item, row 1/i }).click();
    await page.getByRole("option", { name: "Duplex outlet" }).click();
    await page.getByLabel("Quantity").first().fill("10");

    // Wait a tick for localStorage write
    await page.waitForTimeout(100);

    // Reload page
    await page.reload();

    // Row should be restored
    const combobox = page.getByRole("combobox", { name: /Item, row 1/i });
    await expect(combobox).toContainText("Duplex outlet");
    await expect(page.getByLabel("Quantity").first()).toHaveValue("10");
  });
});
