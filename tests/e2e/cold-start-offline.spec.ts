import { chromium, expect, test } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { selectOption } from "./helpers";

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

  test("restores /abrigos results from cache after a fresh offline restart", async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), "kupulumuka-abrigos-sw-"));
    const khongoloteShelters = [
      {
        id: "92044824-6e76-4c20-bd46-5db4e915ef14",
        name: "EPC Khongolote",
        tier: "OFFICIAL",
        capacityStatus: "AVAILABLE",
        routeDescription:
          "Av. da Liberdade, perto do campo de futebol. Portão principal aberto.",
        quarteiraoId: "b26b1100-8945-4945-85f1-acb559a6c98b",
        quarteiraoName: "Quarteirão 12",
        bairroName: "Khongolote",
        fromNeighboringBairro: false,
      },
      {
        id: "97f36b6b-18d1-4d4f-bb34-ace3b1456055",
        name: "Igreja Católica",
        tier: "OFFICIAL",
        capacityStatus: "NEARLY_FULL",
        routeDescription:
          "Rua da Igreja, ao lado do mercado do Khongolote. Campanário visível.",
        quarteiraoId: "b26b1100-8945-4945-85f1-acb559a6c98b",
        quarteiraoName: "Quarteirão 12",
        bairroName: "Khongolote",
        fromNeighboringBairro: false,
      },
      {
        id: "6d14f498-1276-47b6-b23f-cac72deeafde",
        name: "Salão Paroquial S. João",
        tier: "COMMUNITY",
        capacityStatus: "AVAILABLE",
        routeDescription:
          "Rua de São João, nº 123, após a curva do mercado. Portão branco.",
        quarteiraoId: "b26b1100-8945-4945-85f1-acb559a6c98b",
        quarteiraoName: "Quarteirão 12",
        bairroName: "Khongolote",
        fromNeighboringBairro: false,
      },
    ];

    try {
      const onlineContext = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        ignoreHTTPSErrors: true,
      });
      const onlinePage = await onlineContext.newPage();

      await onlinePage.goto("http://127.0.0.1:3000/explorar", {
        waitUntil: "networkidle",
      });
      await expect(onlinePage.getByLabel("Província")).toBeVisible({
        timeout: 15000,
      });

      await selectOption(onlinePage, "Província", "Província de Maputo");
      await selectOption(onlinePage, "Distrito", "Matola");
      await selectOption(onlinePage, "Bairro", "Khongolote");
      await selectOption(onlinePage, "Quarteirão", "Quarteirão 12");

      await onlinePage.route(/\/api\/shelters\?quarteiraoId=/, async (route) => {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(khongoloteShelters),
        });
      });

      await onlinePage.getByRole("button", { name: "Ver abrigos" }).click();
      await onlinePage.waitForURL(/\/abrigos\?quarteiraoId=/);
      await expect(
        onlinePage.getByText("Abrigos disponíveis em Khongolote"),
      ).toBeVisible({ timeout: 15000 });
      await expect(onlinePage.getByText("EPC Khongolote")).toBeVisible();

      const abrigosUrl = onlinePage.url();

      await onlinePage.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        { timeout: 15000 },
      );

      await onlinePage.goto(abrigosUrl, { waitUntil: "networkidle" });
      await expect(
        onlinePage.getByText("Abrigos disponíveis em Khongolote"),
      ).toBeVisible({ timeout: 15000 });
      await expect(onlinePage.getByText("EPC Khongolote")).toBeVisible();

      await onlinePage.waitForFunction(() => {
        return new Promise<boolean>((resolve) => {
          const openRequest = indexedDB.open("kupulumuka");
          openRequest.onerror = () => resolve(false);
          openRequest.onsuccess = () => {
            const db = openRequest.result;
            const transaction = db.transaction("syncMeta", "readonly");
            const store = transaction.objectStore("syncMeta");
            const getRequest = store.get("lastSyncedAt");
            getRequest.onerror = () => {
              db.close();
              resolve(false);
            };
            getRequest.onsuccess = () => {
              db.close();
              resolve(Boolean(getRequest.result?.value));
            };
          };
        });
      }, { timeout: 15000 });
      await onlinePage.close();
      await onlineContext.close();

      const offlineContext = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        ignoreHTTPSErrors: true,
      });
      await offlineContext.setOffline(true);

      const offlinePage = await offlineContext.newPage();
      await offlinePage.goto(abrigosUrl, { waitUntil: "networkidle" });

      await offlinePage.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        { timeout: 15000 },
      );

      await expect(
        offlinePage.getByText("Abrigos disponíveis em Khongolote"),
      ).toBeVisible({ timeout: 15000 });
      await expect(offlinePage.getByText("EPC Khongolote")).toBeVisible();
      await expect(offlinePage.getByText("Igreja Católica")).toBeVisible();
      await expect(offlinePage.getByText("Salão Paroquial S. João")).toBeVisible();
      await expect(
        offlinePage.getByText("Nenhum abrigo encontrado nesta zona"),
      ).toHaveCount(0);

      await offlinePage.close();
      await offlineContext.close();
    } finally {
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
