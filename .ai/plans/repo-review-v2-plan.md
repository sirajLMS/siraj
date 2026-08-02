# Repository Review Plan V2

**Date**: 2026-08-02
**Scope**: Branch diff (quota vs master) — 228 files, 13 commits
**Focus**: Comprehensive (architecture, security, types, imports)
**Files Reviewed**: 228 files across all layers

## Summary

Review of the `quota` branch reveals the quota billing type system is clean, frontend follows MUI v9/React 19/Apollo conventions correctly, and the working tree has no uncommitted changes. The dominant issue is ~30+ `throw new Error()` calls in services that should use `DomainError` subclasses so the GraphQL error mapper can emit proper error codes. Additional issues include business logic in the repository layer, hardcoded repo error strings, type duplication in scheduling/recurring-class areas, and a missing `.env.example` entry.

## Findings

### HIGH (35)
- [ ] [HIGH] backend: backend/services/billing/permission-utils.ts:19,40 — `throw new Error(tErrors.insufficientPermissions)` should be `ForbiddenError`
- [ ] [HIGH] backend: backend/services/billing/quota.service.ts:48 — `throw new Error(tErrors.unauthorizedAction)` should be `UnauthorizedError`
- [ ] [HIGH] backend: backend/services/session/class-session.service.ts:42,49,84,115,121,280,645,731 — 8 `throw new Error(...)` should be DomainError subclasses
- [ ] [HIGH] backend: backend/services/scheduling/state-change-validation.service.ts:51,68,72,81,97,100,103 — 7 `throw new Error(...)` should be DomainError subclasses
- [ ] [HIGH] backend: backend/services/schedule/recurring-class.service.ts:141,164,168,175,178,183,344,353,445,451,581,587 — 12 `throw new Error(...)` should be DomainError subclasses
- [ ] [HIGH] backend: backend/services/schedule/schedule-deletion.service.ts:63,121 — `throw new Error(tErrors.insufficientPermissions)` should be `ForbiddenError`
- [ ] [HIGH] backend: backend/services/scheduling/availability.service.ts:73,110,124 — `throw new Error(tErrors.invalidInput)` should be domain errors
- [ ] [HIGH] backend: backend/services/billing/credit.service.ts:39,64,68,128,132,148,179 — 7 `throw new Error(...)` should be DomainError subclasses
- [ ] [HIGH] backend: backend/services/teacher/teacher-dashboard.service.ts:22,33,83,88 — 4 `throw new Error(...)` should be DomainError subclasses
- [ ] [HIGH] backend: backend/graphql/query/teachers/teacher-dashboard.query.ts:18,69 — `throw new Error(tErrors.unauthorized)` should be `UnauthorizedError`
- [ ] [HIGH] backend: backend/db/repo/billing/quota.repository.ts:786,875,498,1032,1033,1083,1232 — 7 hardcoded repo error strings should be domain errors
- [ ] [HIGH] types: backend/services/schedule/recurring-class.service.ts:30 — `CreateRecurringClassInput` redefined locally, diverges from canonical type in backend/types/scheduling/scheduling.types.ts
- [ ] [HIGH] config: .env.example — `LINT_QUEUE_PORT` env var missing from .env.example

### MEDIUM (12)
- [ ] [MEDIUM] backend: backend/db/repo/billing/quota.repository.ts:1046-1065 — `refreshPeriodic` contains rollover policy business logic (should be in service)
- [ ] [MEDIUM] backend: backend/db/repo/billing/quota.repository.ts:1040 — Early short-circuit `if (now <= periodEnd) return` is orchestration in repo
- [ ] [MEDIUM] backend: backend/db/repo/billing/quota.repository.ts:1087-1099 — Expired-amount calculation + ledger emission is business orchestration in repo
- [ ] [MEDIUM] backend: backend/services/scheduling/availability.service.ts:52 — `catch { return false; }` swallows DB error silently
- [ ] [MEDIUM] backend: backend/services/scheduling/availability.service.ts:122-125 — `catch { throw new Error(...) }` discards original error
- [ ] [MEDIUM] backend: backend/graphql/query/billing/quota.query.ts — Query resolvers have no error mapping (inconsistent with mutation.ts)
- [ ] [MEDIUM] backend: backend/db/repo/billing/credit.repository.ts:85 — Hardcoded repo error string
- [ ] [MEDIUM] types: backend/services/billing/quota.service.ts — 8 `as QuotaReturnType` casts instead of proper mapping
- [ ] [MEDIUM] types: backend/graphql/mutation/billing/quota.mutation.ts:82 — `args.input as QuotaUpdateInput` cast indicates structural mismatch
- [ ] [MEDIUM] types: frontend/common/views/dashboard/billing/quota/types/quota.types.ts — QuotaItem/QuotaLedgerItem duplicate generated GraphQL types
- [ ] [MEDIUM] config: app/(dashboard)/quotas/[id]/page.tsx:16 — generateMetadata ignores id param
- [ ] [MEDIUM] config: app/(dashboard)/quotas/[id]/edit/page.tsx:16 — generateMetadata ignores id param

### LOW (8)
- [ ] [LOW] backend: backend/db/repo/billing/quota.repository.ts:73-79 — `isRichRolloverPolicy` type-guard is policy logic in repo
- [ ] [LOW] backend: backend/services/scheduling/availability.service.ts:277-279 — `catch { }` silently swallows timezone errors
- [ ] [LOW] backend: backend/services/scheduling/availability.service.ts:70-73 — TODO: `assertSlotAvailable` reuses generic `invalidInput` message
- [ ] [LOW] types: backend/types/scheduling/schedule.types.ts:26 — `RescheduleClassInputType` should be `RescheduleClassInput`
- [ ] [LOW] types: backend/types/scheduling/schedule.types.ts:138 — `AdminDashboardScheduleInputType` should be `AdminDashboardScheduleInput`
- [ ] [LOW] types: backend/types/scheduling/scheduling.types.ts:27-84 — `...Entity` suffix instead of `...SelectType`
- [ ] [LOW] types: backend/types/scheduling/scheduling.types.ts:135-156 — `CreateRecurringClassInput` uses inline string literals instead of shared enums
- [ ] [LOW] config: app/(dashboard)/classes/new/actions.ts:43-44 — Unnecessary lossy casts

## Fix Status

- Total findings: 55
- Fixed: 0 / 55
- Remaining: 55
