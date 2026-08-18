# Backend Review Plan (Round Two)

**Date**: 2026-08-17
**Scope**: All backend code (services, GraphQL, repos, schema, lib, tests, app/api, seeds)
**Focus**: Comprehensive — architecture, types, i18n, logging, repo, tests, graphql, style
**Files Reviewed**: ~3,300+ backend files

## Summary

Round two re-reviewed the entire backend after round one's 18 CRITICAL fixes (11 files modified, 1 deleted). 8 parallel review subagents found **191 new findings** (93 CRITICAL, 84 WARNING, 14 SUGGESTION). The dominant violation classes are: (1) repositories throwing hardcoded English errors (25+ repos), (2) test files calling `getServerTranslations("en")` directly (28 instances across 20 files), (3) `logic/shared/` tests lacking `runInRollback` wrappers, (4) GraphQL resolvers calling repositories directly, (5) local type definitions in Pothos/repos instead of importing canonical types from `backend/types/`, (6) read methods using `tx ?? db` instead of `queryDb(tx)`.

Round one's 74 deferred architectural findings (Batches I–N) remain documented in the round-one plan and are NOT re-reported here.

## Findings

### CRITICAL (93)

#### i18n — Repositories throwing hardcoded English errors (25)
- [ ] [CRITICAL] i18n: backend/db/repo/parents/parent.repository.ts:940 — Repo throws "Parent upsert failed" (hardcoded English, no locale)
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher.repository.ts:50 — Repo throws "Failed to create teacher profile"
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher.repository.ts:325 — Repo throws "Teacher upsert failed"
- [ ] [CRITICAL] i18n: backend/db/repo/students/student.repository.ts:616 — Repo throws "Student upsert failed"
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/staff-profile.repository.ts:74 — Repo throws "Failed to create staff profile"
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/staff-profile.repository.ts:425 — Repo throws "Failed to update staff profile"
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher-notes.repository.ts:60 — Repo throws "Failed to create teacher note"
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher-notes.repository.ts:93 — Repo throws `Note ${id} not found`
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher-notes.repository.ts:134 — Repo throws `Note ${id} not found` (duplicate)
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher-due.repository.ts:22 — Repo throws "Failed to insert teacher due row"
- [ ] [CRITICAL] i18n: backend/db/repo/classes/class-subject.repository.ts:48 — Repo throws `Subject ${id} not found`
- [ ] [CRITICAL] i18n: backend/db/repo/classes/class-subject.repository.ts:89 — Repo throws `Subject ${value} not found`
- [ ] [CRITICAL] i18n: backend/db/repo/classes/class-subject.repository.ts:118 — Repo throws "Failed to create class subject"
- [ ] [CRITICAL] i18n: backend/db/repo/classes/subject-resource.repository.ts:112 — Repo throws "Failed to attach resource to subject"
- [ ] [CRITICAL] i18n: backend/db/repo/classes/subject-resource.repository.ts:152 — Repo throws "Resource link not found"
- [ ] [CRITICAL] i18n: backend/db/repo/classes/subject-resource.repository.ts:186 — Repo throws "Subject resource not found"
- [ ] [CRITICAL] i18n: backend/db/repo/complaints/complaint.repository.ts:180 — Repo throws "Failed to create complaint"
- [ ] [CRITICAL] i18n: backend/db/repo/complaints/complaint-response.repository.ts:70 — Repo throws "Failed to create complaint response"
- [ ] [CRITICAL] i18n: backend/db/repo/parents/suggestion.repository.ts:58 — Repo throws "Failed to submit suggestion"
- [ ] [CRITICAL] i18n: backend/db/repo/parents/suggestion.repository.ts:258 — Repo throws `Suggestion ${suggestionId} not found`
- [ ] [CRITICAL] i18n: backend/db/repo/storage/learning-resource.repository.ts:145 — Repo throws "Failed to create learning resource"
- [ ] [CRITICAL] i18n: backend/db/repo/meeting/meeting-provider-token.repository.ts:76 — Repo throws "Failed to update meeting provider token"
- [ ] [CRITICAL] i18n: backend/db/repo/meeting/meeting-provider-token.repository.ts:86 — Repo throws "Failed to insert meeting provider token"
- [ ] [CRITICAL] i18n: backend/db/repo/meeting/class-meeting-config.repository.ts:103 — Repo throws "Class meeting config requires classInstanceId or recurringScheduleId"
- [ ] [CRITICAL] i18n: backend/db/repo/billing/user-payment-method.repository.ts:75 — Repo throws "Failed to create user payment method"
- [ ] [CRITICAL] i18n: backend/db/repo/billing/currency-hedge.repository.ts:41 — Repo throws "Failed to create currency hedge"

