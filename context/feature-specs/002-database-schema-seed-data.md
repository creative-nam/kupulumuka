# 002 — Database Schema & Seed Data

## Goal

Define the Prisma schema for the geographic hierarchy and core domain entities (`Provincia`, `Distrito`, `Bairro`, `Quarteirao`, `BairroVizinho`, `Shelter`, `User`), run the initial migration, and write a seed script producing realistic sample data — enough for every later unit (search, contribution, capacity update, verification) to build and test against real rows instead of fixtures invented per-unit.

## Out of Scope (explicit)

- Any query helper functions beyond what the seed script itself needs (e.g. no `getShelterById`, no search logic) — those belong to the units that actually need them (Phase 1 onward).
- Any API route or UI.
- Auth/OTP logic — the `User` model exists to be queried against, not to be populated through a real signup flow yet.



## Design

**Geographic hierarchy:** `Provincia → Distrito → Bairro → Quarteirao`, generic on purpose. Mozambique's real structure has a quirk this needs to handle correctly: **Cidade de Maputo is província-level**, not a distrito nested inside Província de Maputo, while Matola and Boane (both named in `project-overview.md`'s target area) *are* distrito/município-level, nested inside Província de Maputo. The seed data must reflect this — Cidade de Maputo seeded as its own `Provincia` row, Matola/Boane seeded as `Distrito` rows under Província de Maputo — not flattened into one shape for convenience.

`BairroVizinho` is a self-join on `Bairro` (via a join table, `bairroAId`/`bairroBId`) implementing the adjacency relationship used for shelter-overflow routing, per `architecture.md`.

`Shelter.routeDescription` **is required, not nullable** — this is invariant #3 from `architecture.md`, enforced at the schema level, not just convention.

`Shelter.uploadedById` **is nullable** — official (Tier 1) seeded shelters have no community contributor; only Tier 2 community-submitted shelters have an owning user.

**Capacity status and tier are enums, English internally** (`AVAILABLE` / `NEARLY_FULL` / `FULL`; `OFFICIAL` / `COMMUNITY`), per the naming split in `code-standards.md` — Portuguese display strings belong in a localization layer, not in the enum values themselves.

`User.phone` **and** `User.email` **are both optional but distinct identity paths** — a community-lane user has a phone, no email; an institutional-lane user has an email, no phone. Neither is globally required; a row must have at least one, enforced by a database-level `CHECK` constraint (`CHECK (phone IS NOT NULL OR email IS NOT NULL)`) applied via migration `20260801000000_add_user_contact_check`, with application-layer validation in `lib/db/user-validation.ts` as a user-facing backstop (throws `UserContactError` with a descriptive message before the DB rejects).

**Seed data breadth is deliberate, not incidental.** Rather than a single-neighborhood dataset, seed across three real, flood-relevant regions so Phase 1 (search, adjacency routing) has enough surface area to actually test cross-bairro and cross-province behavior without needing to touch the seed script again:

- **Cidade de Maputo / Província de Maputo** — includes Matola and Boane, per `project-overview.md`'s target area.
- **Sofala** — Beira and the Pungwe/Búzi river basins; the country's most cyclone/flood-exposed region (Cyclone Idai, 2019).
- **Gaza** — the Limpopo river basin around Chókwè/Xai-Xai; site of Mozambique's most severe historical floods (2000, 2013).

