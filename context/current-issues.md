# Current Issues

## 1. `geographic-picker.test.tsx` — "resets lower levels when a parent selection changes" times out (5000ms)

- **Status:** Pre-existing, unowned. Reproduced on clean `HEAD` (commit `71bb9bc`) with `git stash` — not introduced by the deterministic-id work.
- **Failure:** `Error: Test timed out in 5000ms` at `components/geographic-picker.test.tsx:193`. Fails both in the full `npm run test` run and in isolation (`npx vitest run components/geographic-picker.test.tsx`), and also with `-t "resets lower levels"`.
- **Symptom:** The test that changes a parent selection and asserts lower levels reset hangs past the 5s default timeout. Likely a Base UI Select popup/open interaction or an awaiting `userEvent` promise that never resolves under jsdom — timing-sensitive, not a hard assertion mismatch.
- **Implicated files:** `components/geographic-picker.test.tsx` (test at line 193), possibly `components/geographic-picker.tsx` or `components/ui/select.tsx` (Base UI combobox behavior in jsdom).
- **Impact:** `npm run test` reports 72 passed / 1 failed until this is fixed. It blocks a fully-green unit suite.
- **Next step when picked up:** Determine whether the interaction awaits an element that never becomes actionable (e.g. option list not opening in jsdom), add the missing step or a targeted `findBy`/wait, and confirm the whole file passes in isolation and in the full run.