#### i18n — Service hardcoded errors (2)
- [ ] [CRITICAL] i18n: backend/services/billing/billing-payment-proof.helpers.ts:38 — Service throws "Invalid file type" (file.invalidFileType key exists in ErrorsLabels)

#### Tests — `getServerTranslations("en")` direct calls (28 instances across 20 files)
- [ ] [CRITICAL] tests: backend/db/test/logic/permissions/permission-management.service.test.ts:10 — getServerTranslations("en") called directly (Rule 19)
- [ ] [CRITICAL] tests: backend/db/test/logic/permissions/permission-management.service.test.ts:30 — getSystemGroup() queries seed data via db.select (Rule 15)
- [ ] [CRITICAL] tests: backend/db/test/logic/permissions/permission-management.service.test.ts:322 — db.select inside test body NOT wrapped in runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/permissions/permission-management.service.test.ts:335 — db.select inside test body NOT wrapped in runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/permissions/permission-management.service.test.ts:362 — db.select inside test body NOT wrapped in runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/permissions/permission-management.service.test.ts:374 — db.select inside test body NOT wrapped in runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/timezone/timezone_dst.test.ts:50 — getServerTranslations("en") direct call (Rule 19)
- [ ] [CRITICAL] tests: backend/db/test/logic/timezone/timezone_dst.test.ts:77 — db.update NOT wrapped in runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/timezone/timezone_dst.test.ts:262 — db.execute NOT wrapped in runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/timezone/timezone_dst.test.ts:268 — db.select NOT wrapped in runInRollback
- [ ] [CRITICAL] tests: backend/db/test/repo/supported-payment-link.repository.test.ts:10 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/supported-online-account.repository.test.ts:10 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/supported-mobile-wallet.repository.test.ts:11 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/meeting/user-meeting-config.repository.test.ts:13 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/meeting/meeting-provider.repository.test.ts:72 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/meeting/meeting-provider.repository.test.ts:99 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/meeting/meeting-provider.repository.test.ts:128 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/meeting/meeting-provider.repository.test.ts:143 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/meeting/meeting-provider.repository.test.ts:152 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/logic/billing/billing-safeguards.test.ts:16 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/logic/students/student_status_transition.test.ts:11 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/scheduling/scheduling-state-changes.repository.test.ts:302 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/scheduling/scheduling-state-changes.repository.test.ts:331 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/scheduling/scheduling-state-changes.repository.test.ts:354 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/students/student.repository.test.ts:13 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/logic/lms/credit-workflow.test.ts:21 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/concurrency.test.ts:14 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/logic/scheduling/leave_quota.test.ts:256 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/logic/scheduling/leave_quota.test.ts:274 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/logic/scheduling/scheduling_security.test.ts:17 — getServerTranslations("en") direct call
- [ ] [CRITICAL] tests: backend/db/test/repo/billing/billing.repository.test.ts:15 — getServerTranslations("en") direct call

#### Tests — `logic/shared/` tests without runInRollback (11)
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/soft_delete_security.test.ts:5 — db imported; entire file (6 tests) lacks runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/soft_delete_security.test.ts:49 — db.execute inside test body, no runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/soft_delete_security.test.ts:75 — Test mutates DB without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/soft_delete_security.test.ts:108 — Test mutates DB without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/soft_delete_security.test.ts:162 — Test mutates DB without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/hours-recalc.test.ts:4 — db imported; entire file (8 tests) lacks runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/hours-recalc.test.ts:146 — db.insert/update without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/hours-recalc.test.ts:223 — db.insert without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/poly-integrity.test.ts:4 — db imported; entire file (5 tests) lacks runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/poly-integrity.test.ts:45 — Test mutates DB without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/poly-integrity.test.ts:99 — Test mutates DB without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/cache_split_routing.test.ts:4 — db imported; entire file lacks runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/cache_split_routing.test.ts:114 — db.insert without runInRollback
- [ ] [CRITICAL] tests: backend/db/test/logic/shared/cache_split_routing.test.ts:119 — db.insert without runInRollback