Target roughly 5 bairros per province, 1–3 shelters per bairro, and at least 2–3 `BairroVizinho` adjacency pairs per province (adjacency only makes sense between bairros that are actually near each other — don't create pairs across provinces).

**Write the seed script as data driven by arrays/loops, not hand-repeated blocks.** Volume should come from the size of the data structure, not from copy-pasted creation calls — this keeps the script maintainable regardless of how much sample data it seeds, and makes it easy to extend later without restructuring.

## Implementation Steps

1. Install and initialize Prisma against the Postgres instance (Supabase/Neon per `architecture.md`).
2. Define the schema: `Provincia`, `Distrito`, `Bairro`, `Quarteirao`, `BairroVizinho`, `Shelter` (with `ShelterTier` and `CapacityStatus` enums), `User` (with `UserRole` and `VerificationStatus` enums).
3. Run the initial migration.
4. Write `prisma/seed.ts`, structured as data arrays/loops (per the Design section above), covering:
  - **Cidade de Maputo** and **Província de Maputo** as separate `Provincia` rows (not nested), plus **Sofala** and **Gaza**.
  - Distritos under each: e.g. a distrito municipal under Cidade de Maputo; Matola and Boane under Província de Maputo; Beira under Sofala; Chókwè and/or Xai-Xai under Gaza.
  - Roughly 5 `Bairro` rows per province, including Khongolote (Matola) — matching the shelter-search mockup already approved in `ui-context.md`, so later units testing against the search screen have continuity with what's already been designed.
  - At least one `Quarteirao` per seeded bairro, including "Quarteirão 12" under Khongolote.
  - 2–3 `BairroVizinho` relationships per province (only between bairros that are actually geographically adjacent within that province) — enough to prove the adjacency model resolves correctly across more than one isolated pair.
  - 1–3 `Shelter` rows per bairro, mixing Tier 1/Tier 2 and all three capacity statuses across the dataset. The three shelters already used in the approved mockup (EPC Khongolote, Igreja Católica, Salão Paroquial S. João) must be included as-is under Khongolote, for continuity with the approved design.
  - At least one seeded institutional `User` (verified, email-based) and one community `User` (unverified, phone-based) per province, plus the specific community `User` who owns Salão Paroquial S. João.
5. Write the integration test (before considering the seed script done, per TDD): run the seed script against the dedicated test database — a separate Supabase project whose connection string is exposed as `TEST_DIRECT_URL`, never the dev/prod database — then assert expected row counts per province, and that adjacency resolves correctly for at least two different `BairroVizinho` pairs in two different provinces (not just one pair overall — this is the difference between "the join table works" and "the join table works across the actual breadth of data"). **Isolation is by dedicated project, not by a disposable schema:** the original approach (a throwaway schema via `?schema=` in the connection string) didn't work because the `PrismaPg` adapter ignores `?schema=` and writes to the default schema regardless. Every integration test must read `TEST_DIRECT_URL` through `requireTestDbUrl()` in `tests/integration/setup.ts`, which parses the URL and asserts the username segment is exactly `postgres.<test-project-ref>` before any migration, truncation, or seed runs — a guardrail against pointing destructive operations at the real dev/prod database.



## Success Checklist

- [ ] `prisma migrate dev` runs cleanly with no manual schema fixes required after generation.
- [ ] Cidade de Maputo and Província de Maputo are both seeded as `Provincia`-level rows — not one nested under the other. Sofala and Gaza are seeded alongside them.
- [ ] Matola and Boane are seeded as `Distrito` rows under Província de Maputo.
- [ ] Each of the four provinces has roughly 5 bairros, and every bairro has at least one shelter.
- [ ] `Shelter.routeDescription` is a required (non-nullable) column in the generated schema.
- [ ] Seeding the three mockup shelters (EPC Khongolote, Igreja Católica, Salão Paroquial S. João) produces the same tier/capacity-status combination already shown in `ui-context.md`'s reference mockup.
- [ ] `BairroVizinho` adjacency exists across at least two different provinces, only between bairros that are actually geographically near each other.
- [ ] The seed script is data-driven (arrays/loops), not a sequence of hand-repeated creation calls.
- [ ] An integration test (written before the seed script was finalized) verifies per-province row counts and that adjacency resolves correctly in more than one province.
- [ ] `npm run build` and `npm run lint` still pass with no errors introduced.
- [ ] No query helpers, API routes, or UI changes present in the diff — this unit is schema and seed data only.
- [ ] `progress-tracker.md` updated: unit marked complete, any deviations (e.g. from the assumed província/distrito seeding, or from the target bairro/shelter counts) noted explicitly.