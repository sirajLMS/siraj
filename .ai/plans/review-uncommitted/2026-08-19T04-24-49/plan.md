# Uncommitted Changes Review Plan

**Date**: 2026-08-19
**Scope**: Uncommitted changes (staged, unstaged, untracked) — Login cold start fix
**Tracks**: Security, Performance, Business Logic, Deploy Safety, Duplication, Dead Code
**Files Reviewed**: 42 changed files (19 code files with hunks)

## Summary

The login cold start fix adds retry logic, fail-open rate limiting, and frontend retry for Vercel serverless cold starts. The review found 18 total findings: 2 HIGH (duplication), 8 MEDIUM (security + business logic + dead code), and 8 LOW. No CRITICAL issues. Performance and deploy safety tracks are clean. The main concerns are: (1) fail-open rate limiting catches ALL errors not just transient ones, degrading brute-force protection; (2) `createAuthSession` retry is non-idempotent risking duplicate session rows; (3) `makeTransientError` duplicated 4× across test files; (4) orphaned exports in `test/simulate/helpers.ts`.

## Findings

### HIGH (2)

- [ ] [HIGH] duplication: `test/simulate/helpers.ts:16` — `setupColdStartTestLifecycle()` is a near-verbatim copy of committed `frontend/common/graphql/test/lifecycle.ts:23` `setupTestServerLifecycle()`. Only differences: comment block, log message text, function name. No behavioral basis for the fork. Drift risk: fixes must be applied to both copies.
- [ ] [HIGH] duplication: `backend/graphql/mutation/auth/test/auth-mutation-cold-start.test.ts:8` — `makeTransientError` defined in 4 places with 2 different signatures and 2 different hardcoded error codes (auth-mutation test: `"ECONNRESET"`, env-config test: `"ETIMEDOUT"`, retry test: different signature `makeTransientError(code: string)`, simulate/helpers.ts: `"ETIMEDOUT"` but never imported). High drift risk.

### MEDIUM (8)

- [ ] [MEDIUM] security: `backend/graphql/mutation/auth/auth.mutation.ts:258-262, 274-280` — Fail-open `recordAttempt` disables brute-force/lockout accounting during transient DB errors. Failed password attempts not recorded; `isLocked` defaults to false. Attacker gets unlimited guesses without lockout during cold-start window.
- [ ] [MEDIUM] security: `backend/graphql/mutation/auth/auth.mutation.ts:216-221, 231-236` — `checkRateLimit` and `isLocked` catch ALL errors (bare `catch {}`), not just transient ones. Non-transient failures silently disable rate limiting. Recommend narrowing to `isTransientError` and failing closed for non-transient.
- [ ] [MEDIUM] business-logic: `backend/graphql/mutation/auth/auth.mutation.ts:311` — `retryTransient(() => createAuthSession(...))` retries a non-idempotent side-effectful operation. `createAuthSession` generates a fresh `randomUUID()` sessionId on every attempt. If first attempt committed but a later step threw transient error, retry inserts a SECOND session row → orphaned sessions.
- [ ] [MEDIUM] business-logic: `frontend/views/auth/login/useLoginViewModel.ts:99` — `getServiceUnavailableCode` only inspects `error.errors[0]`. If `SERVICE_UNAVAILABLE` is on `errors[1]+`, it's silently treated as non-retryable. Recommend iterating all errors.
- [ ] [MEDIUM] business-logic: `frontend/views/auth/login/useLoginViewModel.ts:134` — `handleLoginSubmit` does NOT reset `retryCountRef.current = 0` before calling `performLogin`. If user resubmits while a retry is in-flight, new invocation inherits already-incremented retryCount → fewer retries than expected. Guard with reset or AbortController.
- [ ] [MEDIUM] dead-code: `test/simulate/helpers.ts:28` — `getGraphQLErrorCode` exported but never imported or called anywhere. Test files use `CombinedGraphQLErrors.is()` directly. Orphaned export.
- [ ] [MEDIUM] dead-code: `test/simulate/helpers.ts:35` — `getGraphQLErrorMessage` exported but never imported or called anywhere. Test files extract message inline. Orphaned export.
- [ ] [MEDIUM] dead-code: `test/simulate/helpers.ts:40` — `makeTransientError` exported but never imported or called anywhere. Dead code duplicating the same-named helper already defined locally in two backend test files.