#### GraphQL — Enum registration in domain files (4)
- [ ] [CRITICAL] graphql: backend/graphql/pothos/meeting/effective-meeting.pothos.ts:7 — EffectiveMeetingSource enum registered with hardcoded `values: [...]` array; no backing TS enum in backend/enum/
- [ ] [CRITICAL] graphql: backend/graphql/pothos/parents/suggestion.pothos.ts:32 — SuggestionStatus enum registered in domain file instead of shared/enum.pothos.ts
- [ ] [CRITICAL] graphql: backend/graphql/pothos/complaints/complaint.pothos.ts:26 — ComplaintCategory enum registered in domain file
- [ ] [CRITICAL] graphql: backend/graphql/pothos/complaints/complaint.pothos.ts:31 — ComplaintStatus enum registered in domain file

#### Architecture — Resolver→Repo bypasses (14)
- [ ] [CRITICAL] arch: backend/graphql/mutation/auth/auth.mutation.ts:198-252 — Login resolver calls RateLimitRepository, UserRepository, SessionRepository directly
- [ ] [CRITICAL] arch: backend/graphql/mutation/auth/auth.mutation.ts:43,58,61 — refreshToken/logout calls UserRepository, SessionRepository directly
- [ ] [CRITICAL] arch: backend/graphql/query/auth/auth.query.ts:17,32,49 — All 3 auth queries call UserRepository directly
- [ ] [CRITICAL] arch: backend/graphql/mutation/students/student.mutation.ts:15-20 — Resolver defines inline permission helper + calls StudentRepository directly
- [ ] [CRITICAL] arch: backend/graphql/query/students/student.query.ts:136,158 — student/students resolvers call StudentRepository directly (inconsistent with studentsDirectory which uses service)
- [ ] [CRITICAL] arch: backend/graphql/query/billing/billing-payments.query.ts:25-31 — invoicePayments resolver does inline permission checks + calls BillingRepository directly
- [ ] [CRITICAL] arch: backend/graphql/mutation/meeting/meeting.mutation.ts:411-419 — generateMeetingUrl resolver does inline permission check + calls MeetingProviderRepository directly
- [ ] [CRITICAL] arch: backend/graphql/mutation/teachers/teacher-notes.mutation.ts:20 — createTeacherImportantNote calls SchedulingRepository directly + inline validation
- [ ] [CRITICAL] arch: backend/graphql/query/storage/storage.query.ts:122 — fileUsage query calls StorageDbRepository directly (inconsistent with rest of file using getStorageService())
- [ ] [CRITICAL] arch: backend/graphql/pothos/billing/fx-display.pothos.ts:44,53,58,74 — Pothos field helpers call UserRepository/BillingRepository/ParentRepository directly
- [ ] [CRITICAL] arch: backend/graphql/query/students/__shared__/resolveStudentIdFromArgsOrUser.ts:23 — Shared resolver helper calls StudentRepository directly
- [ ] [CRITICAL] arch: app/api/storage/vercel-upload/route.ts:114-149 — API route calls SignedUrlRepository directly + runs business validation
- [ ] [CRITICAL] arch: app/api/oauth/shared/oauth-callback-handler.ts:193-200 — OAuth callback handler writes tokens via MeetingProviderTokenRepository directly
- [ ] [CRITICAL] arch: backend/db/repo/parents/parent.repository.ts:411-476 — setParentAccountStatus does cross-repo orchestration (parents + users) in repository layer

