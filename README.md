# Kupulumuka

A mobile-first, offline-capable Progressive Web App helping Mozambican communities prepare for, survive, and recover from floods — starting with the most immediate need: **finding a nearby shelter, in Portuguese, on a slow connection, with or without an internet connection.**

Born out of the [Cursor Hackathon Moçambique](https://cursor.com) flood-resilience challenge, and now being developed further as a spec-driven, AI-agent-assisted build.

## What it does (so far)

- **Geographic search** — a cascading Província → Distrito → Bairro → Quarteirão picker lets a citizen narrow down to their exact area, with no account or sign-in required.
- **Shelter results** — official (verified) shelters are shown ahead of community-submitted ones, each with live capacity status (Livre / Quase cheio / Esgotado) and landmark-based directions, since street addresses are often unreliable in the areas this app targets.
- **Neighboring-bairro overflow** — if the selected bairro has no shelters, nearby bairros (via a real geographic adjacency model) are shown instead, clearly labeled as such rather than silently blended in.
- **Fully offline-capable** — works with a dropped connection mid-session, and even from a cold start with no network at all, once the app has been opened online at least once. Cached data is always visibly marked as such, with a last-updated timestamp — this is a safety-relevant detail, not just a UX nicety, since shelter capacity can change.
- **Light/dark theme**, following system preference with a manual override.

## Not yet built

Community shelter registration and capacity updates, phone-based alert subscriptions, the institutional verification lane, and the USSD/SMS channel for feature phones are all planned but not yet implemented — see [`context/roadmap.md`](./context/roadmap.md) for the full sequencing and [`context/project-overview.md`](./context/project-overview.md) for what's explicitly in and out of scope for the current phase.

## Tech stack

- **Next.js 15** (App Router) + TypeScript, strict mode
- **PostgreSQL** (via Supabase) + **Prisma**
- **next-pwa (Workbox)** for offline precaching, **Dexie.js** for client-side data caching
- **Tailwind CSS** + **shadcn/ui**, themed to a custom warm/community-oriented design system
- **Vitest** + **React Testing Library** (unit/integration), **Playwright** (e2e)

Every stack decision is justified against this project's actual constraints (offline-first, low-bandwidth, no forced accounts) in [`context/architecture.md`](./context/architecture.md) — nothing here was picked by default.

## Getting started

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your own Supabase connection strings (`DATABASE_URL`, `DIRECT_URL`) and a separate test database's `TEST_DIRECT_URL` (used by integration tests and CI — keep it distinct from your real dev database).

```bash
npx prisma migrate dev
npm run generate:geo-snapshot
npm run generate:shelters-snapshot
npm run dev
```

Visit `http://localhost:3000` — it redirects straight to `/explorar`, the shelter search flow.

### Running tests

```bash
npm run test              # unit tests (Vitest)
npm run test:integration  # integration tests, against TEST_DIRECT_URL
npm run test:e2e          # end-to-end tests (Playwright)
```

## How this project is built

This project follows a spec-driven, AI-agent-assisted development methodology rather than open-ended prompting. Everything the coding agent needs — product scope, architecture and its reasoning, design tokens, code conventions, and workflow rules (including a required TDD sequence) — lives in [`/context`](./context), with [`AGENTS.md`](./AGENTS.md) as the entry point. Work is broken into small, individually-specced units in [`context/feature-specs/`](./context/feature-specs), each reviewed (via [CodeRabbit](https://coderabbit.ai)) before being considered done. [`context/progress-tracker.md`](./context/progress-tracker.md) is the living record of what's complete, in progress, and decided along the way.

## License

Not yet decided.