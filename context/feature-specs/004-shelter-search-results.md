# 004 — Shelter Search & Results

## Goal

Given a selected quarteirão (from unit 1.1's picker), show the shelters that serve it: Tier 1 before Tier 2, correct capacity status, landmark route description — the exact screen already approved in `ui-context.md`'s reference mockup, now rendering real seeded data instead of hardcoded markup. This is the core value proposition of the whole app: no auth, no offline complexity yet, just "where do I go."

## Out of Scope (explicit)

- Offline behavior — this unit assumes network is available. Making it work with zero network is unit 1.3, not this one.
- Shelter registration or capacity updates (Phase 2) — the empty-state and low-result copy in this unit must not promise or link to a "report a shelter" flow that doesn't exist yet.
- Alert subscription (Phase 3).

## Design

**Wiring the dependency from 1.1:** unit 1.1 built a "Ver abrigos" button that was correctly disabled/enabled based on selection state but had nowhere to go. This unit gives it a real destination: navigating to this route with the selected quarteirão's id as a query param (e.g. `/abrigos?quarteiraoId=...`). Update the 1.1 component to perform this navigation — this is a small, expected cross-unit edit, not scope creep, since 1.1's spec explicitly anticipated 1.2 wiring a destination onto that button.

**Data flow** *(unit 1.2 baseline — superseded by unit 1.3b)*: Server Component page reads `quarteiraoId` from `searchParams` and calls a query function — don't inline the query logic in the page itself. Put it in `lib/shelters/search.ts` as `getSheltersForQuarteirao(quarteiraoId)`, so it's a clean, independently testable unit, and so the future USSD channel (deferred, but planned per `architecture.md`'s "Future-Channel Compatibility") can call the same function instead of a page-specific one. **Historical:** this server-rendered, direct-Prisma design was the unit 1.2 implementation. Unit 1.3b replaced it with a thin Server Component page wrapper that delegates to the client-side `ShelterResults`, which fetches from `/api/shelters` and falls back to the Dexie cache (see `progress-tracker.md` Architecture Decisions). The `getSheltersForQuarteirao` function itself remains, now wrapped by the `/api/shelters` route.

**Sort order** (this is the concrete implementation of "Tier 1 before Tier 2" from `project-overview.md`): tier ascending (`OFFICIAL` before `COMMUNITY`), then capacity status ascending in severity (`AVAILABLE`, then `NEARLY_FULL`, then `FULL`), then shelter name alphabetically as a final tiebreak. This ordering is a testable, explicit contract — not "whatever order the query happens to return."

**Overflow to neighboring bairros:** if the selected quarteirão's bairro has zero shelters, `getSheltersForQuarteirao` should also check `BairroVizinho` and include shelters from adjacent bairros, with each such result flagged (e.g. `fromNeighboringBairro: true`) so the UI can visually indicate "nothing here, showing nearby options" rather than silently blending results as if they were local. This is the first real use of the adjacency data seeded in unit 0.2 — its existence in the database until now was necessary but not sufficient.

**Empty state, if even neighboring bairros have nothing:** per `ui-context.md`'s copy conventions ("an invitation, not an apology"), but scoped honestly to what actually exists right now — do not invite the person to "report a shelter," since that flow doesn't exist until Phase 2. Something like "Nenhum abrigo encontrado nesta zona. Tente outro quarteirão," with a link back to the picker.

**UI:** reuse the exact card structure, tokens, and copy already approved in `ui-context.md`'s reference mockup — this unit should not be redesigning that screen, just making it real. Tier badge, capacity pill, route description, share icon, in the fixed layout `ui-context.md` already specifies.

**Share action:** implement it for real, not decoratively — `navigator.share()` where available (mobile Safari/Chrome), falling back to copying a link to the clipboard with a brief confirmation otherwise. Small, self-contained Client Component around just that icon/button; the rest of the page stays a Server Component.

## Implementation Steps

1. Write `lib/shelters/search.ts`'s test first: given seeded data, assert correct tier/capacity sort order, and assert overflow to `BairroVizinho` neighbors only triggers when the local bairro has zero shelters.
2. Implement `getSheltersForQuarteirao(quarteiraoId)` against that test.
3. Wire unit 1.1's "Ver abrigos" button to navigate to `/abrigos?quarteiraoId=...`.
4. Build the Server Component results page, rendering the shelter cards per `ui-context.md`'s approved mockup.
5. Build the empty-state and "showing nearby results" states; write their component tests first.
6. Build the share button as an isolated Client Component; write its test first (mock `navigator.share`, and the clipboard-fallback path separately).
7. Playwright e2e: select through the picker (reusing 1.1's flow), land on results, confirm correct shelters/order render for at least two different seeded quarteirãos across two different provinces (not just Khongolote — this is the same "don't just test the one pair you know works" lesson from unit 0.2's adjacency bug).

## Success Checklist

- [ ] `getSheltersForQuarteirao` returns shelters in the exact specified sort order (tier, then capacity severity, then name) — verified by a test written before implementation.
- [ ] Overflow to neighboring bairros only triggers when the local bairro has zero shelters, and results from neighbors are flagged as such — verified by a test written before implementation.
- [ ] 1.1's "Ver abrigos" button now navigates to a real results page carrying the selected `quarteiraoId`.
- [ ] Rendered shelter cards match `ui-context.md`'s approved mockup: tier badge, capacity pill (with text label, not color alone), route description, share icon, in the specified layout.
- [ ] The empty-state and "showing nearby results" copy is in Portuguese, follows `ui-context.md`'s tone conventions, and does not reference shelter registration (out of scope).
- [ ] Share button works via `navigator.share()` where available, with a tested clipboard fallback otherwise.
- [ ] e2e test confirms correct results for at least two different quarteirãos in two different provinces, not just one.
- [ ] The results page itself is a Server Component; only the share button is a Client Component. **Historical (unit 1.2 baseline):** since superseded by unit 1.3b's thin Server Component page wrapper + client-side `ShelterResults` fallback shell.
- [ ] `npm run build` and `npm run lint` pass with no errors introduced.
- [ ] No offline/service-worker code, no shelter-registration code, no alert-subscription code present in the diff.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations noted.