#### Types — Local type definitions duplicating canonical types (7)
- [ ] [CRITICAL] types: backend/graphql/pothos/storage/storage.pothos.ts:154 — Inline objectRef<{ type: string; count: number; size: bigint }>("FileTypeBreakdown") duplicates storage.types.ts; widens FileTypes→string
- [ ] [CRITICAL] types: backend/graphql/pothos/storage/storage.pothos.ts:226 — Inline objectRef<{ path: string; error: string }>("BulkOperationFailure") duplicates storage.types.ts:246
- [ ] [CRITICAL] types: backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:16 — Local AvailabilityWindowUpsertInput duplicates canonical from backend/types
- [ ] [CRITICAL] types: backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:27 — Local RecurringUnavailabilityCreateInput duplicates canonical
- [ ] [CRITICAL] types: backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:39 — Local VacationRequestCreateInput duplicates canonical
- [ ] [CRITICAL] types: backend/db/repo/storage/learning-resource.repository.ts:10 — Local LearningResourceCreateInput duplicates LearningResourceSubmitInput
- [ ] [CRITICAL] types: backend/services/resource/learning-resource.service.ts:9 — Local CreateResourceInput duplicates LearningResourceSubmitInput

### WARNING (84)

#### i18n — Service hardcoded errors (3)
- [ ] [WARNING] i18n: backend/services/auth/permissions.service.ts:102 — "Permission group not found" (permissionManagement.permissionGroupNotFound key exists)
- [ ] [WARNING] i18n: backend/services/billing/billing-payment-proof.helpers.ts:50 — "A payment proof is already pending review for this invoice." (no errors-namespace key; must add)
- [ ] [WARNING] i18n: backend/services/system/system-rules.service.ts:34 — Throws sentinel string `absentTooEarly:${waitingMinutes}:${locale??"ar"}` instead of translated message

#### Tests — Post-rollback db.select patterns (5)
- [ ] [WARNING] tests: backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts:83 — db.select without runInRollback
- [ ] [WARNING] tests: backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts:95 — db.insert without runInRollback
- [ ] [WARNING] tests: backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts:103 — db.select without runInRollback
- [ ] [WARNING] tests: backend/db/test/repo/complaints/complaint.repository.test.ts:564 — db.select after runInRollback (post-rollback verification; legitimate pattern)
- [ ] [WARNING] tests: backend/db/test/repo/teachers/teacher.repository.test.ts:403 — db.select after runInRollback (post-rollback verification; legitimate pattern)

#### GraphQL — Missing `id` fields on object types (16)
- [ ] [WARNING] graphql: backend/graphql/pothos/complaints/complaint.pothos.ts:38 — ComplaintFile missing `id` field
- [ ] [WARNING] graphql: backend/graphql/pothos/billing/credit.pothos.ts:14 — CreditBalance missing `id` field
- [ ] [WARNING] graphql: backend/graphql/pothos/billing/quota.pothos.ts:73 — QuotaPaginatedResult missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/billing/quota.pothos.ts:84 — QuotaLedgerPaginatedResult missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/complaints/complaint.pothos.ts:112 — ComplaintQueuePaginatedResult missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/students/student.pothos.ts:130 — StudentsWithFiltersResponse missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/books/report.pothos.ts:74 — AttendanceReportPayload missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/teachers/teacher-due.pothos.ts:43 — TeacherMonthlyReport missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/teachers/teacher-due.pothos.ts:63 — TeacherPendingDuesSummary missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/cron/cron.pothos.ts:94 — CronPaginatedSchedules missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/cron/cron.pothos.ts:101 — CronPaginatedRuns missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/permissions/permission-management.pothos.ts:110 — UserOverride missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/permissions/permission-group-simulation.objects.pothos.ts:12 — SimulatablePermissionGroup missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/permissions/permission-group-simulation.objects.pothos.ts:23 — PermissionGroupSimulationStatus missing `id`
- [ ] [WARNING] graphql: backend/graphql/pothos/billing/payment-method.pothos.ts:57 — PaymentMethodDetails value object has no `id` (lower priority)

