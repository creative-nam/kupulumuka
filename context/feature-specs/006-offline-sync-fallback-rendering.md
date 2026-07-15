# 006 — Offline Data Sync & Fallback Rendering

## Goal

Make search (and the picker) survive a network drop *within an already-open session* ("warm" offline — the tab is loaded, then the connection goes away). `lib/offline/sync.ts` syncs both snapshots into Dexie on every online load; the results page and picker fall back to that cached data, run through unit 005's pure ranking function, when a live fetch/render isn't available — with a visible cache-staleness banner, never a silent switch.

This unit does not make a *cold* offline start work (closing the tab and reopening with no network from the start) — that requires the service worker precaching the app shell itself, which is unit 007. This unit only needs the browser tab to already be running.

## Out of Scope (explicit)

- Service worker registration / Workbox precaching of the app shell — unit 007.
- Cold-start offline (tab closed, then reopened while offline) — unit 007.
- Offline write queueing (shelter registration, capacity updates) — unit 2.4.

## Design

**`lib/offline/sync.ts`:** on app load, if online, fetch both `geo-snapshot.json` and `shelters-snapshot.json` and store them in Dexie, along with a `lastSyncedAt` timestamp. Runs on every online load — this is a refresh, not a one-time seed.

**Results page fallback:** if a live fetch/server render doesn't succeed, render client-side from the Dexie-cached shelters data, passed through 005's `rank-and-filter.ts` — same visual cards as the online path, same sort order, same overflow behavior, because it's the same pure function underneath.

**Picker fallback:** unit 1.1's picker already fetches `geo-snapshot.json` directly; extend it to read from the Dexie cache populated by `sync.ts` instead of (or as a fallback to) the raw fetch, so a warm offline session doesn't hit 1.1's existing error/retry state unnecessarily when a good cached copy already exists locally.

**Cache-staleness banner, always visible when serving cached data:** *"Sem ligação — a mostrar dados guardados (última atualização: [timestamp])"* — the exact copy pattern from `ui-context.md`. This is a safety-relevant detail: capacity status can change after the last sync, and an offline user should know the data in front of them might not be current, not assume it's live.

## Implementation Steps

1. Write `lib/offline/sync.ts`'s test first (mocked Dexie + fetch): confirms both snapshots and a timestamp are stored on a successful online load, and confirms a second online load *refreshes* rather than skips.
2. Implement `sync.ts` against that test.
3. Write the results page's offline-fallback test first: simulate a failed live fetch, assert the correct real shelters render via the Dexie + pure-function path, assert the banner text and timestamp appear.
4. Implement the fallback rendering path.
5. Extend the picker to consume the Dexie-cached geo snapshot; write a test confirming it renders correctly from cache when a live fetch is unavailable, without hitting 1.1's error state when good cached data exists.
6. Confirm, by test, that going back online after a cached/offline session correctly re-syncs and updates the timestamp — no "stuck on first cache forever" state.

## Success Checklist

- [ ] `sync.ts` populates Dexie with both snapshots and a `lastSyncedAt` timestamp on online load, and refreshes on every subsequent online load — verified by test.
- [ ] With a simulated failed fetch (warm session, tab already open), the results page renders correct real shelters via the Dexie + `rank-and-filter.ts` path — not an empty state.
- [ ] The cache-staleness banner appears with accurate copy and timestamp whenever data is served from cache.
- [ ] The picker renders correctly from Dexie cache in the same warm-offline scenario, without falling into 1.1's original error/retry state when valid cached data exists.
- [ ] Going back online re-syncs and updates the cache/timestamp — verified explicitly, not assumed.
- [ ] `npm run build` and `npm run lint` pass with no errors introduced.
- [ ] No service worker registration/config, no cold-start handling, present in the diff.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations noted.
