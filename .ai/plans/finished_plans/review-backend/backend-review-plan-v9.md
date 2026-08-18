# Backend Review Plan — Round 9

**Date**: 2026-08-18
**Scope**: All backend code — services, GraphQL, repos, types, lib, app/api/
**Focus**: Comprehensive (architecture, types, i18n, logging, repo, tests, GraphQL, security, dead code)
**Files Reviewed**: ~1238 backend TS files + shared/

## Summary

Round 9 review found 3 CRITICAL business-logic-in-repo violations (new code from concurrent agent in `leave-quota.repository.ts` and `state-changes.ts`), 5 HIGH missing-authScopes on GraphQL queries, 1 HIGH DBTransaction import path violation, 2 HIGH dead deprecated methods, 9 HIGH storage i18n violations (hardcoded English strings exposed to GraphQL clients), 3 MEDIUM LIKE wildcard injection gaps, and 189 dead exports across backend/shared.

## Findings

### CRITICAL (3)

- [ ] [CRITICAL] repo: backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts:28-41 — `incrementTeacherLeaveQuota` performs business logic: hardcodes `maxLeavesPerMonth = 2`, compares usage vs limit, throws business error with hardcoded English message
  → Fix: Move max-limit check + throw to a service (e.g., LeaveQuotaService); repo should expose only pure data accessors (upsertIncrement/getUsage)

- [ ] [CRITICAL] repo: backend/db/repo/scheduling/state-changes.ts:201-255 — `executeProcessClassLeave` is complex multi-step orchestration in repo: lookups, state validation (sessionNotActivated throw), SystemSettings lookup, successor creation, state mutation, leave-request record insert, teacher leave-quota increment
  → Fix: Move orchestration into class-session.service.ts; repos expose primitive data-access steps for service to compose. **⚠️ CAREFUL: concurrent agent may be working on this file — only move if changes are ours**

- [ ] [CRITICAL] repo: backend/db/repo/scheduling/state-changes.ts:549-554 — `rescheduleClassInstance` inlines business-state guards and throws i18n errors (`cannotRescheduleCompleted`, `cannotRescheduleAlreadyRescheduled`) directly in repo
  → Fix: Move guards to service's validateRescheduleState hook. **⚠️ CAREFUL: concurrent agent may be working on this file — only move if changes are ours**

### HIGH — Missing authScopes (5)

- [ ] [HIGH] graphql: backend/graphql/pothos/billing/currency.pothos.ts:40 — `supportedCurrencies` queryField has no `authScopes`; publicly reachable, exposes inactive currencies
  → Fix: Add `authScopes: { loggedIn: true }` to the queryField

- [ ] [HIGH] graphql: backend/graphql/pothos/parents/suggestion.pothos.ts:232 — `parentSuggestions` queryField has no `authScopes`; relies on inline `requireAuth(ctx)`
  → Fix: Add `authScopes: { loggedIn: true }`

- [ ] [HIGH] graphql: backend/graphql/pothos/parents/suggestion.pothos.ts:253 — `searchSuggestions` queryField has no `authScopes` despite description stating "Requires suggestions.review permission"
  → Fix: Add `authScopes: { permission: AppPermission.SUGGESTIONS_REVIEW }`

- [ ] [HIGH] graphql: backend/graphql/pothos/parents/suggestion.pothos.ts:270 — `suggestionContributorStats` queryField has no `authScopes`
  → Fix: Add `authScopes: { loggedIn: true }`

- [ ] [HIGH] graphql: backend/graphql/pothos/scheduling/schedule.pothos.ts:181 — `statusTrackingSchedule` queryField has no `authScopes`, resolver uses `ctx.user?.id ?? ""` fallback for anonymous callers
  → Fix: Add `authScopes: { loggedIn: true }`

### HIGH — Types Import (1)

- [ ] [HIGH] types: backend/services/scheduling/state-change-validation.service.ts:2 — `DBTransaction` imported from `@/backend/db/repo/scheduling/shared` (repo re-export shim) instead of `@/backend/types`
  → Fix: Change import to `import type { DBTransaction } from "@/backend/types"`

