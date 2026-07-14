# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Phase 0 — Foundation (unit 0.1 and 0.2 complete)

## Current Goal

- Next up: Phase 1 — Core citizen value (geographic picker)

## Completed

- **0.1 Project scaffold** (`feature-specs/001-project-scaffold.md`) — Next.js 15 App Router shell with strict TypeScript, Tailwind v4 + shadcn/ui, design tokens from `ui-context.md`, Fraunces + system font stack, light/dark theme switching (cookie override → `prefers-color-scheme` → light default), Vitest + Playwright, placeholder home route with wordmark and theme toggle.

- **0.2 Database schema & seed data** (`feature-specs/002-database-schema-seed-data.md`) — Prisma schema with `Provincia`, `Distrito`, `Bairro`, `Quarteirao`, `BairroVizinho`, `Shelter`, and `User` models; enums for `CapacityStatus` (AVAILABLE/NEARLY_FULL/FULL), `ShelterTier` (OFFICIAL/COMMUNITY), `UserRole` (CITIZEN/ADMIN), and `VerificationStatus` (UNVERIFIED/PENDING/VERIFIED). Migration applied to Supabase Postgres. Data-driven seed script covering 4 provinces (Cidade de Maputo, Província de Maputo, Sofala, Gaza), 5 distritos, 22 bairros, 30 quarteiroes, 25 shelters (mixed tiers/capacities), 13 bairro-vizinho adjacency pairs, and 8 users (4 institutional + 4 community). Three mockup shelters (EPC Khongolote, Igreja Católica, Salão Paroquial S. João) seeded under Khongolote with matching tier/capacity per the approved UI mockup. Integration test suite (17 tests) verifies per-province row counts, geographic hierarchy correctness, adjacency across 2+ provinces, and data invariants.

## In Progress

- None.

## Next Up

- **1.1 Geographic picker** — Province → district → bairro → quarteirão selection, working against seeded data.

## Open Questions

- None.

## Architecture Decisions

- **Tailwind v4 `@theme inline` instead of `tailwind.config`:** `create-next-app@15` ships Tailwind CSS v4, which maps design tokens via CSS `@theme` blocks rather than a separate `tailwind.config` file. All `ui-context.md` color, radius, and spacing tokens are defined as CSS custom properties in `app/globals.css` and referenced from `@theme inline` so Tailwind utilities and raw CSS stay in sync.
- **Theme attribute:** Resolved theme is applied via `data-theme="light" | "dark"` on `<html>`, set by an inline bootstrap script (cookie → system preference → light) and updated by the client-side toggle. Cookie name: `theme`.
- **shadcn/ui base-nova:** Initialized with the default `base-nova` style; only the generated `Button` primitive is present (unused in this unit). shadcn CSS variables are mapped to Kupulumuka semantic tokens so future components inherit the design system.
- **Scaffold merge:** Next.js was generated in `tmp-scaffold/` and merged into the existing repo root so `AGENTS.md` and `context/` remain siblings of `package.json`.
- **Prisma v7 config:** Prisma 7.x moved database connection configuration from `schema.prisma`'s `datasource` block to `prisma.config.ts`. The PrismaClient constructor no longer accepts `datasourceUrl`; it requires a driver adapter (`@prisma/adapter-pg`). `prisma.config.ts` uses `DIRECT_URL` for migrations/seed; the runtime client in `lib/db/prisma-client.ts` uses `DATABASE_URL` (pooled) via the adapter.
- **User model — `carlos@example.com` has both email and phone:** The seed user who owns "Salão Paroquial S. João" needs an email to allow shelter lookup by email (`uploadedByEmail`). This is a minor deviation from the strict "community users have phone only" pattern, documented in the spec as acceptable since `User.phone` and `User.email` are both optional.

## Session Notes

- All checklist items for spec 001 are green: `npm run build`, `npm run test`, `npm run test:e2e`, and `npm run lint` pass.
- All checklist items for spec 002 are green: migration clean, seed produces correct hierarchy (Cidade de Maputo and Província de Maputo as separate Provincia rows, Matola/Boane as Distrito under Província de Maputo), 17 integration tests pass, build and lint clean.
- Integration tests use a separate vitest config (`vitest.integration.config.ts`) with `node` environment and run via `npm run test:integration`. The main `vitest.config.ts` excludes `tests/integration/`.
- The seed script is data-driven (arrays/loops per the spec's Design section), not hand-repeated blocks.
- Prisma generated client output is at `lib/generated/prisma/client.ts` (Prisma 7.x changed the output structure from a re-exporting `index.ts` to direct `client.ts`).
