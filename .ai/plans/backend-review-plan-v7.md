# Backend Review Plan v7

**Date**: 2026-08-18
**Scope**: All backend code (services, GraphQL, repos, schema, lib, app/api, types, tests)
**Focus**: Comprehensive — architecture, types, i18n, logging, repos, tests, GraphQL, style
**Files Reviewed**: ~1200+ backend files
**Constraint**: No commits, no pushes. Respect concurrent agent's work. Fix all severities.

## Summary

Round 7 fresh review of all backend files. 8 parallel review subagents found 222 raw findings across 8 review groups. After deduplication of overlapping findings (same file/line flagged by multiple groups), there are ~170 unique findings.

## Findings

### CRITICAL — Architecture Layer Violations (6)

- [ ] [CRITICAL] ARCH: backend/graphql/pothos/students/student.pothos.ts:1 — GraphQL resolver imports StudentRepository and calls loadByIds directly; should delegate to StudentService
- [ ] [CRITICAL] ARCH: app/api/oauth/shared/oauth-callback-handler.ts:16 — API route imports MeetingProviderTokenRepository directly and performs token exchange + persistence; should delegate to MeetingOAuthService
- [ ] [CRITICAL] ARCH: app/api/storage/vercel-upload/route.ts:3 — API route imports SignedUrlRepository directly and validates upload session in-route; should delegate to StorageService
- [ ] [CRITICAL] ARCH: backend/db/repo/scheduling/state-changes.ts:202 — executeProcessClassLeave contains business orchestration (reschedule successor, leave-request insert, quota increment, payroll shaping)
- [ ] [CRITICAL] ARCH: backend/db/repo/scheduling/state-changes.ts:330 — markClassAbsent/markClassMissedBySystem embed payroll policy and outcome logic in repository
- [ ] [CRITICAL] ARCH: backend/db/repo/scheduling/state-changes.ts:464 — buildRescheduledClassInput/markOriginalAsRescheduled orchestrate rate-source precedence and quota reset in repo

### CRITICAL — Type Definition Violations (27)

- [ ] [CRITICAL] TYPES: backend/graphql/pothos/parents/parent-onboarding.pothos.ts:17 — Local `ParentOnboardingGqlInput` interface in Pothos file; import from @/backend/types
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/teachers/teacher-onboarding.pothos.ts:16 — Local `TeacherOnboardingGqlInput` interface in Pothos file
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/billing/payment-method.pothos.ts:244 — Local `UserPaymentMethodSubmitGqlInput` type in Pothos file
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/billing/payment-method.pothos.ts:268 — Local `UserPaymentMethodInitialGqlInput` type in Pothos file
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/system/site-content-settings.pothos.ts:10 — Local `SiteContentUpsertGraphQLInput` type in Pothos file
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/classes/lesson-report.pothos.ts:84 — Local `PendingLessonReportsPayload` type in Pothos file
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/billing/billing-history.pothos.ts:40 — Local `BillingSummaryWithCurrencyTotals` type in Pothos file
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/billing/billing-history.pothos.ts:79 — Local `ParentScopedResolverArgs` interface in Pothos file
- [ ] [CRITICAL] TYPES: backend/graphql/pothos/permissions/permission-management.pothos.ts:47 — Local `ErrorsTranslationsHolder` interface in Pothos file
- [ ] [CRITICAL] TYPES: backend/db/repo/users/user.repository.ts:339 — Uses `Partial<typeof users.$inferInsert>` instead of UserInsertType from @/backend/types
- [ ] [CRITICAL] TYPES: backend/db/repo/users/user.repository.ts:379 — Same $inferInsert usage in updateUserColumn
- [ ] [CRITICAL] TYPES: backend/db/repo/parents/suggestion.repository.ts:246 — Uses `Partial<typeof suggestions.$inferInsert>` instead of SuggestionInsertType
- [ ] [CRITICAL] TYPES: backend/db/repo/scheduling/recurring.ts:22 — Ad-hoc `CreateRecurringScheduleInput` interface in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/scheduling/recurring.ts:460 — Ad-hoc `RateSnapshot` interface in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:16 — Ad-hoc input types (AvailabilityWindowUpsertInput, RecurringUnavailabilityCreateInput, VacationRequestCreateInput) in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/teachers/staff-profile.repository.ts:34 — Ad-hoc `ManagerProfileUpdateInput` interface in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/scheduling/recurring-schedule.repository.ts:12 — Ad-hoc `RecurringScheduleUpsertInput` type in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/scheduling/recurring-schedule.repository.ts:17 — Ad-hoc `RecurringScheduleDayUpsertInput` type in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/storage/learning-resource.repository.ts:15 — Ad-hoc `LearningResourceCreateInput` interface in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/students/student-status-history.repository.ts:9 — Ad-hoc `CreateInitialStatusHistoryInput` type in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/students/student-progress.repository.ts:6 — Ad-hoc `StudentProgressUpsertInput` type in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/books/report.repository.ts:19 — Ad-hoc `AttendanceReportFilters` interface in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/classes/lesson-report.repository.ts:17 — Ad-hoc `PendingReviewFilters` interface in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/scheduling/class-status-events.repository.ts:7 — Ad-hoc `ClassStatusEventSeedInsertInput` type in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/meeting/__shared__/meetingConfigRepoHelpers.ts:28 — Ad-hoc input types in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/complaints/complaint-response.repository.ts:7 — Ad-hoc `CreateComplaintResponseInput` type in repository
- [ ] [CRITICAL] TYPES: backend/db/repo/billing/billing.repository.ts:21 — Ad-hoc input types (CurrencyExchangeRateUpdateInput, InvoiceCreateInput, PaymentRecordInput) in repository

