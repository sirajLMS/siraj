# Requirements: GraphQL Dev-Log Error Catching

## Document Information

- **Feature Name**: graphql-devlog-catch-errors
- **Target Directory**: `.ai/plans/graphql-devlog-catch-errors`
- **Outcome Directory**: `.ai/plans/graphql-devlog-catch-errors/outcome`
- **Version**: 1.0
- **Date**: 2026-08-19
- **Author**: Copilot CLI
- **Stakeholders**: Backend team, QA, GraphQL test maintainers
- **Related Research**: `.ai/plans/graphql-devlog-catch-errors/plan.md` (original analysis + Pothos plugin investigation)

## Introduction

The `bun test:graphql` run captured a 40K-line dev server log (`graphql_tests_logs/dev.log`). The log contains many backend issues that GraphQL tests fail to surface — tests pass because they only assert `result.error` truthiness, never `extensions.code` or translated messages. The goal is to modify the backend so it catches these issues and propagates them through GraphQL with proper error codes and translated messages.

### Feature Summary

Make `DomainError` subclasses propagate `extensions.code` through GraphQL responses, replace raw `new Error(...)` throws with typed `DomainError` subclasses carrying translated messages, fix FK-ordering bugs in test cleanup helpers, and upgrade GraphQL test assertions to check error codes/messages — not just `result.error` truthiness.

### Business Value

- Tests catch real bugs instead of silently passing over error categories
- Error messages reach the GraphQL client in the user's locale (Arabic/English)
- Test cleanup helpers stop leaking rows that corrupt subsequent test runs
- Dev server logs become scannable (structured warnings instead of raw English strings)

### Scope

**In scope**:
- `DomainError` → `GraphQLError` extension (keystone architecture change)
- Replacing raw `new Error(...)` throws with `DomainError` subclasses in 4 service/repository files
- Splitting collapsed validation errors into distinct translated codes
- Fixing FK RESTRICT ordering in test-helper cleanup (2 locations)
- Adding 3 new i18n error keys for scheduling validation
- Upgrading GraphQL test assertions to check `extensions.code`
- Adding optional surfacing for meeting-URL-missing and quota-release-skip
- Structured logging for notification-dropped and rate-limit-bypass warnings

**Out of scope**:
- Fixing Twilio/Resend provider errors (external SaaS, expected test-env noise)
- Migrating to Pothos `errorUnion`/`errorUnionField` union shape (explicitly rejected — see design.md)
- Reworking the notification dispatch UX
- Adding rate limiting to production (already enforced; only test bypass is the gap)

## Requirements

### Requirement 0: Pre-Implementation Baseline & Execution Protocol

**User Story:** As an AI agent or developer, I want to establish an error baseline before implementation and track outcomes persistently, so that I can distinguish new issues from pre-existing ones and avoid repeating past research.

#### Acceptance Criteria

