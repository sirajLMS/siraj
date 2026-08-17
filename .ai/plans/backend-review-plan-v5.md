# Backend Review Plan v5

**Date**: 2026-08-18
**Scope**: All backend code (services, GraphQL, repos, schema, lib, tests, app/api)
**Focus**: Comprehensive backend review (architecture, types, i18n, logging, repo, tests, GraphQL, style)
**Files Reviewed**: 131 modified backend files across 8 review groups
**Round**: 5 (does NOT ignore files reviewed in prior rounds)

## Summary

Round 5 comprehensive backend review found 13 findings: 8 CRITICAL, 4 WARNING, 1 SUGGESTION. The primary issue is inverted layer dependencies created by the B9 batch in round 4 — repositories now import and call service-layer helpers, which inverts the data→service dependency direction. A secondary issue is hardcoded English throws in `supported-online-account.repository.ts`. All other groups (logging, graphql, types, tests, style) returned CLEAN.

## Concurrent Agent File Exclusions (DO NOT MODIFY)

The following files are being actively modified by a concurrent AI agent. Findings in these files are SKIPPED:
- `backend/types/billing/payment-method.types.ts`
- `backend/graphql/mutation/billing/payment-method.mutation.ts`
- `backend/graphql/query/billing/payment-method.query.ts`
- `backend/services/payment-method/*` (all files)
- `backend/db/repo/billing/user-payment-method.repository.ts`
- `backend/graphql/mutation/meeting/meeting.mutation.ts`
- `app/api/oauth/shared/oauth-callback-handler.ts`
- `app/api/storage/vercel-upload/route.ts`

## Findings

### CRITICAL (8)

- [x] [CRITICAL] repo: backend/db/repo/storage/storage.repository.ts:354 — Fixed in R5-A: Removed dynamic import, restored to pure data-access.
- [x] [CRITICAL] repo: backend/db/repo/storage/storage.repository.ts:540 — Fixed in R5-A: Removed dynamic import, restored to pure data-access.
- [x] [CRITICAL] repo: backend/db/repo/storage/storage.repository.ts:549 — Fixed in R5-A: Removed dynamic import, restored to pure data-access.
- [x] [CRITICAL] repo: backend/db/repo/storage/storage.repository.ts:558 — Fixed in R5-A: Removed dynamic import, restored to pure data-access.
- [x] [CRITICAL] repo: backend/db/repo/notifications/notification.repository.ts:376 — Fixed in R5-B: Inlined `isValidForwardTransition()`, removed service imports, uses `getServerTranslations` for errors.
- [x] [CRITICAL] repo: backend/db/repo/complaints/complaint.repository.ts:233 — Fixed in R5-C: `getComplaintQueue` returns raw data; `deriveComplaintMetrics` moved to service caller. Type guards moved to `backend/lib/`.
- [x] [CRITICAL] i18n: backend/db/repo/billing/supported-online-account.repository.ts:22 — Fixed in R5-D: Uses `getServerTranslations("en").errorsTranslations.invalidIdentifierKind`.
- [x] [CRITICAL] i18n: backend/db/repo/billing/supported-online-account.repository.ts:25 — Fixed in R5-D: Uses `getServerTranslations("en").errorsTranslations.invalidSupportedDirections`.

### WARNING (4)

- [x] [WARNING] arch: backend/db/repo/complaints/complaint.repository.ts:5-10 — Fixed in R5-C: Type guards moved to `backend/lib/complaint-validation.ts`; no more service imports.
- [x] [WARNING] arch: backend/db/repo/notifications/notification.repository.ts:5-9 — Fixed in R5-B: `DELIVERY_STATUS_RANK` moved to repo-local `notification-status.constants.ts`; transition guards inlined.
- [x] [WARNING] repo: backend/db/repo/notifications/notification.repository.ts:582 — Fixed in R5-B: SQL uses `sql<number>...mapWith(Number)`. Same at line 586.
- [x] [WARNING] arch: backend/db/repo/complaints/complaint.repository.ts:232-237 — Fixed in R5-C: `getComplaintQueue` returns `ComplaintQueueRawResult` with raw metrics.

### SUGGESTION (1)

- [x] [SUGGESTION] arch: backend/graphql/mutation/students/student.mutation.ts:56 — Fixed in R5-E: `partiallyUpdateStudent` and `deleteStudent` now route through `StudentManagementService`.

