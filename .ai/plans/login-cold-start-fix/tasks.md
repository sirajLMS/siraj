# Tasks: Login Cold Start Fix

## Document Information

- **Feature Name**: Login Cold Start Fix
- **Target Directory**: `.ai/plans/login-cold-start-fix`
- **Outcome Directory**: `.ai/plans/login-cold-start-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-19
- **Author**: Copilot
- **Related Documents**:
  - Requirements: [specs.md](specs.md)
  - Design: [design.md](design.md)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:** Read ALL existing files in `.ai/plans/login-cold-start-fix/outcome/` before starting.
2. **Per-File Quality Verification:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` after every file edit.
3. **Semantic Review Checklist:** Race conditions, env-config, dead code, cross-layer, enums, deferred items.
4. **Global Health Check:** All modified files must pass `sub-loop.ts --lifecycle codescene` with exit code 0.
5. **Post-Execution Outcome File:** Write `.ai/plans/login-cold-start-fix/outcome/<task-id>-outcome.md`.
6. **Task Progress Tracking:** Update `[ ]` -> `[x]` in this file.

## Applicable AGENTS.md & Instructions Per Layer

| File Pattern | AGENTS.md | Instructions |
|---|---|---|
| `backend/lib/**/*.ts` | `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/graphql/**/*.ts` | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/db/repo/**/*.ts` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/services/system/**/*.ts` | `backend/AGENTS.md` | `backend.instructions.md` |
| `frontend/views/**/*.ts(x)` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `shared/locale/**/*.ts` | `shared/AGENTS.md` | — |

---

## Phase 0: Baseline

- [ ] 0.1 **Record baseline error counts**
  - Run `bun tsgo 2>&1 | grep "error TS" | wc -l` and record count
  - Run `bun biome:check 2>&1 | grep -c "warn"` and record count
  - Create `.ai/plans/login-cold-start-fix/deferred-items.md` from template (or empty if no template exists)
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/0.1-baseline.md`
  - _Requirements: REQ-0_

---

## Phase 1: Retry Utility

- [ ] 1.1 **Create `retryTransient` utility**
  - Create file: `backend/lib/retry.ts`
  - Implement `retryTransient<T>(fn: () => Promise<T>, options?: { maxRetries?: number; baseDelayMs?: number }): Promise<T>`
  - Default: 2 retries, 300ms base delay (300ms → 700ms exponential)
  - Transient error detection: check `err.code` for `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, `EAI_AGAIN`, or error message containing `timeout`, `connection`, `WebSocket`, `pool`
  - Non-transient errors re-throw immediately (no retry)
  - Log each retry at `warn` level with attempt number and delay
  - Export `isTransientError(error: unknown): boolean` as a separate helper for reuse
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/lib/retry.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `backend/AGENTS.md`
  - Read applicable instructions: `backend.instructions.md`
  - _Requirements: REQ-2_

- [ ] 1.2 **Write unit tests for `retryTransient`**
  - Create file: `backend/lib/test/retry.test.ts`
  - Test cases:
    - Transient error retried then succeeds → returns result, retried expected number of times
    - Transient error exhausts retries → throws original error
    - Non-transient error → does NOT retry, throws immediately
    - Zero retries option → no retry on transient error
    - Delay timing: verify setTimeout (or mock) called with expected delays
  - Use `bun test` runner with mocking for `setTimeout` and logger
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/lib/test/retry.test.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `backend/AGENTS.md`
  - Read applicable instructions: `tests.instructions.md`, `backend.instructions.md`
  - _Requirements: REQ-2_

- [ ] 1.3 **Run test suite and verify all pass**
  - Run: `bun test backend/lib/test/retry.test.ts`
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/1.1-retry-utility.md`
  - _Requirements: REQ-2_

---

## Phase 2: Login Resolver Error Handling

- [ ] 2.1 **Add fail-open try/catch for rate limiter in login resolver**
  - File: `backend/graphql/mutation/auth/auth.mutation.ts`
  - Wrap `checkRateLimit(ipAddress, authRateLimiter)` (line 208) in try/catch
  - On catch: log warn "Rate limit check bypassed (cold start)" with error, proceed to next step
  - On success: keep existing `if (!rateLimitResult.success)` check
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/auth/auth.mutation.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `backend/graphql/AGENTS.md`, `backend/AGENTS.md`
  - Read applicable instructions: `backend.instructions.md`
  - _Requirements: REQ-1_

- [ ] 2.2 **Add fail-open try/catch for `RateLimitService.isLocked`**
  - File: `backend/graphql/mutation/auth/auth.mutation.ts`
  - Wrap `RateLimitService.isLocked(ipAddress, email.value)` (line 217) in try/catch
  - On catch: log warn "Lock check bypassed (cold start)" with error, proceed to credential check
  - On success: keep existing `if (isLocked)` check
  - Note: `isLocked` already uses `queryDb()` (Neon HTTP) — this is a secondary defense
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/auth/auth.mutation.ts --lifecycle codescene`
  - _Requirements: REQ-1_