1. WHEN feature implementation begins THEN system SHALL record baseline error counts (`bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id baseline`) to distinguish new from pre-existing issues.
2. WHEN feature implementation begins THEN system SHALL create deferred-items ledger at `.ai/plans/graphql-devlog-catch-errors/deferred-items.md`.
3. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`.
4. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/plans/graphql-devlog-catch-errors/outcome/<task-id>-outcome.md`.
5. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
6. WHEN any file is modified THEN system SHALL execute `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on that file (exit code 0 = pass).

### Requirement 0.5: Translation System & Enum Import Compliance

**User Story:** As a developer implementing user-facing features, I want compile-time type-safe translations and correct enum imports, so that I catch i18n and type errors at build time instead of runtime.

#### Acceptance Criteria (Translation System)

1. WHEN GraphQL resolver returns user-facing text THEN system SHALL use `ctx.t("namespace")` with string key (already bound to `ctx.locale`).
2. WHEN new error messages are added THEN system SHALL define keys in `shared/locale/types/errors/index.ts` and implement in both `shared/locale/en/errors/index.ts` and `shared/locale/ar/errors/index.ts`.
3. WHEN API routes or scripts use translations THEN system SHALL use `getServerTranslations(locale, "namespace")` from `@/shared/locale/server-graphql`.
4. WHEN namespace directory is created THEN system SHALL use lowercase casing.

#### Acceptance Criteria (Enum Imports)

5. WHEN enum is used in runtime expression THEN system SHALL import as value (not `import type`).
6. WHEN enum consumer exists THEN system SHALL use enum members NOT string literals.

### Requirement 1: DomainError propagates `extensions.code` through GraphQL

**User Story:** As a GraphQL test author, I want `DomainError` subclasses to surface their `code` property as `extensions.code` in GraphQL error responses, so that tests can assert on specific error categories instead of just `result.error` truthiness.

#### Acceptance Criteria

1. WHEN a service or repository throws `new NotFoundError("CODE", message)` THEN the GraphQL response SHALL include `extensions.code === "CODE"` on the error.
2. WHEN a service or repository throws `new UnauthorizedError("CODE", message)` THEN the GraphQL response SHALL include `extensions.code === "CODE"`.
3. WHEN a service or repository throws `new ValidationError("CODE", message)` THEN the GraphQL response SHALL include `extensions.code === "CODE"`.
4. WHEN a service or repository throws `new ForbiddenError("CODE", message)` THEN the GraphQL response SHALL include `extensions.code === "CODE"`.
5. WHEN a service or repository throws `new ConflictError("CODE", message)` THEN the GraphQL response SHALL include `extensions.code === "CODE"`.
6. WHEN `DomainError` is refactored to extend `GraphQLError` THEN existing `instanceof Error` checks SHALL still hold.
7. WHEN `DomainError` is refactored THEN the `err.message` property SHALL remain unchanged.
8. WHEN `DomainError` is refactored THEN the `err.code` property SHALL remain on the instance.
9. WHEN existing test `auth.test.ts:184` asserts `extensions.code === "UNAUTHENTICATED"` THEN it SHALL continue to pass (scopeAuth path unchanged).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: None (keystone — all other requirements depend on this)
- **Assumptions**: Apollo Server 4 preserves `extensions` on `GraphQLError` instances (confirmed by existing `UNAUTHENTICATED` path)

```log
log single issue here
[2026-08-19 05:00:26.608] [ERROR] Failed to delete complaint {
  error: Error [NotFoundError]: complaints not found: b6b5704b-93c0-4aee-ae84-22a327a5005c
  code: 'COMPLAINTS_NOT_FOUND'
}
```

### Requirement 2: Suggestion repository uses localized NotFoundError

**User Story:** As a GraphQL client, I want the "suggestion not found" error to carry a localized message and a specific error code, so that the UI can display the right message and the test can assert the specific failure.

#### Acceptance Criteria

1. WHEN `markSuggestionReviewed` is called with a non-existent `suggestionId` THEN the repository SHALL throw `NotFoundError("SUGGESTION_NOT_FOUND", localizedMessage)`.
2. WHEN the suggestion repository throws `NotFoundError` THEN the `message` SHALL be a translated string from the compile-time i18n system (not a raw English template literal).
3. WHEN the suggestion service calls the repository THEN it SHALL pass locale context (`tErrors` or `locale`) so the repository can produce a translated message.
4. WHEN the GraphQL test for "marking non-existent suggestion returns error" runs THEN it SHALL assert `error.extensions.code === "SUGGESTION_NOT_FOUND"`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: REQ-1 (DomainError → GraphQLError)
- **Assumptions**: The `recordNotFound` translation key already exists in `shared/locale/types/errors/index.ts`

```log
log single issue here
[2026-08-19 05:01:15.520] [ERROR] Error marking suggestion reviewed {
  error: Error: Suggestion 86dee45d-2df7-49e0-ba78-2f0442941734 not found
  (no `code` field — plain Error, not DomainError)
  at Object.markSuggestionReviewed (backend/db/repo/parents/suggestion.repository.ts:262:16)
}
```

### Requirement 3: Schedule service uses UnauthorizedError for daily metrics

**User Story:** As an unauthorized user querying admin dashboard schedule, I want the error to carry `extensions.code === "UNAUTHORIZED"`, so that the test can distinguish authorization failures from generic errors.

#### Acceptance Criteria

1. WHEN `getAdminDashboardSchedule` is called by an unauthorized user THEN the service SHALL throw `new UnauthorizedError("UNAUTHORIZED", tErrors.unauthorizedViewMetrics)`.
2. WHEN the error reaches the GraphQL client THEN `extensions.code` SHALL be `"UNAUTHORIZED"`.
3. WHEN the schedule test exercises the unauthorized path THEN it SHALL assert `error.extensions.code === "UNAUTHORIZED"`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: REQ-1 (DomainError → GraphQLError)
- **Assumptions**: `unauthorizedViewMetrics` translation key already exists

```log
log single issue here
[2026-08-19 05:01:08.766] [WARN] Unauthorized access to daily metrics { userId: '271c4477-f4a0-4bc1-acc1-7a39293e5dae' }
[2026-08-19 05:01:08.770] [ERROR] Error fetching admin dashboard schedule {
  error: Error: غير مصرح لك بعرض المقاييس.
  (no `code` field on the error — plain `Error`, not `DomainError`)
  at Object.getAdminDashboardSchedule (backend/services/schedule/schedule.service.ts:119:15)
}
```

### Requirement 4: Recurring class validation produces distinct error codes per failure mode

**User Story:** As a test author, I want each validation failure in `createRecurringClass` (missing days, zero duration, missing subjectId) to produce a different error code, so that tests can pinpoint which validation rule was violated.

#### Acceptance Criteria

1. WHEN `createRecurringClass` is called with `days: []` or `days: undefined` THEN the service SHALL throw `ValidationError("RECURRING_CLASS_DAYS_REQUIRED", tErrors.recurringClassDaysRequired)`.
2. WHEN `createRecurringClass` is called with `durationMinutes <= 0` THEN the service SHALL throw `ValidationError("INVALID_DURATION", tErrors.invalidDuration)`.
3. WHEN `createRecurringClass` is called with empty `subjectId` THEN the service SHALL throw `ValidationError("SUBJECT_REQUIRED", tErrors.subjectRequired)`.
4. WHEN the three new translation keys are added THEN they SHALL be defined in `shared/locale/types/errors/index.ts` under `SchedulingErrors` AND implemented in both `shared/locale/en/errors/index.ts` and `shared/locale/ar/errors/index.ts`.
5. WHEN the schedule test exercises the "no days" path THEN it SHALL assert `error.extensions.code === "RECURRING_CLASS_DAYS_REQUIRED"`.
6. WHEN the schedule test exercises the "missing subjectId" path THEN it SHALL assert `error.extensions.code === "SUBJECT_REQUIRED"`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: REQ-1 (DomainError → GraphQLError)
- **Assumptions**: The `invalidInput` key currently collapses all three; new keys replace it

```log
log single issue here
[2026-08-19 05:01:09.001] [ERROR] Error creating recurring class {
  input: { ..., days: [], subjectId: '86dee45d-2df7-49e0-ba78-2f0442941734', durationMinutes: 60 }
  error: Error [ValidationError]: إدخال غير صالح.
  code: 'VALIDATION'
}
[2026-08-19 05:01:09.021] [ERROR] Error creating recurring class {
  input: { ..., days: [{...}], subjectId: '', durationMinutes: 60 }
  error: Error [ValidationError]: إدخال غير صالح.
  code: 'VALIDATION'
}
```

### Requirement 5: Test-helper cleanup deletes FK-blocking rows before parent rows

**User Story:** As a test runner, I want `cleanupTestSuperAdmin` and `cleanupTestEntities` to delete FK-blocking child rows before their parent rows, so that cleanup succeeds and subsequent test runs don't encounter stale data.

#### Acceptance Criteria

1. WHEN `cleanupTestSuperAdmin` deletes a user THEN it SHALL first delete `admin_audit_logs` rows where `actorUserId = userId`.
2. WHEN `cleanupTestEntities` deletes class instances THEN it SHALL first delete `class_status_events` rows referencing those instances.
3. WHEN cleanup succeeds THEN `data.cleanupTestSuperAdmin` SHALL return `true` (not `false`).
4. WHEN cleanup succeeds THEN `data.cleanupTestEntities` SHALL return `true` (not `false`).
5. WHEN the test-helper test runs THEN it SHALL assert `data.cleanupTestSuperAdmin === true` AND `data.cleanupTestEntities === true`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: None (independent of REQ-1)
- **Assumptions**: `admin_audit_logs.actor_user_id` and `class_status_events.class_instance_id` have RESTRICT FK constraints

```log
log single issue here
[2026-08-19 05:00:55.140] [ERROR] Failed to clean up test super admin via helper service {
  error: DrizzleQueryError, code: '23001'
  cause: update or delete on table "users" violates RESTRICT setting of foreign key constraint "admin_audit_logs_actor_user_id_users_id_fkey" on table "admin_audit_logs"
  detail: 'Key (id)=(5a6bda19-a644-479f-ad35-0d81985596d0) is referenced from table "admin_audit_logs".'
}
```

```log
log single issue here
[2026-08-19 05:01:56.271] [ERROR] Failed to clean up test entities via helper service {
  error: DrizzleQueryError, code: '23001'
  cause: update or delete on table "class_instances" violates RESTRICT setting of foreign key constraint "class_status_events_class_instance_id_class_instances_id_fkey" on table "class_status_events"
  detail: 'Key (id)=(02466fe3-bdc0-4a9f-9d05-b5e0fa1aaac6) is referenced from table "class_status_events".'
}
```

### Requirement 6: Quota release skip uses localized warning and is observable in GraphQL

**User Story:** As a test author, I want the "quota-deducted instance has no recurringScheduleId" skip to produce a localized warning and be observable in the GraphQL response, so that tests can verify the manual-path was correctly detected as quota-free.

#### Acceptance Criteria

1. WHEN `releaseQuotaIfDeducted` encounters a `quotaDeducted=true` instance with `recurringScheduleId=null` THEN it SHALL log a localized WARN message (not a raw English string).
2. WHEN the skip occurs THEN the `deleteClassInstance` response SHALL include a `warnings` field (or `extensions.warning`) so the test can observe the skip.
3. WHEN the test exercises `createTeacherManualClassEntry` → `deleteClassInstance` on a quota-backed student THEN it SHALL assert that no quota release was needed.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: None (independent of REQ-1)
- **Assumptions**: The skip is intentional for manual/on-demand entries; only observability is the gap

```log
log single issue here
[2026-08-19 05:01:55.403] [WARN] Quota-deducted instance has no recurringScheduleId — cannot resolve quota {
  classInstanceId: '02466fe3-bdc0-4a9f-9d05-b5e0fa1aaac6',
  studentId: '6d1fd245-ea52-452c-8875-b91567c220c7'
}
```

### Requirement 7: Meeting URL absence is observable in GraphQL result

**User Story:** As a test author, I want the `createRecurringClass` result to include a `meetingUrl` field (nullable), so that tests can detect when no meeting provider was resolved.

#### Acceptance Criteria

1. WHEN `createRecurringClass` returns THEN the result SHALL include a nullable `meetingUrl: string | null` field.
2. WHEN no meeting provider is resolved THEN `meetingUrl` SHALL be `null`.
3. WHEN a meeting provider is resolved and URL generation succeeds THEN `meetingUrl` SHALL be the generated URL.
4. WHEN the "no provider resolved" path fires THEN the service SHALL log `logger.warn` (not `logger.info`) with a `providerLookupReason` field.
5. WHEN the test exercises a non-provider path THEN it SHALL assert `meetingUrl === null`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: None (independent of REQ-1)
- **Assumptions**: `MeetingConfigSnapshotService.generateAndAttachForClassInstance` already returns results via `Promise.allSettled`

```log
log single issue here
[2026-08-19 05:01:11.271] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '1af17352-...' }
[2026-08-19 05:01:11.272] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '88a9cd4a-...' }
[2026-08-19 05:01:12.207] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '638f9743-...' }
[2026-08-19 05:01:12.207] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '5ce30c92-...' }
[2026-08-19 05:01:19.740] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: 'ec3a294c-...' }
[2026-08-19 05:01:55.357] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '02466fe3-...' }
```

### Requirement 8: Silent 400 GraphQL responses are investigated and fixed

**User Story:** As a test author, I want the four mysterious 400 HTTP responses at end of the test run to be investigated and either fixed or surfaced as test assertions, so that silent test failures don't go undetected.

#### Acceptance Criteria

1. WHEN the four 400 responses are investigated THEN the root cause SHALL be identified (persisted-query miss, depth-limit, or constraint directive).
2. WHEN the root cause is a test-client issue THEN the test client SHALL be fixed to avoid the 400.
3. WHEN the root cause is a server-side validation issue THEN the server SHALL return a proper `GraphQLError` with `extensions.code`.
4. WHEN the test runs THEN it SHALL examine `result.error?.graphQLErrors` for non-empty error arrays on all mutations.

#### Additional Details
- **Priority**: Medium
- **Complexity**: High (investigation required)
- **Dependencies**: None (independent)
- **Assumptions**: Apollo Server 4 returns 400 for malformed queries or validation errors

```log
log single issue here
[2026-08-19 05:02:24.180] Executed resolver Mutation.endImpersonation in 12.4ms
 POST /api/graphql 200 in 31ms (next.js: 1.9ms, application-code: 29ms)
 POST /api/graphql 400 in 14ms (next.js: 1.6ms, application-code: 12ms)   ← no resolver, no error log
 POST /api/graphql 400 in 17ms (next.js: 2ms, application-code: 15ms)      ← no resolver, no error log
 POST /api/graphql 400 in 14ms (next.js: 1.9ms, application-code: 12ms)   ← no resolver, no error log
 POST /api/graphql 400 in 13ms (next.js: 2ms, application-code: 11ms)      ← no resolver, no error log