## Recommended Actions

### Priority 1: Fix repo→service inverted dependencies (CRITICAL x6, WARNING x2)

The B9 batch in round 4 moved business logic from repos to services but left "thin wrapper" methods in the repos that dynamically import and call the service layer. This inverts the dependency direction. Fix approach:

**For storage.repository.ts (4 methods):**
- Remove the repo wrapper methods (`registerFileUsage`, `checkFileUsage`, `updateDirectoryPermissions`, `setProtection`) that delegate to `StorageService`.
- Update all callers to call `StorageService` methods directly.
- If any caller still expects a repo method, keep a pure data-access method in the repo (no service import).

**For notification.repository.ts (state machine):**
- Remove `assertValidStatusTransition` / `isValidStatusTransition` calls from repo write methods.
- Move the transition validation to `NotificationService` — call validation BEFORE the repo write.
- Keep `DELIVERY_STATUS_RANK` in a shared neutral module or in the repo (as a data constant), not imported from the service.

**For complaint.repository.ts (metrics + assert helpers):**
- Remove `deriveComplaintMetrics` call from `getComplaintQueue`. Return raw data from repo.
- Remove imports of `assertComplaintCategory`, `assertComplaintStatus`, `deriveComplaintMetrics` from `@/backend/services/communication`.
- Move assertion helpers to a shared neutral module (e.g., `shared/lib/` or `backend/lib/`) if both layers need them, or keep them service-only and have the service validate before calling the repo.

### Priority 2: Fix hardcoded English throws (CRITICAL x2)

- `supported-online-account.repository.ts:22,25` — Replace with i18n translation function.
- Add new error keys to `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`.
- Use `getServerTranslations(locale ?? "en", "errors").errorsTranslations` pattern from `@/shared/locale/server-graphql` (per db/repo/AGENTS.md rule — repos use `getServerTranslations`, NOT the `errorsEn` direct import which is for test files only).

### Priority 3: SQL typing fix (WARNING x1)

- `notification.repository.ts:582,586` — Replace raw `CASE ... ELSE -2` with `sql<number>...mapWith(Number)`.

### Priority 4: Resolver consistency (SUGGESTION x1)

- `student.mutation.ts:56` — Route `partiallyUpdate` through a service method for consistency.

## Layer Compliance Notes

1. **Repo→Service inversion** — B9 batch created circular dependencies by having repos import and call service helpers. This violates the `Data Flow` rule in AGENTS.md: `Client → GraphQL → Service → Repository → Database`. The dependency direction must be Service→Repo, never Repo→Service.
2. **i18n hardcoded throws** — Still present in `supported-online-account.repository.ts`. Per AGENTS.md, all user-facing error messages must use the compile-time translation system.
3. **i18n pattern for repos** — Per `backend/db/repo/AGENTS.md` line 42, repositories must use `getServerTranslations(locale, "errors")` from `@/shared/locale/server-graphql`, NOT the `errorsEn` direct import (which is for test files only). The plan has been updated to reflect this.
4. **SQL typing** — `SQL<unknown>` in notification repo should use `.mapWith(Number)` per repo layer rules.

## Fix Status

- Total findings: 13
- Skipped (concurrent agent): 0
- Fixable: 13
- Fixed: 13 / 13 ✅
- Remaining: 0

### Batch Completion Summary

| Batch | Description | Severity | Status |
|-------|-------------|----------|--------|
| R5-A | Storage repo→service inversions (4 dynamic imports removed) | CRITICAL x4 | ✅ Done |
| R5-B | Notification repo→service imports + SQL typing + status constants | CRITICAL x1, WARNING x2 | ✅ Done |
| R5-C | Complaint repo→service imports (type guards → backend/lib) | CRITICAL x1, WARNING x2 | ✅ Done |
| R5-D | Online-account hardcoded English throws → i18n | CRITICAL x2 | ✅ Done |
| R5-E | Student.mutation partiallyUpdate through service | SUGGESTION x1 | ✅ Done |

### Verification Results (Final)

- **test:db**: 894/894 pass ✅
- **test:services**: 557/557 pass ✅
- **tsgo**: 0 backend errors ✅
- **ESLint**: clean on all R5 files ✅
- **biome**: clean ✅
- **NO commits, NO pushes** — per user constraint