- [ ] 2.3 **Apply `retryTransient` to `UserService.findByEmail` call**
  - File: `backend/graphql/mutation/auth/auth.mutation.ts`
  - Import `retryTransient` from `@/backend/lib/retry`
  - Wrap `UserService.findByEmail(email.value)` (line 227) in `retryTransient(async () => UserService.findByEmail(email.value))`
  - Keep existing try/catch that throws `SERVICE_UNAVAILABLE` (the retry is inside the try)
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/auth/auth.mutation.ts --lifecycle codescene`
  - Semantic review: verify that the `retryTransient` doesn't retry on `INVALID_CREDENTIALS` (user not found is null, not an error — retry only fires on throws)
  - _Requirements: REQ-1, REQ-2_

- [ ] 2.4 **Add fail-open try/catch for `recordAttempt` calls**
  - File: `backend/graphql/mutation/auth/auth.mutation.ts`
  - Wrap `RateLimitService.recordAttempt(ipAddress, email.value)` at line 238 (user not found path) in try/catch
  - Wrap `RateLimitService.recordAttempt(ipAddress, email.value)` at line 250 (invalid password path) in try/catch
  - On catch: log warn "recordAttempt bypassed (cold start)" with error, proceed normally
  - **Critical**: `recordAttempt` uses `db.execute()` (pooled DB), NOT `queryDb()` — this is a HIGH cold-start vulnerability
  - On the line 250 path: preserve the `if (result.isLocked)` check inside the try (if recordAttempt succeeds, still check lock status)
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/auth/auth.mutation.ts --lifecycle codescene`
  - _Requirements: REQ-1_

- [ ] 2.5 **Add fail-open try/catch for `resetAttempts` call**
  - File: `backend/graphql/mutation/auth/auth.mutation.ts`
  - Wrap `RateLimitService.resetAttempts(ipAddress, email.value)` at line 271 (successful login path) in try/catch
  - On catch: log warn "resetAttempts bypassed (cold start)" with error, proceed to session creation
  - **Critical**: `resetAttempts` uses `db.execute()` (pooled DB), NOT `queryDb()` — this is a HIGH cold-start vulnerability
  - Do NOT block a successful login if attempt reset fails
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/auth/auth.mutation.ts --lifecycle codescene`
  - _Requirements: REQ-1_

- [ ] 2.6 **Quality verification for login resolver**
  - Re-run: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/auth/auth.mutation.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/2.1-login-resolver.md`
  - _Requirements: REQ-1, REQ-2_

---

## Phase 3: Neon HTTP Driver for `findByEmail` — ALREADY IMPLEMENTED

> **Plan Review Finding**: `UserRepository.findByEmail` already uses `queryDb()` (line 159 of `user.repository.ts`).
> The Neon HTTP driver routing is already active. This phase is verification-only.

- [x] 3.1 **Verify `UserRepository.findByEmail` already uses `queryDb()`**
  - File: `backend/db/repo/users/user.repository.ts` (line 158-162)
  - Confirmed: `const q = queryDb();` — already routes through Neon HTTP when eligible
  - No code changes needed
  - _Requirements: REQ-3_

