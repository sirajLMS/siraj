# Backend Review Plan v6

**Date**: 2026-08-18
**Scope**: All backend code (services, GraphQL, repos, schema, lib, tests, app/api)
**Focus**: Comprehensive backend review (architecture, types, i18n, logging, repo, tests, GraphQL, style)
**Files Reviewed**: 179 modified backend files across 8 review groups
**Round**: 6 (does NOT ignore files reviewed in prior rounds)

## Summary

Round 6 comprehensive backend review found 71 findings: 41 CRITICAL/HIGH, 22 WARNING/MEDIUM, 8 SUGGESTION/LOW. The primary issue is continued repo→service inversions in the scheduling layer (4 files importing `EffectiveMeetingService`) and `session.repository.ts`, plus widespread hardcoded English strings in GraphQL resolvers/pothos files (23 "unauthenticated"/"Unauthorized" throws). Architecture and i18n groups account for 75% of findings. Logging group returned CLEAN.

## Concurrent Agent File Exclusions (RESPECT — do not revert their changes)

The following files may be actively modified by a concurrent AI agent. If we find changes we didn't make, respect them — don't undo:
- `backend/types/billing/payment-method.types.ts`
- `backend/graphql/mutation/billing/payment-method.mutation.ts`
- `backend/graphql/query/billing/payment-method.query.ts`
- `backend/services/payment-method/*` (all files)
- `backend/db/repo/billing/user-payment-method.repository.ts`
- `backend/graphql/mutation/meeting/meeting.mutation.ts`
- `app/api/oauth/shared/oauth-callback-handler.ts`
- `app/api/storage/vercel-upload/route.ts`

## Findings

### CRITICAL/HIGH (41)

#### Architecture — Repo→Service Inversions (6 CRITICAL)
- [ ] [CRITICAL] arch: backend/db/repo/scheduling/state-changes.ts:14-18 — Repo imports `checkStateChangeAuth`, `validateStateTransition`, `validateRescheduleState`, `EffectiveMeetingService` from `@/backend/services`. Repo→service inversion + authorization/state-machine logic in repo.
- [ ] [CRITICAL] arch: backend/db/repo/scheduling/recurring.ts:18 — Repo imports `EffectiveMeetingService` and `resolveClassRate` from `@/backend/services`. `createRecurringScheduleWithInstances` orchestrates booking, validation, rate snapshot, meeting resolution.
- [ ] [CRITICAL] arch: backend/db/repo/scheduling/shared.ts:11 — Shared repo helper imports `EffectiveMeetingService` from `@/backend/services`. Also throws business-rule errors (`teacherBooked`, `studentBooked`, `meetingUrlInUse`).
- [ ] [CRITICAL] arch: backend/db/repo/scheduling/class-instances.ts:22 — Repo imports `EffectiveMeetingService` for meeting resolution. Repo→service inversion.
- [ ] [CRITICAL] arch: backend/db/repo/shared/session.repository.ts:7 — Repo imports `getRedisService`/`SessionRedisService` from `@/backend/services` and instantiates a session service singleton across ~40 sites.
- [ ] [CRITICAL] arch: backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.repository.ts:24 — Dynamic `await import("@/backend/services/session/class-instance-expiry.service")` and invocation of `ClassInstanceExpiryService.processExpiredInstances` from repo.

#### Architecture — Other (3 CRITICAL from types group)
- [ ] [CRITICAL] types: backend/db/repo/shared/signedUrl.repository.ts:6 — Ad-hoc entity type `SignedUrlEntity = typeof signedUrls.$inferSelect` defined locally; canonical `SignedUrlSelectType` exists in `@/backend/types/shared/signed-url.types.ts`.
- [ ] [CRITICAL] types: backend/db/repo/scheduling/leave-quota-usage.repository.ts:6 — Ad-hoc `LeaveQuotaUsageRow = typeof leaveQuotaUsage.$inferSelect`; canonical `LeaveQuotaUsageSelectType` exists in `@/backend/types/scheduling/scheduling.types.ts:72`.
- [ ] [CRITICAL] types: backend/db/repo/scheduling/leave-request.repository.ts:7 — Ad-hoc `LeaveRequestRow` and `CreateLeaveRequestInput` defined in repo; no canonical types exist — must declare in `@/backend/types/scheduling/`.