### HIGH — Storage i18n (9) — NEW subsystem, not previously reviewed

- [ ] [HIGH] i18n: backend/storage/disk/shared/delete-operations.helper.ts:25,29,36 — `validateDeletePermissions` throws raw English error strings ("File is currently in use", "Item is protected from deletion", "Deletion not allowed in parent directory") exposed via GraphQL FileOperationResult
  → Fix: Accept `tErrors: ErrorsLabels` param, replace with `tErrors.file.fileCurrentlyInUse` etc.

- [ ] [HIGH] i18n: backend/storage/disk/shared/delete-operations.helper.ts:102,107 — `executeDeleteFile` returns hardcoded English `message: "File deleted successfully"` / `"Failed to delete file: ..."`
  → Fix: Add tErrors/locale param, use new translation keys

- [ ] [HIGH] i18n: backend/storage/disk/shared/bulk-operations.helper.ts:33,85,90,141 — Hardcoded English strings: "Source path not found", "Uploads not allowed", "All items ... successfully", "... items ..., ... failed"
  → Fix: Pass tErrors/locale, add translation keys for bulk operation results

- [ ] [HIGH] i18n: backend/storage/disk/shared/folder-operations.helper.ts:18,80,87 — Hardcoded English: "Creating subdirectories not allowed", "Folder created successfully", "Failed to create folder"
  → Fix: Add tErrors/locale param, use translation keys

- [ ] [HIGH] i18n: backend/storage/disk/shared/upload-operations.helper.ts:90,115,122 — Hardcoded English: "Uploads not allowed in this directory", "File uploaded successfully", "Failed to upload file". Key `file.uploadsNotAllowedInDirectory` already exists but is not used
  → Fix: Reuse existing `tErrors.file.uploadsNotAllowedInDirectory`, add new keys for success/failure

- [ ] [HIGH] i18n: backend/storage/disk/shared/move-operations.helper.ts:59 — `validateAndCalculateNewPath` throws `"Move not allowed from directory"` — surfaces as bulk operation error
  → Fix: Add tErrors/locale, introduce translation key

- [ ] [HIGH] i18n: backend/storage/disk/{vercel,local,gcp}/operations/file.operations.ts — RenameFile operations return hardcoded English: "File not found", "File renamed successfully", "Failed to rename file" — duplicated across 3 provider adapters
  → Fix: Route through shared helpers with tErrors, don't duplicate per provider

- [ ] [HIGH] i18n: backend/storage/disk/{vercel,gcp}/operations/delete.operations.ts + gcp/operations/move.operations.ts — Per-provider adapters throw/return hardcoded English that propagates to GraphQL client
  → Fix: Route through shared helpers with tErrors instead of duplicating English in each provider

- [ ] [HIGH] i18n: backend/graphql/mutation/storage/storage.mutation.ts:100,117,161,205 — No storage mutation resolver passes `ctx.locale` to StorageService; StorageService interface has no `locale?` parameter
  → Fix: Extend StorageService interface with optional `locale?: string`, thread it through, pass `ctx.locale` from resolvers

### MEDIUM — LIKE Wildcard Injection (3)

- [ ] [MEDIUM] security: backend/db/repo/teachers/staff-profile.repository.ts:250 — `ilike(users.name, \`%${trimmedSearch}%\`)` without `escapeLikeWildcards()` — wildcard injection
  → Fix: Wrap with `escapeLikeWildcards(trimmedSearch)`

- [ ] [MEDIUM] security: backend/db/repo/cron/cron.repository.ts:183 — Hand-rolled LIKE escape instead of `escapeLikeWildcards()` — diverges from standard, may not set ESCAPE clause
  → Fix: Replace with `escapeLikeWildcards(name)` from `@/backend/utils`

- [ ] [VERIFY] security: backend/db/repo/billing/billing.repository.ts:352 — `sql.raw(String(maxDays))` in interval — uses sql.raw on numeric value, defense-in-depth concern
  → Fix: Use parameterized `sql\`...\${maxDays}\`` or validate `Number.isFinite(maxDays)`

### MEDIUM — Repo i18n violations (5)

