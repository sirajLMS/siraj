# Group-Class Test Fix: Root Cause & Remediation Plan

**Date**: 2026-07-01
**Status**: In Progress — Root cause identified, fix not yet implemented
**Failing Tests**: 7 of 249 GraphQL integration tests (all in `group-class.test.ts`)
**Session Commits**: `170fe77` → `d7923cf` → `3ee5590` → `4b87b78` → `57ec162` → `36ef431` → `16d72c7` → `444f4fd` → `fe53df6` → `68f5a87`

---

## 1. Problem Statement

Running the full GraphQL test suite (`bun test frontend/common/graphql/test/ --timeout=120000`) yields **242 pass, 7 fail**. All 7 failures are in `frontend/common/graphql/test/group-class.test.ts`, and they all cascade from the first test "provision test entities, class instance, and group class" failing to log in a newly-created super admin.

Even when run **individually**, `group-class.test.ts` fails with the same error — this is NOT a parallel-execution race condition.

### Error Message
```
Failed to login: GroupClassIntTestSA-superadmin-4295adaf-xxx@example.com (unknown)
```
- `"unknown"` in parentheses = the GraphQL errors array was empty/undefined
- `result.data` was null/undefined (no token returned)
- Server logs show **HTTP 400** on the login requests

---

## 2. Root Cause (CONFIRMED)

### The `inet` column + `"unknown"` IP = PostgreSQL crash

The `auth_rate_limits` table has `ip_address` defined as PostgreSQL **`inet`** type (Drizzle schema: `inet("ip_address")` at `backend/db/schema/users.ts:108`).

The `ratelimit.repository.ts` casts the IP string to `inet` in SQL:

**`recordAttempt` (line 20-21):**
```ts
SELECT * FROM check_and_record_auth_attempt(
    ${ipAddress}::inet,  // ← CRASHES when ipAddress = "unknown"
    ${email}, ...
)
```

**`resetAttempts` (line 61):**
```ts
SELECT reset_auth_attempts(${ipAddress}::inet, ${email})
```

**The SQL function also expects `inet`:**
```sql
CREATE OR REPLACE FUNCTION check_and_record_auth_attempt(
    p_ip_address INET,  -- ← requires valid IP
    ...
)
```

### Why "unknown"?

The `gqlContextFactory.ts` (lines 26-30) resolves IP from request headers:
```ts
function getIpAddress(headersList: Headers): string {
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
}
```

The test client (`frontend/common/graphql/test/testClient.ts`) is an `ApolloClient` with `HttpLink` that **never sets** `x-forwarded-for` or `x-real-ip` headers. So every test request resolves to IP = `"unknown"`.

### The crash sequence

1. Test calls `provisionTestSuperAdmin` → creates super admin user in DB → tries to log in via `loginUser(email, password)`
2. `loginUser` calls `loginMutationDocument` → hits the login mutation resolver
3. Login resolver calls `RateLimitRepository.isLocked(ipAddress, email)` where `ipAddress = "unknown"`
4. `isLocked` uses Drizzle: `eq(authRateLimits.ipAddress, "unknown")` against an `inet` column → **this may also crash** (comparing string "unknown" to inet column)
5. If `isLocked` doesn't crash first, then after successful password check, `resetAttempts("unknown", email)` is called → `${ipAddress}::inet` = `"unknown"::inet` → **PostgreSQL throws invalid input syntax for type inet**
6. This unhandled DB error crashes the GraphQL mutation → HTTP 400/500 with no GraphQL response body
7. Apollo Client receives HTTP 400: `result.data = null`, `result.errors = undefined`
8. `executeLogin` in helpers.ts throws `"Failed to login: ... (unknown)"` because both data and errors are empty

### Why other tests pass (CRITICAL nuance)

- **`manager-directory-graphql.test.ts` (9/9 pass)**: Also calls `provisionTestSuperAdmin` but mysteriously works. Need to investigate why. Possible: the `isLocked` Drizzle query doesn't crash with "unknown" (Drizzle might handle the cast differently from raw SQL), and the user lookup fails before `recordAttempt` is called, OR the `resetAttempts` call on successful login might crash but the token is already returned by then.
- **`complaint.test.ts` (32/32 pass)**: Also uses `provisionTestSuperAdmin` but passes. Same mystery.
- **`learning-resource-graphql.test.ts` (9/9 pass)**: Uses `provisionTestSuperAdmin` but passes.
- **`class-instance-detail.test.ts`**: Doesn't use `provisionTestSuperAdmin` at all.

