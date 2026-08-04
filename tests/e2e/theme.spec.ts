import { expect, test } from "@playwright/test";

import { themeTokens } from "@/lib/theme/tokens";

function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgb(${red}, ${green}, ${blue})`;
}

async function getPageBackgroundColor(
  page: import("@playwright/test").Page,
): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test.describe("theme resolution", () => {
  test("uses the light page background by default", async ({ page }) => {
    await page.goto("/explorar");

    const backgroundColor = await getPageBackgroundColor(page);
    expect(backgroundColor).toBe(hexToRgb(themeTokens.light.bgPage));
  });

  test("follows prefers-color-scheme dark when no manual override is set", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/explorar");

    const backgroundColor = await getPageBackgroundColor(page);
    expect(backgroundColor).toBe(hexToRgb(themeTokens.dark.bgPage));
  });

  test("persists a manual theme override across reload via the layout toggle", async ({
    page,
  }) => {
    await page.goto("/explorar");

    const toggle = page.getByRole("button", { name: /alternar tema/i });
    await toggle.click();

    const toggledBackground = await getPageBackgroundColor(page);
    expect(toggledBackground).toBe(hexToRgb(themeTokens.dark.bgPage));

    await page.reload();

    const reloadedBackground = await getPageBackgroundColor(page);
    expect(reloadedBackground).toBe(hexToRgb(themeTokens.dark.bgPage));
  });
});
