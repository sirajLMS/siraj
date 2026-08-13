# Plan: Shorten all internal `@/backend/db/...` imports to sub-module level

## Goal

Convert all imports **inside** the `backend/db/` module from deep paths (e.g. `@/backend/db/schema/users/users`, `@/backend/db/repo/shared/soft-delete.repository`, `@/backend/db/test/entity-setup`) to their shortest sub-module path (`@/backend/db/schema`, `@/backend/db/repo/shared`, `@/backend/db/test`). Relative imports (`./`, `../`) are prohibited outside `index.ts` barrels — all non-barrel files must use `@/` path aliases.

## Scope

- **226 internal files** need conversion (deep paths + top-level file paths → sub-module shortest)
- **NOT touching**: same-subdir imports (circular dependency — see below)
- **NOT touching**: the root `backend/db/index.ts` barrel
- **NOT touching**: top-level db files importing from other top-level db files (circular dep with root barrel)

## Circular Dependency Rule (CRITICAL)

A file that is re-exported by a barrel **CANNOT** import from that barrel — it would create a circular dependency. This means:

| File location | Cannot import from | Reason |
|---|---|---|
| Top-level db files (`drizzleDb.ts`, `factory.ts`, etc.) | `@/backend/db` (root barrel) | Root barrel re-exports them |
| `schema/<subdir>/<file>.ts` | `@/backend/db/schema` | Schema barrel re-exports all schema files |
| `repo/<subdir>/<file>.ts` | `@/backend/db/repo/<same-subdir>` | Subdir barrel re-exports all files in that subdir |
| `seeds/<subdir>/<file>.ts` | `@/backend/db/seeds/<same-subdir>` | Subdir barrel re-exports all files in that subdir |
| `scripts/<file>.ts` | `@/backend/db/scripts` (if barrel existed) | Scripts barrel would re-export them |
| `test/<file>.ts` (if in barrel) | `@/backend/db/test` | Test barrel re-exports them |

**Same-subdir imports MUST stay as deep `@/backend/db/...` paths** — they cannot use relative imports (prohibited) and cannot use the subdir barrel (circular dep).

### Same-subdir imports that CANNOT be shortened (exhaustive list)

