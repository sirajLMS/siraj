# Backend Types Barrel: `export *` + Shortest-Path Import Conversion

## Goal
Convert all `@/backend/types/<subdir>/<file>` long-path imports (outside AND inside `backend/types/`) to the shortest path `@/backend/types`. Fix barrel compliance so the root barrel re-exports everything via `export *`.

## Scope
- **210 files** with long-path `from "@/backend/types/..."` imports:
  - 182 files **outside** `backend/types/` (backend/db, backend/graphql, backend/lib, backend/services, scripts)
  - 28 files **inside** `backend/types/` (cross-domain `import type` only — no runtime value imports)
- **4 files** with `export { ... }` or `export type { ... }` re-exports from long types paths (also in the 210 count)
- **3 files** with dynamic `import("@/backend/types/cron/cron.types")` — **NOT converted** (keep deep paths)
- **2 files** with inline `import("@/backend/types/cron/cron.types")` type annotations — **NOT converted** (type expressions, not import statements)

## Phase 1: Fix Barrel Compliance

### 1a. Add 4 missing type files to their barrels
- `backend/types/billing/index.ts`: add `export * from "./currency.types";`
- `backend/types/profile/index.ts`: add `export * from "./profile-field-manifest";` (exports runtime values: `PROFILE_FIELD_GROUPS`, `PROFILE_FIELD_GROUP_BY_KEY`, `getProfileViewPermission`, `getProfileEditPermission` + types)
- `backend/types/scheduling/index.ts`: add `export * from "./class-status-event.types";`
- `backend/types/storage/index.ts`: add `export * from "./site-content.types";`

### 1b. Convert `export type { }` → `export *` in 2 barrels
- `backend/types/meeting/index.ts`: replace the `export type { MeetingConfigBaseInsertType, ... } from "./meeting-config-base.types"` block with `export * from "./meeting-config-base.types";`
  - **No collision**: `MeetingConfigBase*` types are only defined in `meeting-config-base.types.ts`; the other two files only *import* them, not re-export.
- `backend/types/scheduling/index.ts`: replace the `export type { AdminDashboardScheduleReturnType, ... } from "./schedule.types"` block with `export * from "./schedule.types";`
  - **No collision**: all 15 types are defined only in `schedule.types.ts`.

### 1c. Verify root barrel
- `backend/types/index.ts` already exports all 26 subdirs via `export *` — no changes needed.
- Run `bun tsgo` to verify zero export name collisions after Phase 1.

## Phase 2: Convert 210 Files to Shortest-Path Imports

### Conversion rules
1. Replace `from "@/backend/types/<subdir>/<file>"` with `from "@/backend/types"` in all `import`, `import type`, `export { ... }`, and `export type { ... }` statements.
2. **Merge duplicate `import type` statements**: When a file has multiple `import type { ... } from "@/backend/types/..."` statements, merge them into a single `import type { A, B, C } from "@/backend/types"`. This includes merging with existing `import type { ... } from "@/backend/types"` (shortest) statements — 83 files have both.
3. **Merge duplicate value `import` statements**: When a file has multiple `import { ... } from "@/backend/types/..."` (non-type) statements, merge them into a single `import { X, Y } from "@/backend/types"`.
4. **Do NOT merge `import type` with value `import`**: Keep them as separate statements. The `import-x/no-duplicates` rule (default `preferInline: false`) treats `import type` and `import` from the same module as separate — verified by linting `backend/db/repo/billing/quota.repository.ts` which has both and passes clean.
5. **Do NOT merge namespace imports**: `import * as Types from "@/backend/types"` and `import type * as Types from "@/backend/types"` are NOT duplicates of named imports from the same module — the `no-duplicates` rule excludes `ImportNamespaceSpecifier` from duplicate detection. 4 files have both namespace + named long-path imports; the named imports merge among themselves but stay separate from the namespace import.
6. **Do NOT convert dynamic `import()` calls** in:
   - `backend/services/cron/queue-adapters/bullmq-pg.adapter.ts` (inline `import("@/backend/types/cron/cron.types").CronQueueAdapter`)
   - `backend/services/cron/queue-adapters/bullmq-redis.adapter.ts` (inline `import("@/backend/types/cron/cron.types").CronQueueAdapter`)
   - `backend/services/cron/test/queue-adapter.factory.test.ts` (runtime `await import("@/backend/types/cron/cron.types")`)
7. **Do NOT convert inline relative type imports** within `backend/types/`:
   - `backend/types/scheduling/schedule.types.ts:164` — `import("./scheduling.types").StatusTrackingRow` is a relative `./` path to a sibling, not an `@/backend/types/...` long path. Leave as-is.
8. **Preserve import order**: Keep the merged import in the position of the first original import; remove subsequent duplicate import lines.
9. **Handle inline `type` modifiers**: Files like `bullmq-shared.ts` have `import { type CronQueueAdapter, CronQueueBackendNotAvailable } from "@/backend/types/cron/cron.types"` — after conversion, the inline `type` modifier stays: `import { type CronQueueAdapter, CronQueueBackendNotAvailable } from "@/backend/types"`.
10. **Convert re-exports too**: 4 files have `export { ... }` or `export type { ... }` re-exports from long types paths:
    - `backend/db/repo/whatsapp/whatsapp-account.repository.ts` — `export { buildReturnType, isValidLimitTier, isValidQualityRating } from "@/backend/types/whatsapp/whatsapp-account.types"`
    - `backend/db/repo/scheduling/scheduling-queries.repository/index.ts` — `export type { DailyScheduleMetricFilter, ... } from "@/backend/types/scheduling/scheduling.types"`
    - `backend/db/repo/scheduling/queries.ts` — `export type { AdminDashboardScheduleRepoInput, ... } from "@/backend/types/scheduling/scheduling.types"`
    - `backend/services/communication/channels/whatsapp/IWhatsappChannel.ts` — `export type { IWhatsappChannel, ... } from "@/backend/types/whatsapp/whatsapp-channel.types"`