#### i18n — Hardcoded "unauthenticated"/"Unauthorized" throws (17 HIGH)
- [ ] [HIGH] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:172 — Hardcoded "unauthenticated" thrown in resolver.
- [ ] [HIGH] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:200 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:243 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:261 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/complaints/complaint.pothos.ts:306 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/complaints/complaintResponses.pothos.ts:40 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/parents/suggestion.pothos.ts:20 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/books/book.pothos.ts:23 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/books/book.pothos.ts:44 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/books/report.pothos.ts:95 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/storage/learning-resource.pothos.ts:84 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/classes/group-class.pothos.ts:114 — Hardcoded "Unauthorized" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/classes/group-class.pothos.ts:132 — Hardcoded "Unauthorized" thrown.
- [ ] [HIGH] i18n: backend/graphql/pothos/classes/group-class.pothos.ts:149 — Hardcoded "Unauthorized" thrown.
- [ ] [HIGH] i18n: backend/graphql/query/notifications/notification-alerts.query.ts:11 — Hardcoded "Unauthorized" thrown.
- [ ] [HIGH] i18n: backend/graphql/query/reports/__shared__/makeMonthlyReportQueryField.ts:98 — Hardcoded "unauthenticated" thrown.
- [ ] [HIGH] i18n: backend/graphql/mutation/students/student.mutation.ts:48 — Hardcoded "invalid_input" thrown; `tErrors` available in scope.

#### i18n — Hardcoded English in meeting.mutation.ts (6 HIGH — CONCURRENT AGENT FILE, check before editing)
- [ ] [HIGH] i18n: backend/graphql/mutation/meeting/meeting.mutation.ts:127 — Hardcoded "slug is required" thrown.
- [ ] [HIGH] i18n: backend/graphql/mutation/meeting/meeting.mutation.ts:131 — Hardcoded "urlAllowlist is required" thrown.
- [ ] [HIGH] i18n: backend/graphql/mutation/meeting/meeting.mutation.ts:135 — Hardcoded "fieldSchema is required" thrown.
- [ ] [HIGH] i18n: backend/graphql/mutation/meeting/meeting.mutation.ts:206 — Hardcoded "providerId is required" thrown.
- [ ] [HIGH] i18n: backend/graphql/mutation/meeting/meeting.mutation.ts:210 — Hardcoded "isDefault is required" thrown.
- [ ] [HIGH] i18n: backend/graphql/mutation/meeting/meeting.mutation.ts:214 — Hardcoded "details is required" thrown.

#### i18n — Other hardcoded strings (1 HIGH)
- [ ] [HIGH] i18n: backend/graphql/mutation/storage/storage.mutation.ts:46 — Hardcoded `"Bulk ${operation} operation limited to ${BULK_ITEM_LIMIT} items maximum"` thrown.

#### Repo — Dynamic import + SQL typing (2 HIGH)
- [ ] [HIGH] repo: backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.repository.ts:24 — Dynamic import of service layer. (Overlaps with arch finding above.)
- [ ] [HIGH] repo: backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.repository.ts:25 — Business orchestration invokes `ClassInstanceExpiryService.processExpiredInstances`.

#### Tests — Missing runInRollback (2 HIGH)
- [ ] [HIGH] tests: backend/db/test/logic/audit/audit-trail.test.ts:84 — Tests perform DB writes without runInRollback wrapper; no afterAll cleanup, leaking audit_logs rows.
- [ ] [HIGH] tests: backend/db/test/logic/audit/audit-trail.test.ts:344 — Test uses committing db.transaction without rollback, persisting audit_logs rows.

#### Style — Long functions (1 HIGH)
- [ ] [HIGH] style: backend/services/cron/queue-adapters/pgboss.adapter.ts:74 — `createPgBossAdapter` factory function spans 333 lines (74-406), exceeds 150-line limit.

### WARNING/MEDIUM (22)

#### Architecture — Business logic in repos (3 WARNING)
- [ ] [WARNING] arch: backend/db/repo/billing/billing.repository.ts:1149-1151 — `markInvoiceAsPaid` enforces invoice payment state-machine rule in the repo.
- [ ] [WARNING] arch: backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts:76,102 — Repository throws `leaveQuotaExceeded` business-rule.
- [ ] [WARNING] arch: backend/db/repo/shared/session.repository.ts:7 — (Overlaps with CRITICAL above.)

#### Architecture — API routes/resolvers calling repos directly (5 WARNING)
- [ ] [WARNING] arch: app/api/storage/vercel-upload/route.ts:114 — API route calls `SignedUrlRepository.getSignedUrlById` directly. (CONCURRENT AGENT FILE)
- [ ] [WARNING] arch: app/api/oauth/shared/oauth-callback-handler.ts:16,193 — OAuth callback calls `MeetingProviderTokenRepository.upsert` directly. (CONCURRENT AGENT FILE)
- [ ] [WARNING] arch: backend/graphql/mutation/meeting/meeting.mutation.ts:419 — `generateMeetingUrl` resolver calls `MeetingProviderRepository.getByIdOrThrow` directly. (CONCURRENT AGENT FILE)
- [ ] [WARNING] arch: backend/graphql/query/storage/storage.query.ts:122 — `fileUsage` resolver calls `StorageDbRepository.checkFileUsage` directly.
- [ ] [WARNING] arch: backend/graphql/pothos/meeting/meeting.pothos.ts:113 — `oauthTokenExpiresAt` field resolver calls `MeetingProviderTokenRepository.getByUserAndProvider` directly.

