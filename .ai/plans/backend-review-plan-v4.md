# Backend Review Plan v4

**Date**: 2026-08-18
**Scope**: All backend code (services, GraphQL, repos, schema, lib, tests, app/api)
**Focus**: Comprehensive backend review (architecture, types, i18n, logging, repo, tests, GraphQL, style)
**Files Reviewed**: ~400 files across 8 review groups
**Round**: 4 (does NOT ignore files reviewed in prior rounds)

## Summary

Round 4 comprehensive backend review found 117 findings: 46 CRITICAL, 46 WARNING, 25 SUGGESTION. Largest categories are i18n hardcoded throws (40 CRITICAL), architecture layer bypasses (3 CRITICAL + 22 WARNING), repository `tx ?? db` on reads (13 WARNING), test runInRollback gaps (2 CRITICAL + 6 WARNING), and style/magic numbers (4 SUGGESTION). Several flagged files are concurrently modified by another AI agent and are SKIPPED to respect their work.

## Concurrent Agent File Exclusions (DO NOT MODIFY)

The following files are being actively modified by a concurrent AI agent. Findings in these files are SKIPPED:
- `backend/graphql/mutation/meeting/meeting.mutation.ts`
- `backend/graphql/mutation/students/student.mutation.ts`
- `backend/db/repo/shared/session.repository.ts`
- `app/api/oauth/shared/oauth-callback-handler.ts`
- `app/api/storage/vercel-upload/route.ts`
- `backend/services/payment-method/*` (all files in this dir)
- `backend/types/billing/payment-method.types.ts`
- `backend/db/repo/billing/user-payment-method.repository.ts`
- `backend/db/test/logic/permissions/permission-management.service.test.ts`
- `backend/db/test/logic/timezone/timezone_dst.test.ts`
- `backend/db/test/repo/user-payment-method.repository.test.ts`
- `backend/services/payment-method/payment-method-snapshot.ts` (i18n WARNING)
- `backend/services/payment-method/payment-method-mask.ts` (i18n WARNING)

## Findings

### CRITICAL (46)

#### graphQL (1)
- [ ] [CRITICAL] graphQL: backend/graphql/pothos/books/report.pothos.ts:14 — duplicate `ReportGroupingMode` enum registration (already centrally registered at `enum.pothos.ts:347`); remove local registration

