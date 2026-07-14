import { expect, test } from "@playwright/test";

test.describe("Geographic picker", () => {
  test("click-through all four levels enables the Ver abrigos button", async ({
    page,
  }) => {
    await page.goto("/explorar");

    // Wait for the geo-snapshot to load and selects to be enabled
    await expect(page.getByLabel("Província")).toBeVisible({ timeout: 10000 });

    // Initially all lower selects are disabled
    await expect(page.getByLabel("Distrito")).toBeDisabled();
    await expect(page.getByLabel("Bairro")).toBeDisabled();
    await expect(page.getByLabel("Quarteirão")).toBeDisabled();

    // Ver abrigos is disabled initially
    await expect(
      page.getByRole("button", { name: "Ver abrigos" }),
    ).toBeDisabled();

    // Select a província (Cidade de Maputo is first option after placeholder)
    await page.getByLabel("Província").selectOption({ index: 1 });
    await expect(page.getByLabel("Distrito")).not.toBeDisabled();
    await expect(page.getByLabel("Bairro")).toBeDisabled();
    await expect(page.getByLabel("Quarteirão")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Ver abrigos" }),
    ).toBeDisabled();

    // Select a distrito
    await page.getByLabel("Distrito").selectOption({ index: 1 });
    await expect(page.getByLabel("Bairro")).not.toBeDisabled();
    await expect(page.getByLabel("Quarteirão")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Ver abrigos" }),
    ).toBeDisabled();

    // Select a bairro
    await page.getByLabel("Bairro").selectOption({ index: 1 });
    await expect(page.getByLabel("Quarteirão")).not.toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Ver abrigos" }),
    ).toBeDisabled();

    // Select a quarteirão — all four levels now selected
    await page.getByLabel("Quarteirão").selectOption({ index: 1 });
    await expect(
      page.getByRole("button", { name: "Ver abrigos" }),
    ).not.toBeDisabled();

    // Verify the button text is in Portuguese
    await expect(
      page.getByRole("button", { name: "Ver abrigos" }),
    ).toHaveText("Ver abrigos");
  });
});