### CRITICAL — i18n Hardcoded Strings (42)

- [ ] [CRITICAL] I18N: app/api/storage/upload/[id]/route.ts:32,36,41,47,51,116,131,140,153,159 — 10 hardcoded English error strings in NextResponse.json
  → Fix: Extract resolveLocale(request) helper, use getServerTranslations for all error responses
- [ ] [CRITICAL] I18N: app/api/storage/files/[[...path]]/route.ts:132,177,189,197,213,220,226 — 7 hardcoded English error strings
  → Fix: Same resolveLocale + getServerTranslations pattern
- [ ] [CRITICAL] I18N: app/api/storage/vercel-upload/route.ts:87,93,101,108,122,130,139,149,173 — 9 hardcoded English error strings
  → Fix: Same pattern
- [ ] [CRITICAL] I18N: app/api/storage/cleanup/route.ts:33,39,45,73,81 — 5 hardcoded English error strings/success message; no getServerTranslations import
  → Fix: Add import + resolveLocale
- [ ] [CRITICAL] I18N: app/api/invoices/[id]/download/route.ts:11,24,29,35,39,43 — 6 hardcoded English error strings; imports getServerTranslations but only uses for service calls
  → Fix: Use getServerTranslations for all error responses
- [ ] [CRITICAL] I18N: app/api/set-locale/route.ts:59,77,93,100 — All error responses hardcoded English
  → Fix: Use getServerTranslations
- [ ] [CRITICAL] I18N: app/api/fx/refresh/route.ts:43 — Hardcoded "FX refresh failed"
  → Fix: Use getServerTranslations
- [ ] [CRITICAL] I18N: app/api/logs/route.ts:177,184,188,196,207 — 5 hardcoded English error strings
  → Fix: Use getServerTranslations
- [ ] [CRITICAL] I18N: app/api/oauth/shared/oauth-callback-handler.ts:164,169,177,186,208 — 5 hardcoded English error strings in OAuth callback
  → Fix: Use getServerTranslations

### CRITICAL — Repository Business Logic (20)