#### GraphQL — Enum location violations (4)
- [ ] [WARNING] graphql: backend/graphql/pothos/books/report.pothos.ts:21 — ReportGroupingMode enum lives in backend/db/repo, not backend/enum/
- [ ] [WARNING] graphql: backend/graphql/pothos/students/student.pothos.ts:182 — StudentsOrderByColumn enum registered in domain
- [ ] [WARNING] graphql: backend/graphql/pothos/storage/storage.pothos.ts:6 — FileTypes enum defined in backend/types, not backend/enum/
- [ ] [WARNING] graphql: backend/graphql/pothos/storage/storage.pothos.ts:11 — UploadType enum defined in backend/types, not backend/enum/
- [ ] [WARNING] graphql: backend/graphql/pothos/storage/storage.pothos.ts:15 — FileSortField enum defined in backend/types, not backend/enum/

#### Repo — `tx ?? db` instead of `queryDb(tx)` (22)
- [ ] [WARNING] repo: backend/db/repo/auth/impersonation.repository.ts:82 — findActiveByActor uses `tx ?? db` instead of queryDb(tx)
- [ ] [WARNING] repo: backend/db/repo/auth/impersonation.repository.ts:89 — findActiveBySessionId uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/audit/audit.repository.ts:167 — countAuditLogs uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/audit/audit.repository.ts:172 — countAdminAuditLogs uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/audit/audit.repository.ts:178 — getRecentAdminAuditLogs uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:75 — getPermissionIdByKey uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:121 — listAllPermissions uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:138 — listAllGroups uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:196 — getGroupById uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:222 — findGroupBySlug uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:473 — listUsersInGroup uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:560 — getUserOverrides uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:606 — listAllGroupUsers uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/permissions/permission-management.repository.ts:644 — listUserIdsWithPermission uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/parents/parent.repository.ts:882 — getParentStudentProgress uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/parents/parent.repository.ts:906 — getParentWorkshopPromo uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/teachers/teacher.repository.ts:271 — getTeacherProfileForEdit uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/teachers/staff-profile.repository.ts:189 — getManagerDirectory uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/shared/session.repository.ts:96 — getSessionConfig uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/shared/session.repository.ts:539 — getUserSessionMetadata uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/students/student.repository.ts:566 — findByIdempotencyKeys uses `tx ?? db`
- [ ] [WARNING] repo: backend/db/repo/students/student.repository.ts:625 — hasTeacherAssignment uses `tx ?? db`

#### Repo — Conditional aggregation `::int` casts missing `.mapWith(Number)` (10)
- [ ] [WARNING] repo: backend/db/repo/books/report.repository.ts:107 — `sql<number>SUM(CASE WHEN ...)::int` raw cast instead of `.mapWith(Number)`
- [ ] [WARNING] repo: backend/db/repo/books/report.repository.ts:220 — calculateEngagementGrowth raw `::int` casts
- [ ] [WARNING] repo: backend/db/repo/students/student.repository.ts:37 — buildStudentFilterBaseQuery raw CAST
- [ ] [WARNING] repo: backend/db/repo/students/student.repository.ts:488 — `count(*)::int` raw cast
- [ ] [WARNING] repo: backend/db/repo/billing/quota-ledger.repository.ts:139 — countByQuotaId raw cast
- [ ] [WARNING] repo: backend/db/repo/billing/quota-ledger.repository.ts:152 — computeBalance raw casts
- [ ] [WARNING] repo: backend/db/repo/billing/credit.repository.ts:239 — getCreditBalance raw casts
- [ ] [WARNING] repo: backend/db/repo/shared/cache.repository.ts:177 — countByKeyPrefix raw cast
- [ ] [WARNING] repo: backend/db/repo/storage/learning-resource.repository.ts:102 — count sub-query raw cast
- [ ] [WARNING] repo: backend/db/repo/storage/learning-resource.repository.ts:117 — count query raw cast