- [ ] 3.2 **Run existing repository tests to verify no regression**
  - Run: `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts` (or equivalent test path)
  - If no test exists for `findByEmail`, verify via existing login integration tests
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/3.1-neon-http-routing.md`
  - _Requirements: REQ-3_

---

## Phase 3.5: Environment-Config Cold-Start Resilience

> **R3 Finding**: `resolveEnvConfig()` in `environment-config.service.ts` already has a DB error try/catch (line 272-284) with env fallback. However, there are two cold-start issues:
> 1. **Incorrect `source: "db"` on DB failure** (line 292): When DB lookup fails and we fall back to `process.env`, the cache entry is tagged `source: "db"` (authoritative). This blocks DB override re-lookup for 5 minutes — a DB override set during the cold-start window is invisible until the cache expires.
> 2. **No transient error detection**: The DB error catch (line 277) treats all DB failures identically — cold-start timeouts and real database errors are both swallowed. A transient cold-start error should use a **shorter TTL** so the DB is re-queried sooner, while a real DB error should use the full 5-minute TTL.

- [ ] 3.5.1 **Fix cache `source` tag when DB lookup fails**
  - File: `backend/services/system/environment-config.service.ts`
  - In `resolveEnvConfig()` (line 247-294):
    - When DB lookup succeeds (line 274-276): keep `source: "db"` (authoritative — DB override confirmed)
    - When DB lookup fails (catch block, line 277-283): set `source: "env"` in the cache entry (non-authoritative — the next `resolveEnvConfig` call will re-query the DB, respecting DB > env precedence)
    - When DB lookup misses (no row found, line 286-288): keep `source: "db"` (authoritative — DB miss is still a DB-confirmed answer)
  - Apply the same fix to `recordResolvedKey()` in the batch path (line 367-383)
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/services/system/environment-config.service.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `backend/AGENTS.md`
  - Read applicable instructions: `backend.instructions.md`
  - _Requirements: REQ-3_

- [ ] 3.5.2 **Add short-TTL retry for transient DB failures in `resolveEnvConfig`**
  - File: `backend/services/system/environment-config.service.ts`
  - When the DB lookup catch block (line 277) fires AND the error looks transient (connection timeout, ECONNRESET, WebSocket — reuse `isTransientError` from `@/backend/lib/retry`):
    - Set a **shorter cache TTL** (e.g. 30 seconds instead of 5 minutes) so the DB is re-queried sooner
    - Tag the cache entry `source: "env"` (non-authoritative) so the next call falls through to DB
    - Log at `warn` level: "env-config: DB lookup failed (transient) for key '{key}', using short cache TTL (30s) to retry sooner"
  - When the DB lookup catch fires but the error is NOT transient:
    - Use the full 5-minute TTL with `source: "env"` (non-authoritative — still retry, but at normal interval)
    - Log at `error` level: "env-config: DB lookup failed (non-transient) for key '{key}'"
  - Define `SHORT_CACHE_TTL_MS = 30_000` as a constant near `DEFAULT_CACHE_TTL_MS` (line 127)
  - Apply the same logic to `lookupDbValueFor()` in the batch path (line 347-361)
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/services/system/environment-config.service.ts --lifecycle codescene`
  - _Requirements: REQ-3_

- [ ] 3.5.3 **Verify `CACHE_PROVIDER` resolution handles cold start correctly**
  - Trace the full chain: `getCacheProvider()` → `resolveEnvConfig("CACHE_PROVIDER")` → `SystemSettingsRepository.getByKey("env::CACHE_PROVIDER")` → `queryDb()` (Neon HTTP)
  - Verify the fallback chain works when DB is cold:
    1. DB lookup fails (transient) → catch block fires → `process.env.CACHE_PROVIDER` checked
    2. If `CACHE_PROVIDER` is set in env → value returned, cache tagged `source: "env"` with 30s TTL
    3. If `CACHE_PROVIDER` is NOT set in env → `resolveEnvConfig` returns `undefined` → `getCacheProvider()` falls back to `getEnvironmentConfig().cacheProvider` (env-validated)
    4. If `CACHE_PROVIDER` is set in env but DB has an override → after 30s, cache expires, DB re-queried, override picked up
  - Write test or manual verification steps in the outcome file
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/3.5-env-config-cold-start.md`
  - _Requirements: REQ-3_

---

## Phase 4: Frontend Auto-Retry

- [ ] 4.1 **Use Apollo `useMutation` directly in `useLoginViewModel` for error code access**
  - File: `frontend/views/auth/login/useLoginViewModel.ts`
  - **Context**: `useAuth().login()` catches the mutation error in `AuthProvider.tsx` (line 119), extracts only the message string via `getGraphQLErrorMessage()` (line 121), and discards `extensions.code`. The ViewModel cannot access `SERVICE_UNAVAILABLE` through the current `useAuth()` interface.
  - **Approach**: Import `loginMutationDocument` from `@/frontend/common/graphql/sharedDocuments` and `useMutation` from `@apollo/client/react` directly in `useLoginViewModel.ts` (the file already uses `useMutation` for `demoLoginMutation` — follow the same pattern)
  - Import `CombinedGraphQLErrors` from `@apollo/client` for error type checking
  - Import `useAuthToken` for `updateAuthToken` on success (AuthProvider already uses this)
  - Keep `useAuth()` for `isAuthenticated` state and `authError` fallback
  - Quality Loop: `bun run scripts/health/sub-loop.ts frontend/views/auth/login/useLoginViewModel.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - Read applicable instructions: `frontend.instructions.md`
  - _Requirements: REQ-4_