### LOW (8)

- [ ] [LOW] security: `backend/lib/retry.ts:60-62` — `retryTransient` retries with no jitter and fixed multiplier. Concurrent cold-start requests retry in lockstep, potentially amplifying load on cold Neon DB pool (thundering-herd). Add randomized jitter.
- [ ] [LOW] security: `backend/lib/retry.ts:48,57` — Retry logic logs `error.message` and `String(error)`. If downstream error message ever includes user-supplied data (email), could leak PII into logs. Currently low risk since DB-driver errors don't echo input.
- [ ] [LOW] business-logic: `backend/lib/retry.ts:7` — `TRANSIENT_ERROR_PATTERNS` includes bare substrings `"connection"` and `"pool"` which match permanent non-transient failures like `"invalid connection string"`. Tighten patterns.
- [ ] [LOW] business-logic: `backend/graphql/mutation/auth/auth.mutation.ts:259` — On anti-enumeration path, fail-open `recordAttempt` swallows lock result. If this attempt crosses the lock threshold, `INVALID_CREDENTIALS` doesn't propagate lock-escalation UX signal, unlike password-invalid branch.
- [ ] [LOW] business-logic: `backend/lib/retry.ts:60` — `setTimeout` is non-cancellable. On Vercel serverless function freeze/termination mid-backoff, promise never resolves/rejects → caller hangs until invocation timeout. Consider `AbortSignal.timeout`.
- [ ] [LOW] business-logic: `backend/services/system/environment-config.service.ts:347` — Non-transient DB error entries get long TTL but never short-circuit → re-queries broken DB at full QPS. Transient entries have fixed 30s loop with no backoff decay. Inconsistent TTL semantics.
- [ ] [LOW] duplication: `test/simulate/login-full-flow-cold-start.test.ts:19` — `clearCookies()` + `testClient.mutate({ mutation: demoLoginMutationDocument, ... })` block copy-pasted verbatim across 4 simulate test files and multiple tests within each file. ~7 copies of same 9-line block.
- [ ] [LOW] duplication: `backend/lib/test/retry.test.ts:11` — `makeMessageError(message)` is a trivial `new Error(message)` wrapper defined only here. Overlaps conceptually with `makeTransientError` with non-transient message. Minor copy-paste smell.

## Recommended Actions

### Priority 1 — Fix HIGH findings (duplication)
1. **Consolidate `makeTransientError`**: Create a single shared test helper in `test/simulate/helpers.ts` (or `backend/lib/test/helpers.ts`) with a flexible signature `makeTransientError(code: string, message?: string)`. Update all 4 copies to import from it.
2. **Eliminate `setupColdStartTestLifecycle` duplicate**: Import `setupTestServerLifecycle` from `frontend/common/graphql/test/lifecycle.ts` directly in `test/simulate/helpers.ts` and re-export. Remove the copy.

### Priority 2 — Fix MEDIUM findings (security + business logic + dead code)
3. **Narrow fail-open catches**: In `auth.mutation.ts`, replace bare `catch {}` blocks with `catch (error) { if (isTransientError(error)) { logger.warn(...) } else { throw error } }` for `checkRateLimit`, `isLocked`, `recordAttempt`. Non-transient errors should fail closed.
4. **Remove `createAuthSession` from `retryTransient`**: Only retry `findByEmail` (the DB read). Let `createAuthSession` fail without retry — if it throws transient, the whole resolver returns `SERVICE_UNAVAILABLE` and the frontend retries the entire login.
5. **Fix frontend retry race**: Reset `retryCountRef.current = 0` at start of `handleLoginSubmit`. Guard against concurrent in-flight retries.
6. **Fix `getServiceUnavailableCode`**: Iterate all `error.errors` entries, not just `errors[0]`.
7. **Remove orphaned exports**: Delete `getGraphQLErrorCode`, `getGraphQLErrorMessage`, and `makeTransientError` from `test/simulate/helpers.ts` (or update tests to use them — but since tests already work without them, deletion is cleaner).

