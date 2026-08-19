# Plan: Catch and surface all dev-log issues through GraphQL with translated errors

## Overview

The `bun test:graphql` run captured a 40K-line dev server log (`graphql_tests_logs/dev.log`).
Most of the issues are **provider errors** (Twilio trial account, Resend API key invalid tests) — these should NOT be fixed.
This plan identifies the **real backend issues** that GraphQL tests fail to capture,
and proposes backend fixes so that:
1. issues that silently warn/return 200 with `result.error` are propagated as proper GraphQL errors with codes
2. all user-facing error messages use the compile-time translation system in `shared/locale/`
3. tests assert on error codes/messages, not just `result.error` truthiness

## Root cause — confirmed against `@pothos/plugin-errors` v4.9.1 source

The Siraj schema builder (`backend/graphql/gqlSchemaBuilder.ts`) has:

```ts
errors: {
  defaultTypes: [],
  onResolvedError: error => { logger.error("Handled error:", error); },
},
```

Reading the installed plugin source (`node_modules/@pothos/plugin-errors/{src,esm}/index.js`,
`src/types.ts`, `src/schema-builder.ts`) and the indexed Pothos docs confirms that **this config alone
does NOT make `DomainError.code` flow to GraphQL `extensions.code`**:

- The errors plugin's only job is to wrap fields that opt in via `errors: { types: [...] }` (or
  `t.errorUnionField` / `builder.errorUnion`) into a `union SomethingResult = ... | Success` shape.
  When the resolver throws one of the listed error classes, the plugin resolves to the matching
  error object type and exposes `message` and any extra exposed fields.
- `defaultTypes: []` means **no field** is opted-in by default. Adding `NotFoundError`,
  `UnauthorizedError`, etc. to `defaultTypes` only does something useful for fields that ALSO set
  `errors: {}` / `errors: { types: [...] }`. Siraj does not use `errorUnion`/`errorUnionField`
  anywhere (verified via `grep errorUnion backend/graphql/`).
- The plugin has `set<option>Update` no mechanism to stamp `extensions.code` on a plain
  `GraphQLError`. It wraps, it does not rewrite.

**Therefore the keystone fix is NOT "set `defaultTypes`"**. The keystone fix is a minimal
**error normalizer**: a function that converts a thrown `DomainError` (which holds a `code`
property, see `backend/lib/errors.ts`) into a `GraphQLError` carrying `extensions: { code }`.
This is exactly what Siraj already does by hand in:

- `backend/graphql/gqlSchemaBuilder.ts:156` — `scopeAuth.unauthorizedError`
  (`return new GraphQLError(result.message, { extensions: { code: isUnauthenticated ? "UNAUTHENTICATED" : "FORBIDDEN" } })`)
  → verified working by `frontend/common/graphql/test/auth/auth.test.ts:184`
  (`expect(gqlError?.extensions?.code).toBe("UNAUTHENTICATED")`).
- `backend/graphql/mutation/meeting/meeting.mutation.ts:129-215` —
  `throw new GraphQLError(tErrors...., { extensions: { code: "BAD_USER_INPUT" } })`.

The plain-`Error` throws from services/repositories (NotFoundError from
`soft-delete.repository.ts:74`, raw `new Error("Suggestion X not found")` from
`suggestion.repository.ts:262`, `new Error(tErrors.unauthorizedViewMetrics)` from
`schedule.service.ts:119`) currently surface to the GraphQL client as generic `GraphQLError`
*without* `extensions.code` — so tests can only assert `result.error` truthiness, never the
specific failure category. That is the gap this plan closes.

### Implementation strategy (chosen)

**Strategy B — central error normalizer.** Locus: `backend/lib/errors.ts` and a single new
utility `backend/lib/toGraphQLError.ts` (or a method on `DomainError`). Convert every
`DomainError`-subclass throw to use the normalizer, and migrate the 4 raw `new Error(...)`
sites identified below to throw `DomainError` subclasses with translated messages.

 rejected alternative: **Strategy A — Pothos `errorUnion`/`errorUnionField` schema migration**.
  This would require declaring unions for every affected field and rewriting all consumers
  (Storybook stories, Apollo client hooks, codegen output) to use `... on Error { ... }`
  fragments on every mutation. Pothos's `defaultTypes` option *only* adds members to those
  opted-in unions — it does nothing for the vast majority of Siraj's fields that are not opted
  in. Migrating every mutation field is a large schema-shape change with breaking Apollo-cache
  implications. We're choosing B because it (a) preserves Siraj's existing `extensions-code`
  contract used by `auth.test.ts:184` and `meeting.mutation.ts`, (b) requires zero schema-shape
  change, (c) is provably the path Siraj already uses for auth/meeting errors.

### Confirmation: installed package versions

- `node_modules/@pothos/plugin-errors/package.json` → `"version": "4.9.1"`
- entry points: `"main": "./lib/index.js"`, `"module": "./esm/index.js"`, `"types": "./dts/index.d.ts"`
- plugin source inspected: `src/{index.ts,types.ts,schema-builder.ts,utils.ts,field-builder.ts,global-types.ts}`
- Pothos docs (indexed via `docs-search_docs`) retrieved full `plugins/errors.mdx` content
  confirming: "`defaultTypes`: An array of Error classes to include in every field **with error
  handling**."  (i.e., only fields that opt in via `errors: {...}`).

### Docs MCP Server Library Confirmation (Round 2)

Ran `docs-list_libraries` → 35 indexed libraries. Searched `apollo-server`, `pothos`, `apollo-client`, `graphql-codegen`.