- [ ] 4.2 **Add `isRetrying` state and retry logic to `useLoginViewModel`**
  - File: `frontend/views/auth/login/useLoginViewModel.ts`
  - Add `const [isRetrying, setIsRetrying] = useState(false)`
  - Add `const retryCountRef = useRef(0)`
  - Rewrite `handleLoginSubmit`:
    - Call the Apollo mutation directly (from task 4.1)
    - On success: call `updateAuthToken(token)`, redirect (same as AuthProvider.login does)
    - On error: check `CombinedGraphQLErrors.is(error)` and extract `extensions.code` from `error.errors[0]?.extensions?.code`
    - If `code === "SERVICE_UNAVAILABLE"` and `retryCountRef.current < 2`:
      - Set `isRetrying(true)`, increment `retryCountRef.current`
      - `setTimeout` with 1000ms (1st retry) / 2000ms (2nd retry) delays
      - Retry the mutation call
    - If retries exhausted or error is not `SERVICE_UNAVAILABLE`:
      - Set `isRetrying(false)`, reset `retryCountRef.current = 0`
      - Show error message (using `getGraphQLErrorMessage` or the raw error message)
    - On successful login: reset `retryCountRef.current = 0`, `setIsRetrying(false)`
  - Return `isRetrying` from the `LoginViewModel` interface (add to interface type)
  - Quality Loop: `bun run scripts/health/sub-loop.ts frontend/views/auth/login/useLoginViewModel.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - Read applicable instructions: `frontend.instructions.md`
  - _Requirements: REQ-4_

- [ ] 4.3 **Add "Retrying..." indicator and disable submit during retry**
  - File: `frontend/views/auth/login/components/LoginForm.tsx`
  - Destructure `isRetrying` from the ViewModel return value
  - When `isRetrying` is true:
    - Show `labels.retrying` text in the error/result area (using new i18n key from task 4.4)
    - Disable the submit button
    - Show a `CircularProgress` spinner if available (from `@mui/material`)
  - Quality Loop: `bun run scripts/health/sub-loop.ts frontend/views/auth/login/components/LoginForm.tsx --lifecycle codescene`
  - _Requirements: REQ-4_

- [ ] 4.4 **Add i18n key for "retrying"**
  - Add `retrying: string` to `AuthLoginLabels` interface in `shared/locale/types/auth/index.ts`
  - Add `retrying: "Retrying..."` to `shared/locale/en/auth/login.ts`
  - Add `retrying: "إعادة المحاولة..."` to `shared/locale/ar/auth/login.ts`
  - Follow the compile-time i18n pattern: property access, not function calls (no interpolation needed)
  - Quality Loop per modified file: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
  - _Requirements: REQ-4_

- [ ] 4.5 **Quality verification for frontend changes**
  - Re-run sub-loop on all modified frontend files:
    - `frontend/views/auth/login/useLoginViewModel.ts`
    - `frontend/views/auth/login/components/LoginForm.tsx`
    - `shared/locale/types/auth/index.ts`
    - `shared/locale/en/auth/login.ts`
    - `shared/locale/ar/auth/login.ts`
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/4.1-frontend-retry.md`
  - _Requirements: REQ-4_

---

## Phase 5: Vercel Fluid Compute Configuration

