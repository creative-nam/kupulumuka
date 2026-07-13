# 001 — Project Scaffold

## Goal

Stand up the Next.js application shell: strict TypeScript, Tailwind/shadcn wired to the design tokens in `ui-context.md`, both font roles working (Fraunces + system stack), light/dark theme switching (system preference + manual override), and the testing infrastructure (Vitest, Playwright) — with a single placeholder screen that proves the theme renders correctly. No database, no real feature screens, no PWA/offline plumbing — those are later units (0.2, Phase 1, Phase 5).

## Out of Scope (explicit)

- Prisma / database of any kind — see roadmap unit 0.2.
- Service worker, manifest, offline caching — see roadmap unit 1.3 and 5.1.
- Any real product screen (search, contribution, etc.) — see Phase 1 onward.
- Auth of any kind.

If implementation reveals a reason to pull one of these forward, stop and flag it rather than absorbing it into this unit (per `ai-workflow-rules.md`, Rule 11).

## Design

- App Router, TypeScript `strict: true`, no default exports except where Next.js requires them (`code-standards.md`).
- Theme tokens from `ui-context.md` implemented as CSS custom properties in `globals.css`, mapped into `tailwind.config` so both raw CSS and Tailwind utilities resolve to the same values. No hardcoded hex values anywhere outside the token definitions.
- Theme resolution order: manual override (cookie) → `prefers-color-scheme` → light (default). A minimal toggle (no styling polish required yet, just functional) lets a person switch and persist their choice.
- Fraunces loaded via `next/font/google`, subset to `latin` + Portuguese diacritics, weights 500 and 600 only. System font stack for everything else, per `ui-context.md`.
- The one placeholder screen: the "Kupulumuka" wordmark, set in Fraunces 600, on the themed page background — enough to visually confirm both the font and the color tokens are wired correctly in both modes.

## Handling the Existing Directory

The project folder will not be empty when this unit starts — it already contains `AGENTS.md` and `context/`. Most scaffolding tools (`create-next-app` included) refuse to initialize into a non-empty directory, or only tolerate a small allowlist of pre-existing files (`.git`, `.gitignore`, `README.md`, etc.) that does not include `AGENTS.md` or `context/`.

**Required end state:** `context/`, `AGENTS.md`, and the generated Next.js project (`package.json`, `app/`, etc.) all sit at the same directory level — `context/` and `AGENTS.md` must be siblings of `package.json`, not nested inside or outside the actual project root. Any tooling that scopes itself to "the project" needs to see `/context` as part of it.

**How to get there:** scaffold the Next.js app into a temporary subdirectory, then move its generated contents up into the existing project root (merging with, not overwriting, `AGENTS.md` and `context/`), then remove the now-empty temporary subdirectory. Do not leave `AGENTS.md`/`context/` sitting outside the real project root as a side effect of taking the path of least resistance — treat that as a failed unit, not an acceptable shortcut.

## Implementation Steps

1. Initialize the Next.js 15 App Router project with TypeScript strict mode.
2. Install and configure Tailwind CSS + shadcn/ui. Define all color, radius, and spacing tokens from `ui-context.md` as CSS custom properties; wire `tailwind.config` to reference them — no raw hex in component code.
3. Configure `next/font/google` for Fraunces (weights 500, 600; `latin` + Portuguese diacritics subset; `font-display: swap`) alongside the system font stack for body/UI text.
4. Implement theme resolution: read `prefers-color-scheme` on first load, allow manual override, persist the override in a cookie, apply via a `data-theme` attribute (or class) on `<html>`.
5. Build the single placeholder home route rendering the wordmark and a functional (unstyled-is-fine) theme toggle.
6. Configure Vitest + React Testing Library; write the smoke test (see below) before implementation, per the TDD sequence in `ai-workflow-rules.md`.
7. Configure Playwright; write the theme e2e test (see below) before implementation.
8. Configure ESLint/Prettier matching `code-standards.md` conventions (naming, no default exports, no `any`).

## Success Checklist

- [ ] `context/` and `AGENTS.md` sit at the same directory level as `package.json` — not nested inside a generated subfolder, not left outside the project root.
- [ ] `npm run build` completes with zero TypeScript errors under `strict: true`.
- [ ] A Vitest smoke test asserts the home route renders the wordmark text, written before the route was implemented.
- [ ] A Playwright test asserts the page background resolves to `--bg-page`'s light value by default, and to its dark value when `prefers-color-scheme: dark` is emulated — written before the theming logic was implemented.
- [ ] A Playwright test asserts that toggling the theme control changes the rendered background and survives a page reload (cookie persisted).
- [ ] The wordmark renders in Fraunces 600; devtools network panel shows the font served from the app's own origin, not a request to `fonts.googleapis.com`.
- [ ] ESLint passes with zero errors; no default exports outside required Next.js files; no `any` in the codebase.
- [ ] No Prisma, database, service worker, or manifest code present anywhere in the diff.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations from this spec noted.