| Library | Installed Version | Key Finding |
|---------|-------------------|-------------|
| `apollo-server` | v5.5.1 | Custom errors use `new GraphQLError(msg, { extensions: { code } })`. Non-`GraphQLError` throws default to `INTERNAL_SERVER_ERROR`. `status400ForVariableCoercionErrors` defaults to true in v5. |
| `pothos` (errors plugin) | v4.9.1 | `errorUnionField` wraps fields in union types; `defaultTypes` only affects opted-in fields; type resolution uses `instanceof` for class-based error types. |
| `apollo-client` | v4.2.12 | `CombinedGraphQLErrors.is(error)` preferred over `instanceof` (avoids cross-realm false negatives). `error.errors?.[0]?.extensions?.code` is the v4 access path (not `error.graphQLErrors` — that's v3). `ApolloError` class removed in v4. |
| `graphql` | v17.0.2 | `GraphQLError` constructor accepts `{ extensions }` options object. |
| `graphql-codegen` | — | No error-type-specific config needed; `bun codegen` output unchanged. |

---

## Issues found

### ISSUE 1: `markSuggestionReviewed` throws un-translated raw `Error` for "not found"

- **File**: `backend/db/repo/parents/suggestion.repository.ts:261-262`
- **Symptom**: `throw new Error(\`Suggestion ${suggestionId} not found\`)` — raw English string with template literal, no error Code, not i18n. It's exposed in non-localized form to the GraphQL client.
- **Fix**: Replace with `NotFoundError("SUGGESTION", tErrors.recordNotFound({ tableName: "suggestion", entityId: suggestionId }))` (use the same pattern as `soft-delete.repository.ts:74`). But resolvers need to pass `locale` or `t` into the repository function. The repo's existing `_locale?: string` is currently unused — wire it up.
- **Schema implication**: Test `marking non-existent suggestion returns error` should assert `error.extensions.code === "SUGGESTION_NOT_FOUND"`.

---

### ISSUE 2: `deleteComplaint` (softDeleteEntityLog) swallows `NotFoundError` into 200 HTTP without surfacing the code

- **File**: `backend/services/communication/__shared__/complaintSuggestionBase.ts:132-150`
- **Symptom**: The Pothos errors plugin has `defaultTypes: []` and no field-level `errors: {...}` opt-in, so `NotFoundError` delivered by `soft-delete.repository.ts:74` is wrapped by Apollo as a plain `GraphQLError` with the localized `error.message` but **no `extensions.code`**. The existing test `deleting non-existent complaint returns error` only checks `result.error` truth; it cannot assert `error.extensions.code === "COMPLAINTS_NOT_FOUND"`.
- **Fix**: land in two pieces:
  1. **Keystone (see Phase 1 below)**: add a central `toGraphQLError(err)` normalizer to `backend/lib/errors.ts` (or a sibling file) that, given a `DomainError`, returns `new GraphQLError(err.message, { extensions: { code: err.code } })`. Then make `NotFoundError`/`ConflictError`/`UnauthorizedError`/`ForbiddenError`/`ValidationError` throws in services and repositories invoke this normalizer (or equivalently, `throw` a converted `GraphQLError` at the Pothos layer boundary).
  2. No additional schema change is required for this issue — `soft-delete.repository.ts:74` already throws `NotFoundError` with `code: "COMPLAINTS_NOT_FOUND"`; only the normalizer step is needed.
- **Test implication**: Test assertions should verify `error.extensions.code === "COMPLAINTS_NOT_FOUND"` using the existing `CombinedGraphQLErrors` pattern from `auth.test.ts:184`.

```log
log single issue here
[2026-08-19 05:00:26.608] [ERROR] Failed to delete complaint {
  error: Error [NotFoundError]: complaints not found: b6b5704b-93c0-4aee-ae84-22a327a5005c
  code: 'COMPLAINTS_NOT_FOUND'
}
[2026-08-19 05:00:26.635] [ERROR] Failed to delete complaint {
  error: Error [NotFoundError]: complaints not found: [CARD_REDACTED]-[CARD_REDACTED]
  code: 'COMPLAINTS_NOT_FOUND'
}
```

---

### ISSUE 3: `getAdminDashboardSchedule` (schedule service) throws `new Error(tErrors.unauthorizedViewMetrics)` instead of `UnauthorizedError`

- **File**: `backend/services/schedule/schedule.service.ts:117-119`
- **Symptom**: `throw new Error(tErrors.unauthorizedViewMetrics)` — translated message, but the error is a plain `Error` with NO code, so the GraphQL client receives a generic `GraphQLError` with the localized Arabic string but no `extensions.code`. The `logger.warn` ahead of it is the only signal.
- **Fix**: Replace with `throw new UnauthorizedError(tErrors.unauthorizedViewMetrics)` — the code `UNAUTHORIZED` will then propagate to `extensions.code` (after the fix in ISSUE 2).
- **Test implication**: Schedule tests that exercise the unauthorized path should assert `error.extensions.code === "UNAUTHORIZED"`.

```log
log single issue here
[2026-08-19 05:01:08.766] [WARN] Unauthorized access to daily metrics { userId: '271c4477-f4a0-4bc1-acc1-7a39293e5dae' }
[2026-08-19 05:01:08.770] [ERROR] Error fetching admin dashboard schedule {
  error: Error: غير مصرح لك بعرض المقاييس.
  (no `code` field on the error — plain `Error`, not `DomainError`)
  at Object.getAdminDashboardSchedule (backend/services/schedule/schedule.service.ts:119:15)
}
```

---

### ISSUE 4: `validateCreateRecurringClass` throws generic `ValidationError(tErrors.invalidInput)` for unrelated validation failures

- **File**: `backend/services/schedule/recurring-class.service.ts:148-149`
- **Symptom**: One `if` block collapses four different validation failures (no days, zero duration, missing subjectId, empty days) into a single `ValidationError(tErrors.invalidInput)`. The test sees `result.error` truth and passes, but never learns WHY it failed. The two dev-log entries show two different inputs (days=[] and subjectId='') both yielding the same opaque code/message:
  - Input 1 (line 36984): `days: []`, `subjectId: '86dee45d-...'`
  - Input 2 (line 37016): `days: [{dayOfWeek:...}]`, `subjectId: ''`
- **Fix**: Split the validation into three distinct translated errors:
  - `days` empty/undefined → `ValidationError(tErrors.recurringClassDaysRequired)`
  - `durationMinutes <= 0` → `ValidationError(tErrors.invalidDuration)`
  - `!subjectId` (empty string) → `ValidationError(tErrors.subjectRequired)`
- Add three new keys to `shared/locale/types/errors/index.ts` `SchedulingErrors` and to both locale files (`en/errors/index.ts` and `ar/errors/index.ts`).
- **Test implication**: Schedule test should assert different codes per failure mode.

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

---

### ISSUE 5: `cleanupTestSuperAdmin` swallows foreign-key violation (FK on `admin_audit_logs`), preventing test data leak

- **File**: `backend/services/system/test-helper.service.ts:141-154` — specifically the line `await tx.delete(users).where(eq(users.id, userId))` at line 146.
- **Symptom**: The delete cascade fails because `admin_audit_logs` has a RESTRICT FK to `users.id`. The catch returns `false` and **logs**, but the GraphQL test resolves `deleteComplaint`/`markSuggestionReviewed` as 200 because the cleanup failure never makes it back as an error. More importantly, leaked rows (users flagged as deleted but not physically removed) accumulate in audit log tables.
- **Fix**: Before deleting the user, delete (or soft-delete, depending on schema intent) their `admin_audit_logs` rows first. The cleanest contract is to delete audit logs for that test actor since they're test artifacts:
  ```ts
  await tx.delete(adminAuditLogs).where(eq(adminAuditLogs.actorUserId, userId));
  ```
  before the existing `tx.delete(users)...` call. This makes the test cleanup succeed and lets the GraphQL test for `cleanupTestSuperAdmin` see the mutation as `true` instead of silently returning `false`.
- **Test implication**: `test-helper` test should verify `data.cleanupTestSuperAdmin === true` after successful cleanup.

```log
log single issue here
[2026-08-19 05:00:55.140] [ERROR] Failed to clean up test super admin via helper service {
  error: DrizzleQueryError, code: '23001'
  cause: update or delete on table "users" violates RESTRICT setting of foreign key constraint "admin_audit_logs_actor_user_id_users_id_fkey" on table "admin_audit_logs"
  detail: 'Key (id)=(5a6bda19-a644-479f-ad35-0d81985596d0) is referenced from table "admin_audit_logs".'
}
[2026-08-19 05:02:24.297] [ERROR] Failed to clean up test super admin via helper service {
  (same FK error, different test run — leaks ongoing)
}
```

---

### ISSUE 6: `cleanupTestEntities` fails with RESTRICT FK on `class_status_events` (same class, similar root cause)

- **File**: `backend/services/system/test-helper.service.ts:373-375` (the `tx.delete(classInstances).where(or(...))` line).
- **Symptom**: The test-helper deletes `class_instances` while `class_status_events` still references them with a RESTRICT FK. The GraphQL `cleanupTestEntities` mutation finishes as 200 but the test's `data.cleanupTestEntities` is `false` (actually returns true after the catch logs — verify) — but real cleanup never happens, leaving orphan rows for the next run to trip on.
- **Fix**: Delete `class_status_events` rows referencing the target instances BEFORE the `tx.delete(classInstances)...`:
  ```ts
  // delete class status events referencing the instances we're about to remove
  const instanceIds = (await tx.select({ id: classInstances.id }).from(classInstances)
    .where(or(eq(classInstances.studentId, studentId), eq(classInstances.teacherId, teacherId))))
    .map(r => r.id);
  if (instanceIds.length > 0) {
    await tx.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, instanceIds));
  }
  ```
  Place this before the existing class-instance delete call.
- **Test implication**: Test should verify no `class_status_events` rows are left dangling.

```log
log single issue here
[2026-08-19 05:01:56.271] [ERROR] Failed to clean up test entities via helper service {
  error: DrizzleQueryError, code: '23001'
  cause: update or delete on table "class_instances" violates RESTRICT setting of foreign key constraint "class_status_events_class_instance_id_class_instances_id_fkey" on table "class_status_events"
  detail: 'Key (id)=(02466fe3-bdc0-4a9f-9d05-b5e0fa1aaac6) is referenced from table "class_status_events".'
}
```

---

### ISSUE 7: `releaseQuotaIfDeducted` silently drops a quota-deducted instance because `recurringScheduleId` is null — no GraphQL surface

- **File**: `backend/services/session/class-session.service.ts:238-244`
- **Symptom**: When an instance is `quotaDeducted=true` but `recurringScheduleId=null` (e.g., a manual instance produced by `createTeacherManualClassEntry`), the quota release silently returns `quotaReleased: false`. The follow-on `deleteClassInstance` receives `HTTP 200` but the test never learns that the quota was NOT released — the student's quota balance is permanently leaked (unless a compensating credit refund ran elsewhere).
- **Fix**: This is intentional skip for on-demand/manual entries, but the behavior should at least:
  1. Use a localized warning instead of the raw English string `"Quota-deducted instance has no recurringScheduleId — cannot resolve quota"`.
  2. Surface an `extensions.warning` or a `fields.warnings` entry on the `deleteClassInstance` response so the test can observe that the manual path was correctly detected as quota-free.
- **Test implication**: When GraphQL test exercises `createTeacherManualClassEntry` → `deleteClassInstance` on a quota-backed student, assert that no quota release was needed (no orphan ledger entry).

```log
log single issue here
[2026-08-19 05:01:55.403] [WARN] Quota-deducted instance has no recurringScheduleId — cannot resolve quota {
  classInstanceId: '02466fe3-bdc0-4a9f-9d05-b5e0fa1aaac6',
  studentId: '6d1fd245-ea52-452c-8875-b91567c220c7'
}
```

---

### ISSUE 8: `generateAndAttachForClassInstance` silently skips meeting URL generation when no provider is resolved

- **File**: `backend/services/meeting/meeting-config-snapshot.ts:243-248`
- **Symptom**: Six log entries show this INFO path firing (provider not resolved → skip). The booking GraphQL mutation returns 200 with the class instance IDs, but no meeting link is attached to them. Tests don't catch the missing link because the response shape doesn't include a `meetingUrl`. This is actually OK when the teacher has only a "manual" provider configured — but for tests where a real Zoom/Teams integration IS expected, the absence should be detectable.
- **Fix**: For tests, add a `meetingProviderResolved` boolean or a `meetingLink` field to the `createRecurringClass` result so the GraphQL test can assert `[false]` when no provider is set up. (Architectural: optional). Short term — add a `logger.warn` not `info` for non-manual paths so the test log analyzer can flag it.
- **Test implication**: New optional test asserts that booking returns `meetingUrl: null` when no provider is configured.

```log
log single issue here
[2026-08-19 05:01:11.271] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '1af17352-...' }
[2026-08-19 05:01:11.272] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '88a9cd4a-...' }
[2026-08-19 05:01:12.207] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '638f9743-...' }
[2026-08-19 05:01:12.207] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '5ce30c92-...' }
[2026-08-19 05:01:19.740] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: 'ec3a294c-...' }
[2026-08-19 05:01:55.357] [INFO] generateAndAttachForClassInstance: no provider resolved, skipping { classInstanceId: '02466fe3-...' }
```

---

### ISSUE 9: Four 400 HTTP GraphQL responses at end of run with NO resolver executed and NO log — silent test failure

- **File**: `app/api/graphql/route.ts` (Apollo server), `frontend/common/graphql/test/lifecycle.ts` (post-test cleanup)
- **Symptom**: At end of run (lines 40155-40158), four `POST /api/graphql 400 in 14ms / 17ms / 14ms / 13ms` entries appear with NO preceding `[LOG] Executed resolver` line. They hit right after the impersonation end / before the final `cleanupTestSuperAdmin`. No error log either — Apollo returned 400 to the test client but the test runner didn't catch an `assertError`/`result.error` for them. Apollo Server 4 returns 400 for malformed queries (invalid GraphQL syntax, validation errors) or for the persisted-query miss.
- **Fix**: Reproduce locally by inspecting what queries the test was issuing in those four requests (run the test with `--inspect` and break on `POST` 400 in `withRateLimit`). The fix likely is one of:
  - missing persisted-query backfill in the test client (`OPERATION_HASH_NOT_FOUND` → Apollo 400)
  - graphql depth-limit validation (test query depth = 8 > MAX_GRAPHQL_DEPTH=7)
  - constraint directive validation failing on a field with bad input — but tests using `errorPolicy: "all"` shouldn't drop these.
- **Test implication**: Whatever the cause, the test should examine `result.error.graphQLErrors` for a non-empty error array, instead of silent-passing.

```log
log single issue here
[2026-08-19 05:02:24.180] Executed resolver Mutation.endImpersonation in 12.4ms
 POST /api/graphql 200 in 31ms (next.js: 1.9ms, application-code: 29ms)
 POST /api/graphql 400 in 14ms (next.js: 1.6ms, application-code: 12ms)   ← no resolver, no error log
 POST /api/graphql 400 in 17ms (next.js: 2ms, application-code: 15ms)      ← no resolver, no error log
 POST /api/graphql 400 in 14ms (next.js: 1.9ms, application-code: 12ms)   ← no resolver, no error log
 POST /api/graphql 400 in 13ms (next.js: 2ms, application-code: 11ms)      ← no resolver, no error log
[2026-08-19 05:02:24.297] [ERROR] Failed to clean up test super admin via helper service { ... }
```

---

### ISSUE 10 (enhancement): `dispatchWithPreferences: dropped contactless payloads for user` — warn spam, might hide real failures

- **File**: `backend/services/notification/notification-dispatch.helpers.ts:241-246`
- **Symptom**: Hundreds of identical WARN entries. Each one means a notification intended for a user had its contact-channel payload dropped because the user has no contact info on record. Normal behavior on a test DB seeded with phoneless/emailless users — but since GraphQL tests pass, no error surfaces back to the test.
- **Fix**: Tighten the WARN message to include the missing channel type (e.g., "missing email for user X") so the test logs are scannable. Additionally, surface an `extensions.debug.skippedNotifications` field on dispatch-affecting mutations (`submitComplaint`, `cancelClassInstance`) so tests can assert expected dropped-payload counts without grep-ing the dev log.
- **Translation**: Add a localized debug string key (currently only in log, not user-facing — keep the existing English log message, just make it structured for test inspection).
- **Test implication**: Notification tests assert on the count of skipped notifications per type.

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

---

### ISSUE 11 (non-issue, ignore): Provider errors (Twilio / Resend)

- **Files**: `backend/services/communication/...` — Twilio SMS failures and Resend API key failures (lines 13-onwards, 2400-onwards, etc.)
- **Symptom**: Twilio trial-account "unverified number" / "exceeded 5 daily messages limit"; Resend "API key is invalid". Both are **expected in a test environment** — they are external SaaS provider failures, NOT backend bugs.
- **Action**: Leave as-is. Optionally add structured WARN logging to surface the channel type ("EMAIL_PROVIDER", "SMS_PROVIDER") so the test log analyzer can group them.

```log
log single issue here
[2026-08-19 05:00:05.711] [ERROR] Failed to send SMS via Twilio {
  error: 'The number +20100000XXXX is unverified. Trial accounts cannot send messages to unverified numbers; verify +20100000XXXX at twilio.com/user/account/phone-numbers/verified, or purchase a Twilio number to send messages to unverified numbers'
}
[2026-08-19 05:00:07.897] [ERROR] Resend API returned an error {
  errorName: 'validation_error', errorMessage: 'API key is invalid'
}
```

---

### ISSUE 12 (enhancement): "Rate limit would have been exceeded for identifier: [IP_REDACTED] (development mode, not enforced)" — would-be test failure hidden

- **File**: `backend/lib/ratelimit.ts` (or wherever the dev-mode bypass lives)
- **Symptom**: Thousands of WARN entries. In production the rate limiter would have returned `429 RATE_LIMIT_EXCEEDED` (per `app/api/graphql/route.ts:147-165`). In tests, the dev bypass returns 200 silently.
- **Fix**: Add a test-mode-only env flag (`TEST_ENFORCE_RATE_LIMIT=1`) so a GraphQL test can opt INTO rate limiting and verify it returns `extensions.code: "RATE_LIMIT_EXCEEDED"` with a `429` HTTP status. Without this, a real rate-limit bug would only surface in prod.
- **Test implication**: A new test exercises rate-limit enforcement in the test mode.

```log
log single issue here
[2026-08-19 05:00:07.269] [WARN] Rate limit would have been exceeded for identifier: [IP_REDACTED] (development mode, not enforced)
[2026-08-19 05:00:20.685] [WARN] Rate limit would have been exceeded for identifier: [IP_REDACTED] (development mode, not enforced)
(… dozens more …)
```

---

## Proposed backend fix sequence

### Phase 1 (keystone): Central normalizer that rewrites `DomainError` → `GraphQLError(... extensions.code ...)`

**File**: new `backend/lib/toGraphQLError.ts` (or method on `DomainError` in `backend/lib/errors.ts`).

```ts
// backend/lib/errors.ts — add to existing file
import { GraphQLError } from "graphql";

export function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof DomainError) {
    return new GraphQLError(err.message, {
      extensions: { code: err.code },
      originalError: err,
    });
  }
  if (err instanceof GraphQLError) return err;
  // Unknown error: fall back to Apollo's default behaviour
  return new GraphQLError(
    err instanceof Error ? err.message : "Internal server error",
    { originalError: err as Error },
  );
}
```

Wire it in two places (pick one — both are valid, but only one is needed):

**Option 1 (recommended): wrap resolvers via the Pothos `errors.onResolvedError` hook**.
The Pothos `ErrorsPluginOptions.onResolvedError` callback currently only logs:
```ts
// backend/graphql/gqlSchemaBuilder.ts:163-168   (current)
errors: {
  defaultTypes: [],
  onResolvedError: (error, args, context, info) => {
    logger.error("Handled error:", error);
  },
},
```
**Problem**: `onResolvedError` is invoked AFTER the plugin has already wrapped the throw into a union; since `defaultTypes: []`, it never runs for our DomainError throws. So the safer locus is a **resolver-level `wrap`** below.

**Option 2 (siraj-aligned): subclass `DomainError` to be a `GraphQLError`**.
The cleaner fit for Siraj is to make `DomainError` itself extend `GraphQLError`:

```ts
// backend/lib/errors.ts
import { GraphQLError } from "graphql";

export class DomainError extends GraphQLError {
  constructor(message: string, public readonly code: string) {
    super(message, { extensions: { code } });
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype); // restore subclass
  }
}
```

This way **every existing `throw new NotFoundError(...)` immediately surfaces `extensions.code`** through Apollo without any schema-shape change, any new file, or any per-resolver wiring. Apollo Server's default error formatter already preserves `extensions` on `GraphQLError` instances (the only post-processing it does is truncating `extensions` when `hideSchemaDetailsFromClientErrors` is true, but `code` is on the allow-list — confirmed by the existing `UNAUTHENTICATED` path in `auth.test.ts:184`).

**Action**:
1. Refactor `DomainError` in `backend/lib/errors.ts` to extend `GraphQLError` with `extensions: { code }`.
2. Keep `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `QuotaNotFoundError`, `QuotaAlreadyDeletedError`, `QuotaLedgerError` as subclasses — only their extends-chain changes, no constructor surface changes.
3. Delete `errors.defaultTypes`/`onResolvedError` is NOT required; they remain harmless. (We keep `defaultTypes: []` because we are NOT opting into the union-wrapping path.)
4. Smoke verify with `bun codegen && bun tsgo` — no schema change expected.
5. Verify `auth.test.ts:184` still passes (it asserts `extensions.code === "UNAUTHENTICATED"` coming from scopeAuth's `GraphQLError` throw, not from DomainError — should be unaffected).

### Phase 2: Fix issue 1 — localized "not found" in suggestion repository

- Modify `backend/db/repo/parents/suggestion.repository.ts:261` to throw `new NotFoundError("SUGGESTION_NOT_FOUND", tErrors.recordNotFound({ tableName: "suggestion", entityId: suggestionId }))`. Pipe `t` from callers — service layer `backend/services/communication/suggestion.service.ts` already builds `tErrors` from `locale`; add it as a parameter to the repository function signature (the existing `_locale?: string` parameter becomes a `tErrors`-typed callback or a `locale` string).
- Update `frontend/common/graphql/test/suggestions/suggestion.test.ts:197-205` to assert `error.extensions.code === "SUGGESTION_NOT_FOUND"` using the `CombinedGraphQLErrors` pattern (`result.error.graphQLErrors[0].extensions.code`).

### Phase 3: Fix issue 3 — UnauthorizedError for daily metrics

- Replace `throw new Error(tErrors.unauthorizedViewMetrics)` at `backend/services/schedule/schedule.service.ts:119` with `throw new UnauthorizedError("UNAUTHORIZED", tErrors.unauthorizedViewMetrics)`. (Depends on Phase 1 — `UnauthorizedError` is now a `GraphQLError` subclass with `extensions.code`.)
- Update `frontend/common/graphql/test/scheduling/schedule.test.ts` to assert `error.extensions.code === "UNAUTHORIZED"` for the unauthorized-role queries.

### Phase 4: Fix issue 4 — split recurring class validation

- Refactor the `if` block at `backend/services/schedule/recurring-class.service.ts:148` into three distinct throws:
  - `if (!input.days || input.days.length === 0)` → `throw new ValidationError("RECURRING_CLASS_DAYS_REQUIRED", tErrors.recurringClassDaysRequired)`
  - `else if (input.durationMinutes <= 0)` → `throw new ValidationError("INVALID_DURATION", tErrors.invalidDuration)`
  - `else if (!input.subjectId)` → `throw new ValidationError("SUBJECT_REQUIRED", tErrors.subjectRequired)`
- Add the matching keys to:
  - `shared/locale/types/errors/index.ts` (`SchedulingErrors`)
  - `shared/locale/en/errors/index.ts`
  - `shared/locale/ar/errors/index.ts`
- Update `frontend/common/graphql/test/scheduling/schedule.test.ts` tests:
  - Existing test `denied for invalid input (no days)` → assert code `RECURRING_CLASS_DAYS_REQUIRED`.
  - Existing test `rejected when subjectId is omitted` → assert code `SUBJECT_REQUIRED`.

### Phase 5: Fix issues 2 & 9 — verify code propagation via complaint tests

- Re-run complaint tests after Phase 1. The `NotFoundError("COMPLAINTS")` thrown from `soft-delete.repository.ts:74` should now surface `extensions.code === "COMPLAINTS_NOT_FOUND"` automatically (no per-field wiring needed).
- Update `frontend/common/graphql/test/complaints/complaint.test.ts:394-411` so the existing "already-deleted" test AND the "non-existent" test both assert `error.extensions.code === "COMPLAINTS_NOT_FOUND"`.
- Investigate the four mysterious 400 responses (issue 9) by adding a test-case with an Apollo Server log capture asserting `result.error?.graphQLErrors?.length > 0` and logging the raw response body to the test log.

### Phase 6: Fix issues 5 & 6 — test-helper FK-aware cleanup

- Edit `backend/services/system/test-helper.service.ts`:
  - In `cleanupStaffUser` (line 141), add `await tx.delete(adminAuditLogs).where(eq(adminAuditLogs.actorUserId, userId))` BEFORE `tx.delete(users)...`.
  - In `cleanupTestEntities` (line 367), select the target `class_instances.id`s, delete `class_status_events` rows referencing them, then perform the existing `tx.delete(classInstances)...`.
- Add a GraphQL test case that asserts `data.cleanupTestSuperAdmin === true` AND `data.cleanupTestEntities === true`.
- Import `adminAuditLogs` and `classStatusEvents` from `@/backend/db/schema` in the test helper service file.

### Phase 7: Fix issues 7 & 8 — surface skipped logic in GraphQL result

- Add a nullable `meetingUrl: string | null` field to the existing `CreateRecurringClassResult` (and `CreateTeacherManualClassEntryResult`) GraphQL object type.
- Propagate the URL (or null) from `MeetingConfigSnapshotService.generateAndAttachForClassInstance` results back through `recurring-class.service.ts:316-327` (`Promise.allSettled` already captures results).
- Add a GraphQL test that asserts `meetingUrl === null` for a non-provider test path (and detects missing provider via the explicit `null` vs absent field).
- Change the `logger.info("no provider resolved, skipping")` at `meeting-config-snapshot.ts:243` to `logger.warn` so the dev-log analyzer can flag it, and include the `providerLookupReason` ("no provider configured" vs "teacher has no oauth token").

### Phase 8: Fix issues 10 & 12 — optional surfacing for tests

- **Issue 10**: Augment `dispatchWithPreferences` to return a structured `warnings` object alongside `dispatchedCount`, exposing:
  - `droppedByType: { email: number, sms: number, push: number }`
- Add `skippedNotificationsByType` to the GraphQL response shape of dispatch-affecting mutations (`submitComplaint`, `cancelClassInstance`) when test-mode env flag is set.
- **Issue 12**: Add `TEST_ENFORCE_RATE_LIMIT` env-flag handling in `backend/lib/ratelimit.ts` so a nominated GraphQL test can fire enough requests to trip the 429 path and assert `extensions.code: "RATE_LIMIT_EXCEEDED"`.

### Phase 9: Per-issue individual test runs + Next.js devtools MCP verification

After each phase's implementation, run the **specific affected GraphQL test file** in isolation
and use the **Next.js devtools MCP server** (port 3000) to confirm the error handling is correctly
surfaced through the GraphQL route. This catches per-issue regressions before the full suite.

**Next.js devtools MCP tools used** (discovered via `nextjs_index` on port 3000, 9 tools available):

| MCP tool | Purpose in this phase |
|---|---|
| `get_errors` | Retrieve Next.js global errors, browser runtime errors, and build errors with source-mapped stack traces — confirms no compilation/SSR errors introduced. |
| `get_compilation_issues` | Build the module graph for all routes and return compilation issues (resolve errors, missing modules, transform errors) — confirms the `/api/graphql` route still compiles after DomainError changes. |
| `compile_route` with `routeSpecifier: "/api/graphql"` | Pre-compile the GraphQL API route without making an HTTP request — warms the module graph so the test's first request isn't a cold compile. |
| `get_logs` | Get the path to the Next.js development log file so we can read the dev server logs directly — confirms our `logger.warn`/`logger.error` calls emit the expected localized messages and error codes in the dev log. |
| `get_routes` with `routerType: "app"` | Confirm `/api/graphql` is still registered as an App Router route after schema changes. |
| `get_project_metadata` | Confirm project path and dev server URL match expectations. |
| `get_request_insights` | Inspect recent App Router request insights for `/api/graphql` — useful for debugging slow resolver responses and confirming the error path is exercised. |
| `get_page_metadata` | (Secondary) runtime metadata about page rendering — less relevant but available for browser-session debugging. |
| `get_server_action_by_id` | (Not used — Siraj uses Apollo Server route, not Next.js Server Actions.) |

#### Per-phase individual test commands

For each phase, run the targeted test file using the run-test log-capture script:

```bash
# Phase 1 (keystone): no test file directly — verify via existing tests below
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/auth/auth.test.ts
# → confirm auth.test.ts:184 still passes (UNAUTHENTICATED code unchanged)

# Phase 2 (issue 1): suggestion mark-reviewed
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/suggestions/suggestion.test.ts
# → new assertion: error.extensions.code === "SUGGESTION_NOT_FOUND"
bun run scripts/run-test/run-test.ts --last --focus "not found" frontend/common/graphql/test/suggestions/suggestion.test.ts

# Phase 3 (issue 3): schedule unauthorized
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/scheduling/schedule.test.ts
# → new assertion: error.extensions.code === "UNAUTHORIZED"

# Phase 4 (issue 4): recurring class validation
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/scheduling/schedule.test.ts
bun run scripts/run-test/run-test.ts --last --focus "invalid" frontend/common/graphql/test/scheduling/schedule.test.ts
# → new assertions: RECURRING_CLASS_DAYS_REQUIRED, INVALID_DURATION, SUBJECT_REQUIRED

# Phase 5 (issues 2 & 9): complaint delete
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/complaints/complaint.test.ts
# → new assertion: error.extensions.code === "COMPLAINTS_NOT_FOUND"

# Phase 6 (issues 5 & 6): test-helper cleanup
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/test-helper.test.ts
# → assert data.cleanupTestSuperAdmin === true, data.cleanupTestEntities === true
# (if no dedicated test-helper test exists, run the full test:graphql suite)

# Phase 7 (issues 7 & 8): meeting URL surfacing
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/scheduling/schedule.test.ts
# → assert meetingUrl === null for non-provider path

# Phase 8 (issues 10 & 12): notification + rate limit
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/notifications/notifications.test.ts
# → assert skippedNotificationsByType shape
```

#### MCP verification workflow per phase

After each individual test run:

1. **Start the dev server** if not already running:
   ```bash
   bun run dev  # port 3000, Turbopack
   ```

2. **Call `compile_route`** with `routeSpecifier: "/api/graphql"` to pre-compile the route and
   catch any module-graph breakage from the DomainError changes:
   ```
   nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })
   ```

3. **Call `get_compilation_issues`** to confirm zero resolve/transform errors across ALL routes:
   ```
   nextjs_call(port: "3000", toolName: "get_compilation_issues", args: {})
   ```

4. **Call `get_errors`** to confirm no Next.js global/browser/build errors introduced:
   ```
   nextjs_call(port: "3000", toolName: "get_errors", args: {})
   ```

5. **Run the individual test** (commands above) while the dev server is running.

6. **Call `get_logs`** to retrieve the dev server log file path, then read the tail of that log
   to confirm:
   - The `logger.warn` / `logger.error` calls emit the expected **localized** messages
   - The `extensions.code` values appear in the GraphQL error responses
   - No new unexpected `[ERROR]` or `[WARN]` entries appeared from the phase's changes
   ```
   nextjs_call(port: "3000", toolName: "get_logs", args: {})
   → read the returned file path with view_range or bash tail
   ```

7. **Call `get_request_insights`** (optional, for slow-resolver debugging) with the requestId
   from the test's GraphQL mutation to inspect the request timeline:
   ```
   nextjs_call(port: "3000", toolName: "get_request_insights", args: { requestId: "<id>" })
   ```

8. **Call `get_routes`** with `routerType: "app"` to confirm `/api/graphql` is still registered:
   ```
   nextjs_call(port: "3000", toolName: "get_routes", args: { routerType: "app" })
   ```

9. **If any MCP check fails**, fix the issue before advancing to the next phase. The progressive
   verification loop is: fix → compile_route → get_compilation_issues → get_errors → individual test → get_logs → repeat until clean.

### Phase 10: Full `bun test:graphql` run + Next.js devtools MCP final check

After all per-phase individual tests pass with MCP verification, run the **full GraphQL test
suite** and use the Next.js devtools MCP server to check the complete error-handling surface.

#### Step 1: Full suite run with log capture

```bash
# Full GraphQL test suite (dev server must be running on port 3000)
bun run test:graphql 2>&1 | tee graphql_tests_logs/dev-post-fix.log
```

#### Step 2: MCP verification of the full run

1. **Call `get_errors`** to confirm zero build/SSR/global errors after the full suite:
   ```
   nextjs_call(port: "3000", toolName: "get_errors", args: {})
   ```
   Expected: `errors: []` (empty). Any non-empty result indicates a regression introduced by
   the plan changes.

2. **Call `get_compilation_issues`** to confirm zero compilation issues across ALL routes:
   ```
   nextjs_call(port: "3000", toolName: "get_compilation_issues", args: {})
   ```
   Expected: `issues: []` (empty). The DomainError → GraphQLError refactor must not break
   the module graph.

3. **Call `compile_route`** with `routeSpecifier: "/api/graphql"` as a final warm-compile check:
   ```
   nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })
   ```
   Expected: `{ routeSpecifier: "/api/graphql", issues: [] }`.

4. **Call `get_logs`** and read the full dev server log to compare against the original
   `graphql_tests_logs/dev.log`:
   ```
   nextjs_call(port: "3000", toolName: "get_logs", args: {})
   → read the returned file path (full or via view_range/tail)
   ```
   Confirm:
   - All 12 issue log patterns from the original `dev.log` are either:
     - **Gone** (issues 1-9: fixed by the plan), OR
     - **Expected** (issue 11: provider errors — Twilio/Resend test-env noise), OR
     - **Controlled** (issues 10, 12: now structured WARN with test-mode surfacing).
   - No NEW `[ERROR]` patterns appeared that weren't in the original log.
   - The `extensions.code` values are present in the GraphQL error responses (visible in dev log
     when Apollo logs the error objects).

5. **Call `get_routes`** with `routerType: "app"` to confirm all App Router routes are intact:
   ```
   nextjs_call(port: "3000", toolName: "get_routes", args: { routerType: "app" })
   ```
   Compare route list against pre-change baseline — `/api/graphql` must be present, plus all
   page routes.

6. **Call `get_request_insights`** (optional) for any slow GraphQL mutations reported in the
   test output:
   ```
   nextjs_call(port: "3000", toolName: "get_request_insights", args: { requestId: "<id>" })
   ```

#### Step 3: Log diff analysis

```bash
# Diff the original and post-fix dev logs to confirm issue resolution
diff <(grep -E '\[ERROR\]|\[WARN\]' graphql_tests_logs/dev.log) \
     <(grep -E '\[ERROR\]|\[WARN\]' graphql_tests_logs/dev-post-fix.log) \
     | head -200
