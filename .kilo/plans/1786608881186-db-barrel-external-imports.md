# Plan: Shorten all external `@/backend/db/...` imports to sub-module level

## Goal

Convert all imports **outside** the `backend/db/` module from deep paths (e.g. `@/backend/db/repo/users/user.repository`, `@/backend/db/schema/auth/impersonation`, `@/backend/db/test/entity-setup`) to their shortest sub-module path (`@/backend/db/repo/users`, `@/backend/db/schema`, `@/backend/db/test`). The root `@/backend/db` barrel stays unchanged — we do NOT add `repo/`, `schema/`, or `test/` to it.

## Scope

- **102 external files** need conversion (deep paths → sub-module shortest)
- **161 external files** already at shortest sub-module path (no change needed)
- **NOT touching**: any imports *inside* `backend/db/` (the db module's internal import structure stays unchanged)
- **NOT touching**: the root `backend/db/index.ts` barrel (stays with 6 top-level module exports)

## Why not `@/backend/db` for everything?

Adding `repo/` to the root `@/backend/db` barrel creates a runtime circular dependency: `@/backend/db` → `repo/scheduling/shared.ts` → `@/backend/services` → `@/backend/db`. 5 repo files import from `@/backend/services` and 2 from `@/backend/lib`. These are pre-existing architectural violations (repo should not import from services). The circular dep already exists when loading `@/backend/db/repo/scheduling` directly, but adding `repo/` to the root barrel would trigger it for ALL `@/backend/db` consumers — too risky. So we shorten to sub-module level only.

## Conversion Mapping

| Current path | New path | Barrel change needed? |
|---|---|---|
| `@/backend/db/schema` | `@/backend/db/schema` | No (already shortest) |
| `@/backend/db/schema/<subdir>/<file>` | `@/backend/db/schema` | No (schema barrel already re-exports all) |
| `@/backend/db/repo/<subdir>` | `@/backend/db/repo/<subdir>` | No (already shortest) |
| `@/backend/db/repo/<subdir>/<file>.repository` | `@/backend/db/repo/<subdir>` | Yes — 6 missing `export *` lines in subdir barrels |
| `@/backend/db/repo/fx-sync.repository` | `@/backend/db/repo` | Yes — create `repo/index.ts` |
| `@/backend/db/repo/scheduling/queries` | `@/backend/db/repo/scheduling` | Yes — add `export * from "./queries"` to scheduling barrel |
| `@/backend/db/repo/scheduling/shared` | `@/backend/db/repo/scheduling` | Yes — add `export * from "./shared"` to scheduling barrel |
| `@/backend/db/test/entity-setup` | `@/backend/db/test` | Yes — create `test/index.ts` |
| `@/backend/db/test/test-utils` | `@/backend/db/test` | Yes — covered by `test/index.ts` |
| `@/backend/db/drizzleDb` | `@/backend/db` | No (already in root barrel) |
| `@/backend/db/drizzleRelations` | `@/backend/db` | No (already in root barrel) |
| `@/backend/db/factory` | `@/backend/db` | No (already in root barrel) |
| `@/backend/db/query.extensions` | `@/backend/db` | No (already in root barrel) |

## Phase 1: Barrel changes (5 files)

### 1a. Add 6 missing `export *` lines to existing repo subdir barrels

**`backend/db/repo/scheduling/index.ts`** — add:
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

**Collision check**: Verified zero collisions for all 6 missing files + `queries.ts` + `shared.ts` against existing barrel exports.

**Note on `scheduling/index.ts`**: This barrel already has `import` statements and builds a `SchedulingRepository` aggregate object (pre-existing, not a pure barrel). We only ADD `export *` lines — we do NOT refactor the existing imports or aggregate object. The `export * from "./queries"` and `export * from "./shared"` lines bring in `StatusTrackingRow`, `DBTransaction`, `getWeeklyScheduleGrid`, `getWeeklyWorkloadMetrics`, `resolveStudentTimezone`, etc. — all needed by external files currently importing from `@/backend/db/repo/scheduling/queries` and `@/backend/db/repo/scheduling/shared`.

### 1b. Create `backend/db/repo/index.ts` (MISSING)

Create with `export *` from every subdir + the top-level `fx-sync.repository.ts`:
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

**Circular dependency note**: `repo/index.ts` re-exports `scheduling/` which imports from `@/backend/services` (via `shared.ts`). This circular dep ALREADY EXISTS today when loading `@/backend/db/repo/scheduling` directly. Creating `repo/index.ts` makes `@/backend/db/repo` load ALL subdirs at once, but each subdir's circular deps already work individually. Only 2 external files import `@/backend/db/repo/fx-sync.repository` — they will switch to `@/backend/db/repo`. The `repo/index.ts` barrel is NOT added to the root `@/backend/db` barrel.

### 1c. Create `backend/db/test/index.ts` (MISSING)

```typescript
export * from "./entity-setup";
export * from "./test-utils";
```

**Do NOT include** `const.ts`, `ensure-env.ts`, `logger-mock.ts`, `connection-strategy.test.ts`, `http-client.test.ts` — not imported externally.

**No circular dependency**: Both test helpers import only from `@/backend/db/drizzleDb`, `@/backend/db/schema`, `@/backend/enum`, `@/backend/types` — none import from services/lib.

## Phase 2: Convert 102 external files

Convert all deep-path `@/backend/db/...` imports to their shortest sub-module path in 102 files outside `backend/db/`.

### Files to PRESERVE (do NOT convert):

1. **Dynamic `import()` calls** (2 files — NOT in conversion list, but listed for safety):
   - `test/integration/db/query-db.integration.test.ts`: `await import("@/backend/db/drizzleRelations")` — preserve
   - `scripts/dbActions/envFile.ts`: `import("@/backend/db/drizzleDb")` in a JSDoc comment — preserve

2. **Inline `import()` type annotations** (1 file IN conversion list):
   - `backend/services/system/system-rules.service.ts`: `typeof import("@/backend/db/drizzleDb").db.transaction` — PRESERVE this inline `import()`. Only convert the `import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository"` line.

3. **Inline `import()` type annotations** (1 file NOT in conversion list):
   - `backend/types/parents/parent.types.ts`: `typeof import("@/backend/db/schema").parents.$inferSelect` and `.parents.$inferInsert` — already at `@/backend/db/schema` (shortest schema path), no conversion needed.

### Merge rules:

- If a file has both `import { X } from "@/backend/db/repo/users/user.repository"` and `import { Y } from "@/backend/db/repo/users"`, convert the first to `@/backend/db/repo/users` and merge into the second: `import { X, Y } from "@/backend/db/repo/users"`
- If a file has `import { X } from "@/backend/db/drizzleDb"` and `import type { Y } from "@/backend/db/schema"`, both are already shortest (`@/backend/db` and `@/backend/db/schema` respectively) — no change needed
- Do NOT merge `import * as` namespace imports with named imports
- Do NOT merge `import type * as` with named imports
- `import type` and value `import` from the SAME sub-module path can be merged into `import { X, type Y } from "..."` (per `import-x/no-duplicates` with `preferInline: false`)

### Execution strategy: parallel subagents

Split the 102 files into ~4 batches by directory prefix:
1. `backend/types/` (~15 files) — schema deep paths → `@/backend/db/schema`
2. `backend/services/` part 1 (~35 files) — repo file-level → subdir, scheduling/queries/shared → scheduling
3. `backend/services/` part 2 (~35 files) — repo file-level → subdir, test helpers → test
4. `backend/graphql/`, `backend/lib/`, `backend/storage/`, `backend/utils/`, `app/`, `scripts/`, `test/` (~17 files) — mixed

Each subagent:
- Reads the file
- Identifies all `from "@/backend/db/..."` imports deeper than sub-module level
- Converts each to the shortest sub-module path
- Merges with existing same-path imports if present
- Preserves dynamic `import()` and inline `import()` type annotations
- Preserves `import * as` namespace imports (convert path only, keep namespace form)

## Phase 3: Validation

1. **tsgo** — `bun tsgo` — verify no type errors from barrel changes or import conversion
2. **oxlint** — `./node_modules/.bin/oxlint` — verify no lint errors
3. **biome** — `bun biome:check` — verify formatting
4. **lint** — `bun run lint` — verify ESLint (including `import-x/no-duplicates`, `import-x/export`)
5. **lint:type-aware** — `bun lint:type-aware` — verify type-aware ESLint rules
6. **Tests** — run representative test suites:
   - `bun run test:services` — backend services tests
   - `bun run test:db` — database repository tests
   - Verify no new failures beyond pre-existing ones (meeting-config 2 failures + cron 1 failure are pre-existing)

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `repo/index.ts` circular dep with services | Circular dep ALREADY EXISTS today via `scheduling/index.ts` → `shared.ts` → `@/backend/services`. Creating `repo/index.ts` doesn't add a new cycle — it just loads existing subdirs together. Only 2 files import `@/backend/db/repo` (for `FxSyncRepository`). |
| Export name collisions in subdir barrels | Static analysis verified zero collisions for all 6 missing files + `queries.ts` + `shared.ts` |
| `scheduling/index.ts` has `import` statements (barrel convention violation) | Leave as-is — pre-existing aggregate barrel with runtime logic. Only ADD `export *` lines. |
| `import-x/no-duplicates` false positives | Type+value from same module is NOT a duplicate per `preferInline: false`. Merge only when both resolve to same path. |
| Dynamic `import()` accidentally converted | Explicitly listed files to preserve. Subagents instructed to skip `import()` calls. |
| Inline `import()` type annotations accidentally converted | `system-rules.service.ts` explicitly flagged. Subagents instructed to skip inline `import()`. |

## Files Modified

### db module barrels (5 files):
1. `backend/db/repo/index.ts` — CREATE with 19 `export *` lines
2. `backend/db/repo/scheduling/index.ts` — add 4 `export *` lines (leave-quota-usage, leave-request, queries, shared)
3. `backend/db/repo/students/index.ts` — add 2 `export *` lines (student-progress, student-status-history)
4. `backend/db/repo/teachers/index.ts` — add 2 `export *` lines (teacher-availability-bootstrap, teacher-payment)
5. `backend/db/test/index.ts` — CREATE with 2 `export *` lines (entity-setup, test-utils)

### External files (102 files):
All files listed in `/tmp/kilo/db-convert-files.txt` — convert deep-path `@/backend/db/...` imports to shortest sub-module path.

### Files NOT modified:
- `backend/db/index.ts` (root barrel — stays unchanged)
- All files inside `backend/db/` (except the 5 barrels above)
- 161 external files already at shortest sub-module path
- Dynamic `import()` and inline `import()` type annotations (preserved)

## Execution Order

1. Phase 1a: Add missing `export *` lines to scheduling, students, teachers barrels
2. Phase 1b: Create `backend/db/repo/index.ts`
3. Phase 1c: Create `backend/db/test/index.ts`
4. Validate Phase 1: `bun tsgo` (verify barrel changes don't break types)
5. Phase 2: Convert 102 external files in 4 parallel subagent batches
6. Phase 3: Full validation (tsgo, oxlint, biome, lint, lint:type-aware, tests)
