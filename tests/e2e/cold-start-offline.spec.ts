import { expect, test } from "@playwright/test";

test.describe("Cold start offline (service worker precaching)", () => {
  test("service worker registers and controls page after online visit", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/explorar", { waitUntil: "networkidle" });

    await expect(page.getByLabel("Província")).toBeVisible({ timeout: 15000 });

    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      { timeout: 15000 },
    );

    await page.close();
    await context.close();
  });

  test("service worker precaches app shell assets and supports offline navigation", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/explorar", { waitUntil: "networkidle" });

    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      { timeout: 15000 },
    );

    // Re-navigate with SW active so all subsequent requests go through the SW
    await page.goto("/explorar", { waitUntil: "networkidle" });
    await expect(page.getByLabel("Província")).toBeVisible({ timeout: 15000 });

    // Verify precache contents: chunks, fonts, and HTML pages
    const precachePathnames = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const precacheName = cacheNames.find((n) => n.includes("precache"));
      if (!precacheName) return [];
      const cache = await caches.open(precacheName);
      const requests = await cache.keys();
      return requests.map((r) => new URL(r.url).pathname);
    });
    expect(precachePathnames.length).toBeGreaterThan(0);
    expect(precachePathnames.some((p) => p.includes("chunks/"))).toBe(true);
    expect(precachePathnames.some((p) => p.includes("woff2"))).toBe(true);
    expect(precachePathnames.includes("/explorar")).toBe(true);

    // Verify the snapshots cache has the geo-snapshot
    const snapshotsUrls = await page.evaluate(async () => {
      const cache = await caches.open("snapshots");
      const requests = await cache.keys();
      return requests.map((r) => r.url);
    });
    expect(snapshotsUrls.some((u) => u.includes("geo-snapshot.json"))).toBe(
      true,
    );

    // Go offline and verify the page renders from cache
    await context.setOffline(true);

    const offlinePage = await context.newPage();
    await offlinePage.goto("/explorar", { waitUntil: "networkidle" });

    await offlinePage.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      { timeout: 15000 },
    );

    await expect(offlinePage.getByLabel("Província")).toBeVisible({
      timeout: 15000,
    });

    await offlinePage.close();
    await page.close();
    await context.close();
  });
});