### Execution strategy
Dispatch parallel subagents by directory group:
1. `backend/db/` (repo + schema + seeds + test) — ~95 files
2. `backend/graphql/` (mutation + pothos + query + utils) — ~35 files
3. `backend/services/` group A (meeting, cron, communication, billing, notification, payment-method, profile) — ~50 files
4. `backend/services/` group B (all other services) — ~20 files
5. `backend/types/` (internal cross-domain) — 28 files
6. `backend/lib/` + `scripts/` — 8 files

Each subagent:
- Reads the file
- Identifies all `from "@/backend/types/..."` import and re-export statements (excluding dynamic `import()` and inline relative `import("./...")`)
- Converts each to `from "@/backend/types"`
- Merges duplicate `import type` statements into one; merges duplicate value `import` statements into one
- Does NOT merge `import type` with value `import`; does NOT merge named imports with namespace imports
- Removes now-empty import lines
- Writes the file

## Phase 3: Validation

1. **tsgo**: `bun run tsgo` — must pass clean (verifies no broken imports, no export collisions)
2. **oxlint**: `bun run oxlint` — must pass clean
3. **biome**: `bun biome:check` — must pass clean (may auto-fix formatting)
4. **lint**: `bun run lint` — must pass clean (verifies `import-x/no-duplicates` after merging)
5. **lint:type-aware**: `bun lint:type-aware` — must pass clean
6. **Tests**: Run representative service tests:
   - `bun run scripts/run-test/run-test.ts backend/services/cache/test/EntityCacheService.test.ts`
   - `bun run scripts/run-test/run-test.ts backend/services/communication/test/communication.service.test.ts`
   - Verify no regressions vs pre-refactor baseline

## Key Decisions
- **Internal cross-domain imports converted too**: 28 files inside `backend/types/` that import from `@/backend/types/<subdir>/...` are converted to `@/backend/types` (user confirmed). All are `import type` only — no runtime value imports — so no circular dependency risk at runtime.
- **Dynamic `import()` NOT converted**: 3 files with `import("@/backend/types/cron/cron.types")` keep deep paths (established convention from services barrel refactor).
- **Inline relative `import("./...")` NOT converted**: `schedule.types.ts:164` uses `import("./scheduling.types").StatusTrackingRow` — a relative sibling path, not an `@/` long path. Out of scope.
- **`export type { }` → `export *`**: Both `meeting/index.ts` and `scheduling/index.ts` use `export type { }` for types that have no collision — converting to `export *` for consistency with barrel conventions.
- **`import type` + value `import` kept separate**: Verified by linting `quota.repository.ts` — the `no-duplicates` rule with default `preferInline: false` does not flag type+value pairs from the same module.
- **Namespace imports kept separate from named imports**: Verified by linting `payment-method.service.ts` — the `no-duplicates` rule excludes `ImportNamespaceSpecifier` from duplicate detection.
- **4 missing barrel exports** (not 2 as initially estimated): `billing/currency.types`, `profile/profile-field-manifest`, `scheduling/class-status-event.types`, `storage/site-content.types` — adding them enables shortest-path conversion for their consumers.
- **Re-exports converted too**: 4 files with `export { ... }` or `export type { ... }` from long types paths are converted to `@/backend/types`.

## Risks
- **Export name collisions**: Adding `export *` for `meeting-config-base.types`, `schedule.types`, `currency.types`, `profile-field-manifest`, `class-status-event.types`, `site-content.types` could collide if any other file in the same barrel exports the same name. Mitigated by tsgo verification in Phase 1c — tsgo will catch TS2308 collisions immediately.
- **`import-x/no-duplicates` warnings**: After conversion, files with multiple imports from different `@/backend/types/...` subpaths will all point to `@/backend/types`. The `no-duplicates` rule (set to `warn`) will flag unmerged duplicates. Mitigated by merging in Phase 2 and verifying with `bun run lint` in Phase 3.
- **Circular dependencies (type-level)**: Converting internal cross-domain `import type` to use the root barrel creates type-level circular chains (e.g., `auth.types.ts` → `@/backend/types` → `auth/index.ts` → `auth.types.ts`). However, `import type` statements are erased at compile time and do not create runtime circular dependencies. tsgo handles type-only circular references fine.
- **83 files with existing shortest-path imports**: These files already have `import type { ... } from "@/backend/types"` (shortest) AND long-path imports. The long-path imports must be merged INTO the existing shortest-path import, not just converted. Subagents must detect and handle this merge case.

## Relevant Files
- `backend/types/index.ts` — root barrel (26 `export *` lines, no changes needed)
- `backend/types/billing/index.ts` — add `./currency.types`
- `backend/types/profile/index.ts` — add `./profile-field-manifest`
- `backend/types/scheduling/index.ts` — add `./class-status-event.types`, convert `export type { }` → `export *`
- `backend/types/storage/index.ts` — add `./site-content.types`
- `backend/types/meeting/index.ts` — convert `export type { }` → `export *`
- 210 files with long-path imports (listed in `/tmp/kilo/types-all-files.txt`)