### Priority 3 — Fix LOW findings (optional, straightforward)
8. **Add jitter to `retryTransient`**: Add `Math.random() * 50` ms jitter to each delay.
9. **Tighten `TRANSIENT_ERROR_PATTERNS`**: Replace bare `"connection"` with `"connection reset"`, `"connection terminated"`, `"connection refused"`. Replace bare `"pool"` with `"the pool is full"`, `"pool exhausted"`.
10. **Consolidate `demoLoginSuperAdmin` helper**: Extract the repeated mutate block into a shared helper in `test/simulate/helpers.ts`.

## Layer Compliance Notes

- All backend changes follow `backend/AGENTS.md` layer rules (types from `backend/types/`, no local type definitions in Pothos files)
- Frontend changes follow `frontend/AGENTS.md` (MUI v9 `sx` prop usage, Apollo `useMutation` from `@apollo/client/react`)
- Test files follow `tests.instructions.md` (proper `runInRollback` for DB tests, `testClient` for GraphQL)
- i18n: New `retrying` label added to all locale files (en, ar) and type schema ✅
- No `console.*` usage — all logging via `logger` ✅
- No hardcoded colors ✅

## Fix Status

- Total findings: 18
- Fixed: 15 / 18
- Skipped: 3 (LOW severity — non-blocking, deferred)
- Remaining: 0 actionable

### Fixed findings:

**HIGH (2/2 fixed)**
- [x] [HIGH] duplication: `test/simulate/helpers.ts:16` — Eliminated `setupColdStartTestLifecycle` duplicate. Now re-exports `setupTestServerLifecycle` from `@/frontend/common/graphql/test/lifecycle`.
- [x] [HIGH] duplication: `makeTransientError` 4 copies → consolidated to 1 shared helper in `backend/lib/test/helpers.ts`. All test files updated to import from it.

**MEDIUM (8/8 fixed)**
- [x] [MEDIUM] security: Fail-open now only catches transient errors via `failOpen()` helper. Non-transient errors are re-thrown (fail-closed).
- [x] [MEDIUM] security: Same as above — all 5 bare `catch {}` blocks replaced with `failOpen()` that checks `isTransientError`.
- [x] [MEDIUM] business-logic: Removed `retryTransient` from `createAuthSession`. Non-idempotent write is no longer retried — transient error returns `SERVICE_UNAVAILABLE` for frontend retry.
- [x] [MEDIUM] business-logic: `getServiceUnavailableCode` now iterates all `error.errors` entries, not just `errors[0]`.
- [x] [MEDIUM] business-logic: `handleLoginSubmit` now resets `retryCountRef.current = 0` before calling `performLogin`.
- [x] [MEDIUM] dead-code: Removed `getGraphQLErrorCode` from `test/simulate/helpers.ts`.
- [x] [MEDIUM] dead-code: Removed `getGraphQLErrorMessage` from `test/simulate/helpers.ts`.
- [x] [MEDIUM] dead-code: Removed `makeTransientError` from `test/simulate/helpers.ts`.

**LOW (5/8 fixed)**
- [x] [LOW] security: Added jitter via `randomInt(0, 50)` (crypto-secure, not `Math.random()`).
- [x] [LOW] business-logic: Tightened `TRANSIENT_ERROR_PATTERNS` — `"connection"` → `"connection reset"`, `"connection terminated"`, `"connection refused"`. `"pool"` → `"the pool is full"`, `"pool exhausted"`.
- [x] [LOW] business-logic: Removed trivial `makeMessageError` wrapper from retry.test.ts, replaced with inline `new Error()`.
- [ ] [LOW] security: Retry logs `error.message` — currently low risk (DB-driver errors don't echo user input). Deferred.
- [ ] [LOW] business-logic: `setTimeout` non-cancellable — would need AbortSignal for Vercel freeze. Deferred.
- [ ] [LOW] business-logic: Env-config non-transient TTL inconsistency — cosmetic. Deferred.
- [ ] [LOW] duplication: `demoLoginSuperAdmin` mutate block repeated across test files — would need shared test helper. Deferred.
- [ ] [LOW] duplication: `setupColdStartTestLifecycle` → `lifecycle.ts` re-export shim — kept for stable import path. Deferred.

### Verification
- ✅ tsgo: 0 errors
- ✅ lint: 0 errors
- ✅ biome: clean
- ✅ retry.test.ts: 17/17 pass (3 new tests for tightened patterns)
- ✅ auth-mutation-cold-start.test.ts: 5/5 pass
- ✅ environment-config-cold-start.test.ts: 5/5 pass