#### Architecture — Business logic in repos/resolvers (6)
- [ ] [WARNING] arch: backend/db/repo/teachers/teacher-availability.repository.ts:393-556 — Repository contains business-logic validation (time range, vacation status transitions)
- [ ] [WARNING] arch: backend/db/repo/students/student.repository.ts:138,189,265 — Repository invokes StudentUtils.validateName + throws BusinessErrors
- [ ] [WARNING] arch: backend/graphql/pothos/meeting/meeting.pothos.ts:110 — oauthTokenExpiresAt field resolver calls MeetingProviderTokenRepository directly
- [ ] [WARNING] arch: backend/graphql/mutation/auth/auth.mutation.ts:178-265 — Login resolver embeds entire credential-verification + rate-limit flow inline
- [ ] [WARNING] arch: backend/graphql/query/auth/auth.query.ts:46 — users query does inline limit-capping business logic
- [ ] [WARNING] arch: backend/graphql/mutation/students/student.mutation.ts:42 — partiallyUpdateStudent builds input map inline

#### Types — Local type definitions that should be canonical (17)
- [ ] [WARNING] types: backend/db/repo/scheduling/leave-request.repository.ts:7 — Local LeaveRequestRow (no canonical LeaveRequestSelectType in backend/types)
- [ ] [WARNING] types: backend/db/repo/scheduling/leave-request.repository.ts:9 — Local CreateLeaveRequestInput (no canonical SubmitInput)
- [ ] [WARNING] types: backend/db/repo/scheduling/class-status-events.repository.ts:7 — Local ClassStatusEventSeedInsertInput duplicates canonical InsertType
- [ ] [WARNING] types: backend/db/repo/students/student-status-history.repository.ts:9 — Local CreateInitialStatusHistoryInput; canonical exists at backend/types
- [ ] [WARNING] types: backend/db/repo/students/student-progress.repository.ts:6 — Local StudentProgressUpsertInput via Pick<>
- [ ] [WARNING] types: backend/db/repo/scheduling/recurring-schedule.repository.ts:12 — Local RecurringScheduleUpsertInput
- [ ] [WARNING] types: backend/db/repo/scheduling/recurring-schedule.repository.ts:17 — Local RecurringScheduleDayUpsertInput
- [ ] [WARNING] types: backend/db/repo/scheduling/recurring-schedule.repository.ts:24 — Local ScheduleDayKey utility type
- [ ] [WARNING] types: backend/db/repo/storage/learning-resource.repository.ts:17 — Local LearningResourceListResult duplicates canonical (name shadowing)
- [ ] [WARNING] types: backend/db/repo/books/report.repository.ts:19 — Local AttendanceReportFilters interface + ReportGroupingMode enum in repo
- [ ] [WARNING] types: backend/db/repo/classes/lesson-report.repository.ts:17 — Local PendingReviewFilters in repo
- [ ] [WARNING] types: backend/db/repo/teachers/staff-profile.repository.ts:34 — Local ManagerProfileUpdateInput in repo
- [ ] [WARNING] types: backend/db/repo/meeting/class-meeting-config.repository.ts:20 — Local ClassScope/RecurringScope/ScopeFilter types in repo
- [ ] [WARNING] types: backend/db/repo/shared/signedUrl.repository.ts:6 — Local SignedUrlEntity/SignedUrlEntityInput via $inferSelect/$inferInsert
- [ ] [WARNING] types: backend/db/repo/scheduling/leave-quota-usage.repository.ts:6 — Local LeaveQuotaUsageRow alias (no canonical SelectType)
- [ ] [WARNING] types: backend/services/parent/parent-document.service.ts:6 — Local ParentDocumentRow/LinkedDocumentResult (no canonical counterpart)
- [ ] [WARNING] types: backend/services/staff/manager-profile.service.ts:10 — Local UpdateManagerProfileInput (duplicates staff-profile.repository.ts:34)

### SUGGESTION (14)

#### Style — Magic numbers (2)
- [ ] [SUGGESTION] style: backend/db/seeds/classes/seed-class-communications.ts:31 — Magic number `86400000` (ms/day); define named constant
- [ ] [SUGGESTION] style: backend/services/cache/PostgresCacheAdapter.ts:207 — Magic number `3600000` (ms/hour); define named constant (peer code uses `CACHE_TAG_INDEX_TTL`)