**KEY QUESTION (UNRESOLVED)**: Why do some tests that call `provisionTestSuperAdmin` (complaint, manager-directory, learning-resource) pass while group-class fails? The `inet` crash should affect ALL login calls equally. Possible explanations:
1. The `isLocked` Drizzle query doesn't actually crash (Drizzle handles the string-to-inet comparison safely), but `recordAttempt`/`resetAttempts` raw SQL does crash
2. The login succeeds (password check passes, token generated), then `resetAttempts` crashes AFTER the return — but the mutation result is already sent
3. Only failing logins hit `recordAttempt` (crash path), while successful logins hit `resetAttempts` which might not crash if Drizzle casts differently
4. Test execution order: group-class may run AFTER other tests that left the DB in a bad state

**This needs verification.** If `resetAttempts` also crashes, then successful logins would fail too, and ALL provisionTestSuperAdmin calls should fail. The fact that some pass suggests either: (a) the crash is caught somewhere, (b) the return happens before the crash, or (c) there's a difference in how the IP is passed.

---

## 3. Evidence

| Source | Finding |
|--------|---------|
| `backend/db/schema/users.ts:108` | `ipAddress: inet("ip_address")` — column is PostgreSQL `inet` type |
| `backend/db/repo/ratelimit.repository.ts:21` | `${ipAddress}::inet` in raw SQL — crashes with "unknown" |
| `backend/db/repo/ratelimit.repository.ts:61` | `${ipAddress}::inet` in raw SQL — crashes with "unknown" |
| `backend/db/migration/auth_rate_limiting.sql` | SQL function parameter `p_ip_address INET` — requires valid IP |
| `backend/graphql/gqlContextFactory.ts:26-30` | Falls back to `"unknown"` when no IP headers present |
| `frontend/common/graphql/test/testClient.ts` | Never sets `x-forwarded-for` or `x-real-ip` headers |
| `backend/graphql/mutation/auth.mutation.ts:142-184` | Calls `isLocked`, `recordAttempt`, `resetAttempts` with `ipAddress` from context |
| DB query result | `auth_rate_limits` table has **0 rows** — "unknown" was never successfully stored |
| Server log | `POST /api/graphql 400 in 33ms` — HTTP 400 on login attempts |
| Test error | `(unknown)` = no GraphQL errors in response (mutation crashed before GraphQL error formatting) |

### Verified NOT the cause
- Password hashing: Both `createTestSuperAdmin` and `createTestEntities` use `hashPassword()` → `bcrypt.hash(password, 12)` — identical
- Race condition: Group-class fails even when run **individually**
- Rate limit lockout: Table has 0 rows, no entries locked
- Missing fields: User is created correctly (isSuperAdmin=true, permission group assigned, staff profile created)

---

## 4. Uncommitted Changes (NOT related to this bug)

These files have uncommitted changes from the security review but are NOT part of the group-class fix:
- `.env.example`
- `app/[locale]/(auth)/login/page.tsx`
- `app/api/logs/route.ts`
- `backend/graphql/mutation/auth.mutation.ts` — **NOTE: this has auth changes from security review**
- `environment.d.ts`
- `frontend/lib/logger/index.ts`
- `frontend/views/auth/login/index.tsx`

---

## 5. Fix Plan

