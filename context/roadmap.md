# Roadmap

An ordered map of build units, not a spec backlog. Each entry is a one-line goal and its dependencies — no implementation detail, no success checklist. Those get written into `feature-specs/` one at a time, as work reaches them (see `ai-workflow-rules.md`, Rule 2).

This file is directional, not contractual. Reorder or revise it as real implementation surfaces things we didn't anticipate — that's expected, not a failure of planning. `progress-tracker.md` is the source of truth for what's actually done; this file is the source of truth for what order makes sense.

## Phase 0 — Foundation

**0.1 Project scaffold**
Next.js App Router + TypeScript project, Tailwind/shadcn wired to the tokens in `ui-context.md` (colors, Fraunces + system font, light/dark theme switching), Vitest + Playwright configured, strict TS. No real screens yet — just a shell that renders the theme correctly in both modes.
*Depends on: nothing.*

**0.2 Database schema & seed data**
Prisma schema for the geographic hierarchy (`bairro`, `quarteirao`, `bairro_vizinhos`), `shelter`, and `user` tables per `architecture.md`. Migration + a seed script with realistic sample data (e.g. a Khongolote-style neighborhood) so every later unit has something real to build and test against.
*Depends on: 0.1.*

## Phase 1 — Core citizen value (no auth required)

**1.1 Geographic picker**
Province → district → bairro → quarteirão selection, working against seeded data.
*Depends on: 0.2.*

**1.2 Shelter search & results**
The screen we already mocked up — Tier 1 before Tier 2, capacity status pill, landmark route description. This is the single most important unit in the whole build: it's the core value proposition with no auth, no offline complexity yet.
*Depends on: 1.1.*

**1.3 Offline caching** *(split into three sub-units after scoping — see `feature-specs/005`–`007`)*
- **1.3a — Shelters snapshot & shared ranking logic:** pure data/logic groundwork, no offline infra yet.
- **1.3b — Offline data sync & fallback rendering:** Dexie sync + client-side fallback for a *warm* offline session (tab already open, connection drops).
- **1.3c — Service worker precaching:** the *cold* offline case (tab closed, reopened with no network) — requires the app shell itself to be precached.

Service worker caches the app shell + geographic snapshot; Dexie stores it for offline search. Search must return real results with zero network.
*Depends on: 1.2. Sub-units are sequential (1.3a → 1.3b → 1.3c).*

## Phase 2 — Community contribution

**2.1 Phone verification (OTP)**
Twilio Verify integration for phone-based identity — proves phone ownership only, not trust/verification status.
*Depends on: 0.2.*

**2.2 Shelter registration**
A verified-phone user submits a new shelter (Tier 2, `uploaded_by` ownership).
*Depends on: 2.1, 1.2 (reuses shelter data shape and display).*

**2.3 Capacity update**
Ownership-gated capacity status write, independent of `verification_status` (invariant #2 in `architecture.md`).
*Depends on: 2.2.*

**2.4 Offline contribution queue**
Registrations/capacity updates made while offline are queued (Dexie) and synced once back online.
*Depends on: 2.3, 1.3b (Dexie sync pattern — offline write-queueing follows the same warm-offline mechanism, not the cold-start service worker layer).*

## Phase 3 — Alerts (subscription only)

**3.1 Alert subscription**
Bind a phone number to a `home_quarteirao_id`, no full profile required. Delivery itself stays out of scope per `project-overview.md`.
*Depends on: 2.1.*

## Phase 4 — Institutional lane

**4.1 Institutional signup**
Email-domain whitelist check, auto-sets `verification_status: verified`.
*Depends on: 0.2.*

**4.2 Verification queue**
Admin view of pending community contributors; approve/reject; approval cascades the contributor's shelters from Tier 2 to Tier 1 in one transaction (invariant #6).
*Depends on: 4.1, 2.2.*

## Phase 5 — Cross-cutting polish

**5.1 PWA installability**
Manifest, icons, install prompt, offline fallback page for uncached routes.
*Depends on: 1.3c (needs the service worker/precaching layer in place, not just the data/sync groundwork in 1.3a/1.3b).*

**5.2 Accessibility & performance pass**
Contrast check against both theme modes, keyboard navigation, Lighthouse pass on a throttled 3G profile.
*Depends on: everything above being in place for at least Phase 1–2.*

---

**Suggested build order:** 0.1 → 0.2 → 1.1 → 1.2 → 1.3a → 1.3b → 1.3c → 2.1 → 2.2 → 2.3 → 2.4 → 3.1 → 4.1 → 4.2 → 5.1 → 5.2. Phase 3 and Phase 4 don't depend on each other and could swap order if one becomes more urgent to demo.