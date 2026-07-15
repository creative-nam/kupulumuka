# 007 — Service Worker Precaching (Cold Offline Start)

## Goal

Make the app usable from a genuinely cold start with zero network — tab closed, then reopened in airplane mode, not just a connection dropping mid-session (that's unit 006). Register a service worker (next-pwa/Workbox) that precaches the app shell (JS/CSS bundles, the self-hosted Fraunces files from unit 0.1) and both snapshot files, so a returning offline user gets the full app plus their last-synced data.

**Explicit, important limitation this unit does not remove:** a device that has *never* been online with this app cannot have any data to show — there is nothing to precache without at least one prior successful sync. This unit guarantees a *returning* user's cold-offline experience works, not a true first-ever-use-fully-offline scenario. Worth remembering for later units (e.g. 5.1's onboarding) that a first online visit is a real, load-bearing requirement, not an assumption to design around invisibly.

## Out of Scope (explicit)

- PWA manifest, icons, install prompts — unit 5.1.
- A generic fallback page for routes that were never part of the precached shell at all — unit 5.1.
- Anything about the Dexie sync logic itself or the fallback rendering path — those are unit 006's, this unit only adds the layer that makes the shell/assets available on a cold start; it should not need to modify 006's logic, only ensure the browser has the files to run it against.

## Design

**Workbox precache list:** the app shell's JS/CSS bundles, the self-hosted Fraunces font files, `geo-snapshot.json`, `shelters-snapshot.json`. Runtime caching for the snapshots uses `StaleWhileRevalidate` — serve the cached copy instantly, refresh in the background when online, rather than a strategy that never checks for updates once cached.

**Cold-start verification is the actual point of this unit** — a passing build with next-pwa configured doesn't prove precaching works; the service worker's precache manifest needs to be confirmed via devtools' Application panel, and behavior needs to be proven with a real cold-start test (sync online once, fully close and reopen in a new offline context, confirm the shell loads and 006's fallback path renders real data from the previously-synced cache).

## Implementation Steps

1. Configure next-pwa/Workbox with the precache list described above.
2. Register the service worker.
3. Write a test confirming the precache manifest actually includes the app shell, fonts, and both snapshots (devtools Application panel check, documented as a manual verification step if it can't be fully automated — don't just trust the config file's intent).
4. Write the cold-start Playwright e2e test: load the app online once (triggering 006's sync), then start a fresh browser context with offline set from the beginning, and confirm the picker and search flow both work using the previously-synced data.
5. Confirm `StaleWhileRevalidate` actually refreshes cached snapshots after a subsequent online visit — not just serving the same first-cached copy indefinitely.

## Success Checklist

- [ ] Service worker registers successfully and its precache manifest, confirmed via devtools, includes the app shell, self-hosted fonts, and both snapshot files.
- [ ] Cold-start e2e test passes: sync online once, fully close/reopen in an offline context, picker and search both work using previously-synced data.
- [ ] `StaleWhileRevalidate` is confirmed (by test) to refresh snapshot data on a subsequent online visit, not serve a permanently stale first copy.
- [ ] The explicit "first-ever use requires one online visit" limitation is documented in `progress-tracker.md` for future units (especially 5.1) to account for.
- [ ] `npm run build` and `npm run lint` pass with no errors introduced.
- [ ] No PWA manifest/icons/install-prompt code, no generic uncached-route fallback page, present in the diff.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations noted.
