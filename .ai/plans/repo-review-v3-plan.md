# Round 3 Repository Review Plan

**Date**: 2025-07-31
**Scope**: All commits on `quota` branch (16 commits, 251 files)
**Focus**: Comprehensive — architecture, security, performance, types, imports
**Files Reviewed**: 251 files across all layers

## Summary

Round 3 review found 20 unique findings across types (10), backend (12), and uncommitted (1). Frontend and config reviews returned CLEAN. The main issues are: remaining `throw new Error` calls in repo/service layers (9 HIGH), type naming convention violations in scheduling types (7 MEDIUM), business logic in repository (1 MEDIUM), an N+1 query (1 MEDIUM), and import path inconsistencies (2 LOW).

## Findings

### HIGH (9)
- [ ] [HIGH] backend: backend/db/repo/billing/quota.repository.ts:786 — hardcoded English `throw new Error("Quota redemption failed...")` should use QuotaLedgerError
- [ ] [HIGH] backend: backend/db/repo/billing/quota.repository.ts:875 — hardcoded English `throw new Error("Quota release failed...")` should use DomainError
- [ ] [HIGH] backend: backend/db/repo/billing/quota.repository.ts:1032 — hardcoded English `throw new Error("Cannot refresh non-periodic quota")` should use ValidationError
- [ ] [HIGH] backend: backend/db/repo/billing/quota.repository.ts:1033 — hardcoded English `throw new Error("Quota has no valid period days configured")` should use ValidationError
- [ ] [HIGH] backend: backend/db/repo/billing/quota.repository.ts:1083 — hardcoded English `throw new Error("Failed to refresh periodic quota...")` should use ConflictError
- [ ] [HIGH] backend: backend/db/repo/billing/quota.repository.ts:1232 — hardcoded English `throw new Error("Failed to reset usedThisPeriod...")` should use ConflictError
- [ ] [HIGH] backend: backend/services/schedule/recurring-class.service.ts:106 — `throw new Error(tErrors.outOfQuota)` should use ValidationError/ConflictError
- [ ] [HIGH] backend: backend/services/schedule/recurring-class.service.ts:111 — `throw new Error(tErrors.credit.insufficientBalance(...))` should use DomainError subclass
- [ ] [HIGH] types: backend/types/scheduling/schedule.types.ts:138 — Duplicate `AdminDashboardScheduleInput` defined here AND in scheduling.types.ts:59 with structurally different fields

### MEDIUM (9)
- [ ] [MEDIUM] backend: backend/db/repo/billing/quota.repository.ts:1032 — Business/policy logic in repo (rollover percent, accumulation cap, refreshPeriodic) should be in service layer
- [ ] [MEDIUM] backend: backend/services/scheduling/state-change-validation.service.ts:51,74,78,87,103,106,109 — 7 `throw new Error` calls should use UnauthorizedError/ValidationError
- [ ] [MEDIUM] backend: backend/services/teacher/teacher-dashboard.service.ts:32 — `throw new Error` should use NotFoundError
- [ ] [MEDIUM] types: backend/types/scheduling/scheduling.types.ts:29,32,35,76,79 — `...Entity` suffix instead of `...SelectType` convention
- [ ] [MEDIUM] types: backend/types/scheduling/scheduling.types.ts:30,33,36,77,86 — `...InsertInput` suffix instead of `...InsertType` convention
- [ ] [MEDIUM] types: backend/types/scheduling/scheduling.types.ts:25,38,54 — Imports `StudentEntity`/`TeacherEntity` misaligned with canonical naming
- [ ] [MEDIUM] types: backend/types/billing/quota.types.ts:106 — `QuotaLedgerInsertInput` should be `QuotaLedgerSubmitInput` for consistency
- [ ] [MEDIUM] types: backend/types/billing/quota.types.ts:7-25 — `QuotaReturnType` Omit list out of sync with actual exposed fields
- [ ] [MEDIUM] uncommitted: backend/services/scheduling/availability.service.ts:179 — N+1 query in findAvailableSlots (per-slot DB call; should batch like sibling methods)

### LOW (2)
- [ ] [LOW] types: backend/db/repo/billing/quota.repository.ts:13-21 — Deep import paths instead of barrel `@/backend/types`
- [ ] [LOW] backend: backend/db/repo/teachers/teacher-availability.repository.ts:717 — Repo throws business-validation errors (should be in service)

## Recommended Actions

1. **Fix remaining `throw new Error` in quota.repository.ts** (6 sites) — replace with appropriate DomainError subclasses
2. **Fix `throw new Error` in recurring-class.service.ts** (2 sites) — use ValidationError/DomainError
3. **Fix `throw new Error` in state-change-validation.service.ts** (7 sites) — use UnauthorizedError/ValidationError
4. **Fix `throw new Error` in teacher-dashboard.service.ts** (1 site) — use NotFoundError
5. **Resolve duplicate `AdminDashboardScheduleInput`** — remove dead duplicate in schedule.types.ts
6. **Fix scheduling type naming** — rename `...Entity` → `...SelectType`, `...InsertInput` → `...InsertType`
7. **Fix `QuotaLedgerInsertInput`** → `QuotaLedgerSubmitInput`
8. **Sync `QuotaReturnType` Omit list** with actual exposed GraphQL fields
9. **Fix N+1 in findAvailableSlots** — batch overlapping instance check
10. **Fix import paths** — use barrel `@/backend/types` instead of deep paths

## Layer Compliance Notes

- Repo layer should not contain business logic or hardcoded error strings (AGENTS.md: repository layer is data-access only)
- All user-facing errors must use DomainError subclasses (AGENTS.md: domain error hierarchy)
- Type naming must follow `{Entity}SelectType`, `{Entity}InsertType` convention (AGENTS.md: type definition pattern)
- N+1 queries violate performance guidelines (1 DB call per loop iteration)

## Fix Status

- Total findings: 20
- Fixed: 0 / 20
- Remaining: 20