#### i18n — Scalars and API routes (5 MEDIUM)
- [ ] [MEDIUM] i18n: backend/graphql/pothos/permissions/permission-management.pothos.ts:35 — Hardcoded English "Invalid OverrideState value: ${o.state}" in resolver.
- [ ] [MEDIUM] i18n: backend/graphql/scalars/localizedStringScalar.ts:13 — Hardcoded English GraphQLError surfaced to clients.
- [ ] [MEDIUM] i18n: backend/graphql/scalars/localizedStringScalar.ts:21 — Hardcoded English GraphQLError with interpolated key.
- [ ] [MEDIUM] i18n: backend/graphql/scalars/localizedStringScalar.ts:24 — Hardcoded English GraphQLError.
- [ ] [MEDIUM] i18n: backend/graphql/scalars/stringMapScalar.ts:17 — Hardcoded English GraphQLError.
- [ ] [MEDIUM] i18n: backend/graphql/scalars/stringMapScalar.ts:23 — Hardcoded English GraphQLError.
- [ ] [MEDIUM] i18n: app/api/storage/vercel-upload/route.ts:184 — Hardcoded JSON error "Invalid upload request body". (CONCURRENT AGENT FILE)
- [ ] [MEDIUM] i18n: app/api/storage/upload/[id]/route.ts:76 — Hardcoded "SHA-256 hash mismatch" error.

#### Repo — SQL `::int`/`::float` casts without `.mapWith(Number)` (15 MEDIUM/LOW)
- [ ] [MEDIUM] repo: backend/db/repo/books/report.repository.ts:107-111 — 5 conditional aggregations with raw `::int`/`::float` casts without `.mapWith(Number)`.
- [ ] [MEDIUM] repo: backend/db/repo/books/report.repository.ts:220-225 — 6 conditional aggregations with raw `::int` casts without `.mapWith(Number)`.
- [ ] [MEDIUM] repo: backend/db/repo/billing/quota-ledger.repository.ts:139,152,153 — 3 raw `::int` casts without `.mapWith(Number)`.
- [ ] [LOW] repo: backend/db/repo/billing/credit.repository.ts:239,240 — 2 conditional aggregations with raw `::int` casts.
- [ ] [LOW] repo: backend/db/repo/students/student.repository.ts:37,468 — 2 raw `::int`/`cast(...)` usages without `.mapWith(Number)`.
- [ ] [LOW] repo: backend/db/repo/shared/cache.repository.ts:177 — Raw `::int` cast.
- [ ] [LOW] repo: backend/db/repo/storage/learning-resource.repository.ts:102,117 — 2 raw `::int` casts.

#### Style — Long functions (2 MEDIUM)
- [ ] [MEDIUM] style: backend/services/cron/queue-adapters/custom-sql.adapter.ts:85 — `createCustomSqlAdapter` spans ~160 lines.
- [ ] [MEDIUM] style: backend/services/whatsapp/whatsapp-account.service.ts:600 — `syncFromMeta` spans ~188 lines.

#### Tests — Seed data queries (3 MEDIUM/LOW)
- [ ] [MEDIUM] tests: backend/db/test/repo/permissions/permission-management.repository.test.ts:232 — Queries seed `isSystem=true` permission_group as test input.
- [ ] [MEDIUM] tests: backend/db/test/repo/permissions/permission-management.repository.test.ts:257 — Queries seed permission row as test input.
- [ ] [LOW] tests: backend/db/test/logic/permissions/permission-management.service.test.ts:31 — Helper queries seed group via global db.select.

### SUGGESTION/LOW (8)

#### Architecture — Resolver/loader direct repo calls (3 SUGGESTION)
- [ ] [SUGGESTION] arch: backend/graphql/gqlContext.ts:81 — Context builder calls `UserRepository.findSafeById` directly.
- [ ] [SUGGESTION] arch: backend/graphql/pothos/users/user.pothos.ts:19,48 — `loadableObject` loaders call repos directly.
- [ ] [SUGGESTION] arch: backend/graphql/pothos/classes/class-subject.pothos.ts:40 — `ClassSubject.category` loader calls repo directly.
- [ ] [SUGGESTION] arch: backend/graphql/pothos/classes/class-category.pothos.ts:8 — `ClassCategory` loader calls repo directly.

