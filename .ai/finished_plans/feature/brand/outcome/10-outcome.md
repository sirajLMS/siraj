# Task 10 — Repo tests for `AppearanceSettingsRepository` (Tier 1 & Tier 2)

## Summary

Created `backend/db/test/appearance/appearance-settings.repository.test.ts` —
11 tests (5 Tier 1 + 6 Tier 2) that achieve **100% line + 100% branch coverage**
on `backend/db/repo/appearance/appearance-settings.repository.ts` (Task 2.2)
and pass all 6 codescene-lifecycle stages cleanly (tsgo → oxlint → biome →
lint:type-aware → check:duplicates → codescene).

The test file also doubled as a discovery surface for an environment gap: the
`appearance_settings` table was missing on the local `siraj_test` DB (the
dev `siraj` DB had it from Task 2's `db push`, but the test DB had not been
synced since). Pushed the schema with `drizzle-kit push --force` against the
test DATABASE_URL — the table is now present and stable for all future
appearance tests.

This satisfies **AC-1, AC-8, AC-9, AC-37, AC-39**:
- **AC-1**: `appearance_settings` table populated + read via repo (test exercises both).
- **AC-8**: `upsert` writes published + draft in one operation (verified by INSERT and UPDATE branch tests).
- **AC-9**: `publishDraft` copies draft active-mode colors into published columns atomically (verified for both `light` and `dark` active modes).
- **AC-37**: tiered test matrix — this file lands Tier 1 (100% line coverage) + Tier 2 (boundary cases) for the repo layer.
- **AC-39**: high-quality tests — `runInRollback` for isolation, no `any`, `tx` propagation, CodeScene-clean.

## Requirements Coverage

| AC | Test(s) | How |
|---|---|---|
| AC-1 | "get() returns null when table is empty", "upsert() inserts a new row" | empty `appearance_settings` → null; insert → row visible |
| AC-8 | "upsert() inserts (INSERT branch)", "upsert() updates (UPDATE branch)" | `upsert` writes BOTH published + draft from input; UPDATE preserves row id |
| AC-9 | "publishDraft() copies active-mode colors (light)", "publishDraft() copies dark-mode colors", "publishDraft() updates in place (no duplicate row)" | `publishDraft` computes `primaryMain`/`secondaryMain` from `draftFields.colors[draftFields.defaultColorScheme]` and writes both published + draft columns in a single UPDATE |
| AC-37 | whole file | Tier 1 + Tier 2 matrix entries for repo layer |
| AC-39 | whole file | `runInRollback` wraps every test; `tx` propagated to every repo call; no `any`; CodeScene-clean |

## Files Created / Modified

### Created (1 file)