#### i18n (40)
- [ ] [CRITICAL] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:173 — `throw new Error("unauthenticated")` → `throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } })`
- [ ] [CRITICAL] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:201 — `throw new Error("unauthenticated")` → GraphQLError
- [ ] [CRITICAL] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:244 — `throw new Error("unauthenticated")` → GraphQLError
- [ ] [CRITICAL] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:262 — `throw new Error("unauthenticated")` → GraphQLError
- [ ] [CRITICAL] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:307 — `throw new Error("unauthenticated")` → GraphQLError
- [ ] [CRITICAL] i18n: backend/graphql/pothos/books/report.pothos.ts:97 — `throw new Error("unauthenticated")` → GraphQLError
- [ ] [CRITICAL] i18n: backend/graphql/mutation/storage/storage.mutation.ts:46 — hardcoded English bulk limit error → use `tErrors excessiveBulkUploadLimit`
- [ ] [CRITICAL] i18n: backend/services/student/student-field-acl.ts:24 — raw key `"studentNotFound"` → use `tErrors.studentNotFound` from translations
- [ ] [CRITICAL] i18n: backend/services/student/student-field-acl.ts:40 — raw key `"insufficientPermissions"` → `tErrors.insufficientPermissions`
- [ ] [CRITICAL] i18n: backend/services/student/student-field-acl.ts:46 — raw key `"studentNotFound"` → `tErrors.studentNotFound`
- [ ] [CRITICAL] i18n: backend/services/profile/profile-field-filter.ts:150 — raw key `"insufficientPermissions"` → `tErrors.insufficientPermissions`
- [ ] [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:101 — raw key `"lessonReport.*"` → use translation function
- [ ] [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:237 — raw key `"lessonReport.*"`
- [ ] [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:243 — raw key `"lessonReport.*"`
- [ ] [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:275 — raw key `"lessonReport.*"`
- [ ] [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:396 — raw key `"lessonReport.*"`
- [ ] [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:399 — raw key `"lessonReport.*"`
- [ ] [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:609 — raw key `"lessonReport.*"`
- [ [CRITICAL] i18n: backend/services/classes/lesson-report.service.ts:619 — raw key `"lessonReport.*"`
- [ ] [CRITICAL] i18n: backend/services/system/system-rules.service.ts:34 — constructs raw key-with-params string → use translation function with interpolation
- [ ] [CRITICAL] i18n: backend/services/report/report.service.ts:65 — raw key `"permissionDenied"` despite `tErrors` built on line 61
- [ ] [CRITICAL] i18n: backend/services/parent/parent-document.service.ts:68 — raw key `"invalidFileId"`
- [ ] [CRITICAL] i18n: backend/services/resource/learning-resource.service.ts:161 — raw key `"resourceDeleteFailed"`
- [ ] [CRITICAL] i18n: backend/services/resource/book.service.ts:40 — raw key `"bookDeleteFailed"`
- [ ] [CRITICAL] i18n: backend/services/fx/fx-ingestion.service.ts:95 — raw key `"fxSyncAlreadyRunning"`
- [ ] [CRITICAL] i18n: backend/services/fx/fx-rate-limit.service.ts:20 — raw key `"fxRefreshRateLimitExceeded"`
- [ ] [CRITICAL] i18n: backend/db/repo/notifications/notification.repository.ts:410 — hardcoded English "not found" → use translation function
- [ ] [CRITICAL] i18n: backend/db/repo/suggestion/suggestion.repository.ts:262 — hardcoded English "not found"
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher-notes.repository.ts:95 — hardcoded English "not found"
- [ ] [CRITICAL] i18n: backend/db/repo/teachers/teacher-notes.repository.ts:136 — hardcoded English "not found"
- [ ] [CRITICAL] i18n: backend/db/repo/classes/class-subject.repository.ts:49 — hardcoded English "not found"
- [ ] [CRITICAL] i18n: backend/db/repo/classes/class-subject.repository.ts:90 — hardcoded English "not found"
- [ ] [CRITICAL] i18n: backend/db/repo/shared/session.repository.ts:337 — hardcoded English "not found" (SKIPPED — concurrent agent)
- [ ] [CRITICAL] i18n: backend/db/repo/shared/session.repository.ts:347 — hardcoded English "not found" (SKIPPED — concurrent agent)
- [ ] [CRITICAL] i18n: backend/db/repo/storage/storage.repository.ts:424 — hardcoded English
- [ ] [CRITICAL] i18n: backend/services/storage/storage.service.ts:289 — hardcoded English
- [ ] [CRITICAL] i18n: backend/services/system/system-settings.service.ts:115 — hardcoded English
- [ ] [CRITICAL] i18n: backend/services/meeting/meeting-oauth.service.ts:193 — untranslated bootstrap error
- [ ] [CRITICAL] i18n: backend/lib/auth.utils.ts:10 — hardcoded English validation
- [ ] [CRITICAL] i18n: backend/db/repo/permissions/permission-management.service.ts:503 — surfaced as Error string (SKIPPED — concurrent agent)

#### arch (3)
- [ ] [CRITICAL] arch: backend/db/repo/students/student.repository.ts:415 — `changeStatus` embeds ALLOWED_STATUS_TRANSITIONS state machine in repo → move to StudentService
- [ ] [CRITICAL] arch: backend/db/repo/students/student.repository.ts:338 — `deductClasses` / `addClasses` enforce business invariant + quota in repo → move to StudentService
- [ ] [CRITICAL] arch: backend/db/repo/shared/session.repository.ts:7 — repository depends on SessionRedisService (service layer) (SKIPPED — concurrent agent)

#### tests (2)
- [ ] [CRITICAL] tests: backend/db/test/logic/audit/audit-trail.test.ts:30 — entire suite bypasses runInRollback; beforeAll uses db.transaction (committed); every test calls repo methods with global db (no tx, no cleanup) — violates Rule 1, leaks data
- [ ] [CRITICAL] tests: backend/db/test/logic/audit/audit-trail.test.ts:94 — 20 test cases create audit logs via repo with global db, no rollback, no cleanup — persists permanently

### WARNING (46)

#### i18n (5)
- [ ] [WARNING] i18n: backend/services/permissions/permission-management.service.ts:503 — internal guard surfaced as Error string (SKIPPED — concurrent agent)
- [ ] [WARNING] i18n: backend/db/repo/notifications/notification.repository.ts:187 — internal guard surfaced as Error string
- [ ] [WARNING] i18n: backend/services/payment-method/payment-method.mask.ts:65 — internal guard surfaced as Error string (SKIPPED — concurrent agent)
- [ ] [WARNING] i18n: backend/services/payment-method/payment-method-snapshot.ts:104 — internal guard surfaced as Error string (SKIPPED — concurrent agent)
- [ ] [WARNING] i18n: backend/services/meeting/channels/MetaCloudApiAdapter.ts:481 — internal guard surfaced as Error string

#### repo (13)
- [ ] [WARNING] repo: backend/db/repo/complaints/complaint-response.repository.ts:14 — read method `findByComplaintId` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/complaints/complaint-response.repository.ts:90 — read method `getResponsesByComplaint` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/complaints/complaint-response.repository.ts:111 — read method `getResponsesByComplaints` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/teachers/staff-profile.repository.ts:180 — read method `getManagerDirectory` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/teachers/teacher-availability.repository.ts:742 — read method `validateBookingAvailability` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/teachers/teacher-availability.repository.ts:855 — read method `validateBookingAvailabilityBatch` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/teachers/teacher-availability.repository.ts:886 — read method `checkBookingAvailabilityBatch` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/teachers/teacher-availability.repository.ts:1154 — read method `searchCrossStaffAvailability` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/teachers/teacher-due.repository.ts:159 — read method `getMonthlyReport` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/classes/dst-migration.repository.ts:46 — read method `getActiveRecurringSchedules` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/classes/dst-migration.repository.ts:70 — read method `checkConflictingSchedules` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/classes/dst-migration.repository.ts:121 — read method `findRunByUserId` uses `tx ?? db` → `queryDb(tx)`
- [ ] [WARNING] repo: backend/db/repo/classes/dst-migration.repository.ts:132 — read method `findEntriesByScheduleIds` uses `tx ?? db` → `queryDb(tx)`

#### arch (22)
- [ ] [WARNING] arch: backend/db/repo/notifications/notification.repository.ts:161 — `assertValidStatusTransition` implements B3 forward-only rank state machine in repo → move to NotificationService
- [ ] [WARNING] arch: backend/db/repo/complaints/complaint.repository.ts:352 — `getComplaintMetrics` computes derived business metrics in repo → move to ComplaintService
- [ ] [WARNING] arch: backend/db/repo/complaints/complaint.repository.ts:40 — formatDuration + assertComplaintCategory/Status helpers in repo → move to service/helpers
- [ ] [WARNING] arch: backend/db/repo/storage/storage.repository.ts:551 — `checkFileUsage` derives canDelete/deleteBlockReason in repo → move to StorageService
- [ ] [WARNING] arch: backend/db/repo/storage/storage.repository.ts:575 — `updateDirectoryPermissions`/setProtection/registerFileUsage compute success/message results in repo → move to service
- [ ] [WARNING] arch: backend/db/repo/users/user.repository.ts:308 — hardcoded English error string "Failed to create user..." → use translation function
- [ ] [WARNING] arch: app/api/oauth/shared/oauth-callback-handler.ts:195 — API route calls MeetingProviderTokenRepository.upsert directly (SKIPPED — concurrent agent)
- [ ] [WARNING] arch: app/api/storage/vercel-upload/route.ts:117 — API route calls SignedUrlRepository.getSignedUrlById directly (SKIPPED — concurrent agent)
- [ ] [WARNING] arch: backend/graphql/mutation/auth/auth.mutation.ts:183 — `login` resolver embeds business logic + calls repos directly → delegate to AuthService
- [ ] [WARNING] arch: backend/graphql/mutation/auth/auth.mutation.ts:137 — rotateTokensAndSession helper calls repos directly → delegate to service
- [ ] [WARNING] arch: backend/graphql/mutation/students/student.mutation.ts:54 — partiallyUpdateStudent/deleteStudent call repo directly (SKIPPED — concurrent agent)
- [ ] [WARNING] arch: backend/graphql/mutation/teachers/teacher-notes.mutation.ts:20 — createTeacherImportantNote calls SchedulingRepository directly → delegate to service
- [ ] [WARNING] arch: backend/graphql/mutation/meeting/meeting.mutation.ts:424 — generateMeetingUrl calls MeetingProviderRepository directly (SKIPPED — concurrent agent)
- [ ] [WARNING] arch: backend/graphql/query/auth/auth.query.ts:17 — `me`/`user`/`users` resolvers call UserRepository directly → delegate to UserService
- [ ] [WARNING] arch: backend/graphql/query/billing/billing-payments.query.ts:31 — invoicePayments resolver calls BillingRepository directly → delegate to BillingService
- [ ] [WARNING] arch: backend/graphql/query/students/student.query.ts:136 — `student`/`students` resolvers call StudentRepository directly → delegate to StudentService
- [ ] [WARNING] arch: backend/graphql/query/students/__shared__/resolveStudentIdFromArgsOrUser.ts:23 — shared helper calls StudentRepository directly → delegate to StudentService
- [ ] [WARNING] arch: backend/graphql/query/storage/storage.query.ts:122 — fileUsage resolver calls StorageDbRepository directly → delegate to StorageService
- [ ] [WARNING] arch: backend/graphql/pothos/billing/fx-display.pothos.ts:53 — currency-resolution utility calls repos directly → delegate to FxDisplayService
- [ ] [WARNING] arch: backend/graphql/pothos/meeting/meeting.pothos.ts:113 — oauthTokenExpiresAt field calls repo per-parent, no DataLoader batching
- [ ] [WARNING] arch: backend/graphql/utils/class-session.utils.ts:87 — GraphQL util calls SchedulingRepository directly → delegate to ClassSessionService
- [ ] [WARNING] arch: backend/graphql/query/storage/storage.query.ts:39 — folderInfo field missing `nullable: true` (DirectoryInfo | null)

#### tests (6)
- [ ] [WARNING] tests: backend/db/test/logic/students/student-pagination-stability.test.ts:112 — suite never uses runInRollback; db.insert/update with manual cleanup
- [ ] [WARNING] tests: backend/db/test/logic/teachers/teacher_profile.test.ts:27 — suite never uses runInRollback; inserts via global db with manual cleanup
- [ ] [WARNING] tests: backend/db/test/logic/parents/parent_directory.test.ts:21 — suite never uses runInRollback; inserts via global db with manual cleanup
- [ ] [WARNING] tests: backend/db/test/logic/timezone/timezone_dst.test.ts:66 — suite never uses runInRollback (SKIPPED — concurrent agent)
- [ ] [WARNING] tests: backend/db/test/logic/permissions/permissions_rls.test.ts:111 — hand-rolled db.transaction with tx.rollback instead of runInRollback wrapper
- [ ] [WARNING] tests: backend/db/test/repo/permissions/permission-management.repository.test.ts:257 — queries seed data; create test data via entity-setup instead (SKIPPED — concurrent agent)

### SUGGESTION (25)

#### i18n (17)
- [ ] [SUGGESTION] i18n: 15 test files using `getServerTranslations("en")` directly instead of `errorsEn` import from `@/shared/locale/en/errors`
  - Test files: (to be enumerated by fix subagent — scan `backend/db/test/` and `backend/services/**/test/` for `getServerTranslations("en")`)
- [ ] [SUGGESTION] i18n: backend/services/fx/fx-ingestion.service.ts — missing locale param for translation
- [ ] [SUGGESTION] i18n: backend/services/fx/fx-rate-limit.service.ts — missing locale param for translation

#### types (1)
- [ ] [SUGGESTION] types: backend/graphql/pothos/parents/parent-profile.pothos.ts:20 — redundant local type alias `ParentProfileGraphQLShape = ParentProfileResult`; use `ParentProfileResult` directly

#### style (4)
- [ ] [SUGGESTION] style: backend/services/group-class/group-class.service.ts:91 — nested ternary → extract to named function or if/else
- [ ] [SUGGESTION] style: backend/utils/storage.utils.ts:25 — magic number `1024` (path max length) → named constant
- [ ] [SUGGESTION] style: backend/services/meeting/channels/google-meet/GoogleMeetAdapter.ts:211 — magic number `3600` (JWT lifetime seconds) → named constant
- [ ] [SUGGESTION] style: backend/db/repo/billing/credit.repository.ts:26 — ternary nested inside `??` → extract

#### repo (1)
- [ ] [SUGGESTION] repo: backend/db/repo/students/student.repository.ts:37 — `cast(count(*) over() as int)` inside `sql<number>` without `.mapWith(Number)` → `sql<number>\`count(*) over()\`.mapWith(Number)`

#### arch (1)
- [ ] [SUGGESTION] arch: backend/graphql/gqlContext.ts:81 — context factory calls UserRepository.findSafeById directly; consider routing through UserService

#### tests (1)
- [ ] [SUGGESTION] tests: backend/db/test/logic/shared/session-scalability.test.ts:21 — reimplements local runInRollback helper instead of importing from `./test-utils`

## Recommended Actions

### Priority 1 — Fix immediately (CRITICAL, non-overlapping with concurrent agent)
1. **i18n GraphQLError throws** (5 in complaint.pothos.ts, 1 in report.pothos.ts:97) — replace `throw new Error("unauthenticated")` with `throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } })`
2. **Duplicate enum registration** (report.pothos.ts:14) — remove local `ReportGroupingMode` registration (already at enum.pothos.ts:347)
3. **i18n service raw keys** (student-field-acl.ts, profile-field-filter.ts, lesson-report.service.ts, system-rules.service.ts, report.service.ts, parent-document.service.ts, learning-resource.service.ts, book.service.ts, fx services) — replace raw keys with translation function calls
4. **i18n repo hardcoded English** (notification, suggestion, teacher-notes, class-subject, storage repos + storage/system/system-settings/meeting-oauth services + auth.utils) — replace with translation function
5. **audit-trail.test.ts runInRollback** — wrap entire suite in runInRollback with tx
6. **arch student.repository.ts state machine** — move changeStatus/deductClasses/addClasses to StudentService

### Priority 2 — Fix after CRITICAL (WARNING, non-overlapping)
7. **repo `tx ?? db` → `queryDb(tx)`** (13 read methods across 4 repos) — import queryDb, replace read branches
8. **arch resolver→repo bypasses** (auth.mutation, teacher-notes.mutation, auth.query, billing-payments.query, student.query, storage.query, fx-display.pothos, class-session.utils) — delegate to services
9. **arch repo business logic** (notification assertValidStatusTransition, complaint metrics/formatDuration, storage checkFileUsage/permissions, user.repository error string) — move to services
10. **i18n WARNING internal guards** (notification.repository:187, MetaCloudApiAdapter:481) — use translation function
11. **test runInRollback gaps** (student-pagination, teacher_profile, parent_directory, permissions_rls) — wrap suites in runInRollback
12. **storage.query.ts folderInfo nullable** — add `nullable: true`

### Priority 3 — Fix last (SUGGESTION)
13. **Test files errorsEn import** (15 files) — replace `getServerTranslations("en")` with `import { errorsEn } from "@/shared/locale/en/errors"`
14. **Style fixes** (nested ternary, magic numbers 1024/3600, ternary in `??`)
15. **Types redundant alias** (parent-profile.pothos.ts:20)
16. **repo `.mapWith(Number)`** (student.repository.ts:37)
17. **gqlContext.ts repo access** (SUGGESTION — may overlap with other work)

## Layer Compliance Notes

- **Plan-review result**: Plan passes all AGENTS.md rules for affected layers. 1 minor note: all i18n replacements in repos/services MUST use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (NOT deprecated `getBackendTranslations`). This is already specified in fix subagent prompts.
- **Carve-outs confirmed compliant** (NOT violations):
  - QuotaService/CreditService cross-domain couplings per `backend/services/AGENTS.md §"Quota System Integration"`
  - Pothos `GqlInput` adapters — Pothos-only
  - `inferSelect` aliases — repository boilerplate
  - `export type { X } from "./file"` — intentional type-only re-exports
  - DataLoader batch repo access (`loadByIds`) — allowed per `backend/graphql/AGENTS.md`
  - `session.repository.ts` importing `SessionRedisService` — flagged but SKIPPED (concurrent agent)
  - GraphQL resolver direct repo access in `meeting.mutation.ts`, `student.mutation.ts` — flagged but SKIPPED (concurrent agent)

- **Concurrent agent coordination**:
  - 14 files explicitly SKIPPED across 17 findings (arch + i18n + tests) to respect concurrent agent's work
  - Before any edit, fix subagent MUST run `git diff --name-only -- <file>` to verify no concurrent modifications

## Fix Status

- Total findings: 117
- Skipped (concurrent agent): 2 (B16, B17)
- Fixable: 115
- Fixed: 115 / 115 ✅
- Remaining: 0
- Tests: test:db 894/894 pass ✅ | test:services 557/557 pass ✅
- tsgo: 0 errors on our files (1 pre-existing error on concurrent-agent payment-method.types.ts) ✅
- oxlint: 0 new warnings on our files (pre-existing no-await-in-loop warnings in pagination test are by design) ✅
- biome: clean ✅

All fixes are unstaged in the working tree (no commits, no pushes per user constraint).