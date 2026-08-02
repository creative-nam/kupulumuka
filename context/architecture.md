# Architecture

## Tech Stack

| Layer | Choice | Why (our requirements, not convention) |
|---|---|---|
| App framework | Next.js 15 (App Router) + TypeScript | One deployable unit serves both the PWA frontend and the API routes that will later host `/api/ussd` and `/api/sms`. Satisfies the unified-backend requirement without a second language or service. |
| Database | PostgreSQL | Our geographic data (`bairros → quarteiroes → shelters`, `bairro_vizinhos`) is relational and hierarchical, not spatial. Postgres is the correct fit for the data shape, independent of tooling trends. |
| ORM | Prisma | Generated TypeScript types give a compile-time check before a test even runs — important for the agent-driven TDD workflow. |
| Managed Postgres + Storage | Supabase (or Neon) — **database and object storage only** | Used purely as hosted Postgres + file storage for shelter photos. We are **not** using Supabase Auth (see Identity & Access below — it doesn't fit the anonymous / dual-lane model). |
| Identity/OTP | Twilio Verify (or equivalent SMS aggregator) | We'll need an SMS/telecom aggregator for the USSD/SMS channel regardless. Using the same vendor for phone OTP now avoids a second integration later. |
| Hosting | Vercel | Cron Jobs replace the originally-proposed Python daemon for scheduled checks (same language as the rest of the app). Edge network helps latency on slow connections. |
| Offline layer | workbox-build (`generateSW`) + Dexie.js | Direct implementation of the offline-first requirement: Workbox precaches the app shell and runtime-caches the geographic/shelter snapshots (StaleWhileRevalidate, not precache); Dexie queues offline searches/contributions in IndexedDB with less boilerplate than raw IndexedDB. |
| Styling / UI | Tailwind CSS + shadcn/ui | Tailwind's build-time purge keeps CSS payload minimal for low-bandwidth use. shadcn copies component source into the repo (not an opaque bundle), keeping both bundle size and agent-editability in check. |
| Testing | Vitest + React Testing Library (unit/integration), Playwright (E2E) | Supports TDD: agent writes the test from the spec first, then implements against it. Playwright covers the few flows where "does it work under pressure" (e.g. offline mid-session) genuinely needs a real browser. |

## Identity & Access Model

There is no traditional "login" for citizens. Identity is handled as application logic on top of the `users` table (see original data model), not a third-party auth product:

- **Anonymous** — no `users` row at all. Search requires nothing.
- **Community lane** — a phone number is associated with a `home_quarteirao_id` via OTP verification (proves phone ownership, not identity/trust). Role defaults to `citizen`; contributors who submit shelters get `verification_status: unverified` until an admin reviews them.
- **Institutional lane** — email domain whitelist check on signup auto-sets `verification_status: verified` and unlocks admin views.

## Folder Structure (high level)

```
/app                    → Next.js App Router routes & pages
  /(public)              → anonymous-accessible routes (search, subscribe)
  /(contributor)          → community lane routes (register shelter, update capacity)
  /(admin)                → institutional lane routes (verification queue)
  /api                    → route handlers (shelters, subscriptions, verification;
                             /ussd and /sms reserved, not implemented this phase)
/lib
  /db                     → Prisma client, query helpers
  /geo                    → hierarchy lookup, bairro_vizinhos overflow logic
  /offline                → Dexie schema, sync queue logic
/prisma
  schema.prisma           → single source of truth for the data model
/context                  → this folder; agent-facing source of truth
  /feature-specs           → per-unit specs, written incrementally
/public
  geo-snapshot.json        → compressed geographic hierarchy for offline caching
/tests
  /unit /integration /e2e
```

## System Invariants

Rules the code must never break, regardless of what a given feature spec asks for:

1. **No forced account creation for search.** Anonymous shelter search must never require a `users` row, OTP, or any registration step.
2. **Capacity write access is ownership-based, not verification-based.** A `capacity_status` update on a shelter requires `uploaded_by == current_user.id` — it must never be blocked by the user's `verification_status`.
3. **Every shelter has a `route_description`.** Landmark-based text directions are the offline fallback; a shelter record without one is incomplete data, not just a missing "nice-to-have" field.
4. **Geographic lookups go through the relational hierarchy, never GPS-only.** `latitude`/`longitude` are enhancements; they must never become the only way to locate or match a shelter, since feature phones and offline PWA sessions may have neither.
5. **Single backend, single language.** No new service, daemon, or language gets introduced to solve a problem Next.js/TypeScript can solve (this is why the alert-check job is a Vercel Cron route, not a separate process).
6. **Tier changes are cascading and automatic.** When a contributor's `verification_status` moves to `verified`, all shelters with `uploaded_by == user.id` move from Tier 2 to Tier 1 in the same transaction — never as a manual per-shelter admin action.
7. **Offline-first is baseline, not enhancement.** Core search must work against the cached geographic snapshot with zero network. GPS sort, live map pins, and photo upload are progressive enhancements layered on top when online — never requirements for the base flow.

## Future-Channel Compatibility

The data model, business logic, and API routes are designed so the USSD/SMS channel (deferred this phase) can be added as new route handlers (`/api/ussd`, `/api/sms`) and a state-machine layer, reusing the same Prisma models and the same shelter/verification/subscription logic — not a parallel system.