- [ ] [CRITICAL] REPO: backend/db/repo/billing/quota.repository.ts:639 — throws ConflictError("insufficient reserved classes") — business-rule, should be in QuotaService
- [ ] [CRITICAL] REPO: backend/db/repo/billing/quota.repository.ts:954 — throws ConflictError("quota no longer active") — concurrent-update business error
- [ ] [CRITICAL] REPO: backend/db/repo/billing/quota.repository.ts:1110 — throws ValidationError("Cannot refresh non-periodic quota") — state-machine guard
- [ ] [CRITICAL] REPO: backend/db/repo/billing/quota.repository.ts:1112 — throws ValidationError("Quota has no valid period days") — input validation
- [ ] [CRITICAL] REPO: backend/db/repo/billing/quota.repository.ts:1147 — throws ConflictError for concurrent write
- [ ] [CRITICAL] REPO: backend/db/repo/billing/quota.repository.ts:1304 — throws ConflictError for concurrent modification
- [ ] [CRITICAL] REPO: backend/db/repo/billing/quota.repository.ts:1060 — refreshPeriodic implements quota rollover business logic inline
- [ ] [CRITICAL] REPO: backend/db/repo/teachers/teacher-availability.repository.ts:396 — throws ValidationError("Start time must be before end time") — input validation
- [ ] [CRITICAL] REPO: backend/db/repo/teachers/teacher-availability.repository.ts:493 — throws ValidationError for vacation dates — input validation
- [ ] [CRITICAL] REPO: backend/db/repo/teachers/teacher-availability.repository.ts:670 — validateBookingAvailability orchestrates multi-source validation + throws business errors
- [ ] [CRITICAL] REPO: backend/db/repo/scheduling/shared.ts:50 — checkOverlaps throws translated business errors (teacherBooked, studentBooked, meetingUrlInUse)
- [ ] [CRITICAL] REPO: backend/db/repo/notifications/notification.repository.ts:374 — updateDeliveryStatus enforces state machine in repo
- [ ] [CRITICAL] REPO: backend/db/repo/scheduling/scheduling-queries.repository/teacher-schedule.repository.ts:26 — throws Error("Invalid ClassExecutionState") for enum decoding
- [ ] [CRITICAL] REPO: backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts:38 — throws Error for quota validation (added in round 6 fix for test compatibility)
- [ ] [CRITICAL] REPO: backend/db/repo/cron/cron.repository.ts:83 — throws Error("Invalid cron schedule row") for enum decoding
- [ ] [CRITICAL] REPO: backend/db/repo/parents/parent.repository.ts:63,77,351 — throws business errors (alreadyExists, invalidTimezone, parentNotFound)
- [ ] [CRITICAL] REPO: backend/db/repo/permissions/permission-management.repository.ts:450 — throws Error(cannotDeleteSystemPermissionGroup) — business rule
- [ ] [CRITICAL] REPO: backend/db/repo/scheduling/state-changes.ts:152 — buildLeaveStateChangePayload builds business-state payloads in repository
- [ ] [CRITICAL] REPO: backend/db/repo/scheduling/state-changes.ts:216 — runStateChange throws session activation state rule (added in round 6 fix for test compat)
- [ ] [CRITICAL] REPO: backend/db/repo/scheduling/state-changes.ts:550 — rescheduleClassInstance enforces completed/rescheduled checks (added in round 6 fix for test compat)

### CRITICAL — Test Conventions (1)

- [ ] [CRITICAL] TESTS: backend/db/test/repo/meeting/class-meeting-config.repository.test.ts:57 — `expect(...).rejects.toThrow()` inside runInRollback — causes deadlocks. Replace with try/catch helper.

### WARNING — Architecture (5)

- [ ] [WARNING] ARCH: app/api/storage/cleanup/route.ts:42 — API route performs inline admin authorization; belongs in service
- [ ] [WARNING] ARCH: app/api/webhooks/whatsapp/route.ts:177 — API route contains HMAC verification + IP rate-limiting business logic; should be in WhatsappWebhookHandler service
- [ ] [WARNING] ARCH: backend/db/repo/scheduling/state-changes.ts:140 — getRequesterTypeForUser classifies actor role in repository
- [ ] [WARNING] ARCH: backend/db/repo/notifications/notification.repository.ts:42 — isValidForwardTransition duplicates service status-transition logic
- [ ] [WARNING] ARCH: backend/db/repo/billing/billing.repository.ts:652 — getUnpaidInvoicesSummary performs grouping/sorting/aggregation — reporting logic in repo

### WARNING — Type Patterns (9)

