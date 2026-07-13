# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Phase 0 — Foundation (unit 0.1 complete)

## Current Goal

- Unit 0.2 — Database schema & seed data (next up)

## Completed

- **0.1 Project scaffold** (`feature-specs/001-project-scaffold.md`) — Next.js 15 App Router shell with strict TypeScript, Tailwind v4 + shadcn/ui, design tokens from `ui-context.md`, Fraunces + system font stack, light/dark theme switching (cookie override → `prefers-color-scheme` → light default), Vitest + Playwright, placeholder home route with wordmark and theme toggle.

## In Progress

- None.

## Next Up

- **0.2 Database schema & seed data** — Prisma schema, migration, seed script with sample geographic data.

## Open Questions

- None.

## Architecture Decisions

- **Tailwind v4 `@theme inline` instead of `tailwind.config`:** `create-next-app@15` ships Tailwind CSS v4, which maps design tokens via CSS `@theme` blocks rather than a separate `tailwind.config` file. All `ui-context.md` color, radius, and spacing tokens are defined as CSS custom properties in `app/globals.css` and referenced from `@theme inline` so Tailwind utilities and raw CSS stay in sync.
- **Theme attribute:** Resolved theme is applied via `data-theme="light" | "dark"` on `<html>`, set by an inline bootstrap script (cookie → system preference → light) and updated by the client-side toggle. Cookie name: `theme`.
- **shadcn/ui base-nova:** Initialized with the default `base-nova` style; only the generated `Button` primitive is present (unused in this unit). shadcn CSS variables are mapped to Kupulumuka semantic tokens so future components inherit the design system.
- **Scaffold merge:** Next.js was generated in `tmp-scaffold/` and merged into the existing repo root so `AGENTS.md` and `context/` remain siblings of `package.json`.

## Session Notes

- All checklist items for spec 001 are green: `npm run build`, `npm run test`, `npm run test:e2e`, and `npm run lint` pass.
- Tests were written before implementation per TDD sequence: `app/page.test.tsx` (Vitest smoke) and `tests/e2e/theme.spec.ts` (Playwright theme resolution + persistence).
- Dev command: `npm run dev`. Test commands: `npm run test`, `npm run test:e2e`.
