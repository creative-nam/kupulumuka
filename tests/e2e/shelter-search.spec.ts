import { expect, test } from "@playwright/test";

test.describe("Shelter search and results", () => {
  test("selects Khongolote quarteirão and sees correct sorted shelters", async ({
    page,
  }) => {
    await page.goto("/explorar");

    await expect(page.getByLabel("Província")).toBeVisible({ timeout: 10000 });

    // Província de Maputo (index 3, after placeholder, Cidade de Maputo, Gaza)
    await page.getByLabel("Província").selectOption({ index: 3 });

    // Matola (index 2, after placeholder and Boane)
    await page.getByLabel("Distrito").selectOption({ index: 2 });

    // Khongolote (index 2, after placeholder and Fomento)
    await page.getByLabel("Bairro").selectOption({ index: 2 });

    // Quarteirão 12 (index 1, first quarteirão after placeholder)
    await page.getByLabel("Quarteirão").selectOption({ index: 1 });

    // Click Ver abrigos
    await page.getByRole("button", { name: "Ver abrigos" }).click();

    // Should be on the abrigos page
    await expect(page).toHaveURL(/\/abrigos\?quarteiraoId=/);

    // Back nav should show Khongolote context
    await expect(page.getByText("Khongolote")).toBeVisible();
    await expect(page.getByText("Abrigos disponíveis")).toBeVisible();

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

    // Sofala (index 4, after placeholder, Cidade de Maputo, Gaza, Província de Maputo)
    await page.getByLabel("Província").selectOption({ index: 4 });

    // Beira (index 1, only distrito after placeholder)
    await page.getByLabel("Distrito").selectOption({ index: 1 });

    // Ponta-Gêa (index 1, first bairro after placeholder)
    await page.getByLabel("Bairro").selectOption({ index: 1 });

    // Quarteirão Praia (index 1, first quarteirão after placeholder)
    await page.getByLabel("Quarteirão").selectOption({ index: 1 });

    // Click Ver abrigos
    await page.getByRole("button", { name: "Ver abrigos" }).click();

    // Should be on the abrigos page
    await expect(page).toHaveURL(/\/abrigos\?quarteiraoId=/);

    // Back nav should show Ponta-Gêa context
    await expect(page.getByText("Ponta-Gêa")).toBeVisible();
    await expect(page.getByText("Abrigos disponíveis")).toBeVisible();

    // Should show one shelter
    await expect(page.getByText("Escola Secundária da Ponta-Gêa")).toBeVisible();
    await expect(page.getByText("Livre")).toBeVisible();
    await expect(page.getByText("Oficial")).toBeVisible();
  });
});