- [ ] [WARNING] TYPES: backend/graphql/pothos/parents/parent-profile.pothos.ts:20 — Gratuitous `ParentProfileGraphQLShape` alias; use objectRef<ParentProfileResult> directly
- [ ] [WARNING] TYPES: backend/graphql/pothos/scheduling/__shared__/recurringScheduleSharedFields.ts:19 — Local `RecurringScheduleSharedShape` re-declares 9 entity fields; derive via Pick from @/backend/types
- [ ] [WARNING] TYPES: backend/graphql/pothos/scheduling/__shared__/classSessionMetricsFields.ts:11 — Local interface declarations; centralize in @/backend/types
- [ ] [WARNING] TYPES: backend/graphql/pothos/scheduling/__shared__/classExecutionFields.ts:16 — Local interface declarations; centralize in @/backend/types
- [ ] [WARNING] TYPES: backend/graphql/pothos/billing/__shared__/paymentFieldHelpers.ts:17,32 — Local interface/type declarations; centralize in @/backend/types
- [ ] [WARNING] TYPES: backend/graphql/pothos/billing/payment-method.pothos.ts:29 — Local `SupportedCommonShape` interface; centralize
- [ ] [WARNING] TYPES: backend/graphql/pothos/billing/currency.pothos.ts:9 — Local `ErrorsTranslations` type; should live in @/shared/locale or @/backend/types
- [ ] [WARNING] TYPES: backend/services/meeting/integrations/token-refresh.ts:25 — Provider-integration types in service file; consider relocating to @/backend/types/meeting/
- [ ] [WARNING] TYPES: backend/services/meeting/integrations/meeting-oauth.service.ts:70 — `MeetingOAuthStatePayload` type in service; consider @/backend/types/meeting/

### WARNING — i18n (4)

- [ ] [WARNING] I18N: backend/services/storage/storage.service.ts:99-121 — validateSignedUrlSession returns hardcoded English; should accept locale/tErrors
- [ ] [WARNING] I18N: backend/services/storage/storage.service.ts:214 — checkFileAccess returns hardcoded "Forbidden"; should accept locale/tErrors
- [ ] [WARNING] I18N: backend/services/storage/storage.service.ts:225 — checkDirectoryUploadPermissions returns hardcoded English; should accept locale
- [ ] [WARNING] I18N: backend/db/repo/storage/storage.repository.ts:759,765,770 — validateUpload returns hardcoded English; should accept tErrors/locale

### WARNING — Repo SQL/Patterns (4)

- [ ] [WARNING] REPO: backend/db/repo/students/student.repository.ts:38 — Raw `CAST(... AS INT)` with `.mapWith(Number)` — cast redundant, remove CAST
- [ ] [WARNING] REPO: backend/db/repo/parents/parent.repository.ts:832 — `AVG(...)` missing `.mapWith(Number)`
- [ ] [WARNING] REPO: backend/db/repo/scheduling/recurring-schedule.repository.ts:248 — `COUNT(*)` missing `.mapWith(Number)`
- [ ] [WARNING] REPO: backend/db/repo/shared/cache.repository.ts:106 — Raw `::int` cast; acceptable but worth noting

### WARNING — Test Conventions (8)

- [ ] [WARNING] TESTS: backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts:33 — DB tests without runInRollback; uses manual afterAll cleanup
- [ ] [WARNING] TESTS: backend/db/test/logic/shared/hours-recalc.test.ts:30 — DB tests without runInRollback; raw db.insert; no entity-setup helpers
- [ ] [WARNING] TESTS: backend/db/test/logic/shared/poly-integrity.test.ts:15 — DB tests without runInRollback; manual afterAll cleanup
- [ ] [WARNING] TESTS: backend/db/test/logic/shared/soft_delete_security.test.ts:27 — DB tests without runInRollback (non-RLS cases)
- [ ] [WARNING] TESTS: backend/db/test/logic/timezone/timezone_dst.test.ts:212 — DB tests without runInRollback; manual afterAll cleanup
- [ ] [WARNING] TESTS: backend/db/test/logic/permissions/permission-management.service.test.ts:117 — DB tests without runInRollback; touches system/seed permission groups
- [ ] [WARNING] TESTS: backend/db/test/logic/shared/cache_split_routing.test.ts:103 — Expired-cache test inserts outSide runInRollback
- [ ] [WARNING] TESTS: backend/services/meeting/integrations/token-refresh.ts:25 — (duplicate of TYPES finding)

### WARNING — GraphQL Missing `id` Fields (10)

- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/complaints/complaint.pothos.ts:35 — ComplaintFile missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/teachers/teacher-due.pothos.ts:45 — TeacherMonthlyReport missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/billing/credit.pothos.ts:16 — CreditBalance missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/permissions/permission-management.pothos.ts:117 — UserOverride missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/billing/payment-method.pothos.ts:97 — PaymentMethodCatalogSnapshot missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/billing/currency.pothos.ts:20 — SupportedCurrency missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/meeting/meeting.pothos.ts:61 — MeetingConfigDetails missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/meeting/effective-meeting.pothos.ts:14 — EffectiveMeeting missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/storage/storage.pothos.ts:78 — FileInfo missing `id`
- [ ] [WARNING] GRAPHQL: backend/graphql/pothos/storage/storage.pothos.ts:102 — DirectoryInfo missing `id`