#### GraphQL — `id` naming convention (2)
- [ ] [SUGGESTION] graphql: backend/graphql/pothos/auth/auth.pothos.ts:54 — AdminResetPasswordResult exposes `userId` not canonical `id`
- [ ] [SUGGESTION] graphql: backend/graphql/pothos/billing/payment-method.pothos.ts:57 — PaymentMethodDetails value object has no `id` (acceptable for value objects)

#### Repo — Prepared statement candidates (4)
- [ ] [SUGGESTION] repo: backend/db/repo/storage/storage.repository.ts:332 — isFileInUse uses raw db.execute, no tx propagation
- [ ] [SUGGESTION] repo: backend/db/repo/complaints/complaint-response.repository.ts:14 — findByComplaintId uses `tx ?? db`, doesn't import queryDb
- [ ] [SUGGESTION] repo: backend/db/repo/classes/dst-migration.repository.ts:31 — Read methods use `tx ?? db` instead of `queryDb(tx)`
- [ ] [SUGGESTION] repo: backend/db/repo/teachers/teacher.repository.ts:27 — findById is a candidate for Prepared Statements 2.0

#### Architecture — State machine placement (1)
- [ ] [SUGGESTION] arch: backend/db/repo/notifications/notification.repository.ts:161 — assertValidStatusTransition encodes B3 delivery state machine; cleaner in NotificationDispatchService

#### Types — Redundant type aliases (5)
- [ ] [SUGGESTION] types: backend/db/repo/storage/learning-resource.repository.ts:8 — Local alias LearningResourceRow = LearningResourceReturnType (redundant re-naming)
- [ ] [SUGGESTION] types: backend/db/repo/students/student-status-history.repository.ts:7 — Local alias StudentStatusHistoryRow = StudentStatusHistorySelectType (redundant)
- [ ] [SUGGESTION] types: backend/db/repo/books/report.repository.ts:26 — Local alias AttendanceReportRow = AttendanceReportRowReturnType (redundant)
- [ ] [SUGGESTION] types: backend/db/repo/scheduling/recurring-schedule.repository.ts:19 — Local narrow RecurringScheduleDayUpsertInput["dayOfWeek"]
- [ ] [SUGGESTION] types: backend/db/repo/meeting/class-meeting-config.repository.ts:20 — Local ClassScope/RecurringScope tiny positional scopes

## Recommended Actions

### Batch A — i18n: Repo throws (27 CRITICAL)
Replace hardcoded English `throw new Error("...")` in repositories with locale-aware pattern. Requires adding `locale?` parameter to repo methods and using `getServerTranslations(locale, "errors")` to get translated messages. **CAUTION**: Most repos don't accept `locale` yet; callers must be updated to pass `ctx.locale`. This is a wide-reaching refactor affecting ~25 repo files + their callers.

### Batch B — i18n: Service throws (1 CRITICAL, 3 WARNING)
- CRITICAL: `billing-payment-proof.helpers.ts:38` — replace "Invalid file type" with `tErrors.invalidFileType` (key exists)
- WARNING: `permissions.service.ts:102` — use `permissionManagement.permissionGroupNotFound(id)` (key exists)
- WARNING: `billing-payment-proof.helpers.ts:50` — needs new errors-namespace key for pending-review message
- WARNING: `system-rules.service.ts:34` — replace sentinel string with translated message

### Batch C — Tests: getServerTranslations direct calls (28 CRITICAL)
CONFIRMED VALID per `backend/db/test/AGENTS.md` Rule 19 — "Do Not Call `getServerTranslations` Directly in Tests." All 28 instances across 20 files are real violations. Tests should use the `expectRepoError` try/catch pattern and assert on substrings of the translated message instead. Fix approach: remove the `getServerTranslations("en")` import and call, replace expected-error-key assertions with `expectRepoError` + `.toContain()` on substring. **CAUTION**: Mechanical but requires per-file analysis of how the translation result is used in each test.

