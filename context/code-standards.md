# Code Standards

## Next.js / React

- **Default to React Server Components.** Add `"use client"` only when a component genuinely needs browser interactivity, hooks, or offline/local state (e.g. anything touching Dexie, `navigator.onLine`, or form state). Don't reach for `"use client"` reflexively at the top of a file "to be safe" — this bloats the client bundle, which directly works against the low-bandwidth requirement in `architecture.md`.
- **Route handlers stay thin.** Validate input, check ownership/access-lane boundaries, call into `/lib`, return a response. Business logic belongs in `/lib`, not inline in `app/api/**/route.ts`.
- **No `"use client"` at a layout or page root just because one child needs it.** Push the client boundary as far down the tree as possible — wrap only the interactive piece (e.g. the search input with autocomplete), not the whole page.

## TypeScript

- **Strict mode on.** `strict: true` in `tsconfig.json`, no exceptions. No `any` — use `unknown` and narrow, or define the type properly.
- **No implicit non-null assertions (`!`).** If a value can be null/undefined, handle it explicitly. This matters especially for offline code paths, where "the network request never happened" is a normal, expected state, not an edge case.
- **Types over interfaces** for data shapes (`type Shelter = { ... }`); **interfaces** only when defining a contract meant to be extended/implemented (e.g. a repository interface with multiple backends).
- **No default exports**, except for Next.js files that require them (pages, layouts, route handlers). Named exports everywhere else — easier for an agent (and you) to grep, rename, and trace usage.
- **Prisma-generated types are the source of truth for data shapes.** Don't hand-write a parallel `Shelter` type that duplicates the schema; import and extend from `@prisma/client` if a shape needs to differ (e.g. a client-side subset for offline caching).

## Naming

- **Files:** `kebab-case.ts` / `kebab-case.tsx` (e.g. `shelter-search.ts`, `capacity-badge.tsx`).
- **Components:** `PascalCase` matching the file name minus the extension (e.g. `CapacityBadge` in `capacity-badge.tsx`).
- **Functions/variables:** `camelCase`. Boolean variables/functions read as a question or state: `isOnline`, `hasPendingSync`, `canEditCapacity`.
- **Prisma models:** `PascalCase` singular (`Shelter`, `Bairro`, `Quarteirao`) — Prisma pluralizes table names automatically; don't fight this.
- **Route handlers:** named after the resource and verb implied by the HTTP method, not restated in the name (`app/api/shelters/route.ts` handles GET/POST; no `getShelters.ts`).
- **Administrative/geographic terms stay in Portuguese** in code and schema (`bairro`, `quarteirao`, `province`, `district`). These name Mozambique-specific administrative structures, not generic concepts with an English equivalent — if the project ever expands to another country, its administrative hierarchy will likely differ in shape too, so this is a data-modeling concern, not a translation one. Do not rename these to English "for consistency."
- **Generic status/state vocabulary is named in English internally**, even though the product is Portuguese-only today (`capacityStatus` values: `available` / `nearly_full` / `full`; not `livre`/`quase_cheio`/`esgotado`). These are ordinary concepts that happen to display in Portuguese — keeping them English internally means the eventual localization layer is additive (a translation dictionary at the display boundary) rather than a schema migration. Portuguese strings live in a localization file, not in enum values or code identifiers.

## File & Folder Structure

- One component per file. If a component needs a small private subcomponent only it uses, colocate it in the same file — don't create a file for something with exactly one caller.
- Route groups (`(public)`, `(contributor)`, `(admin)`) enforce the access-lane boundaries from `architecture.md` — a component or route handler must never reach across lanes directly (e.g. a public search page must not import an admin-only query function).
- Shared logic goes in `/lib`, organized by domain (`/lib/geo`, `/lib/offline`), not by technical type (no generic `/lib/utils.ts` dumping ground — if a helper doesn't clearly belong to a domain folder, that's a signal it needs a home, not an excuse to skip choosing one).

## Testing (TDD workflow)

- **Test file lives next to the code it tests:** `shelter-search.ts` → `shelter-search.test.ts`, in the same folder. E2E specs live in `/tests/e2e`, not colocated.
- **A test is written from the feature spec's success checklist before implementation starts.** A red test that encodes the spec's checklist item is the expected starting state for any unit of work — see `ai-workflow-rules.md`.
- **No skipped or commented-out tests committed.** A failing test that's temporarily blocked gets a tracked note in `progress-tracker.md` or `current-issues.md`, not a `.skip()` left silently in the codebase.
- **Test names state the behavior, not the method:** `"returns Tier 1 shelters before Tier 2"`, not `"test searchShelters"`.

## Comments

- Comment **why**, not **what** — the code should read clearly enough that "what" is redundant. Reserve comments for non-obvious tradeoffs (e.g. why a query falls back to `bairro_vizinhos` instead of a radius search — link back to the relevant `architecture.md` invariant rather than re-explaining it inline).
- No commented-out code left in commits. Delete it — git history preserves it if it's ever needed again.

## Git / Commits

- One unit of work (one feature spec, see `ai-workflow-rules.md`) = one commit or small commit group, not one giant commit per session.
- Commit messages: imperative mood, state what changed and reference the spec (e.g. `feat: add shelter search by quarteirao (spec: 003-shelter-search)`).