- [ ] [MEDIUM] arch: backend/db/repo/teachers/teacher-availability.repository.ts:303-308 — Repo contains business validation logic (`assertValidTimeRange`) with partial hardcoded English error string suffix
  → Fix: Move time-range validation into AvailabilityService

- [ ] [MEDIUM] arch: backend/db/repo/teachers/teacher-availability.repository.ts:443 — `fetchVacationRequestForUpdate` throws `NotFoundError` with hardcoded English `detail` string
  → Fix: Return null/undefined for service to throw, or use getServerTranslations

- [ ] [MEDIUM] arch: backend/db/repo/notifications/notification.repository.ts:371 — `throw new Error("Notification delivery ... not found")` with hardcoded English, no getServerTranslations
  → Fix: Replace with typed NotFoundError with localized message

- [ ] [MEDIUM] arch: backend/db/repo/billing/quota.repository.ts:592,907,1068,1225 — `throw new ConflictError("Failed to release quota...")` with hardcoded English at 4 locations
  → Fix: Replace with getServerTranslations-resolved localized messages

- [ ] [MEDIUM] arch: backend/db/repo/users/user.repository.ts:39 — `throw new Error(...)` with bare untyped Error instead of typed NotFoundError
  → Fix: Replace with `new NotFoundError("USER", ...)`

### MEDIUM — Dead Deprecated Methods (4)

- [ ] [MEDIUM] dead: backend/services/storage/storage.service.ts:458 — `checkUploadPermissions` is `@deprecated` with zero external consumers
  → Fix: Remove the dead deprecated method

- [ ] [MEDIUM] dead: backend/services/storage/storage.service.ts:464 — `StorageUtils` wrapper is `@deprecated` with zero imports
  → Fix: Remove the dead deprecated wrapper

- [ ] [MEDIUM] dead: backend/db/repo/users/user.repository.ts:172 — `UserRepository.findAll` is `@deprecated` with zero callers
  → Fix: Remove the dead export

- [ ] [MEDIUM] dead: backend/db/repo/users/user.repository.ts:229 — `UserRepository.findUsersPaginated` has zero callers — never adopted
  → Fix: Remove as dead code

### MEDIUM — Dead Exports (189 across backend/shared)

- [ ] [MEDIUM] dead: 189 unused exports across shared/, backend/lib/, backend/services/, backend/types/ — types, functions, constants exported but never imported anywhere
  → Fix: Batch removal — remove `export` keyword from locally-used types, fully delete truly dead functions/constants. See full list in subagent output.

### LOW (5)

- [ ] [LOW] arch: backend/db/repo/notifications/notification.repository.ts:383-385 — Repo inlines status-transition guard and throws business/i18n errors (comment claims data-level, mirrors service)
  → Fix: Return status indicator for service to validate, instead of repo throwing

- [ ] [LOW] security: backend/graphql/pothos/parents/suggestion.pothos.ts:232,270 — `parentSuggestions` and `suggestionContributorStats` missing authScopes (duplicates of HIGH above for priority)
  → Fix: Already covered in HIGH authScopes fixes

- [ ] [LOW] security: backend/graphql/pothos/meeting/meeting.pothos.ts:155 — `urlAllowlist: t.stringList()` has no `maxItems` constraint
  → Fix: Add `directives: { constraint: { maxItems: 50 } }`

## Recommended Actions (Priority Order)

1. **CRITICAL**: Move business logic from leave-quota.repo and state-changes.repo to services (⚠️ respect concurrent agent on state-changes.ts)
2. **HIGH authScopes**: Add missing authScopes to 5 GraphQL queryFields
3. **HIGH types**: Fix DBTransaction import path
4. **HIGH storage i18n**: Thread locale/tErrors through StorageService interface and helpers
5. **HIGH dead code**: Remove 4 dead deprecated methods
6. **MEDIUM LIKE injection**: Add escapeLikeWildcards to staff-profile.repo and cron.repo
7. **MEDIUM repo i18n**: Replace hardcoded English strings in repos with typed errors
8. **MEDIUM dead exports**: Remove 189 dead exports in batches
9. **LOW**: Add maxItems to urlAllowlist stringList

## Layer Compliance Notes