### Batch D — Tests: logic/shared tests without runInRollback (14 CRITICAL)
6 test files (`logic/shared/soft_delete_security`, `hours-recalc`, `poly-integrity`, `cache_split_routing`, plus `timezone_dst`, `auth_rate_limit_enforcement`) use raw `db.*` without `runInRollback`. They clean up in `afterAll`. **CAUTION**: Wrapping in `runInRollback` for these multi-test files requires significant test restructuring. These tests intentionally mutate + verify cross-test state and `afterAll` cleanup. High risk of breaking test semantics.

### Batch E — Tests: permission-management service test db.select (4 CRITICAL)
4 `db.select` calls inside test bodies not wrapped in `runInRollback`. These appear to be read-only verification queries. **CAUTION**: Test restructuring needed.

### Batch F — GraphQL: Enum registration in domain files (4 CRITICAL)
Move enum registrations from domain Pothos files to `shared/enum.pothos.ts`. The 3 `backend/enum/`-backed enums (SuggestionStatus, ComplaintCategory, ComplaintStatus) should be registered centrally. EffectiveMeetingSource needs a backing TS enum created first.

### Batch G — Architecture: Resolver→Repo bypasses (14 CRITICAL)
Move business logic from resolvers to services. **CAUTION**: Major architectural refactor — same territory as round one's deferred Batch J. Requires creating/wiring service methods. High risk; defer.

### Batch H — Types: Local type definitions duplicating canonical (7 CRITICAL)
Replace local type definitions with imports from `backend/types/`. These are mechanical find-and-replace fixes — low risk, high value.

### Batch I — GraphQL: Missing `id` fields (14 WARNING)
Add synthetic/derived `id` resolver to wrapper/paginated object types for Apollo cache normalization. Pattern exists (ParentAssignedStudentsResult:32).

### Batch J — Repo: `tx ?? db` → `queryDb(tx)` (22 WARNING)
Mechanical find-and-replace: replace `tx ?? db` with `queryDb(tx)` in read methods. Low risk if `queryDb` is already imported.

### Batch K — Repo: Conditional aggregation `.mapWith(Number)` (10 WARNING)
Replace raw `::int` casts with `.mapWith(Number)` pattern per AGENTS.md. Mechanical but requires care with SQL fragment syntax.

### Batch L — Other WARNING/SUGGESTION findings (deferred)
- Types: 17 WARNING local type definitions (medium risk, each needs canonical type creation in backend/types)
- Architecture: 6 WARNING business logic in repos/resolvers (same as round one deferred Batch K)
- Style: 2 SUGGESTION magic numbers (trivial fixes)
- Other SUGGESTIONs (low priority)

## Layer Compliance Notes

- **Quota system carve-out**: QuotaService/CreditService cross-domain couplings remain compliant per `backend/services/AGENTS.md §"Quota System Integration"` — NOT re-reported.
- **`inferSelect` aliases**: Raw drizzle `$inferSelect` aliases used as repository boilerplate remain compliant — NOT re-reported.
- **Pothos `GqlInput` adapters**: Legitimately Pothos-only input types carrying branded types — NOT re-reported.
- **`general-user-create` pattern**: Already exposes `id` — NOT re-reported.
- **getServerTranslations in tests**: CONFIRMED VALID per `backend/db/test/AGENTS.md` Rule 19 — "Do Not Call `getServerTranslations` Directly in Tests." The rule explicitly states tests should NOT call this function directly to construct expected error strings; instead use the `expectRepoError` try/catch pattern. All 28 direct `getServerTranslations("en")` calls in tests are REAL CRITICAL violations. NO downgrade.
- **`logic/shared/` tests without runInRollback**: These are integration tests that intentionally mutate state and clean up in `afterAll`. Converting to `runInRollback` would break multi-test state sharing. May warrant AGENTS.md amendment rather than enforcement.

## Fix Status

- Total findings: 191
- Fixed: 0 / 191
- Remaining: 191
- Round one deferred (Batches I–N): 74 findings (documented in `backend-review-plan.md`, not re-reported)

## Round One Summary (for reference)

- Round one fixed: 18 CRITICAL findings across 11 files (2 cleanup + 16 i18n throws)
- Round one plan: `.ai/plans/backend-review-plan.md`
- Round one verification: tsgo, oxlint, biome, ESLint, duplicates all clean on modified files
- No commits made (per user request)