```

Expected diff:
- Issues 1-6: `[ERROR]` lines for NotFoundError, FK violations, ValidationError — **removed**.
- Issue 7: `[WARN] Quota-deducted instance has no recurringScheduleId` — **removed or changed
  to structured WARN with localized message**.
- Issue 8: `[INFO] no provider resolved, skipping` → `[WARN]` with `providerLookupReason` —
  **changed severity and structured**.
- Issue 9: Four `400 in Xms` with no preceding resolver log — **removed** (Apollo now returns
  proper `GraphQLError` with `extensions.code`).
- Issue 10: `dropped contactless payloads` WARN — **structured with channel type**.
- Issue 11: Provider errors — **unchanged** (expected).
- Issue 12: Rate limit WARN — **unchanged** unless `TEST_ENFORCE_RATE_LIMIT` test ran.

#### Step 4: Final quality gate

```bash
bun run generate:gqlSchema
bun codegen
bun quality-gate
```

Expected: all stages pass clean. No new tsgo/oxlint/biome/lint/duplicates/codescene issues from
the DomainError refactor or the new translation keys.

---

## Non-goals (not in scope)

- Fixing Twilio trial account / Resend API key issues (they are external SaaS, expected test-env noise).
- Reworking the entire notification dispatch UX.
- Moving `DomainError` to a separate npm package or schema module.
- Writing new translations for the notification-dropped-payload logs — those stay as developer-facing log strings; only GraphQL-visible messages need i18n.
- Adding rate limiting to production behavior — production already enforces; only the test bypass is the gap.
- Migrating mutation result types to the Pothos `errorUnion`/`errorUnionField` union shape — explicitly rejected (see Strategy A discussion above). The `extension.code` path preserves Siraj's existing GraphQL contract with no breaking schema change.

## Cross-cutting concerns

- **i18n**: All new error messages MUST go through the compile-time translation system (`shared/locale/`). Add new keys to `SchedulingErrors` and friends in `types/errors/index.ts`, then implement in both `en/errors/index.ts` and `ar/errors/index.ts`.
- **Type-safety**: Each `DomainError` subclass's `code` becomes a string literal propagated via `extensions.code`. Add the code strings to a shared enum (`shared/types/errorCodes.ts` or similar) so resolvers and tests can reference them without typos.
- **Backwards compatibility**: Existing tests that check only `result.error` truthiness will continue to pass; the new `extensions.code` assertions are ADDITIVE, not breaking. Making `DomainError` extend `GraphQLError` is invisible to callers — `instanceof Error` still holds, `err.message` is unchanged, the `code` property is still on the instance.

## Pothos errors plugin investigation file references

- **Installed package**: `node_modules/@pothos/plugin-errors/package.json` — version `4.9.1`.
- **Plugin source inspected**:
  - `node_modules/@pothos/plugin-errors/src/types.ts` — `ErrorsPluginOptions` interface (`defaultTypes`, `directResult`, `onResolvedError`, `unsafelyHandleInputErrors`, `defaultResultOptions`, `defaultUnionOptions`).
  - `node_modules/@pothos/plugin-errors/src/schema-builder.ts` — `errorUnion` implementation: merges field `types` with `defaultTypes`, builds a `union` type, attaches `pothosErrorTypes` extension.
  - `node_modules/@pothos/plugin-errors/esm/index.js` — `PothosErrorsPlugin.wrapIsTypeOf` and `onOutputFieldConfig` confirm the plugin only engages on fields with `errors: { types: [...] }` or `errorUnionField`.
- **Indexed Pothos docs** retrieved via `docs-search_docs({ library: "pothos", query: "errors plugin" })` — confirmed `defaultTypes` "adds members to every field **with error handling**", NOT to every field globally. See `/tmp/1787106248465-copilot-tool-output-d54710.txt` (lines 1-720) for the full original docs output.
- **Siraj grep verification**: `grep -rn "errorUnion" backend/graphql/` returned zero matches — Siraj has zero fields opted into the union-wrapping path, confirming `defaultTypes: []` is a no-op today.
