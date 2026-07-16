# Working With the Architect

This file is for whoever is acting as project architect on Kupulumuka — a human, Claude in a new session, or a different AI entirely. It's a different audience than `AGENTS.md` and the rest of `/context`: those are written for a *coding* agent implementing specs. This one is about the collaborative process between the person building this and whoever is helping them plan, write specs, and review results. Read this alongside `progress-tracker.md` (current state) rather than instead of it.

## The Core Loop

1. A feature spec (`feature-specs/NNN-name.md`) gets drafted — Goal, Out of Scope, Design, Implementation Steps, Success Checklist, TDD-sequenced — and handed to a coding agent (currently: Cursor).
2. The coding agent implements it and reports back in chat (the person relays this manually, copy-pasted).
3. The person reviews with CodeRabbit **manually** — there's no automatic integration between the coding agent and CodeRabbit. The person runs the review, copies CodeRabbit's findings, and pastes them into this conversation.
4. The architect (this role) triages CodeRabbit's findings — **not** by accepting its severity labels at face value. Several "Minor"-labeled findings in this project turned out to matter more than "Major"-labeled ones once the actual consequence was reasoned through (e.g. a dev-mode service worker registration bug labeled Minor was treated as more urgent than its label suggested, because of the confusing debugging problems it would cause across every subsequent unit).
5. The architect writes **one self-contained, copy-paste-ready instruction at a time** back to the person, who relays it to the coding agent. Findings get fixed one at a time, not bundled, once there's more than a couple — this keeps commits self-contained and makes it possible to tell which fix caused which result if something goes sideways.
6. Once everything's resolved, the person commits and the cycle repeats for the next spec.

## Verification Norms — the most important section in this file

**Do not trust a coding agent's summary at face value for anything a checklist claims to verify.** This project has already hit a real case of this going wrong: unit 1.2's e2e checklist item was reported and closed as passing, and had actually never passed once, from the commit that introduced it — an ambiguous test locator matched two elements, and nobody caught it for two units. The fix going forward: ask for actual evidence (real test output, specific file/line references, a description of *why* something works, not just *that* it works) rather than a restated checklist. Where something is independently checkable by the person (a screenshot, a devtools panel, an actual click), ask them to check it directly rather than accept a description of it.

**Treat "pre-existing" or "unrelated" claims as things to verify, not accept.** When an agent claims a failing test predates the current change, ask for the actual method of verification (e.g., disabling the suspected cause and re-running), not just the claim. This project had exactly one such claim turn out to be true (the shelter-search e2e bugs, confirmed by disabling the service worker and reproducing identically) — verified, not assumed.

**A green test suite proves the code runs, not that it's correct.** Several real bugs in this project were caught specifically because someone asked "does this test check behavior, or just presence/existence" — a retry button that renders but was never actually clicked and confirmed to work, a `walkDir` test that validated a hand-copied duplicate instead of the real function. This is now written into `code-standards.md` as an explicit rule; keep applying it even where the rule doesn't literally name the situation.

## Spec-Writing Norms

- Specs are written one (or a small handful) at a time, never batched in advance — `roadmap.md` gives the ordering and one-line scope of what's ahead; `feature-specs/` only ever contains what's actually being worked on now plus history.
- Every spec has an explicit "Out of Scope" section naming what belongs to *other* units, not just what this one does — this is what's caught scope creep and kept units small enough to review properly.
- When a unit's implementation reveals that an earlier "closed" unit's assumptions no longer hold (e.g. unit 1.3b converting a Server Component from unit 1.2 into a Client Component), that's a real architecture decision requiring explicit documentation in `progress-tracker.md`, not something to let sit implicit in a diff.

## Git Workflow

- `dev` branch for ongoing work, `main` reserved for genuine milestones (end of a phase, not every unit).
- The person reviews with CodeRabbit and typically commits before opening/updating the PR (their preference, to avoid multiple commits per unit of work).
- A PR into `main` gets opened early (even before merging) so the accumulated diff can be reviewed as a whole, not just unit-by-unit.
- No dedicated feature branch per spec — units are already isolated by being separate commits with a review gate before each one lands; branch-per-unit would add ceremony without a corresponding benefit for this linear, single-developer roadmap.

## A Few Judgment Calls Worth Remembering, Not Re-Litigating

- Domain vocabulary split: Mozambican administrative nouns (`bairro`, `quarteirao`, `provincia`) stay Portuguese in code/schema; generic status vocabulary (capacity status, verification status) is English internally, localized only at the display layer.
- Anything presenting data to a person during an actual emergency must never overstate certainty — this is why the offline cache-staleness banner exists, and why the neighboring-bairro overflow distinction in search results was treated as a safety issue worth fixing properly, not a copy nitpick.
- Low-bandwidth is a real, recurring design constraint, not a one-time checkbox — it's shaped the font-loading strategy, the native-vs-styled Select decision (later reversed once visual cohesion mattered more in practice), and the static-snapshot-over-per-request-API pattern used for both geographic and shelter data.