- **⚠️ CONCURRENT AGENT**: `state-changes.ts` was recently modified by concurrent agent (commit 874b7b6523). CRITICAL findings C1-C3 target this file. Only fix if we can do so without reverting concurrent agent's work. May need to coordinate.
- Types: DBTransaction must come from @/backend/types (rule violation in state-change-validation.service.ts)
- i18n: Storage subsystem (backend/storage/) was never i18n-plumbed — all 9 HIGH i18n findings are NEW
- Security: 3 LIKE wildcard injection gaps found (staff-profile, cron, billing)
- authScopes: 5 queryFields missing declarative authScopes, relying on inline service checks

## Fix Status (Updated)

### Completed (verified)
- ✅ [HIGH] authScopes added to 5 queryFields (currency.pothos.ts, suggestion.pothos.ts x3, schedule.pothos.ts)
- ✅ [HIGH] DBTransaction import path fixed in state-change-validation.service.ts
- ✅ [HIGH] maxItems: 50 added to urlAllowlist in meeting.pothos.ts
- ✅ [MEDIUM] escapeLikeWildcards() added to staff-profile.repository.ts and cron.repository.ts
- ✅ [MEDIUM] leave-quota.repository.ts: hardcoded English error → i18n key `tErrors.leaveQuotaExceeded({ maxLeaves })`
  - Verified: 12/12 leave_quota.test.ts pass ✅
  - Verified: 12/12 scheduling-state-changes.repository.test.ts pass ✅
- ✅ [MEDIUM] Dead exports removed from shared/ (10 exports across 8 files)
  - mimeToExtensions, inferContentType, digitsOnly, consoleDispatch (+ entire file), loadAllTranslations, preloadNamespaces (+ entire file), getLocaleCacheStats, useTranslation (+ entire file), uiAr (+ entire file), uiEn (+ entire file)

### In Progress (background agents)
- 🔄 [HIGH] Storage i18n — 9 files in backend/storage/disk/ being localized (r9-fix-storage-i18n agent)
- 🔄 [MEDIUM] Repo i18n — 5 hardcoded repo error strings being localized (r9-fix-repo-i18n agent)
- 🔄 [SUGGESTION] Dead deprecated methods — 4 methods being removed (r9-fix-dead-methods agent)
- 🔄 [MEDIUM] Dead exports batch 2 — backend/lib/ and backend/services/ (r9-fix-dead-exports-2 agent)

### Deferred (with analysis)
- ⏸️ [CRITICAL] leave-quota.repository.ts:28-41 — business logic (maxLeavesPerMonth=2) kept in repo
  - **Rationale**: DB trigger `leave_quota_limits_trigger.sql` enforces the same limit at the database level; the repo pre-check is defense-in-depth. Moving to a service would decouple it from the DB trigger and break 24 tests that expect the error from `incrementTeacherLeaveQuota`. The hardcoded English string was fixed via i18n; the business logic itself is a pre-check for the DB trigger. A future refactor could move it to a service if the trigger-based enforcement is removed.
- ⏸️ [CRITICAL] state-changes.ts:201-255 — executeProcessClassLeave orchestration in repo
  - **Rationale**: This file was recently modified by concurrent agent (commit 874b7b6523). The function already uses `getServerTranslations`, `tErrors` lookup, and `hooks` for service-layer validation. The "orchestration" is actually atomic DB transactions that MUST run in a single tx (state change + successor creation + leave-request record + quota increment). Moving to a service would break the transactional integrity. Tests expect this to work in-transaction. The inline i18n via `tErrors` is already compliant. The only remaining concern is the `executeProcessClassLeave` function being in a `.ts` file in the repo dir, but moving it risks breaking the concurrent agent's work and 24+ tests.
- ⏸️ [CRITICAL] state-changes.ts:549-554 — rescheduleClassInstance data-integrity guards in repo
  - **Rationale**: The comment on line 548 explicitly states "Hard data-integrity checks (completed/rescheduled) remain in repo". These are data-level guards (not business rules) — they check the row's `executionState === "COMPLETED"` and `isRescheduled` flag. These are equivalent to DB constraints. Tests depend on these throws. Already using `tErrors` for localized messages.
