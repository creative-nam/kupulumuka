import { expect, test } from "@playwright/test";
import { selectOption } from "./helpers";

test.describe("Shelter search and results", () => {
  test("selects Khongolote quarteirão and sees correct sorted shelters", async ({
    page,
  }) => {
    await page.goto("/explorar");

    await expect(page.getByLabel("Província")).toBeVisible({ timeout: 10000 });

    // Província de Maputo
    await selectOption(page, "Província", "Província de Maputo");

    // Matola
    await selectOption(page, "Distrito", "Matola");

    // Khongolote
    await selectOption(page, "Bairro", "Khongolote");

    // Quarteirão 12 (first quarteirão for Khongolote)
    await selectOption(page, "Quarteirão", "Quarteirão 12");

    // Click Ver abrigos
    await page.getByRole("button", { name: "Ver abrigos" }).click();

    // Should be on the abrigos page
    await expect(page).toHaveURL(/\/abrigos\?quarteiraoId=/);

    // Back nav should show Khongolote context
    await expect(page.getByRole("link", { name: /Khongolote/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Abrigos disponíveis em Khongolote")).toBeVisible();

    // Should have 3 shelter cards in correct order
    const cards = page.getByText(/EPC Khongolote|Igreja Católica|Salão Paroquial S. João/);
    await expect(cards).toHaveCount(3);

    // Verify correct sort order by checking text positions
    const shelterNames = page.locator("h2");
    await expect(shelterNames.nth(0)).toHaveText("EPC Khongolote");
    await expect(shelterNames.nth(1)).toHaveText("Igreja Católica");
    await expect(shelterNames.nth(2)).toHaveText("Salão Paroquial S. João");

    // Verify capacity pills
    await expect(page.getByText("Livre")).toHaveCount(2);
    await expect(page.getByText("Quase cheio")).toHaveCount(1);

    // Verify tier badges
    await expect(page.getByText("Oficial")).toHaveCount(2);
    await expect(page.getByText("Comunitário")).toHaveCount(1);
  });

  test("selects Ponta-Gêa quarteirão in Sofala and sees correct shelter", async ({
    page,
  }) => {
    await page.goto("/explorar");

    await expect(page.getByLabel("Província")).toBeVisible({ timeout: 10000 });

    // Sofala
    await selectOption(page, "Província", "Sofala");

    // Beira
    await selectOption(page, "Distrito", "Beira");

    // Ponta-Gêa
    await selectOption(page, "Bairro", "Ponta-Gêa");

    // Quarteirão Praia (first quarteirão for Ponta-Gêa)
    await selectOption(page, "Quarteirão", "Quarteirão Praia");

    // Click Ver abrigos
    await page.getByRole("button", { name: "Ver abrigos" }).click();

    // Should be on the abrigos page
    await expect(page).toHaveURL(/\/abrigos\?quarteiraoId=/);

    // Back nav should show Ponta-Gêa context
    await expect(page.getByRole("link", { name: /Ponta-Gêa/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Abrigos disponíveis em Ponta-Gêa")).toBeVisible();

    // Should show one shelter
    await expect(page.getByText("Escola Secundária da Ponta-Gêa")).toBeVisible();
    await expect(page.getByText("Livre")).toBeVisible();
    await expect(page.getByText("Oficial")).toBeVisible();
  });
});