## Recommended Actions

### Priority 1: Repo→Service inversions in scheduling layer (CRITICAL x6)
- Remove `EffectiveMeetingService` imports from `state-changes.ts`, `recurring.ts`, `shared.ts`, `class-instances.ts`.
- Move state-machine validation (`validateStateTransition`, `validateRescheduleState`) and authorization (`checkStateChangeAuth`) to service callers.
- Move `ClassInstanceExpiryService.processExpiredInstances` call out of `daily-schedule.repository.ts` to service.
- Move `getRedisService`/`SessionRedisService` out of `session.repository.ts` to service layer.
- Restore repos to pure data-access.

### Priority 2: Hardcoded "unauthenticated"/"Unauthorized" throws (HIGH x17)
- Replace all `throw new Error("unauthenticated")` / `throw new Error("Unauthorized")` with `throw new GraphQLError(ctx.t("errors").unauthenticated, { extensions: { code: "UNAUTHORENTICATED" } })` (or existing pattern per file).
- Use `import { GraphQLError } from "graphql"`.
- Add missing translation keys to `shared/locale/types/errors/index.ts` if not already present.

### Priority 3: Hardcoded English in meeting.mutation.ts (HIGH x6 — CONCURRENT AGENT FILE)
- Check `git diff` before editing — respect concurrent agent's changes.
- Replace hardcoded `"X is required"` with `ctx.t("errors").xxx` translations.
- Skip if concurrent agent has already modified these or if changes conflict.

### Priority 4: Ad-hoc entity types in repos (CRITICAL x3)
- Replace `SignedUrlEntity` with `SignedUrlSelectType` from `@/backend/types/shared/signed-url.types.ts`.
- Replace `LeaveQuotaUsageRow` with `LeaveQuotaUsageSelectType` from `@/backend/types/scheduling/scheduling.types.ts`.
- Create `LeaveRequestSelectType`/`LeaveRequestInsertType` in `@/backend/types/scheduling/` and update repo + seed service to import from there.

### Priority 5: Resolver→repo direct calls (WARNING x5)
- Route `storage.query.ts:122` through `StorageService.checkFileUsage`.
- Route `meeting.pothos.ts:113` through meeting service.
- Route `meeting.mutation.ts:419` through meeting service. (CONCURRENT AGENT FILE)
- Route `vercel-upload/route.ts` through storage service. (CONCURRENT AGENT FILE)
- Route `oauth-callback-handler.ts` through meeting service. (CONCURRENT AGENT FILE)

### Priority 6: Test violations (HIGH x2, MEDIUM x2, LOW x1)
- Wrap `audit-trail.test.ts:84,344` in `runInRollback`.
- Fix permission-management tests to create test data instead of querying seed data.

### Priority 7: SQL `::int`/`::float` casts (MEDIUM/LOW x22 individual)
- Add `.mapWith(Number)` to all `sql<number>` expressions using raw `::int`/`::float` casts.

### Priority 8: Long functions (HIGH x1, MEDIUM x2)
- Decompose `pgboss.adapter.ts:74-406` into helper modules.
- Decompose `custom-sql.adapter.ts:85-245` into helper modules.
- Extract `syncFromMeta` into smaller steps.

### Priority 9: i18n scalars and API routes (MEDIUM x8)
- Add i18n to scalar validation messages.
- Add i18n to API route error responses.
- Skip files owned by concurrent agent unless safe to edit.

## Layer Compliance Notes

1. **Repo→Service inversion** — Scheduling layer has 6 repo files importing from `@/backend/services`. Session repo also imports service singleton. This is the same pattern fixed in rounds 4-5 for storage/notification/complaint repos.
2. **i18n hardcoded throws** — 24+ GraphQL resolvers across many files use hardcoded English strings instead of `ctx.t("errors")`.
3. **Ad-hoc type definitions** — 3 repos define local entity types instead of using canonical types from `@/backend/types`.
4. **_Long functions** — 3 functions exceed the 150-line CodeScene limit.
5. **SQL typing** — 22+ `sql<number>` expressions use raw `::int`/`::float` casts without `.mapWith(Number)`.
6. **Test conventions** — `audit-trail.test.ts` missing `runInRollback`; permission tests query seed data.

## Fix Status

- Total findings: 71
- Skipped (concurrent agent): ~10 (meeting.mutation, vercel-upload, oauth-callback-handler)
- Fixable: ~61
- Fixed: 0 / 71
- Remaining: 71
