# AI Workflow Rules

These rules govern how a coding agent should operate on this project, session to session. They apply regardless of which specific feature spec is being worked on.

## 0. Read `/context` First, Every Session

Before touching any code, read every file in `/context` — not just this one. Start with `progress-tracker.md` to know what state the project is actually in; a session that skips this will re-derive stale assumptions or redo completed work.

## 1. Work in Units, Not Broad Prompts

Never implement more than one feature spec (`/context/feature-specs/NNN-name.md`) at a time, even if the next unit seems obvious or trivial. If asked to "just keep going," stop after the current spec's checklist is fully green and wait for the next spec to be written — don't self-assign the next unit.

## 2. Specs Are Written Incrementally, Not All Upfront

There is no complete backlog of feature specs sitting in `/context/feature-specs/` waiting to be worked through. Specs are created one (or a small handful) at a time, as decisions solidify. If no spec exists yet for what's being discussed, that's a signal to help draft the spec — not to start implementing from a verbal description.

`context/roadmap.md` is not an exception to this rule — it lists build units and their order/dependencies at a one-line level, with no implementation detail or success checklist. It tells you *what's next in sequence*, not *how to build it*. Treat a roadmap entry as a name and a rough scope boundary, nothing more, until its feature spec is actually written.

## 3. TDD Is the Required Sequence, Not Optional Rigor

For every feature spec, follow this order and do not skip steps:

1. **Read the spec's success checklist.**
2. **Write the test(s) first**, directly encoding the checklist items. The test should fail (red) at this point — that failure is the expected, correct state, not a bug to quietly fix by loosening the test.
3. **Implement the minimum code to make the test pass (green).**
4. **Refactor if needed**, keeping tests green throughout.
5. Only after all checklist items are green does the unit count as done.

If a checklist item can't be turned into a test (e.g. a subjective visual judgment), flag this explicitly rather than silently skipping it — either the checklist item needs rewording into something testable, or it's legitimately a manual-review item and should be marked as such in the spec.

## 4. System Invariants Are Non-Negotiable

The seven invariants in `architecture.md` override any individual feature spec if they ever conflict. If a spec's instructions seem to require breaking one (e.g. a spec that implies gating capacity updates on verification status), stop and flag the conflict rather than implementing it — this almost always means the spec was written wrong, not that the invariant should bend.

## 5. Handling Ambiguity and Scope Creep

- If a spec is ambiguous on an implementation detail that doesn't affect behavior (e.g. exact variable naming, minor internal structure), make a reasonable choice consistent with `code-standards.md` and move on — don't stall for clarification on things that don't matter.
- If a spec is ambiguous on something that **does** affect behavior or violates a stated invariant, stop and ask rather than guessing.
- If, while implementing one unit, a clearly separate but related need becomes obvious (e.g. building shelter search surfaces a missing index, or reveals a need for a new endpoint), do **not** silently expand scope to fix it. Note it in `progress-tracker.md` under a "Noted, not yet spec'd" section and finish the current unit as scoped.

## 6. Progress Tracking Is Mandatory, Not Optional Housekeeping

At the end of every unit of work, update `progress-tracker.md`:

- Move the unit from "In Progress" to "Complete" (or note why it's blocked, under "Blocked").
- Record any architectural decisions made during implementation that weren't in the original spec (e.g. "chose X over Y because Z") — this is how continuity survives across sessions, since no session has memory of a previous one beyond what's written down.
- Log anything noted under Rule 5 (scope items deferred, not yet spec'd).

An implementation session that produces working code but doesn't update this file is not finished.

## 7. Issues and Debugging

If something is broken and the fix isn't obvious from the current spec, don't wander the codebase searching. Create or update `current-issues.md` with: what's broken, which files are implicated, and the exact error/failing test output. Work from that document, not from re-reading the whole codebase from scratch.

## 8. Review Loop

CodeRabbit is installed on this repo and reviews changes automatically. Treat each completed unit as a pull request:

1. Implement against the spec.
2. Self-check against the success checklist line by line before declaring done.
3. If CodeRabbit or the human reviewer flags something, don't silently patch it — re-read the original spec, apply the specific correction, and update `progress-tracker.md` to note the correction was made and why.

## 9. Never Invent Product Decisions

If implementing a unit surfaces a genuine product question (not a technical one) — e.g. "what should happen if a citizen searches with no bairros nearby at all" — do not decide this unilaterally by picking whatever is easiest to code. Flag it as a question. Product decisions belong in `project-overview.md` or a spec, not buried in an implementation choice.

## 10. Protected Foundation Components

Do not modify generated third-party foundation components — `components/ui/*` (shadcn/ui primitives) and other library internals — unless a spec explicitly requires it. These should stay default and upgradable.

Project-specific styling, layout, and feature logic belong in app-level components that wrap or compose these primitives, not in edits to the primitives themselves. If a shadcn component genuinely needs different behavior, that's a signal to build a wrapper component, not to patch the copied source in place.

## 11. When to Split Work

Before starting a unit, check whether it actually combines multiple units. Split the work if it mixes:

- Frontend/UI changes and offline-sync logic (Dexie/service worker) changes
- Changes across more than one access lane (`(public)` / `(contributor)` / `(admin)`)
- Multiple unrelated API routes or resources
- Behavior that isn't clearly defined in a feature spec — write/clarify the spec first, rather than resolving the gap inline while coding

If a change can't be verified end to end in one sitting, the scope is too broad — split it into smaller specs rather than pushing through.