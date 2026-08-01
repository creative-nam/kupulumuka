# 008 — CI Pipeline

## Goal

A GitHub Actions workflow that runs build, lint, unit, integration, and e2e tests automatically on every push and pull request — so a checklist item's truth no longer depends on trusting a summary. This directly closes the gap that let unit 1.2's broken e2e test sit "done" for two units before anyone noticed: CI would have shown a red check on that PR the moment the test was introduced, regardless of what any report claimed.

This is also the natural point to formalize what unit 1.3c's investigation already established about running e2e against a production build, not `next dev`.

## Out of Scope (explicit)

- Deployment (Vercel or otherwise) — deferred per the earlier discussion; this unit is CI (checks on push/PR), not CD (deploy on merge).
- Any change to the actual application code — this unit should only add workflow configuration and, if needed, minor test-environment adjustments (e.g. env vars CI needs that local dev already has in `.env`).
- CodeRabbit configuration itself — that's already running as a separate integration; this unit doesn't touch it.

## Design

**One workflow, six jobs, no strict fail-fast staging.** The actual `.github/workflows/ci.yml` does not stage cheap checks before slow ones — lint, typecheck, unit, and integration all run independently in parallel (no `needs`; integration's only "dependency" is the `TEST_DIRECT_URL` secret). The only sequencing is the shared-test-database dependency chain: **build has `needs: integration`** (it seeds the same test database — `prisma migrate deploy` + seed — and is sequenced after integration to avoid racing its truncate/seed cycle on the same DB) and **e2e has `needs: build`** (it runs against the production preview server, which requires a successful build first). So e2e genuinely depends on build — not just by coincidence of ordering — but a lint/unit failure does not short-circuit the slower jobs; they still run.

The six jobs:
1. **Lint** — `npm run lint`.
2. **Typecheck** — `npm run typecheck` (`tsc --noEmit`), with a `npx prisma generate` step first so Prisma types resolve.
3. **Unit tests** — `npm run test` (Vitest).
4. **Integration tests** — `npm run test:integration`, against the dedicated `kupulumuka-test` Supabase project's `TEST_DIRECT_URL` (unit 0.2's isolated test database — CI must never point at the real dev/prod database).
5. **Build** — `npm run build` (this also generates the service worker per unit 1.3c's `generate:sw` chain); `needs: integration`.
6. **E2E tests** — `npm run test:e2e`, which per unit 1.3c's `playwright.config.ts` now runs against the production preview server, not `next dev`; `needs: build`.

**Secrets:** `TEST_DIRECT_URL` (and any other required env vars) must be added to the GitHub repo's Actions secrets — never committed, never inferred from `.env.example` alone. This unit should not touch the real `DATABASE_URL`/`DIRECT_URL` at all; CI has no legitimate reason to touch the dev database.

**Triggers:** run on push to any branch and on pull requests targeting `main` — this covers both the `dev` branch's ongoing commits and the PR you're about to open.

**Status visibility:** the workflow's job results should show up as checks on the PR itself, per GitHub's default behavior for repo-configured Actions — no extra configuration should be needed for this, but confirm it actually appears rather than assuming.

## Implementation Steps

1. Write `.github/workflows/ci.yml` with the six jobs described above, in dependency order (lint/typecheck/unit/integration run in parallel; build needs integration; e2e needs build).
2. Add `TEST_DIRECT_URL` (and any other required variables) to GitHub Actions secrets — this is a manual step in the GitHub UI in this repo, not something the agent can do itself; flag clearly if a human needs to complete this before CI can pass.
3. Push a small test commit (or open a draft PR) to confirm the workflow actually triggers and all six jobs run and report status correctly.
4. Deliberately introduce a failing test locally, push it, confirm CI actually shows red — don't just assume a green run on working code proves the pipeline is correctly wired; a workflow with a misconfigured trigger or a silently-skipped job can show green for the wrong reason.
5. Revert the deliberate failure once confirmed.

## Success Checklist

- [ ] `.github/workflows/ci.yml` exists with lint, typecheck, unit, integration, build, and e2e jobs, correctly ordered/dependent (build requires integration to succeed first; e2e requires build to succeed first).
- [ ] Integration tests in CI run against `TEST_DIRECT_URL` (the isolated Supabase test project), confirmed by checking the actual CI logs — not assumed from config alone.
- [ ] E2E tests in CI run against the production preview server (per unit 1.3c's established pattern), not `next dev`.
- [ ] A deliberately introduced failing test was pushed and confirmed to make the relevant CI job fail (red), then reverted — proving the pipeline actually catches failures, not just that it runs.
- [ ] CI checks appear on the PR itself, confirmed by looking at an actual PR, not assumed.
- [ ] No secrets committed to the repo; `TEST_DIRECT_URL` and any other required values live only in GitHub Actions secrets.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations noted, and a note confirming which human-only steps (adding secrets) were completed.
