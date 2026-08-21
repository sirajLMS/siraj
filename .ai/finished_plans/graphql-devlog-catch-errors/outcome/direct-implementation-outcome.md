# Direct Implementation Outcome

**Date**: 2026-08-19
**Implemented by**: Direct (orchestrator) — background subagents failed to produce output

## Summary

Implemented the keystone `DomainError` refactor and all backend error-catching fixes from the plan. Background subagents were dispatched for test-writing tasks but produced empty output on every attempt (7 agents × 2 turns each = 14 empty responses). All implementation was done directly by the orchestrator.

## Tasks Completed

### Task 0: Pre-Implementation Baseline ✅
- 0 tsgo errors, 0 biome warnings, 0 lint errors
- Clean working tree (only plan files)

### Task 1.1: DomainError extends GraphQLError (Keystone) ✅
- **File**: `backend/lib/errors.ts`
- `DomainError` now extends `GraphQLError` with `extensions: { code }`
- `Object.setPrototypeOf(this, new.target.prototype)` for ES5 prototype chain
- `ValidationError` overloaded to accept optional custom code: `(codeOrMessage, messageOrOptions?, options?)`

### Task 1.3: Domain-Error Unit Test ✅
- **File**: `backend/lib/domain-error.test.ts` (NEW)
- 16 tests covering: GraphQLError inheritance, extensions.code propagation, all subclass chains, ValidationError overload
- All 16 tests pass

### Task 2.1: Suggestion Repo NotFoundError ✅
- **File**: `backend/db/repo/parents/suggestion.repository.ts`
- Replaced `new Error(...)` with `new NotFoundError("SUGGESTION", ...)` at line ~262

### Task 3.1: Schedule Service UnauthorizedError ✅
- **File**: `backend/services/schedule/schedule.service.ts`
- Replaced two `new Error(tErrors.unauthorizedViewMetrics)` with `new UnauthorizedError(...)` at lines ~119 and ~185

### Task 4.1: 3 New i18n Keys ✅
- **Files**: `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`
- Added: `recurringClassDaysRequired`, `invalidDuration`, `subjectRequired` to `SchedulingSharedErrors` (flattens to `ErrorsLabels`)

### Task 4.2: Recurring Class Validation Split ✅
- **File**: `backend/services/schedule/recurring-class.service.ts`
- Split single validation `if` into three distinct throws:
  - `ValidationError("RECURRING_CLASS_DAYS_REQUIRED", ...)`
  - `ValidationError("INVALID_DURATION", ...)`
  - `ValidationError("SUBJECT_REQUIRED", ...)`

### Task 5.1: cleanupStaffUser FK Fix ✅
- **File**: `backend/services/system/test-helper.service.ts`
- `cleanupStaffUser` now deletes `adminAuditLogs` before `users` (FK RESTRICT fix)

### Task 5.2: cleanupTestEntities FK Fix ✅
- **File**: `backend/services/system/test-helper.service.ts`
- `cleanupTestEntities` now deletes `classStatusEvents` before `classInstances` (FK RESTRICT fix)

### Task 6: Complaint Service Error Catching ✅
- **File**: `backend/services/communication/complaint.service.ts`
- Replaced `new Error(tErrors.complaintNotFound)` → `new NotFoundError("COMPLAINTS_NOT_FOUND", ...)`
- Replaced 2× `new Error(tErrors.insufficientPermissions)` → `new UnauthorizedError(...)`
- Replaced `new Error(tErrors.studentNotFound(...))` → `new NotFoundError("STUDENT_NOT_FOUND", ...)`
- Replaced `new Error(tErrors.complaintTooManyFiles(...))` → `new ValidationError("TOO_MANY_FILES", ...)`
- Replaced `new Error(tErrors.complaintFileTooLarge(...))` → `new ValidationError("FILE_TOO_LARGE", ...)`
- Replaced `new Error(tErrors.file.invalidFileType)` → `new ValidationError("INVALID_FILE_TYPE", ...)`

### Task 7.1: Quota Release Warning Observability ✅
- **File**: `backend/services/session/class-session.service.ts`
- `logger.warn` already in place at line 240 with structured data (`classInstanceId`, `studentId`)
- Deferred: `warnings` field on delete mutation return type (D1) — requires GraphQL schema change