- [ ] 5.1 **Verify or enable Fluid Compute**
  - Check if `vercel.json` exists at repo root
  - Check if Fluid Compute is already enabled (Vercel default on newer plans)
  - If not configured, add minimal config to enable pre-warming for the GraphQL route
  - If already active, document the verification
  - Quality Loop: N/A (config file, not TS code)
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/5.1-fluid-compute.md`
  - _Requirements: REQ-5_

---

## Phase 5.5: Cold-Start Simulation Tests

> **Goal**: Write tests that simulate serverless cold-start conditions. Tests are organized in two tiers:
> - **Tier 1 (Unit/Mocked)**: Fast unit tests with `spyOn`/`mockImplementation` — no dev server needed
> - **Tier 2 (Full GraphQL Integration)**: End-to-end tests under `test/simulate/` that spin up a real Next.js dev server, send real GraphQL login mutations, and inject transient failures into the DB/cache layer via module-level mocking — covering the full stack from Apollo Client → GraphQL resolver → Service → Repository → Database

> **Test infrastructure**:
> - Tier 1: `bun:test` with `spyOn`/`mockImplementation` — follows `backend/services/system/test/environment-config.service.test.ts` patterns
> - Tier 2: `test/simulate/` — new root-level test directory. Uses the existing `setupTestServerLifecycle()` pattern from `frontend/common/graphql/test/lifecycle.ts` to start a Next.js dev server, and the `testClient` from `frontend/common/graphql/test/testClient.ts` to send GraphQL mutations. Module-level mocking injects transient failures into repo/service methods within the server process.
> - **Rate limiting**: The standard test server sets `DISABLE_RATE_LIMITING: "true"`. Tier 2 cold-start tests MUST override this to `false` in the server env so rate limiter cold-start paths are exercised.
> - **Test command**: `bun test test/simulate/` (new script: `test:simulate` in `package.json`)

### Tier 1: Unit/Mocked Tests (no dev server)

- [ ] 5.5.1 **Retry utility unit tests (`retryTransient`)**
  - File: `backend/lib/test/retry.test.ts`
  - Already planned in Phase 1.2 — verify it covers:
    - Mock function throws `ECONNRESET` → retried 2 times → succeeds on 3rd call → returns result
    - Mock function throws `ETIMEDOUT` → retried 2 times → still throws → re-throws original error
    - Mock function throws `Error("invalid query")` → NOT retried → throws immediately
    - `maxRetries: 0` → no retry on transient error
    - Verify delay timing via `spyOn(globalThis, "setTimeout")` mock
  - No DB connection needed — pure unit test with mocked functions
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/lib/test/retry.test.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `backend/AGENTS.md`
  - Read applicable instructions: `tests.instructions.md`, `backend.instructions.md`
  - _Requirements: REQ-2_

- [ ] 5.5.2 **Environment-config cold-start simulation tests**
  - File: `backend/services/system/test/environment-config-cold-start.test.ts`
  - Test pattern: `spyOn(SystemSettingsRepository, "getByKey").mockRejectedValueOnce(transientError).mockResolvedValueOnce(dbOverride)` to simulate cold-start DB failure followed by success
  - Test cases:
    1. **DB transient failure falls back to process.env**: Mock `getByKey` to reject with `Object.assign(new Error("connect ETIMEDOUT"), { code: "ETIMEDOUT" })` → `resolveEnvConfig` returns `process.env[KEY]` (not `undefined`)
    2. **DB failure caches as `source: "env"` (non-authoritative)**: After a DB failure, the second `resolveEnvConfig` call MUST re-query the DB (not short-circuit from cache). Verify by checking spy call count = 2 after two calls.
    3. **DB failure uses short TTL (30s)**: After a transient failure, the cache entry expires in 30s (not 5 min). Test by advancing time or checking that the second call re-queries within the test timeframe.
    4. **DB success caches as `source: "db"` (authoritative)**: After a DB success, the second `resolveEnvConfig` call does NOT query the DB. Verify spy call count = 1.
    5. **DB non-transient failure uses full TTL**: Mock with `Error("relation system_settings does not exist")` → cache entry should use full TTL but still be `source: "env"` (non-authoritative — retry on next call)
    6. **DB override picked up after cold-start recovery**: Mock first call fails (transient), second call returns DB override → `resolveEnvConfig` returns the DB override value (not the env fallback)
    7. **CACHE_PROVIDER resolution chain**: Simulate `CACHE_PROVIDER` DB failure → verify `resolveEnvConfig` falls back to `process.env.CACHE_PROVIDER` → verify `getCacheProvider()` falls back to `getEnvironmentConfig().cacheProvider` when env is also unset
  - Use `invalidateEnvConfigCache()` in `beforeEach` to reset cache between tests
  - Import `isTransientError` from `@/backend/lib/retry` to verify the same transient detection logic
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/services/system/test/environment-config-cold-start.test.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `backend/AGENTS.md`
  - Read applicable instructions: `tests.instructions.md`, `backend.instructions.md`
  - _Requirements: REQ-3_

- [ ] 5.5.3 **Login resolver cold-start fail-open tests (mocked services)**
  - File: `backend/graphql/mutation/auth/test/auth-mutation-cold-start.test.ts`
  - Test pattern: Mock individual service/repository methods to throw transient errors, verify the resolver proceeds (fail-open) instead of rejecting
  - Setup: Create a test user in `runInRollback`, then simulate cold-start failures on specific operations
  - Test cases:
    1. **Rate limiter transient failure → fail-open**: Mock `checkRateLimit` to throw `Error("connect ETIMEDOUT")` → resolver does NOT throw `TOO_MANY_ATTEMPTS` → proceeds to credential check → returns login token if credentials valid
    2. **Rate limiter returns `success: false` → still rejects**: Mock `checkRateLimit` to return `{ success: false, ... }` → resolver DOES throw `TOO_MANY_ATTEMPTS` (fail-open only on ERRORS, not on rate limit being exceeded)
    3. **isLocked transient failure → fail-open**: Mock `RateLimitService.isLocked` to throw → resolver does NOT throw → proceeds to credential check
    4. **findByEmail transient failure → retried then fails as SERVICE_UNAVAILABLE**: Mock `UserService.findByEmail` to throw `ECONNRESET` twice → retried → still fails → `SERVICE_UNAVAILABLE` error thrown
    5. **findByEmail transient then succeeds**: Mock `UserService.findByEmail` to throw once then return user → retry succeeds → login proceeds normally
    6. **recordAttempt transient failure → fail-open**: Mock `RateLimitService.recordAttempt` to throw → resolver proceeds (records nothing but doesn't block login or credential check)
    7. **resetAttempts transient failure → does not block successful login**: Mock `RateLimitService.resetAttempts` to throw → resolver still creates session and returns token
  - Use try/catch helper pattern (NOT `expect().rejects.toThrow()`) per `backend/db/test/AGENTS.md` rules
  - For mocking: use `spyOn` on imported services (e.g. `spyOn(RateLimitService, "isLocked").mockRejectedValueOnce(...)`)
  - Quality Loop: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/auth/test/auth-mutation-cold-start.test.ts --lifecycle codescene`
  - Read applicable AGENTS.md: `backend/graphql/AGENTS.md`, `backend/AGENTS.md`, `backend/db/test/AGENTS.md`
  - Read applicable instructions: `tests.instructions.md`, `backend.instructions.md`
  - _Requirements: REQ-1, REQ-2_

