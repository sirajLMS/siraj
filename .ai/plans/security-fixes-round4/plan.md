# Security Fixes — Round 4

## Overview

Round 4 backend security audit of the Siraj codebase. This round focuses on information leakage and input validation hardening. All findings were identified via direct grep/sed audit of `backend/graphql/`, `backend/db/repo/`, `backend/services/`, `backend/lib/`, `app/api/`, and `next.config.ts`.

**Constraints**: No commits, no pushes. Respect concurrent agent's work on shared files. Ensure DB and service tests still pass. Respect AGENTS.md and instructions.

## Findings

### MEDIUM Severity

#### R4M-1: Information Leakage in `storage.repository.ts` (3 instances)

**File**: `backend/db/repo/storage/storage.repository.ts`
**Lines**: 376, 606, 639

Three `catch` blocks return `String(error)` in the `message` field of `FileOperationResultPothosObject` / `StorageOperationResultPothosObject`, which is exposed to GraphQL clients via `t.exposeString("message")` in `storage.pothos.ts` (lines 214, 239). This leaks internal error details (stack traces, DB error messages, file system paths) to end users.

**Current code** (line 376):
```ts
return { success: false, message: `Failed to register file usage: ${String(error)}` };
```

**Fix**: Replace `String(error)` with a localized generic message. Log the actual error via `logger.error`.

```ts
logger.error("Failed to register file usage", { error: String(error) });
return { success: false, message: "Failed to register file usage" };
```

Repeat for lines 606 and 639.

**Affected tests**: `backend/db/test/repo/storage.repository.test.ts` (if any test asserts on the `message` field containing error details).

---

### LOW Severity

#### R4L-1: Unbounded `t.arg.string()` Inputs Across GraphQL Files

**Files affected** (20+ files, ~50+ string inputs):

**Mutations**:
- `backend/graphql/mutation/billing/billing-payments.mutation.ts` — `amount`, `transactionId`, `paymentDate`
- `backend/graphql/mutation/billing/credit.mutation.ts` — `notes`
- `backend/graphql/mutation/whatsapp/whatsapp-account.mutation.ts` — `id`, `accessToken`, `twoStepPin`, `userId`, `source`
- `backend/graphql/mutation/classes/class-session.mutation.ts` — `leaveReason`, `rateAmount`
- `backend/graphql/mutation/classes/dst-migration.mutation.ts` — `description`
- `backend/graphql/mutation/classes/lesson-report.mutation.ts` — `rejectionReason`
- `backend/graphql/mutation/classes/lesson-report-reflection.mutation.ts` — `studentNotes`
- `backend/graphql/mutation/students/student.mutation.ts` — `id`
- `backend/graphql/mutation/storage/storage.mutation.ts` — `path`
- `backend/graphql/mutation/profile/profile.mutation.ts` — `userId`

**Queries**:
- `backend/graphql/query/whatsapp/whatsapp-account.query.ts` — `userId`
- `backend/graphql/query/shared/intl.query.ts` — `key`, `namespace`
- `backend/graphql/query/auth/auth.query.ts` — `id`
- `backend/graphql/query/scheduling/schedule.query.ts` — `date`, `teacherId`, `search`, `metricFilter`
- `backend/graphql/query/teachers/teacher-dashboard.query.ts` — `date`
- `backend/graphql/query/teachers/staff-directory.query.ts` — `permissionGroupFilter`
- `backend/graphql/query/parents/parent-dashboard.query.ts` — `date`, `search`
- `backend/graphql/query/parents/parent-directory.query.ts` — `search`
- `backend/graphql/query/students/student.query.ts` — `id`
- `backend/graphql/query/students/student-status.query.ts` — `studentId`
- `backend/graphql/query/students/student-profile.query.ts` — `studentId`
- `backend/graphql/query/storage/storage.query.ts` — `path`, `searchTerm`, `fileType`, `folder`
- `backend/graphql/query/profile/profile.query.ts` — `userId`
- `backend/graphql/query/classes/class-session.query.ts` — `teacherId`

**Fix**: Add `maxLength` constraint directive to each `t.arg.string()` input. Use appropriate limits based on field semantics:

| Field type | maxLength | Rationale |
|---|---|---|
| UUID fields (`id`, `userId`, `teacherId`, `studentId`) | 36 | UUID v4 is 36 chars |
| Date fields (`date`, `paymentDate`) | 10 | ISO date `YYYY-MM-DD` |
| Search/filter fields (`search`, `metricFilter`, `permissionGroupFilter`, `searchTerm`, `fileType`, `folder`) | 256 | Reasonable search query length |
| Path fields (`path`) | 1024 | File system paths |
| Free-text fields (`notes`, `leaveReason`, `rejectionReason`, `studentNotes`, `description`) | 2000 | Reasonable text limit |
| Token fields (`accessToken`) | 512 | OAuth tokens |
| PIN fields (`twoStepPin`) | 6 | WhatsApp 2FA PIN |
| Amount fields (`amount`, `rateAmount`) | 20 | Numeric string |
| Transaction ID (`transactionId`) | 100 | Payment provider transaction IDs |
| Source (`source`) | 50 | Short identifier |
| i18n key (`key`) | 256 | Translation key |
| i18n namespace (`namespace`) | 100 | Namespace identifier |