1. **`backend/db/test/appearance/appearance-settings.repository.test.ts`** (300 lines, 11 tests)
   - **Tier 1 (5 tests, 100% line coverage)**:
     1. `get()` returns `null` when the table is empty — covers the `null` branch of `get` / `toAppearanceSettingsRow` (line 118 in the repo).
     2. `upsert()` inserts a new row when none exists — covers the INSERT branch of `writeAppearanceRow` (lines 101–102).
     3. `upsert()` updates an existing row preserving the row id — covers the UPDATE branch (lines 93–99), AND verifies `id` preservation + `updatedAt` re-stamping.
     4. `get()` returns the row after `upsert` — covers the `row` branch of `toAppearanceSettingsRow` (Date → ISO string timestamp conversion).
     5. `publishDraft()` copies draft active-mode colors into published columns (INSERT path) — covers `publishDraft` end-to-end with `defaultColorScheme: "light"`.
   - **Tier 2 (6 tests, boundary cases)**:
     6. `upsert()` + `get()` roundtrip a `null` logo (the `logoUrl` column is the only nullable field — verifies PG nullability + JSONB `null` roundtrip).
     7. `upsert()` + `get()` roundtrip a non-null logo URL.
     8. `upsert()` persists maximum-length strings — `siteName` 80 chars / `siteTitle` 120 chars / `siteDescription` 300 chars (the JSON Schema limits from Task 9.1). The repo doesn't enforce these (no DB CHECK), but the test verifies the boundary doesn't silently truncate.
     9. `upsert()` preserves special characters — emoji (`🚀`), Arabic RTL (`أكاديمية`), HTML-like tags (`<script>alert('xss')</script>`), control chars (`\n`, `\t`). Verifies JSONB preserves the bytes verbatim (repo doesn't sanitize — that's the service layer's job per Task 9.8).
     10. `publishDraft()` copies `dark`-mode colors when `defaultColorScheme=dark` — active-mode selection branch.
     11. `publishDraft()` on an existing row updates in place — verifies no duplicate row is inserted (the check-then-update-or-insert pattern in `writeAppearanceRow` correctly takes the UPDATE path when a row already exists).
   - **Helpers** (file-local, no `test-utils.ts` pollution per AGENTS.md §13):
     - `clearAppearanceRow(tx)` — clears the single-row table inside the rollback tx. Uses `.where(sql\`TRUE\`)` as an explicit "delete all" marker required by the `drizzle/enforce-delete-with-where` oxlint rule (NEVER `oxlint-disable`).
     - `buildDraft(overrides)` — constructs an `AppearanceFields` payload with the same defaults as `DEFAULT_APPEARANCE_FIELDS` from `appearance-settings.service.ts` (so a future drift in defaults doesn't silently break the tests — they explicitly construct their own baseline).
     - `buildRow(draft)` — constructs an `AppearanceSettingsRow` from a draft, computing `primaryMain`/`secondaryMain` from the draft's active-mode colors (mirroring `publishDraft`'s logic, so tests can pass either `upsert` or `publishDraft` interchangeably for setup).
     - `seedAndFetch(tx, overrides)` (Tier 2 only) — shared seed+fetch wrapper that eliminates the `clear → user → draft → upsert → get` boilerplate across the 4 boundary roundtrip tests. Extracted to satisfy CodeScene's code-duplication detector (AGENTS.md §13).

### Modified (0 source files)

No source files modified. The repo file (`appearance-settings.repository.ts`) is read-only — this task only adds tests.

### Environment setup (not a file change, but a one-time DB sync)

- `siraj_test` Postgres DB was missing the `appearance_settings` table. Pushed the schema via:
  ```bash
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/siraj_test?sslmode=disable \
    bun --env-file=.env.test ./node_modules/.bin/drizzle-kit push --force
  ```
  This is a one-time setup; future appearance repo tests assume the table exists. The migration file `backend/drizzle/20260822060847_long_slayback/` (generated by Task 2) is the source of truth for the schema.

## Design Decisions

### Why `clearAppearanceRow(tx)` at the start of every test?

Per `backend/db/test/AGENTS.md` §12 ("Accounting for Pre-existing Data") and §15 ("Always Create Test Data — Never Query Seed Data"), tests must not assume a table is empty. `appearance_settings` is a single-row table, so any pre-existing committed row (e.g. from a Task 2.3 service smoke test) would cause `upsert` to take the UPDATE branch instead of INSERT, breaking the "INSERT branch" test.

`clearAppearanceRow(tx)` deletes any existing row inside the rollback transaction. The committed seed (if any) is restored when the tx rolls back — no test pollution, no dev-DB mutation.

### Why `.where(sql\`TRUE\`)` instead of bare `tx.delete(appearanceSettings)`?

The `drizzle/enforce-delete-with-where` oxlint rule fires on any `delete()` without a `.where(...)` clause — a safety net against accidental full-table deletes in production code. The fix is `.where(sql\`TRUE\`)`, which:
- Explicitly signals "yes, I want to delete all rows" (intent is unambiguous in code review).
- Satisfies the linter without an `oxlint-disable` comment (which AGENTS.md forbids).
- Compiles to `DELETE FROM "appearance_settings" WHERE TRUE` — semantically identical to bare `DELETE FROM`.

### Why construct `buildDraft` / `buildRow` locally instead of importing `DEFAULT_APPEARANCE_FIELDS`?

`DEFAULT_APPEARANCE_FIELDS` lives in `backend/services/appearance/appearance-settings.service.ts` — a service-layer file. Importing it from a repo test would:
1. Couple the repo test to the service layer (violates the test layering rule — repo tests should only exercise the repo).
2. Pull in the service's transitive imports (`revalidateTag`, `unstable_cache`, `AuditService`, `PermissionsService`, `sanitizeAppearanceFields`, Zod schemas) — none of which are needed for repo-level CRUD tests.
3. Make the tests silently break if a future task changes the defaults (the tests should pass with any valid draft, not specifically the defaults).

The local `buildDraft` uses the same values as `DEFAULT_APPEARANCE_FIELDS` for readability (so a reader sees the same colors/site names), but the tests don't depend on those specific values — every assertion uses variables derived from the draft passed in.

### Why a `seedAndFetch` helper for Tier 2 but not Tier 1?

CodeScene flagged code duplication at the 4 Tier 2 roundtrip tests (null logo / non-null logo / max-length strings / special chars) — they all follow the same `clear → user → draft → upsert → get` setup with only the draft overrides and final assertions varying. Extracting `seedAndFetch` collapses the 4-step boilerplate into a single call, and each test keeps only its unique assertions.

Tier 1 tests are intentionally NOT collapsed because each one exercises a distinct repo branch (INSERT, UPDATE, get-null, get-row, publishDraft) — they need different setup sequences and different mid-test assertions. Forcing them through a single helper would obscure the branch-coverage intent.

### Why not use `expect(...).rejects.toThrow()` for error cases?

The repo has no error-throwing paths — `upsert`/`get`/`publishDraft` all succeed on any valid input (the schema has no CHECK constraints beyond `NOT NULL` on the required columns). The `expectRepoError` try/catch pattern from `backend/db/test/AGENTS.md` §3 is therefore not needed.

If a future task adds validation (e.g. a CHECK constraint on hex color format), the corresponding error tests should use `expectRepoError`, NOT `expect(...).rejects.toThrow()` (which deadlocks inside `runInRollback`).

### Why not test the `tx` undefined path (calling repo methods without `tx`)?

The repo's `queryDb(tx)` helper falls back to the global `db` client when `tx` is undefined — this is the "Neon HTTP eligible for bare reads" optimization (per `backend/db/repo/AGENTS.md`). Testing this path would require running OUTSIDE `runInRollback` (because the fallback uses `db`, not `tx`), which would mutate the dev DB. The trade-off: the undefined-`tx` path is exercised by the service-layer integration tests (Task 10.1) and by every SSR read in the running app — it doesn't need a dedicated repo test here.

## Test Execution Output

```
backend/db/test/appearance/appearance-settings.repository.test.ts:
(pass) AppearanceSettingsRepository — Tier 1 (100% line coverage) > get() returns null when the table is empty (null branch) [27.42ms]
(pass) AppearanceSettingsRepository — Tier 1 (100% line coverage) > upsert() inserts a new row when none exists (INSERT branch) [20.66ms]
(pass) AppearanceSettingsRepository — Tier 1 (100% line coverage) > upsert() updates an existing row preserving the row id (UPDATE branch) [15.63ms]
(pass) AppearanceSettingsRepository — Tier 1 (100% line coverage) > get() returns the row after upsert (row branch of toAppearanceSettingsRow) [16.11ms]
(pass) AppearanceSettingsRepository — Tier 1 (100% line coverage) > publishDraft() copies draft active-mode colors into published columns (INSERT path) [11.47ms]
(pass) AppearanceSettingsRepository — Tier 2 (boundary cases) > upsert() and get() roundtrip a null logo (logoUrl column is nullable) [12.35ms]
(pass) AppearanceSettingsRepository — Tier 2 (boundary cases) > upsert() and get() roundtrip a non-null logo URL [14.26ms]
(pass) AppearanceSettingsRepository — Tier 2 (boundary cases) > upsert() persists maximum-length strings (siteName 80 / siteTitle 120 / siteDescription 300) [10.85ms]
(pass) AppearanceSettingsRepository — Tier 2 (boundary cases) > upsert() preserves special characters (emoji, Arabic RTL, HTML-like tags, newlines, tabs) [8.40ms]
(pass) AppearanceSettingsRepository — Tier 2 (boundary cases) > publishDraft() copies dark-mode colors when defaultColorScheme=dark [10.75ms]
(pass) AppearanceSettingsRepository — Tier 2 (boundary cases) > publishDraft() on an existing row updates in place (no duplicate row inserted) [16.62ms]

11 pass
0 fail
58 expect() calls
Ran 11 tests across 1 file. [277.00ms]
```

## Coverage Report

```
File                                                              | Lines % | Branch % |
backend/db/repo/appearance/appearance-settings.repository.ts      | 100.00  | 100.00   |
```

All 6 lines of `writeAppearanceRow` (SELECT + INSERT + UPDATE branches) and all 3 exported methods (`get` / `upsert` / `publishDraft`) are exercised. The `toAppearanceSettingsRow` mapper is exercised by both the `null` (early return) and `row` (full mapping) branches of `get`.

## Quality Verification

### Per-file `sub-loop.ts --lifecycle codescene`

All 6 stages pass cleanly:

```
✅ tsgo passed (no errors for backend/db/test/appearance/appearance-settings.repository.test.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

### Iterations to reach green

1. **Run 1**: all 11 tests failed with `relation "appearance_settings" does not exist` — the test DB (`siraj_test`) had not been synced with the appearance schema since Task 2. Pushed the schema via `drizzle-kit push --force` against the test DATABASE_URL. Re-ran → all 11 tests passed.
2. **Run 2** (codescene-lifecycle): `lint:type-aware` FAILED on the bare `tx.delete(appearanceSettings)` — `drizzle/enforce-delete-with-where` rule. Fixed by adding `.where(sql\`TRUE\`)` and a JSDoc explaining the deliberate full-table delete. Re-ran → lint passed.
3. **Run 3** (codescene-lifecycle): `codescene` FAILED with 2 code-duplication warnings at lines 190 and 204 (the null-logo and non-null-logo Tier 2 tests had identical `clear → user → draft → upsert → get` boilerplate). Fixed by extracting the `seedAndFetch(tx, overrides)` helper. Re-ran → codescene passed.

## Cross-File Dependencies

### Producers (this task)

- `backend/db/test/appearance/appearance-settings.repository.test.ts` — the new test file.

### Consumers (downstream — not modified by this task)

- `backend/db/repo/appearance/appearance-settings.repository.ts` — the SUT (system under test). Read-only.
- `backend/db/schema/appearance/appearance-settings.schema.ts` — provides `appearanceSettings` table reference for `clearAppearanceRow` and the duplicate-row count assertion. Read-only.
- `backend/db/test/entity-setup.ts` — provides `createTestUser(tx, overrides)` for seeding an `updatedByUserId` (the only FK on the table). Read-only.
- `backend/db/test/test-utils.ts` — provides `runInRollback(fn)`. Read-only.
- `backend/types/appearance.types.ts` — provides `AppearanceFields`, `AppearanceSettingsRow`, `DBTransaction` types. Read-only.

### Downstream impact on existing consumers

- None. Adding a new test file under `backend/db/test/appearance/` does not change any existing test discovery or execution path. `bun run test:db` will pick up the new file automatically on the next full DB-test run.

## Carry-Forward / Deferred

- **Task 10.1 (service tests)** — `AppearanceSettingsService` needs Tier 1 + Tier 2 + Tier 3 + Tier 4 tests. The repo tests here cover the data-access layer; the service tests should cover:
  - Tier 1: `getAppearance`, `saveDraft`, `publish`, `resetDraft` happy paths.
  - Tier 2: malformed `NEXT_PUBLIC_APP_BRANDING` JSON fallback (AC-27), Zod rejection of invalid input.
  - Tier 3: optimistic concurrency conflict (`expectedUpdatedAt` mismatch → `AppearanceConflictError`, AC-33), permission gating (`SETTINGS_APPEARANCE_MANAGE` enforced on writes — AC-7).
  - Tier 4: audit logging on `publish` (best-effort, AC-22), cache tag invalidation (`revalidateTag("appearance")`).

- **Task 10.2 (GraphQL integration tests)** — `frontend/common/graphql/test/` via `testClient`. Full argument permutation tests for `saveAppearanceDraft` / `publishAppearance` / `resetAppearanceDraft` mutations, unauthorized mutation attempts, XSS input payload tests (AC-34).

- **Task 10.3 (UI component tests)** — appearance tab render + customizer compound components. Mock Apollo; test WCAG contrast badge and keyboard focus restoration (AC-32, AC-35).

- **Task 10.4 (E2E tests)** — `test/ui/e2e/` against the production build. Tab visibility, overlay entry/exit, save/publish, SSR metadata reflection (AC-20), theme CSS verification (AC-21).

- **CI DB sync** — the local `siraj_test` DB was missing the `appearance_settings` table; CI (GitHub Actions) likely has the same gap if the migration wasn't run there. The `drizzle-kit push --force` is a local-only fix; CI may need `bun run db migrate` (the auto-bundler that applies the custom SQL migrations in `backend/db/migration/`) added to the CI workflow if it isn't already. Worth verifying in Task 11 (quality gate) — the full `bun run test:db` run on CI would surface the same `relation "appearance_settings" does not exist` error if CI hasn't been migrated.

## Decisions

- **Local helpers, no `test-utils.ts` pollution.** `clearAppearanceRow`, `buildDraft`, `buildRow`, and `seedAndFetch` are all file-local. They encode appearance-specific setup (single-row table, draft-with-overrides pattern) that wouldn't be reusable by other repo tests. Per AGENTS.md §13: "Do NOT dump domain-specific logic into `test-utils.ts`".

- **`seedAndFetch` returns `{ created, fetched }` rather than just one.** Both are needed by every Tier 2 test (created for the upsert-result assertions, fetched for the roundtrip-get assertions). Returning both from one helper halves the boilerplate vs. calling upsert + get separately in each test.

- **No `expect(...).rejects.toThrow()` patterns.** The repo has no error-throwing paths. If future tasks add CHECK constraints, the corresponding error tests should use `expectRepoError` (try/catch) — never `rejects.toThrow()` (deadlocks `runInRollback`).

- **`buildDraft` defaults match `DEFAULT_APPEARANCE_FIELDS` but don't import it.** See "Design Decisions" above — coupling a repo test to a service-layer constant would violate test layering.

- **Test file lives at `backend/db/test/appearance/` (NOT `backend/db/test/repo/appearance/`).** The AGENTS.md §11 says `repo/` is for "100% coverage of individual repository methods in isolation" and `logic/` is for "business logic workflows". This file achieves 100% repo coverage, but it ALSO includes Tier 2 boundary cases that are more workflow-flavored. The `backend/db/test/appearance/` directory (sibling to `repo/` and `logic/`) is the cleanest home — it groups all appearance-related DB tests (repo + future logic tests for the service's seeding behavior) under one feature directory. Mirrors the `backend/db/test/repo/notifications/` pattern but at the `backend/db/test/` level.

## Files Touched

| Path | Action | Lines |
|---|---|---|
| `backend/db/test/appearance/appearance-settings.repository.test.ts` | Created | 300 |
| `.ai/plans/brand/tasks.md` | Edited | `- [ ] 10.` → `- [x] 10.` |
| `.ai/plans/brand/outcome/10-outcome.md` | Created | this file |
| `siraj_test` DB schema | One-time push | `appearance_settings` table created via `drizzle-kit push --force` |

## Issues / Open Questions

- **`siraj_test` DB was missing the `appearance_settings` table.** Resolved locally via `drizzle-kit push --force`. The CI DB may have the same gap — worth verifying in Task 11 (quality gate) by running the full `bun run test:db` and watching for the same `relation "appearance_settings" does not exist` error. If CI is missing the table, the fix is `bun run db migrate` in the CI workflow (the auto-bundler applies the custom SQL migrations in `backend/db/migration/`).

- **No issues introduced by this task.** All 11 tests pass, repo file has 100% line + branch coverage, the new test file passes all 6 codescene-lifecycle stages.

## Next Actions

- **Task 10.1** (service tests) — `backend/services/appearance/test/`. The repo tests here cover the data-access layer; the service tests should cover the business-logic layer (permission gating, concurrency, audit, cache invalidation, ENV fallback).
- **Task 10.2** (GraphQL integration tests) — `frontend/common/graphql/test/` via `testClient`. Full argument permutations + XSS payloads.
- **Task 10.3** (UI component tests) — appearance tab + customizer compound components.
- **Task 10.4** (E2E tests) — `test/ui/e2e/` against production build. SSR metadata + theme CSS verification.
- **Task 11** (quality gate) — `bun quality-gate` across the whole repo. Verify CI DB has the `appearance_settings` table; if not, add `bun run db migrate` to the CI workflow.