**Schema same-subdir** (27 import statements across ~20 files):
- `schema/billing/*.ts` → `schema/billing/*` (billing→billing: user-payment-methods, billing, quotas, __shared__/supportedPaymentMethodBase)
- `schema/classes/*.ts` → `schema/classes/*` (class-subject→class-category, group-class→scheduling, lesson-reports→scheduling, scheduling→class-subject, subject-resource→class-subject)
- `schema/meeting/*.ts` → `schema/meeting/*` (class-meeting-configs→__shared__/*, user-meeting-configs→__shared__/*, __shared__/meeting-config-columns→meeting-providers)
- `schema/storage/__shared__/*` → `schema/storage/storage`
- `schema/teachers/*.ts` → `schema/teachers/*` (teacher-availability→teachers, teacher-dues→teacher-payments/teachers, teacher-notes→teachers, teacher-payments→teachers)

**Repo same-subdir** (24 import statements across ~15 files):
- `repo/billing/*.ts` → `repo/billing/*` (quota.repository→quota-ledger.repository, supported-*-wallet→__shared__/billingRepoFactory, __shared__/billingRepoFactory→__shared__/directionFilter)
- `repo/classes/*.ts` → `repo/classes/shared/runInClassTransaction`
- `repo/meeting/*.ts` → `repo/meeting/*` (class-meeting-config→__shared__/meetingConfigRepoHelpers, upsert-utils; user-meeting-config→same)
- `repo/scheduling/*.ts` → `repo/scheduling/*` (class-instances→class-instance-upsert, shared, state-changes; queries→scheduling-queries.repository; recurring→shared; state-changes→scheduling-queries.repository, shared)
- `repo/scheduling/scheduling-queries.repository/*.ts` → `repo/scheduling/scheduling-queries.repository/*.utils` (daily-schedule→daily-schedule.utils, etc.)

**Seeds same-subdir** (25 import statements across ~15 files):
- `seeds/lib/*.ts` → `seeds/lib/*` (all lib factory files import from each other: faker-client, seed-config, date-window, etc.)

**Scripts same-subdir** (6 import statements across 4 files):
- `scripts/*.ts` → `scripts/*` (migrate→applyCustomMigrations, ensureIdempotentMigrations, runDrizzleMigrations; resetDb→migrate; ensureMigrationsBeforeSeed→migrate; runDrizzleMigrations→ensureIdempotentMigrations)

**Test same-subdir** (2 import statements):
- `test/repo/scheduling/scheduling-test-helpers.ts` is imported by 2 test files via deep path — would need `test/repo/index.ts` + `test/repo/scheduling/index.ts` barrel chain (too complex for 2 consumers, violates "max one `/` per path" rule). **Leave as deep path.**

## Conversion Mapping

| Current path | New path | Condition |
|---|---|---|
| `@/backend/db/schema/<subdir>/<file>` | `@/backend/db/schema` | Importing file is NOT in `schema/` |
| `@/backend/db/repo/<subdir>/<file>` | `@/backend/db/repo/<subdir>` | Importing file is NOT in `repo/<same-subdir>/` |
| `@/backend/db/repo/fx-sync.repository` | `@/backend/db/repo` | Importing file is NOT in `repo/` (needs `repo/index.ts`) |
| `@/backend/db/seeds/<subdir>/<file>` | `@/backend/db/seeds/<subdir>` | Importing file is NOT in `seeds/<same-subdir>/` |
| `@/backend/db/seeds/index` | `@/backend/db/seeds` | Always (root barrel) |
| `@/backend/db/seeds/lib/<file>` | `@/backend/db/seeds/lib` | Importing file is NOT in `seeds/lib/` |
| `@/backend/db/test/<file>` | `@/backend/db/test` | Importing file is NOT re-exported by test barrel (needs `test/index.ts`) |
| `@/backend/db/drizzleDb` | `@/backend/db` | Importing file is NOT a top-level db file |
| `@/backend/db/factory` | `@/backend/db` | Importing file is NOT a top-level db file |
| `@/backend/db/connection-strategy` | `@/backend/db` | Importing file is NOT a top-level db file |
| `@/backend/db/http-client` | `@/backend/db` | Importing file is NOT a top-level db file |
| `@/backend/db/drizzleRelations` | `@/backend/db` | Importing file is NOT a top-level db file |
| `@/backend/db/query.extensions` | `@/backend/db` | Importing file is NOT a top-level db file |

**Note**: Top-level db files (`drizzleDb.ts`, `factory.ts`, `connection-strategy.ts`, `http-client.ts`, `drizzleRelations.ts`) import from each other via `@/backend/db/<file>` — these CANNOT be shortened to `@/backend/db` (root barrel re-exports them = circular dep). They stay as-is.

## Phase 1: Barrel changes (5 files)

### 1a. Create `backend/db/test/index.ts` (MISSING)

```typescript
export * from "./const";
export * from "./entity-setup";
export * from "./test-utils";
```

**Circular dep check**: `const.ts` has no db imports. `test-utils.ts` imports from `@/backend/db/drizzleDb` and `@/backend/db/schema` (not from test barrel). `entity-setup.ts` imports from `@/backend/db/drizzleDb` and `@/backend/db/schema` (not from test barrel). **No circular dep.**

**Do NOT include** `repo/scheduling/scheduling-test-helpers` — it's in `test/repo/scheduling/` and would need a deep barrel chain (violates "max one `/` per path" rule). Its 2 consumers stay as deep paths.

### 1b. Create `backend/db/seeds/meeting/index.ts` (MISSING)

```typescript
export { seedOrGet as seedOrGetClassMeetingConfigs } from "./seed-class-meeting-configs";
export { seedOrGet as seedOrGetMeetingProviders } from "./seed-meeting-providers";
export { seedOrGet as seedOrGetUserMeetingConfigs } from "./seed-user-meeting-configs";
```

Follows the existing seeds subdir barrel pattern (named re-exports with `seedOrGet as` aliases).

### 1c. Add 3 missing `export *` to `backend/db/seeds/lib/index.ts`

```typescript
export * from "./currency-catalog-factory";
export * from "./meeting-provider-factory";
export * from "./payment-catalog-factory";
```

**Collision check**: Verified zero export name collisions across all seeds/lib files.

### 1d. Add `export * from "./class-instance-upsert"` to `backend/db/repo/scheduling/index.ts`

Needed for `backend/db/test/logic/scheduling/seed-class-instance-upsert.test.ts` which imports `upsertSeedClassInstance` from `@/backend/db/repo/scheduling/class-instance-upsert`.

**Circular dep check**: `class-instance-upsert.ts` imports only from `@/backend/db/drizzleDb` and `@/backend/db/schema` — no dep on scheduling barrel. **Safe.**

### 1e. Create `backend/db/repo/index.ts` (MISSING) — shared with external plan

```typescript
export * from "./audit";
export * from "./auth";
export * from "./billing";
export * from "./books";
export * from "./classes";
export * from "./complaints";
export * from "./cron";
export * from "./fx-sync.repository";
export * from "./meeting";
export * from "./notifications";
export * from "./parents";
export * from "./permissions";
export * from "./scheduling";
export * from "./shared";
export * from "./storage";
export * from "./students";
export * from "./teachers";
export * from "./users";
export * from "./whatsapp";
```

Needed for `backend/db/test/repo/billing/fx-sync.repository.test.ts` which imports `FxSyncRepository` from `@/backend/db/repo/fx-sync.repository` → `@/backend/db/repo`.

**Circular dep note**: See external plan for full analysis. The circular dep already exists via `scheduling/index.ts` → `shared.ts` → `@/backend/services`. Only 1 internal file imports from `@/backend/db/repo` (the fx-sync test file).

### 1f. Add missing `export *` lines to existing repo subdir barrels — shared with external plan

**`backend/db/repo/scheduling/index.ts`** — add (in addition to 1d above):
```typescript
export * from "./leave-quota-usage.repository";
export * from "./leave-request.repository";
export * from "./queries";
export * from "./shared";
```

**`backend/db/repo/students/index.ts`** — add:
```typescript
export * from "./student-progress.repository";
export * from "./student-status-history.repository";
```

**`backend/db/repo/teachers/index.ts`** — add:
```typescript
export * from "./teacher-availability-bootstrap.repository";
export * from "./teacher-payment.repository";
```

**Collision check**: Verified zero collisions (same as external plan).

## Phase 2: Convert 226 internal files

### Conversion categories:

**Category 0: Top-level db file imports → `@/backend/db`** (94 files)
- Internal files (NOT top-level db files themselves) importing from `@/backend/db/drizzleDb`, `@/backend/db/query.extensions`, `@/backend/db/factory`, `@/backend/db/connection-strategy`, `@/backend/db/http-client`, `@/backend/db/drizzleRelations`
- These → `@/backend/db` (root barrel already re-exports all top-level files)
- `drizzleDb`: 93 files, `query.extensions`: 8 files, `connection-strategy`: 1 file, `http-client`: 1 file
- If file already imports from `@/backend/db`, merge the symbols into one import statement
- `@/backend/db/schema` stays as-is (root barrel does NOT export schema)

**Category 1: Non-schema files importing schema deep paths → `@/backend/db/schema`** (17 files)
- `repo/**/*.ts`, `seeds/**/*.ts`, `test/**/*.ts`, `scripts/**/*.ts` importing from `@/backend/db/schema/<subdir>/<file>`
- All schema deep paths → `@/backend/db/schema` (schema barrel already complete with 26 `export *` lines)

**Category 2: Non-repo files importing repo deep paths → `@/backend/db/repo/<subdir>`** (68 files)
- `test/**/*.ts`, `seeds/**/*.ts`, `scripts/**/*.ts` importing from `@/backend/db/repo/<subdir>/<file>`
- Deep paths → `@/backend/db/repo/<subdir>` (subdir barrels, after Phase 1f additions)
- `@/backend/db/repo/fx-sync.repository` → `@/backend/db/repo` (after Phase 1e)

**Category 3: Repo cross-subdir deep paths → `@/backend/db/repo/<other-subdir>`** (13 files)
- `repo/<subdirA>/*.ts` importing from `@/backend/db/repo/<subdirB>/<file>` where A ≠ B
- 6 unique cross-subdir imports: `audit/audit.repository`, `shared/bulk-upsert`, `shared/soft-delete.repository`, `shared/system-settings.repository`, `teachers/teacher-availability.repository`, `users/user.repository`

**Category 4: Seeds cross-subdir deep paths → `@/backend/db/seeds/<other-subdir>`** (15 files)
- `seeds/<subdirA>/*.ts` importing from `@/backend/db/seeds/<subdirB>/<file>` where A ≠ B
- `seeds/index.ts` (root barrel) importing from `@/backend/db/seeds/<subdir>/<file>` — 62 imports → `@/backend/db/seeds/<subdir>` (using subdir barrel's aliased export names)
- `seeds/meeting/*.ts` files importing from other seeds subdirs (after Phase 1b creates meeting barrel)

**Category 5: Test deep paths → `@/backend/db/test`** (86 files)
- `test/**/*.ts` importing from `@/backend/db/test/entity-setup`, `@/backend/db/test/test-utils`, `@/backend/db/test/const`
- After Phase 1a creates `test/index.ts`, these → `@/backend/db/test`
- `test/repo/scheduling/scheduling-test-helpers` stays as deep path (no barrel chain)

**Category 6: Seeds/lib deep paths from non-lib files → `@/backend/db/seeds/lib`** (16 files)
- `seeds/<non-lib>/*.ts` and `scripts/*.ts` importing from `@/backend/db/seeds/lib/<file>`
- After Phase 1c adds 3 missing exports, all needed symbols are in `seeds/lib` barrel

**Category 7: `seeds/index` import → `@/backend/db/seeds`** (1 file)
- `scripts/drizzleSeed.ts`: `from "@/backend/db/seeds/index"` → `from "@/backend/db/seeds"`

### Special case: `seeds/index.ts` conversion

The root seeds barrel (`seeds/index.ts`) has 62 imports from `@/backend/db/seeds/<subdir>/<file>` using the pattern:
```typescript
import { seedOrGet as seedOrGetX } from "@/backend/db/seeds/<subdir>/<file>";
```

After conversion, these become:
```typescript
import { seedOrGetX } from "@/backend/db/seeds/<subdir>";
```

The subdir barrels already export `seedOrGet as seedOrGetX` (aliased), so the root barrel imports the aliased name directly. This changes the import syntax but preserves the same runtime behavior.

**Example**:
- Before: `import { seedOrGet as seedOrGetSupportedCurrencies } from "@/backend/db/seeds/billing/seed-currencies";`
- After: `import { seedOrGetSupportedCurrencies } from "@/backend/db/seeds/billing";`

The `runSeedStep` import from `seeds/lib/run-seed-step` → `seeds/lib` follows the same pattern (lib barrel already exports it via `export *`).

### Merge rules:

- If a file has both `import { X } from "@/backend/db/repo/users/user.repository"` and `import { Y } from "@/backend/db/repo/users"`, convert the first to `@/backend/db/repo/users` and merge: `import { X, Y } from "@/backend/db/repo/users"`
- If a file has `import { db } from "@/backend/db/drizzleDb"` and `import { Z } from "@/backend/db"`, convert the first to `@/backend/db` and merge: `import { db, Z } from "@/backend/db"` (50 files need this merge)
- `import type` and value `import` from the SAME sub-module path can be merged into `import { X, type Y } from "..."` (per `import-x/no-duplicates` with `preferInline: false`)
- Do NOT merge `import * as` namespace imports with named imports
- Do NOT merge `import type * as` with named imports
- `@/backend/db` and `@/backend/db/schema` are DIFFERENT modules — never merge them

### Files to PRESERVE (do NOT convert):

1. **Same-subdir imports** — all listed in the "Same-subdir imports that CANNOT be shortened" section above
2. **Top-level db file cross-imports** — `drizzleDb.ts`, `factory.ts`, `connection-strategy.ts`, `http-client.ts`, `drizzleRelations.ts` importing from each other via `@/backend/db/<file>` (circular dep with root barrel)
3. **`test/repo/scheduling/scheduling-test-helpers`** — deep path stays (no barrel chain)
4. **Dynamic `import()` calls** — preserve (if any exist in internal files)
5. **Inline `import()` type annotations** — preserve

### Execution strategy: parallel subagents

Split the 226 files into ~5 batches by category:
0. Top-level file imports (`drizzleDb`, `query.extensions`, etc.) → `@/backend/db` (94 files — can be merged with other batches)
1. `backend/db/repo/` cross-subdir + `backend/db/repo/` non-repo-files (13 + part of 68 = ~30 files)
2. `backend/db/test/` (86 files — largest batch, split into 2 sub-batches)
3. `backend/db/test/` part 2 (~43 files)
4. `backend/db/seeds/` (15 files + `seeds/index.ts` 62-import refactor)
5. `backend/db/scripts/` + `backend/db/schema/` non-schema importers (~17 files)

Each subagent:
- Reads the file
- Identifies all `from "@/backend/db/..."` imports deeper than sub-module level
- Checks if the import is same-subdir (SKIP — cannot shorten) or cross-subdir/cross-module (CONVERT)
- Converts cross-subdir/cross-module imports to shortest sub-module path
- Merges with existing same-path imports if present
- Preserves same-subdir imports, dynamic `import()`, inline `import()` type annotations
- Preserves `import * as` namespace imports (convert path only, keep namespace form)

## Phase 3: Validation

1. **tsgo** — `bun tsgo` — verify no type errors from barrel changes or import conversion
2. **oxlint** — `./node_modules/.bin/oxlint` — verify no lint errors
3. **biome** — `bun biome:check` — verify formatting
4. **lint** — `bun run lint` — verify ESLint (including `import-x/no-duplicates`, `import-x/export`)
5. **lint:type-aware** — `bun lint:type-aware` — verify type-aware ESLint rules
6. **Tests** — run representative test suites:
   - `bun run test:db` — database repository tests
   - `bun run test:db:sequential` — if parallel tests have issues
   - Verify no new failures beyond pre-existing ones (meeting-config 2 failures + cron 1 failure are pre-existing)

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Same-subdir import accidentally shortened (circular dep) | Exhaustive list of same-subdir imports documented. Subagents instructed to check file's subdir vs import's subdir before converting. |
| `seeds/index.ts` import pattern change (alias syntax) | Subdir barrels already export aliased names. Root barrel imports the alias directly. Verified pattern works. |
| `test/index.ts` circular dep with test files | `const.ts`, `test-utils.ts`, `entity-setup.ts` have no imports from test barrel. Verified safe. |
| `repo/index.ts` circular dep with services | Same as external plan — circular dep already exists via scheduling. Only 1 internal file uses `@/backend/db/repo`. |
| `seeds/meeting/index.ts` missing barrel | Created in Phase 1b with same pattern as other seed subdir barrels. |
| `seeds/lib` missing 3 exports | Added in Phase 1c. Collision check passed. |
| `import-x/no-duplicates` false positives | Type+value from same module is NOT a duplicate per `preferInline: false`. Merge only when both resolve to same path. |

## Files Modified

### db module barrels (8 files):
1. `backend/db/test/index.ts` — CREATE with 3 `export *` lines (const, entity-setup, test-utils)
2. `backend/db/seeds/meeting/index.ts` — CREATE with 3 named re-exports
3. `backend/db/seeds/lib/index.ts` — add 3 `export *` lines (currency-catalog-factory, meeting-provider-factory, payment-catalog-factory)
4. `backend/db/repo/scheduling/index.ts` — add 5 `export *` lines (class-instance-upsert, leave-quota-usage, leave-request, queries, shared)
5. `backend/db/repo/students/index.ts` — add 2 `export *` lines (student-progress, student-status-history)
6. `backend/db/repo/teachers/index.ts` — add 2 `export *` lines (teacher-availability-bootstrap, teacher-payment)
7. `backend/db/repo/index.ts` — CREATE with 19 `export *` lines (shared with external plan)
8. `backend/db/seeds/index.ts` — refactor 62 imports from deep paths to subdir barrels

### Internal files (226 files):
All files in `.kilo/plans/db-internal-convert-files.txt` — convert deep-path and top-level-file `@/backend/db/...` imports to shortest sub-module path, excluding same-subdir imports.

### Files NOT modified:
- `backend/db/index.ts` (root barrel — stays unchanged)
- Same-subdir imports (all listed above — stay as deep paths)
- Top-level db file cross-imports (circular dep with root barrel)
- `test/repo/scheduling/scheduling-test-helpers` deep path (no barrel chain)
- Dynamic `import()` and inline `import()` type annotations (preserved)

## Execution Order

1. Phase 1a: Create `backend/db/test/index.ts`
2. Phase 1b: Create `backend/db/seeds/meeting/index.ts`
3. Phase 1c: Add 3 missing exports to `backend/db/seeds/lib/index.ts`
4. Phase 1d: Add `export * from "./class-instance-upsert"` to scheduling barrel
5. Phase 1e: Create `backend/db/repo/index.ts` (shared with external plan)
6. Phase 1f: Add missing `export *` lines to scheduling, students, teachers barrels (shared with external plan)
7. Validate Phase 1: `bun tsgo` (verify barrel changes don't break types)
8. Phase 2: Convert 226 internal files in 5 parallel subagent batches
9. Phase 3: Full validation (tsgo, oxlint, biome, lint, lint:type-aware, tests)

## Relationship to External Plan

This plan shares barrel changes with the external plan (`.kilo/plans/1786608881186-db-barrel-external-imports.md`):
- `repo/index.ts` creation (Phase 1e) — shared
- `repo/scheduling/index.ts` additions (Phase 1f + 1d) — shared (external adds 4, internal adds 1 more)
- `repo/students/index.ts` additions (Phase 1f) — shared
- `repo/teachers/index.ts` additions (Phase 1f) — shared
- `test/index.ts` creation (Phase 1a) — shared (external plan also creates this)

If both plans are executed, the barrel changes should be done once (union of all additions), then both sets of file conversions can proceed in parallel.