**Pattern** (Pothos maxLength directive):
```ts
amount: t.arg.string({
  required: true,
  directives: { constraint: { maxLength: 20 } },
}),
```

**Affected tests**: GraphQL integration tests that send string inputs — they should still pass since maxLength only rejects inputs exceeding the limit. No test should be sending > 2000 char strings.

---

## Audit Summary (No Issues Found)

The following areas were audited and found to be secure — no fixes needed:

| Area | Status | Notes |
|---|---|---|
| **AuthScopes** | ✅ PASS | All mutation/query fields have authScopes except expected public ones (login, demoLogin, refreshToken) |
| **SQL Injection** | ✅ PASS | All `sql.raw()` calls use hardcoded strings or enum values, not user input |
| **LIKE Injection** | ✅ PASS | All 12 files with `ilike()` have `escapeLikeWildcards` applied |
| **Rate Limiting** | ✅ PASS | All sensitive mutations have rate limiting (login, demoLogin, changePassword, adminResetPassword, createTeacher/Parent/Student/GeneralUser, respondToSuggestion, respondToComplaint, sendPaymentReminder, resendClassNotifications, group class creation, FX refresh) |
| **IP Address Extraction** | ✅ PASS | `gqlContextFactory.ts` correctly handles IPv6 via `IPV6_REGEX` |
| **Security Headers** | ✅ PASS | CSP, HSTS, X-Frame-Options DENY, nosniff, referrer policy, permissions policy all present in `next.config.ts` |
| **File Upload Security** | ✅ PASS | MIME allowlist excludes SVG/HTML/JS; size limits enforced via signed URLs |
| **Test Helper Gate** | ✅ PASS | Hard-disabled on Vercel production/preview; only enabled in test contexts |
| **Hardcoded Secrets** | ✅ PASS | No hardcoded credentials found; all secrets from env vars |
| **process.env Access** | ✅ PASS | `session-hash.ts` uses `process.env.JWT_SECRET` intentionally (pre-env-config); falls back to ephemeral key in dev, throws in production |
| **Communication Adapter Errors** | ✅ PASS | `throw new Error("...")` in email/SMS/WhatsApp/FCM adapters are internal config errors, caught by service layers, not user-facing |
| **Dead Code** | ℹ️ INFO | `assertProfileEditFieldGroups` in `profile-field-filter.ts` has no callers — dead code, low priority cleanup |

## Implementation Order

1. **R4M-1** (MEDIUM): Fix 3 `String(error)` leaks in `storage.repository.ts` — highest priority, information leakage
2. **R4L-1** (LOW): Add `maxLength` constraints to ~50+ unbounded string inputs across 20+ GraphQL files — defense in depth

## Risks

1. **Test breakage from maxLength**: If any GraphQL integration test sends strings exceeding the new limits, it will fail. Mitigation: Use generous limits (2000 for free-text, 256 for search). No test should be sending such long strings.

2. **Concurrent agent conflicts**: Another agent is working on backend files. Some files in this plan (e.g., `storage.repository.ts`, `profile.mutation.ts`) may be modified by the other agent. Mitigation: Check file state before editing; don't revert changes not made by this agent.

3. **Storage repository message field**: Tests may assert on the `message` field content. After replacing `String(error)` with generic messages, any test checking for error details in `message` will fail. Mitigation: Update test assertions to check for generic message text.

4. **Pothos directive compatibility**: The `directives: { constraint: { maxLength: N } }` pattern must be supported by the schema builder. Verify the pattern is already used elsewhere in the codebase (it is — pothos files already use it).

## Affected Tests

### Database Tests
- `backend/db/test/repo/storage.repository.test.ts` — may assert on `message` field content (R4M-1)

### GraphQL Integration Tests
- `frontend/common/graphql/test/` — tests that send string inputs to mutations/queries (R4L-1). Should not break since maxLength only rejects excessively long strings.

### Service Tests
- No service tests affected — changes are in GraphQL input validation and repository error handling only.

## Verification

After implementation:
1. Run `bun tsgo` — verify type checking passes
2. Run `bun run test:db` — verify database tests pass
3. Run `bun run test:services` — verify service tests pass
4. Run `bun run test:graphql` — verify GraphQL integration tests pass
5. Run `bun run lint` — verify no lint errors introduced
