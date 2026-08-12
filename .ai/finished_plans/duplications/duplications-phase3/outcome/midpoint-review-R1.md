# Mid-Point Review — R1

**Date:** 2025-01-20
**Reviewers:** `review-backend-phase3` (code-review subagent), `review-types-phase3` (code-review subagent)
**Scope:** All backend and type files modified in commit `f97e41e03e`

## Backend Review Findings

### HIGH Severity — FIXED

**Lost `identifierLabel` default in `SupportedOnlineAccountRepository.create`**

- **File:** `backend/db/repo/billing/supported-online-account.repository.ts`
- **Description:** The generic `makeBillingRepo` factory's `create()` method dropped the `identifierLabel: input.identifierLabel ?? input.name` default that existed in the original code. The schema column is `.notNull()`, so omitting `identifierLabel` in a GraphQL mutation would throw a Postgres NOT NULL constraint violation.
- **Root cause:** The factory's `create()` only filled `createdAt`/`updatedAt` defaults, not entity-specific defaults.
- **Evidence:** The `upsertMany` method in the same file still has the default (lines 79, 93), proving it was intentional.
- **Fix:** Added `prepareInsert?` hook to `BillingRepoConfig` interface. Configured in `supported-online-account.repository.ts` to restore `identifierLabel: input.identifierLabel ?? input.name`. Factory's `create()` now applies the hook before inserting.
- **Files modified:**
  - `backend/db/repo/billing/__shared__/billingRepoFactory.ts` — Added `TInsert` generic param to `BillingRepoConfig`, added `prepareInsert?` field, applied in `create()`
  - `backend/db/repo/billing/supported-online-account.repository.ts` — Configured `prepareInsert` hook

### Verification

- `tsgo`: 0 errors
- `oxlint`: 0 errors (type-aware)
- `biome:check`: 0 errors
- `lint` (ESLint): 0 errors

## Types Review Findings

### No Issues Found

All 8 modified type files pass review:

1. **`meeting-config-base.types.ts`** — Correctly extracts shared shape; no circular imports
2. **`class-meeting-config.types.ts`** — Correctly extends `MeetingConfigBase*` via intersection; no dropped fields
3. **`meeting-config.types.ts`** — Correctly extends `MeetingConfigBase*`; `MeetingConfigDetails` re-export is type-only (safe under `isolatedModules`)
4. **`shared/pagination.types.ts`** — `PaginationInput` equivalent to original 7 fields; `PaginationArgs` field narrowing from optional to required is safe (constructor unconditionally assigns)
5. **`communication.types.ts`** — 4 new exports (`BaseEntity`, `BaseRepo<T>`, `DBTx`, `ResolutionResult`) uniquely named; no barrel collision
6. **`simulation/index.ts`** — `SimulationAuditLogParams` correctly consumed; auth simulation tests pass

### One Low-Priority Observation (Not a Bug)

- `SimulationSessionOwnership` is exported but has no consumer — effectively dead code from unimplemented design doc helpers. Not a review issue.

## Conclusion

Phase 3 backend and type refactoring is type-safe and preserves all consumer-visible behavior. The single HIGH severity issue (lost `identifierLabel` default) has been fixed and verified.
