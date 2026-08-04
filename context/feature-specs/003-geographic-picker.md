# 003 — Geographic Picker

## Goal

A cascading Província → Distrito → Bairro → Quarteirão selector, working against the seeded data from unit 0.2, that lets a citizen narrow down to a specific quarteirão. This is the first real product screen (everything in 0.1/0.2 was infrastructure) and the direct prerequisite for unit 1.2 (shelter search).

## Out of Scope (explicit)

- Actually searching for or displaying shelters — that's 1.2. This unit ends at "a quarteirão is selected," not "shelters for that quarteirão are shown."
- Offline caching / service worker wiring of the geo snapshot — that's 1.3. This unit only needs to *produce* `public/geo-snapshot.json`; making it work offline is a separate unit.
- Any auth or user-specific state (e.g. remembering a previous selection across sessions) — no `User` interaction at all in this unit.

## Design

**Data loading: one static snapshot, not per-level API calls.** Generate `public/geo-snapshot.json` from the seeded database via a build-time script — a nested tree (`Provincia → Distrito → Bairro → Quarteirao`, minimal fields: id + display name at each level). The picker component loads this once and does all cascading filtering in-memory on the client. No `/api/geo/*` round-trip per selection. This directly serves the low-bandwidth invariant in `architecture.md`: after one small JSON load, the entire selection flow costs zero additional network requests — and it produces the exact artifact `architecture.md` already earmarked for 1.3's offline caching, so that unit inherits this one rather than building its own.

**Component boundary (Server/Client split per `code-standards.md`):** the page itself is a Server Component. Only the interactive cascading-select logic is a Client Component (`"use client"`), wrapping the four `Select` inputs and the local state tracking which level is selected. Push the client boundary down to just that piece, not the whole page.

**UI:** four cascading dropdowns (shadcn `Select`, styled per `ui-context.md` tokens), each disabled until its parent is chosen. Screen title in Fraunces per the type scale; the selects and their labels use the system font stack. A "Ver abrigos" primary button (styled per the `ui-context.md` button convention) is disabled until all four levels are selected — it doesn't need to go anywhere functional yet (1.2 doesn't exist), but it should exist, be correctly enabled/disabled, and be ready for 1.2 to wire a real destination onto.

**Copy:** Portuguese, per `ui-context.md`'s copy conventions — labels like "Província," "Distrito," "Bairro," "Quarteirão," placeholder text like "Selecionar província" rather than a generic "Choose...".

## Implementation Steps

1. Write `scripts/generate-geo-snapshot.ts`: queries the seeded database via Prisma, builds the nested `Provincia → Distrito → Bairro → Quarteirao` tree, writes it to `public/geo-snapshot.json`. Write this script's test first (assert the generated structure matches expected shape/counts against the seeded data) before implementing it, per the TDD sequence.
2. Add an npm script (e.g. `npm run generate:geo-snapshot`) so this can be re-run whenever seed data changes, rather than being a one-off manual step.
3. Build the Client Component (`GeographicPicker` or similar) that loads the snapshot and renders the four cascading `Select` inputs, filtering options at each level based on the parent selection. Write its component tests first (RTL): selecting a província populates the correct distritos, selecting a distrito populates the correct bairros, and so on down to quarteirão; changing an earlier selection resets everything below it.
4. Wire the "Ver abrigos" button's enabled/disabled state to whether a quarteirão is currently selected. Test this explicitly (disabled with 0–3 levels selected, enabled at 4).
5. Build the Server Component page that renders `GeographicPicker`, styled per `ui-context.md`.
6. Write the Playwright e2e test: a full click-through of all four levels, confirming the button enables only at the end, written before final polish per TDD.

## Success Checklist

- [ ] `scripts/generate-geo-snapshot.ts` produces a `public/geo-snapshot.json` matching the seeded database's actual province/distrito/bairro/quarteirão counts and names, verified by a test written before the script was finalized.
- [ ] Selecting a level correctly filters and enables the next level down; changing an earlier selection resets everything below it — verified by component tests written before the component was finalized.
- [ ] After the initial snapshot load, selecting through all four levels produces zero additional network requests (checked in devtools, same category of verification as the font check in unit 0.1 — described as a design intention isn't enough, it needs to actually be confirmed).
- [ ] "Ver abrigos" is disabled until a quarteirão is selected, enabled once one is — verified by a test written before implementation.
- [ ] Playwright e2e test passes: a full click-through selection flow completes correctly.
- [ ] The page is a Server Component; only the cascading-select logic is a Client Component — no unnecessary `"use client"` at the page/layout level.
- [ ] All labels, placeholders, and the button copy are in Portuguese, matching `ui-context.md`'s copy conventions.
- [ ] `npm run build` and `npm run lint` pass with no errors introduced.
- [ ] No shelter search, results, or `/api/geo` route present in the diff — this unit is the picker only.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations noted.