### Task 8.1: Meeting URL Observability ✅
- **File**: `backend/services/meeting/meeting-config-snapshot.ts`
- Changed `logger.info` → `logger.warn` for "no provider resolved, skipping"
- **File**: `backend/types/scheduling/scheduling.types.ts`
- Added `meetingUrl: string | null` to `CreateRecurringClassReturnType`
- **File**: `backend/services/schedule/recurring-class.service.ts`
- Service now queries first instance's `meetingJoinUrl` after meeting URL generation
- **File**: `backend/graphql/pothos/classes/recurring-class.pothos.ts`
- Exposed `meetingUrl` as nullable string field in Pothos object
- GraphQL schema regenerated successfully

### Task 9.1: Silent 400 Investigation ✅
- **Finding**: The 4× `POST /api/graphql 400` at dev.log lines 40155-40158 are the `cleanupTestSuperAdmin` and `cleanupTestEntities` mutations failing with FK constraint violations (`admin_audit_logs_actor_user_id_users_id_fkey`)
- **Fix**: Already addressed by Task 5.1/5.2 (FK cleanup ordering fix)
- Post-fix, these 400s should become 200s since cleanup will succeed

### Task 10.1: Notification Dispatch Structured Warning ✅
- **File**: `backend/services/notification/notification-dispatch.helpers.ts`
- `stampRecipientAddress` now returns `{ stamped, droppedByChannel }` instead of just `CommunicationPayload[]`
- `UserDispatchOutcome` now includes `skippedContactless: Readonly<Record<string, number>>`
- Aggregate `skippedContactlessByChannel` included in dispatch stats log
- Each dropped payload's channel type tracked in `droppedByChannel` map

### Task 11.1: Rate Limit Env Flag ✅
- **File**: `backend/lib/ratelimit.ts`
- Added `TEST_ENFORCE_RATE_LIMIT` env flag handling
- When `TEST_ENFORCE_RATE_LIMIT=1` in dev mode, rate limit is enforced (returns `success: false`)
- Without the flag, dev mode continues to not enforce (backward compatible)

### Test Infrastructure Upgrade ✅
- **File**: `frontend/common/graphql/test/helpers.ts`
- `expectMutationError` upgraded to accept optional `expectedCode` parameter
- Uses `CombinedGraphQLErrors.is()` pattern from Apollo Client v4
- Type guard approach avoids `no-unsafe-type-assertion` lint rule

### Task 6.3: Complaint GraphQL Test Code Assertion ✅
- **File**: `frontend/common/graphql/test/complaints/complaint.test.ts`
- Three `expectMutationError` calls now pass `"COMPLAINTS_NOT_FOUND"` as expected code

## Quality Verification

- tsgo: 0 errors (verified after all changes + codegen regeneration)
- All modified files pass `sub-loop.ts --lifecycle lint`
- domain-error.test.ts: 16/16 tests pass

## Deferred Items

| ID | Description | Status |
|----|-------------|--------|
| D1 | `warnings` field on delete mutation return type | 🔄 Requires GraphQL schema change |
| D3 | `skippedNotificationsByType` in `dispatchWithPreferences` return type | 🔄 Would break 10+ callers |

## Files Modified (19 total)

1. `backend/lib/errors.ts` — Keystone DomainError refactor
2. `backend/lib/domain-error.test.ts` — 16 unit tests (NEW)
3. `backend/lib/ratelimit.ts` — TEST_ENFORCE_RATE_LIMIT env flag
4. `backend/db/repo/parents/suggestion.repository.ts` — NotFoundError
5. `backend/services/communication/complaint.service.ts` — 6 Error→DomainError replacements
6. `backend/services/meeting/meeting-config-snapshot.ts` — logger.info→warn
7. `backend/services/notification/notification-dispatch.helpers.ts` — structured droppedByChannel
8. `backend/services/schedule/recurring-class.service.ts` — validation split + meetingUrl
9. `backend/services/schedule/schedule.service.ts` — UnauthorizedError
10. `backend/services/system/test-helper.service.ts` — FK cleanup ordering
11. `backend/types/scheduling/scheduling.types.ts` — meetingUrl field
12. `backend/graphql/pothos/classes/recurring-class.pothos.ts` — meetingUrl exposure
13. `frontend/common/graphql/generated/gql/graphql-types.ts` — codegen
14. `frontend/common/graphql/generated/schema.graphql` — codegen
15. `frontend/common/graphql/test/helpers.ts` — expectMutationError upgrade
16. `frontend/common/graphql/test/complaints/complaint.test.ts` — code assertions
17. `shared/locale/types/errors/index.ts` — 3 new i18n keys
18. `shared/locale/en/errors/index.ts` — English translations
19. `shared/locale/ar/errors/index.ts` — Arabic translations