### SUGGESTION — All remaining (92)

#### Architecture (8)
- [ ] [SUGGESTION] ARCH: backend/db/repo/scheduling/shared.ts:8 — Repo imports SystemSettingsRepository + TeacherAvailabilityRepository directly
- [ ] [SUGGESTION] ARCH: backend/db/repo/scheduling/class-instances.ts:17 — Repo imports SoftDeleteRepository + TeacherAvailabilityRepository
- [ ] [SUGGESTION] ARCH: backend/db/repo/billing/quota.repository.ts:5 — Repo imports QuotaLedgerRepository
- [ ] [SUGGESTION] ARCH: backend/db/repo/teachers/staff-profile.repository.ts:3 — Repo imports UserRepository
- [ ] [SUGGESTION] ARCH: backend/db/repo/parents/parent.repository.ts:3 — Repo imports UserRepository
- [ ] [SUGGESTION] ARCH: backend/db/repo/shared/soft-delete.repository.ts:3 — SoftDeleteRepository imports AuditRepository
- [ ] [SUGGESTION] ARCH: (repo-reschedule-hooks) — RescheduleHooks callback pattern inverts dependency; service should fetch+validate then call repo write
- [ ] [SUGGESTION] ARCH: (quota-redeem-idempotency) — redeemForInstance mixes data access with idempotency-key reconciliation

#### Repo (8)
- [ ] [SUGGESTION] REPO: notification.repository.ts:42-50 — isValidForwardTransition duplicate; remove and let service call assertValidStatusTransition
- [ ] [SUGGESTION] REPO: state-changes.ts:525-560 — RescheduleHooks callback anti-pattern
- [ ] [SUGGESTION] REPO: quota.repository.ts:644-700 — redeemForInstance mixes data access with idempotency reconciliation
- [ ] [SUGGESTION] REPO: teacher-availability.repository.ts:730-763 — validateBookingAvailability orchestrates 3 reads; refactor to single context fetch
- [ ] [SUGGESTION] REPO: student.repository.ts:323 — versionMismatch error is business-facing; repo could return null
- [ ] [SUGGESTION] REPO: complaint.repository.ts — Generally clean (positive reference)
- [ ] [SUGGESTION] REPO: teacher-schedule.repository.ts:153 — Clean .mapWith(Number) reference
- [ ] [SUGGESTION] REPO: books/report.repository.ts:55,67 — raw ::numeric/::text casts (acceptable for string precision)

#### Tests (2)
- [ ] [SUGGESTION] TESTS: session-scalability.test.ts:18 — Local runInRollback/createTestUser duplicates; import shared helpers
- [ ] [SUGGESTION] TESTS: general-settings.test.ts:30 — GraphQL test queries seeded system setting; upsert test setting instead

#### Types (4)
- [ ] [SUGGESTION] TYPES: learning-resource.repository.ts:13 — Redundant `LearningResourceRow` alias; import LearningResourceReturnType directly
- [ ] [SUGGESTION] TYPES: student-status-history.repository.ts:7 — Redundant `StudentStatusHistoryRow` alias
- [ ] [SUGGESTION] TYPES: books/report.repository.ts:26 — Redundant `AttendanceReportRow` alias
- [ ] [SUGGESTION] TYPES: token-refresh.ts, quota-notification.builders.ts, complaint-validation.helpers.ts — Service-layer local types; consider @/backend/types

#### i18n (2)
- [ ] [SUGGESTION] I18N: localizedStringScalar.ts:13-65 — Scalar validation errors hardcoded English (developer-facing, low priority)
- [ ] [SUGGESTION] I18N: stringMapScalar.ts:17-104 — Same pattern (developer-facing, low priority)

#### GraphQL (44)
- [ ] [SUGGESTION] GRAPHQL: 44 payload/wrapper/metrics/pagination types missing `id` (intentional by design; not Apollo-normalizable entities)