```

### Requirement 9: Notification dropped-payload warnings are structured

**User Story:** As a test log analyzer, I want the "dropped contactless payloads" WARN to include the missing channel type, so that logs are scannable and tests can assert expected dropped-payload counts.

#### Acceptance Criteria

1. WHEN `dispatchWithPreferences` drops a payload THEN the WARN message SHALL include the missing channel type (e.g., "missing email for user X").
2. WHEN dispatch-affecting mutations (`submitComplaint`, `cancelClassInstance`) run in test mode THEN the response SHALL include `skippedNotificationsByType` for test inspection.
3. WHEN notification tests run THEN they SHALL assert on the count of skipped notifications per type.

#### Additional Details
- **Priority**: Low
- **Complexity**: Medium
- **Dependencies**: None
- **Assumptions**: Log message stays developer-facing English; only structure changes

```log
log single issue here
[2026-08-19 05:00:07.321] [WARN] dispatchWithPreferences: dropped contactless payloads for user {
  userId: '07b5d593-4f7d-49c1-9dbe-af906552b30c', droppedCount: 1, userFound: true
}
[2026-08-19 05:00:07.322] [WARN] dispatchWithPreferences: dropped contactless payloads for user {
  userId: '07d0612e-a71d-40db-9056-c9798162dba7', droppedCount: 1, userFound: true
}
(… hundreds more …)
```

### Requirement 10: Rate limit dev bypass is test-enforceable

**User Story:** As a test author, I want to opt into rate-limit enforcement during tests via an env flag, so that I can verify the 429 path returns `extensions.code: "RATE_LIMIT_EXCEEDED"`.

#### Acceptance Criteria

1. WHEN `TEST_ENFORCE_RATE_LIMIT=1` env flag is set THEN the rate limiter SHALL enforce limits in test mode (no dev bypass).
2. WHEN the rate limit is exceeded in test mode THEN the response SHALL return `429` with `extensions.code: "RATE_LIMIT_EXCEEDED"`.
3. WHEN a new test exercises rate-limit enforcement THEN it SHALL fire enough requests to trip the 429 path and assert the code.

#### Additional Details
- **Priority**: Low
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: Production already enforces; only the test bypass is the gap

```log
log single issue here
[2026-08-19 05:00:07.269] [WARN] Rate limit would have been exceeded for identifier: [IP_REDACTED] (development mode, not enforced)
[2026-08-19 05:00:20.685] [WARN] Rate limit would have been exceeded for identifier: [IP_REDACTED] (development mode, not enforced)
(… dozens more …)
```

## UX/Navigation Requirements

This feature is backend-only (error handling, test infrastructure). No new routes, sidebar items, or UI components are introduced.

### New Routes & Role-Based Access

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| N/A | No new routes | N/A | N/A |

### Per-Audience Rendering

N/A — backend error handling changes are invisible to the UI. Existing UI components already render GraphQL error messages; the change is that those messages now carry `extensions.code` and are localized.

## Non-Functional Requirements

### Reliability Requirements

- WHEN `DomainError` is refactored to extend `GraphQLError` THEN existing tests that check `result.error` truthiness SHALL continue to pass (additive, not breaking).
- WHEN FK cleanup ordering is fixed THEN subsequent test runs SHALL not encounter stale data from prior runs.

### Security Requirements

- WHEN `DomainError` carries `extensions.code` THEN the code SHALL NOT leak internal implementation details (no SQL fragments, no stack traces in production — Apollo's `hideSchemaDetailsFromClientErrors` remains active).

## Constraints and Assumptions

### Technical Constraints

- No schema-shape change (no `errorUnion`/`errorUnionField` migration — explicitly rejected).
- `DomainError` must remain `instanceof Error` for backwards compatibility.
- Apollo Server 4 `extensions` preservation is relied upon (already proven by `UNAUTHENTICATED` path).
- Pothos errors plugin v4.9.1 installed; `defaultTypes: []` stays as-is (no-op).

### Business Constraints

- Provider errors (Twilio/Resend) are NOT in scope — they are expected test-env noise.
- Rate limiting in production is already enforced; only test bypass is the gap.

### Assumptions

- Apollo Server 4 preserves `extensions` on `GraphQLError` instances (confirmed by existing `auth.test.ts:184`).
- The `recordNotFound`, `unauthorizedViewMetrics`, and `invalidInput` translation keys already exist.
- Test helpers `runInRollback` and `entity-setup.ts` patterns are followed for any new test data.

## Success Criteria

### Definition of Done

- [ ] All acceptance criteria are met
- [ ] `bun run generate:gqlSchema` succeeds with no schema-shape change
- [ ] `bun codegen` succeeds
- [ ] `bun quality-gate` passes clean
- [ ] `bun test:graphql` passes with new `extensions.code` assertions
- [ ] Dev server log diff shows issues 1-9 resolved, issue 11 unchanged (expected), issues 10 & 12 structured

### Acceptance Metrics

- Zero new `[ERROR]` patterns in dev log compared to baseline (excluding provider errors)
- All affected GraphQL tests assert `extensions.code` on error paths
- `cleanupTestSuperAdmin` and `cleanupTestEntities` return `true` consistently

## Glossary

| Term | Definition |
|------|------------|
| DomainError | Base class for all siraj-specific errors (`NotFoundError`, `ValidationError`, etc.) defined in `backend/lib/errors.ts` |
| extensions.code | GraphQL error extension field that carries a machine-readable error category string |
| Pothos errors plugin | `@pothos/plugin-errors` v4.9.1 — wraps fields in union types when opted in via `errors: { types: [...] }` |
| Keystone fix | The foundational architecture change (REQ-1) that all other requirements depend on |
| FK RESTRICT | PostgreSQL foreign key constraint that prevents deletion of a parent row while child rows reference it |
