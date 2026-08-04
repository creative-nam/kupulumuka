# 005 — Shelters Snapshot & Shared Ranking Logic

## Goal

Produce `public/shelters-snapshot.json` (mirroring 1.1's `geo-snapshot.json`) and extract unit 1.2's sort/overflow logic out of its Prisma-coupled form into a pure, environment-agnostic function. This unit lays the groundwork for offline support without touching Dexie, the service worker, or any UI — it's a data/logic unit only, independently testable and completable before any offline infrastructure exists.

## Out of Scope (explicit)

- Dexie, IndexedDB, any client-side caching — unit 006.
- Service worker / Workbox — unit 007.
- Any change to the results page's rendering or the offline banner — unit 006.

## Design

**`scripts/generate-shelters-snapshot.ts`** queries all shelters via Prisma and writes tier, capacity status, route description, and quarteirão/bairro ids to `public/shelters-snapshot.json` — same pattern, same npm-script convention (`generate:shelters-snapshot`) as 1.1's geo snapshot.

**Extract, don't rewrite, the ranking logic.** Unit 1.2's `getSheltersForQuarteirao` already has correct, tested sort-order and `BairroVizinho`-overflow behavior. Pull that logic into `lib/shelters/rank-and-filter.ts` as a pure function operating on plain arrays (shelters, adjacency pairs) — no Prisma calls inside it. `getSheltersForQuarteirao` becomes a thin wrapper: fetch via Prisma, then call the pure function. The goal is that 1.2's existing test suite continues to pass completely unchanged after this refactor — if it doesn't, the extraction introduced a behavior change, which would be a regression, not an improvement.

## Implementation Steps

1. Write `scripts/generate-shelters-snapshot.ts`'s test first (structure/counts against seeded data), then implement it.
2. Extract `rank-and-filter.ts`: write tests first by adapting 1.2's existing sort/overflow test cases to the new pure-function signature — same inputs and expectations, different call shape.
3. Refactor `getSheltersForQuarteirao` to call the extracted function.
4. Run unit 1.2's original test suite in full — it must still pass with zero changes to its assertions.

## Success Checklist

- [ ] `shelters-snapshot.json` generation is tested and matches seeded data structure/counts.
- [ ] `rank-and-filter.ts` is a pure function (no Prisma import, no DB call) and passes tests adapted directly from 1.2's original sort/overflow cases.
- [ ] Unit 1.2's original test suite passes unchanged after the refactor.
- [ ] `npm run build` and `npm run lint` pass with no errors introduced.
- [ ] No Dexie, service worker, or UI/rendering changes present in the diff.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations noted.