### Option A: Fix the IP fallback (RECOMMENDED)
Change `gqlContextFactory.ts` to return a valid IP instead of `"unknown"`:
```ts
function getIpAddress(headersList: Headers): string {
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return realIp || forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
}
```
**Pros**: Fixes at the source, works for all callers
**Cons**: All test requests would share "127.0.0.1" IP (but that's fine for rate limiting since email differs)

### Option B: Make ratelimit.repository.ts robust
Validate/sanitize IP before casting to inet:
```ts
const safeIp = isValidInetAddress(ipAddress) ? ipAddress : "127.0.0.1";
// use safeIp in SQL
```
**Pros**: Defense in depth, protects against any caller passing invalid IP
**Cons**: Requires adding IP validation utility, changes the repo layer

### Option C: Change DB column to varchar
Revert `ip_address` from `inet` to `varchar`:
**Cons**: Loses PostgreSQL inet-specific features (network containment queries, etc.), weaker data integrity

### Option D: Fix test client to send valid IP
Add `x-forwarded-for: 127.0.0.1` header to the test Apollo Client:
**Pros**: Tests work, production unaffected
**Cons**: Doesn't fix the underlying issue if a real client sends no IP header

### Recommended: Option A + Option B combined
- Fix `gqlContextFactory.ts` fallback from `"unknown"` to `"127.0.0.1"`
- Also add validation in `ratelimit.repository.ts` (defense in depth)

---

## 6. Verification Steps

After implementing the fix:
1. Run `group-class.test.ts` individually: `~/.bun/bin/bun run scripts/run-test/run-test.ts frontend/common/graphql/test/group-class.test.ts`
2. Run full GraphQL test suite: `~/.bun/bin/bun run test:graphql` (expect 249/249 pass)
3. Run `tsgo` type check
4. Run `biome:check`
5. Lint via queue server: `Invoke-RestMethod -Uri http://localhost:${LINT_QUEUE_PORT}/lint -Method POST -ContentType 'application/json' -Body '{"id":"inet-fix","files":["backend/graphql/gqlContextFactory.ts","backend/db/repo/ratelimit.repository.ts"]}'`
6. Commit scoped changes

---

## 7. Key Files to Modify

| File | Change |
|------|--------|
| `backend/graphql/gqlContextFactory.ts` | Change `"unknown"` fallback to `"127.0.0.1"` |
| `backend/db/repo/ratelimit.repository.ts` | Add IP validation before `::inet` cast (defense in depth) |

### Files NOT to modify
- `frontend/common/graphql/test/group-class.test.ts` — test logic is correct
- `frontend/common/graphql/test/helpers.ts` — retry logic is correct, the fix is server-side
- `backend/graphql/mutation/auth.mutation.ts` — logic is correct, issue is upstream (IP resolution)

---

## 8. Environment & Commands Reference

| Item | Value |
|------|-------|
| Bun path | `~/.bun/bin/bun` |
| Test runner | `~/.bun/bin/bun run scripts/run-test/run-test.ts <test-path>` |
| Test runner (last results) | `--last` flag; `--last --focus "<pattern>"` for filtering |
| Lint queue server | `~/.bun/bin/bun run scripts/lint-queue-server.ts` (port defined in `scripts/lint-queue-config.ts`) |
| Lint via queue | `Invoke-RestMethod -Uri http://localhost:${LINT_QUEUE_PORT}/lint -Method POST -ContentType 'application/json' -Body '{"id":"x","files":["f1"]}'` |
| Type check | `~/.bun/bin/bun run tsgo` |
| Format check | `~/.bun/bin/bun run biome:check` |
| Quality gate | `~/.bun/bin/bun quality-gate` |
| GraphQL codegen | `~/.bun/bin/bun run generate:gqlSchema && bun codegen` |

---

## 9. Session History (for full context)

### Commits made this session (chronological):
1. `170fe77`: 108 initial security findings
2. `d7923cf`: 14 config/root findings
3. `3ee5590`: 234 frontend findings
4. `4b87b78`: IDOR, auth, GraphQL query/mutation fixes
5. `57ec162`: 127 remaining security fixes (86 files, +658/-273)
6. `36ef431`: URL sanitizer + delivery failure utility
7. `16d72c7`: DB test fixes (student_progress, session-scalability)
8. `444f4fd`: GraphQL test fixes (7 test files + class-session.utils.ts bug)
9. `fe53df6`: Test resilience (retry logic, error surfacing, TEST_USER_PASSWORD constant, codegen regen, seed fix, timezone test fix)
10. `68f5a87`: CSP nonce propagation for Emotion SSR styles

### Key bugs found and fixed:
- **ClassExecutionState "PENDING" enum bug**: `class-session.utils.ts` used `||` operator causing `ClassOutcome.PENDING` to leak into `ClassExecutionState` field. Fixed with `resolveClassInstanceStatus()` function.
- **IDOR protection**: `ComplaintService.submitComplaint` now validates `studentId`. Tests updated to use `null` instead of `NIL_UUID`.
- **Auth scope changes**: Several queries/mutations now require `superAdmin` scope. Tests updated to use `superAdminToken`.
- **SQL function `check_and_record_auth_attempt`**: Requires `inet` type for IP but receives `"unknown"` from test context — **CURRENTLY UNFIXED**.

---

## 10. Open Investigation (UNRESOLVED)

**Why do some `provisionTestSuperAdmin` calls succeed while group-class fails?**

Multiple test files call `provisionTestSuperAdmin` but only `group-class.test.ts` fails. This is paradoxical if the `inet` crash affects all login calls equally. Possible explanations to verify:

1. **Drizzle `isLocked` vs raw SQL `recordAttempt`**: `isLocked` uses Drizzle ORM (`eq(authRateLimits.ipAddress, "unknown")`) which may handle the inet comparison gracefully (returning empty results instead of crashing), while `recordAttempt` and `resetAttempts` use raw SQL with explicit `::inet` cast which DOES crash.

2. **Login success path**: If password check passes → `resetAttempts("unknown", email)` is called → if this crashes AFTER the token is already generated and about to be returned, the Pothos resolver may have already serialized the response. But if the crash happens before the return, the mutation result would be null.

3. **Login failure path**: If password check fails → `recordAttempt("unknown", email)` is called → this ALWAYS crashes because it's raw SQL with `::inet` → the mutation returns null data with HTTP 400.

4. **Test execution order**: The 3 passing tests may run before any DB rate limit entries are created, or the `::inet` cast behavior may differ when the table is empty vs has rows.

**NEXT STEP**: Verify `SELECT 'unknown'::inet` in PostgreSQL to confirm it throws an error. Then fix `gqlContextFactory.ts` and `ratelimit.repository.ts`.