### Tier 2: Full GraphQL Integration Tests (`test/simulate/`)

> **Goal**: End-to-end tests that start a real Next.js dev server, send real GraphQL `login` mutations via Apollo Client, and verify that cold-start transient failures are handled correctly across the full stack — GraphQL layer → Pothos resolver → Service → Repository → PostgreSQL.
>
> **Key infrastructure**: These tests reuse the existing `testClient` (Apollo Client) and `setupTestServerLifecycle()` pattern from `frontend/common/graphql/test/`, but run from `test/simulate/` with cold-start-specific server configuration. The key difference from standard GraphQL integration tests: the server is started with `DISABLE_RATE_LIMITING: "false"` so the rate limiter cold-start path is exercised, and transient DB failures are injected via module-level `spyOn` on repository methods.

- [ ] 5.5.4 **Create `test/simulate/` directory and helpers**
  - Create directory: `test/simulate/`
  - File: `test/simulate/helpers.ts`
  - Helpers:
    - `setupColdStartTestServer()` — Calls `startTestServer()` but with env override: `DISABLE_RATE_LIMITING: "false"` (so rate limiter code paths are active). Uses the same port allocation pattern from `testPort.ts`.
    - `makeTransientError(message: string): Error & { code: string }` — Constructs `Object.assign(new Error(message), { code: "ETIMEDOUT" })` for consistent transient error simulation.
    - `loginViaGraphQL(input: { email: string; password: string }): Promise<GraphQLResult>` — Sends `loginMutationDocument` via `testClient.mutate()`, returns the raw Apollo result (including `errors` array with `extensions.code`).
    - `getGraphQLErrorCode(result): string | undefined` — Extracts `result.errors?.[0]?.extensions?.code` from the Apollo mutation result.
    - `getGraphQLErrorMessage(result): string | undefined` — Extracts `result.errors?.[0]?.message`.
  - File: `test/simulate/lifecycle.ts`
  - `setupColdStartTestLifecycle()` — Same pattern as `setupTestServerLifecycle()` from `frontend/common/graphql/test/lifecycle.ts`, but uses `setupColdStartTestServer()`. Calls `ensureDemoUsersForTests()` for credential validation tests.
  - Quality Loop: `bun run scripts/health/sub-loop.ts test/simulate/helpers.ts --lifecycle codescene` and `test/simulate/lifecycle.ts`
  - Read applicable AGENTS.md: Root `AGENTS.md` (no layer-specific file for `test/simulate/` — it's a new root-level test dir)
  - Read applicable instructions: `tests.instructions.md`
  - _Requirements: REQ-1, REQ-2, REQ-4_

- [ ] 5.5.5 **Full GraphQL login cold-start simulation — rate limiter**
  - File: `test/simulate/login-rate-limit-cold-start.test.ts`
  - Test infrastructure: Uses `setupColdStartTestLifecycle()`, `testClient` from `frontend/common/graphql/test/testClient.ts`, `loginMutationDocument` from `frontend/common/graphql/sharedDocuments/auth/auth.documents.ts`
  - **Mocking strategy**: Since the test server runs in a separate process, module-level `spyOn` won't cross process boundaries. Instead, use one of:
    - **Option A (env-based)**: Set `CACHE_PROVIDER: "invalid"` in the server env to force cache service initialization failure. Verify the login resolver fails-open and returns a token (not `TOO_MANY_ATTEMPTS`).
    - **Option B (network-based)**: Point `DATABASE_URL` to a non-responsive port (e.g., `postgresql://user:pass@localhost:1/db`) so `db.execute()` in `recordAttempt`/`resetAttempts` fails. Verify login still succeeds (fail-open).
    - **Option C (middleware-based)**: Create a Next.js middleware fixture that injects a delay/error into the `/api/graphql` route handler before the resolver runs. (More complex, consider for later.)
    - **Recommended**: Option A for cache cold-start, Option B for DB pool cold-start. Both are env-var-based, no process internals needed.
  - Test cases:
    1. **Cache cold-start (CACHE_PROVIDER=invalid) → login succeeds**: Start server with `CACHE_PROVIDER: "invalid"` → send `login` mutation with valid demo credentials → verify `data.login.token` is defined (rate limiter fails-open, does NOT return `TOO_MANY_ATTEMPTS`)
    2. **DB pool cold-start (DATABASE_URL=bad port) → login with Neon HTTP still succeeds**: Start server with `DATABASE_URL` pointing to a dead port but `DB_PROVIDER: "neon"` + `DB_NEON_HTTP_ENABLED: "true"` → `findByEmail` uses Neon HTTP (bypasses dead pool) → login succeeds. This verifies the Neon HTTP driver routing for login reads.
    3. **DB pool cold-start (DATABASE_URL=bad port) → login fails with SERVICE_UNAVAILABLE (not INVALID_CREDENTIALS)**: Start server with `DATABASE_URL` pointing to dead port + `DB_PROVIDER: "postgresql"` (NOT neon, so no HTTP fallback) → send `login` mutation → verify error code is `SERVICE_UNAVAILABLE` (NOT `INVALID_CREDENTIALS`). This verifies the retry + fail-open chain produces the correct error code.
    4. **Rate limiter warm (cache works) → genuine lock still enforced**: Start server with `DISABLE_RATE_LIMITING: "false"` and working cache → intentionally trigger rate limit by sending N+1 login attempts with wrong password → verify `TOO_MANY_ATTEMPTS` error. This is a baseline test to confirm rate limiting is NOT disabled in cold-start tests.
  - Use `testClient.mutate()` with `loginMutationDocument` — same pattern as `frontend/common/graphql/test/auth/auth.test.ts`
  - Each test may need its own server instance with specific env vars, or use a shared server with env overrides applied via `beforeAll` + server restart
  - Quality Loop: `bun run scripts/health/sub-loop.ts test/simulate/login-rate-limit-cold-start.test.ts --lifecycle codescene`
  - Read applicable AGENTS.md: Root `AGENTS.md`
  - Read applicable instructions: `tests.instructions.md`
  - _Requirements: REQ-1, REQ-2, REQ-3_

- [ ] 5.5.6 **Full GraphQL login cold-start simulation — env-config**
  - File: `test/simulate/login-env-config-cold-start.test.ts`
  - Test infrastructure: Same as 5.5.5
  - Test cases:
    1. **env-config DB failure → falls back to process.env**: Start server with `DATABASE_URL` pointing to dead port → call `resolveEnvConfig("CACHE_PROVIDER")` (via a custom GraphQL test query or by observing `getCacheProvider()` behavior) → verify cache provider value matches `process.env.CACHE_PROVIDER` (not `undefined`)
    2. **env-config DB failure → short TTL (30s) → DB override picked up after recovery**: Start server with dead DB → first login attempt uses env fallback → restart server with working DB → second login attempt should use DB override (verified by observing cache provider behavior or system settings query)
    3. **Settings query during cold-start**: Send a `generalSettings` query (or similar `SystemSettings` query) during DB cold-start → verify it returns env-fallback values (not a crash). This covers the GraphQL settings query path.
  - **Note**: These tests may require a custom GraphQL query to inspect `resolveEnvConfig` behavior. If no such query exists, verify indirectly by checking that the cache service initializes with the correct provider (env fallback) during cold-start.
  - Quality Loop: `bun run scripts/health/sub-loop.ts test/simulate/login-env-config-cold-start.test.ts --lifecycle codescene`
  - Read applicable AGENTS.md: Root `AGENTS.md`
  - Read applicable instructions: `tests.instructions.md`
  - _Requirements: REQ-3_

- [ ] 5.5.7 **Full GraphQL login cold-start simulation — complete login flow**
  - File: `test/simulate/login-full-flow-cold-start.test.ts`
  - Test infrastructure: Same as 5.5.5
  - Test cases:
    1. **Complete cold-start login → SUCCESS**: Start server with Neon HTTP enabled, DB pool cold (dead `DATABASE_URL` for pool, working `NEON_DATABASE_URL` for HTTP) → send `login` mutation with valid demo credentials → verify `data.login.token` + `data.login.user.id` are defined → verify `me` query works with returned token
    2. **Complete cold-start login → SERVICE_UNAVAILABLE (not INVALID_CREDENTIALS)**: Start server with dead DB (no Neon HTTP fallback) → send `login` mutation → verify `errors[0].extensions.code === "SERVICE_UNAVAILABLE"` (NOT `"INVALID_CREDENTIALS"`) → verify `errors[0].message` does NOT contain "invalid credentials" or "password"
    3. **Login with wrong credentials during cold-start → still INVALID_CREDENTIALS (not SERVICE_UNAVAILABLE)**: Start server with working DB → send `login` mutation with wrong password → verify `errors[0].extensions.code === "INVALID_CREDENTIALS"`. This is a baseline confirming that genuine auth failures are not masked by cold-start handling.
    4. **Login during cold-start → retry then succeed**: Start server with intermittently-failing DB → first `login` mutation returns `SERVICE_UNAVAILABLE` → wait 1s → second `login` mutation (same credentials) succeeds. This verifies the frontend auto-retry would succeed if the backend recovers.
    5. **Token after cold-start login is valid**: After test case 1 succeeds, use the returned token to call `me` query → verify `data.me` returns the same user. This verifies the session was properly created despite cold-start.
    6. **Logout after cold-start login**: After test case 1, call `logout` mutation → verify success. This verifies the full auth lifecycle works after cold-start login.
  - Quality Loop: `bun run scripts/health/sub-loop.ts test/simulate/login-full-flow-cold-start.test.ts --lifecycle codescene`
  - Read applicable AGENTS.md: Root `AGENTS.md`
  - Read applicable instructions: `tests.instructions.md`
  - _Requirements: REQ-1, REQ-2, REQ-4_

- [ ] 5.5.8 **Add `test:simulate` script to `package.json`**
  - Add script: `"test:simulate": "bun test test/simulate/"`
  - Add script: `"test:simulate:sequential": "bun test test/simulate/ --sequential"` (for debugging)
  - Verify: `bun run test:simulate` runs all `test/simulate/` tests
  - _Requirements: All_

- [ ] 5.5.9 **Run all cold-start tests and verify**
  - Run Tier 1: `bun test backend/lib/test/retry.test.ts`
  - Run Tier 1: `bun test backend/services/system/test/environment-config-cold-start.test.ts`
  - Run Tier 1: `bun test backend/graphql/mutation/auth/test/auth-mutation-cold-start.test.ts`
  - Run Tier 2: `bun run test:simulate` (all `test/simulate/` tests)
  - Verify all tests pass (or document any that require live Neon and skip gracefully)
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/5.5-cold-start-tests.md`
  - _Requirements: REQ-1, REQ-2, REQ-3, REQ-4_

---

## Phase 6: Integration Verification

- [ ] 6.1 **Run full quality gate**
  - Run: `bun tsgo` to verify no type errors across the codebase
  - Run: `bun run lint` to verify no lint errors
  - Fix any issues introduced by the changes
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/6.1-integration-verification.md`
  - _Requirements: All_

- [ ] 6.2 **Post-Implementation Review**
  - Dispatch review subagents:
    - `review-backend` on all modified `backend/` files
    - `review-frontend` on all modified `frontend/` files
    - `review-types` on any modified type files (if any)
  - Aggregate findings, filter to new code only
  - Fix any HIGH/CRITICAL findings
  - Re-run review until zero feature-specific findings
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/6.2-post-implementation-review.md`
  - _Requirements: All_

---

## Phase 7: Knowledge Propagation

- [ ] 7.1 **Create canonical doc and update AGENTS.md**
  - Read all outcome files in `.ai/plans/login-cold-start-fix/outcome/`
  - Create: `docs/backend/login-cold-start-resilience.md` — consolidate patterns for cold-start error handling, retry utility, Neon HTTP routing for auth reads
  - Update `docs/backend/serverless-cold-start-optimization.md` — add cross-reference to the new doc
  - Update `backend/graphql/AGENTS.md` — add rule: "Login resolver must fail-open for rate limiter transient errors (cold start)"
  - Update `backend/AGENTS.md` — add reference to new doc
  - Update root `AGENTS.md` Important References section with new doc
  - Run: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified AGENTS.md/doc file
  - Write outcome: `.ai/plans/login-cold-start-fix/outcome/7.1-knowledge-propagation.md`
  - _Requirements: REQ-0_
