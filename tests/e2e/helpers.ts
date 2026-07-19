import { type Page } from "@playwright/test";

/**
 * Select an option from a Base-UI / Radix Select combobox by its visible label.
 *
 * The GeographicPicker uses shadcn/ui Select which renders a
 * `<button role="combobox">` — native `selectOption()` does not work.
 * This helper clicks the labelled trigger to open the popup, then clicks the
 * matching option.
 *
 * Ported from the RTL-level `selectOption` helper in
 * `components/geographic-picker.test.tsx` (same click-trigger → click-option
 * pattern), created when the native `<select>` was replaced with shadcn Select.
 *
 * @param page - Playwright Page
 * @param label - The aria-label of the trigger (e.g. "Província")
 * @param optionName - The visible text of the option to select
 */
export async function selectOption(
  page: Page,
  label: string,
  optionName: string,
) {
  const trigger = page.getByLabel(label);
  await trigger.click();
  // Popup opens asynchronously (portal-based) — wait for the option to be
  // attached and visible before clicking.  Without this, in CI the popup's
  // animation can race with the click and the option detaches mid-action.
  const option = page.getByRole("option", { name: optionName });
  await option.waitFor({ state: "visible", timeout: 5000 });
  await option.click();
}