#### Style (18)
- [ ] [SUGGESTION] STYLE: backend/lib/ratelimit.ts:128 — Deeply nested error handling (8 levels); extract ensureRateLimitTtl helper
- [ ] [SUGGESTION] STYLE: EntityCacheService.ts:80 — readFromCache nest 5 levels; early return + extract
- [ ] [SUGGESTION] STYLE: EntityCacheService.ts:121 — safeIndexTags nest 5 levels; extract parseTagIndex
- [ ] [SUGGESTION] STYLE: session.service.ts:161 — logoutUser nest 5 levels; extract endImpersonationIfActive
- [ ] [SUGGESTION] STYLE: credit.service.ts:140 — recordPurchaseIfMissing nest 5 levels; early return
- [ ] [SUGGESTION] STYLE: daily-schedule.repository.ts:93 — Repeated `typeof options === "object"` pattern; extract
- [ ] [SUGGESTION] STYLE: sanitizeIpAddress duplicated 4× across files; consolidate to shared helper
- [ ] [SUGGESTION] STYLE: findEnrollmentKeys duplicated between service and repo; remove service copy
- [ ] [SUGGESTION] STYLE: canViewX permission check duplicated 5× across pothos files; extract helper
- [ ] [SUGGESTION] STYLE: resolveAuthCtx duplicated 3×; lift into shared resolver helper
- [ ] [SUGGESTION] STYLE: assertPermission duplicated 5× across services; extract to shared
- [ ] [SUGGESTION] STYLE: admin-auth extraction duplicated 3× across storage routes; consolidate
- [ ] [SUGGESTION] STYLE: assertCanViewMonthlyReport duplicated 2×; extract
- [ ] [SUGGESTION] STYLE: getUserIdsWithPermission/resolveUsersWithPermission near-identical; unify
- [ ] [SUGGESTION] STYLE: issueAccessTokenForSession duplicated 2×; extract shared helper
- [ ] [SUGGESTION] STYLE: getStudentScope duplicated 2× between bridge and filter; pick one
- [ ] [SUGGESTION] STYLE: isZoomTokenResponse/isTokenResponse identical guards; generalize
- [ ] [SUGGESTION] STYLE: isErrorResponse/isMicrosoftTeamsErrorResponse identical; generalize

## Recommended Actions

### Priority 1 — Architecture & Layer Violations (CRITICAL)
Fix GraphQL resolver→repo direct calls and API route→repo direct calls first. Move orchestration from state-changes.ts to service layer.

### Priority 2 — Type Definitions (CRITICAL)
Move all 27 ad-hoc input/filter types from Pothos files and repositories to `@/backend/types`. Replace `Partial<typeof users.$inferInsert>` with proper InsertType aliases.

### Priority 3 — i18n Hardcoded Strings (CRITICAL)
Introduce a shared `resolveLocale(request)` helper and wire all API route error responses through `getServerTranslations(locale).errorsTranslations`. Add `localeC/tErrors` params to StorageService and StorageDbRepository methods.

### Priority 4 — Repository Business Logic (CRITICAL)
Move quota business-rule throws, teacher-availability validation, notification state machine, and scheduling orchestration to service layer. Note: Some state-changes.ts checks were re-added in round 6 for test compatibility — exercise caution.

### Priority 5 — Test Fix (CRITICAL)
Replace `rejects.toThrow()` in class-meeting-config test with try/catch helper.

### Priority 6 — SQL Typing Fixes (WARNING)
Add `.mapWith(Number)` to 3 queries missing it; remove redundant CAST.

### Priority 7 — Missing `id` on GraphQL types (WARNING)
Add `id` resolver to 10 entity-like Pothos object types for Apollo cache normalization.

### Priority 8 — Test Conventions (WARNING)
Wrap 6 test files in runInRollback; convert raw db.insert to entity-setup helpers.

### Priority 9 — SUGGESTION-level
Deduplicate shared helpers; extract nested code; clean up redundant aliases.

## Layer Compliance Notes

- AGENTS.md barrel conventions: Followed
- AGENTS.md logging rules: Clean (no console.* in backend source)
- AGENTS.md i18n rules: Violations concentrated in API routes (app/api/)
- AGENTS.md type definitions: Widespread violations in repos and Pothos (27 CRITICAL)
- AGENTS.md repo=data-access-only: State-changes.ts, quota.repository, teacher-availability have heavy business logic
- AGENTS.md test conventions: 1 CRITICAL (deadlock risk), 8 WARNING (missing runInRollback)
- AGENTS.md GraphQL id fields: 10 entity types missing `id`

## Fix Status

- Total findings: ~170 (deduplicated from 222 raw)
- Fixed: 0 / ~170
- Remaining: ~170
