# Design: Login Cold Start Fix

## Document Information

- **Feature Name**: Login Cold Start Fix
- **Target Directory**: `.ai/plans/login-cold-start-fix`
- **Outcome Directory**: `.ai/plans/login-cold-start-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-19
- **Author**: Copilot
- **Related Documents**: [Requirements](specs.md)

## Overview

The login flow currently fails during Vercel serverless cold starts because three sequential DB/cache-dependent operations (rate limit check, lock check, user lookup) can all throw transient errors before the database connection pool is ready. The `authRateLimiter` with `failOpen=false` causes false "too many login attempts" rejections when the cache is cold. The `RateLimitService.isLocked` call is not wrapped in try/catch, so DB timeouts propagate as generic GraphQL errors that the frontend maps to "invalid credentials".

This design introduces a layered approach: (1) fail-open for rate limiter transient errors in the login resolver, (2) a retry-with-backoff utility for transient DB errors, (3) routing login reads through the Neon HTTP driver (zero-pool, ~15-30ms cold start), (4) frontend auto-retry on `SERVICE_UNAVAILABLE`, and (5) enabling Vercel Fluid Compute pre-warming.

### Design Goals
- Eliminate false "invalid credentials" / "too many attempts" errors during cold start
- Preserve brute-force rate limiting when infrastructure is warm
- Use the fastest available DB path (Neon HTTP) for login reads
- Provide transparent retry for users when `SERVICE_UNAVAILABLE` is returned

### Key Design Decisions

#### Decision 1: Fail-open rate limiter in login resolver (not in the limiter itself)
**Context:** The `authRateLimiter` has `failOpen=false` (correct for brute-force protection). During cold start, the cache service fails, and the limiter rejects the request.
**Options Considered:**
1. Change `authRateLimiter` `failOpen=true` — Pros: simplest / Cons: disables brute-force protection globally when cache is down
2. Catch limiter errors in the login resolver — Pros: localized, only login bypasses during cold start / Cons: slightly more code
3. Add a separate "warm-up" rate limiter with failOpen=true — Pros: explicit / Cons: over-engineered
**Decision:** Option 2 — catch transient errors in the login resolver and proceed with credential validation. The DB-backed `RateLimitRepository.isLocked` provides a secondary brute-force check.
**Rationale:** Keeps the rate limiter design intact, only affects the login flow, and the DB-backed lock check still catches genuine brute-force attempts.

#### Decision 2: Retry utility as a standalone function, not a decorator
**Context:** Several operations (DB queries, cache checks) may throw transient errors during cold start.
**Options Considered:**
1. A reusable `withRetry` higher-order function — Pros: composable, reusable / Cons: generic typing complexity
2. A standalone async function `retryTransient` — Pros: simple, explicit / Cons: less composable
3. Inline try/catch retry in each call site — Pros: no abstraction / Cons: duplicated code
**Decision:** Option 2 — a standalone `retryTransient<T>(fn, maxRetries, baseDelay)` utility in `backend/lib/retry.ts`.
**Rationale:** Simple, reusable, type-safe, and easy to test independently.

#### Decision 3: Route `findByEmail` through `queryDb()` (not a separate HTTP repo)
**Context:** The codebase already has `queryDb()` in `drizzleDb.ts` which prefers the Neon HTTP client when eligible.
**Options Considered:**
1. Modify `UserRepository.findByEmail` to use `queryDb()` instead of `db` — Pros: uses existing infra / Cons: repository pattern change
2. Create a separate `UserHttpRepository` — Pros: clean separation / Cons: over-engineered, duplication
3. Call `getNeonHttpDb()` directly in the login resolver — Pros: localized / Cons: bypasses repository pattern
**Decision:** Option 1 — modify `UserRepository.findByEmail` to receive an optional `db` handle parameter, defaulting to `queryDb()`. The login resolver passes no `tx`, so `queryDb()` resolves to the HTTP client when eligible, or the pooled `db` as fallback.
**Rationale:** Minimal change, uses existing pattern, repository stays the data access layer.

## UX/Navigation Specification

This is a backend + infrastructure fix with minimal frontend changes. No new routes, sidebar items, or navigation changes are needed.

#### New Routes & URLs
| Route | Purpose | Permission Required | Roles with Access |
|-------|---------|---------------------|-------------------|
| N/A | No new routes | N/A | N/A |

#### Role-Based Access Matrix
| Role | Impact |
|------|--------|
| All roles | Login flow becomes more resilient to cold starts — no UI changes |

#### Mobile vs Desktop Variants
| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Login retry indicator | "Retrying..." text in error area | Same |
| Submit button during retry | Disabled with spinner | Same |

#### Permission Mapping
No permission changes — the login flow is public (unauthenticated).

## Architecture

### System Context

```mermaid
graph TB
    User[User Login Request] --> FE[Frontend useLoginViewModel]
    FE --> GQL[GraphQL login Mutation]
    GQL --> RL[Rate Limiter checkRateLimit]
    RL --> Cache[CacheService Redis/PG]
    GQL --> Lock[RateLimitService.isLocked]
    Lock --> DB1[DB - rate_limit table]
    GQL --> FindEmail[UserService.findByEmail]
    FindEmail --> DB2[Neon HTTP / Pooled DB]
    DB2 --> Neon[Neon PostgreSQL]
    
    style Cache fill:#f9a825,stroke:#333
    style DB1 fill:#f9a825,stroke:#333
    style Neon fill:#4caf50,stroke:#333
```

Yellow nodes are the cold-start failure points. The Neon HTTP driver (green) bypasses the WebSocket pool entirely.

### High-Level Architecture

```mermaid
graph LR
    A[Login Request] --> B[Rate Limiter Check]
    B -->|transient error caught| C[Lock Check - try/catch]
    B -->|warm success| C
    C -->|transient error caught| D[findByEmail via queryDb]
    C -->|warm success| D
    D -->|Neon HTTP - fast cold start| E[Password Verify]
    D -->|Pooled DB - warm fallback| E
    E --> F[Create Session + Return Token]
```

### Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Backend retry utility | TypeScript async function | Simple, reusable, no dependency |
| DB read path | `drizzle-orm/neon-http` via `queryDb()` | Zero-pool HTTP, ~15-30ms cold start |
| Frontend retry | React useEffect + setTimeout | No new dependency needed |
| Vercel config | `vercel.json` or `next.config.ts` Fluid Compute | Native Vercel optimization |

## Components and Interfaces

### Component 1: `retryTransient<T>` Utility

**Purpose**: Retry transient infrastructure errors with exponential backoff.

**Responsibilities**:
- Detect transient error patterns (ECONNRESET, ETIMEDOUT, ENOTFOUND, connection timeout)
- Retry up to N times with configurable backoff
- Log each retry attempt

**Interfaces**:
- **Input**: `(fn: () => Promise<T>, options?: { maxRetries?: number; baseDelayMs?: number })`
- **Output**: `Promise<T>` (or throws original error if retries exhausted)
- **Dependencies**: `@/backend/lib/logger`

**Implementation Notes**:
- Default: 2 retries, 300ms base delay (300ms → 700ms exponential)
- Transient error detection: check `err.code` for `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, `EAI_AGAIN` or error message containing `timeout`, `connection`, `WebSocket`
- Non-transient errors re-throw immediately (no retry)
- File: `backend/lib/retry.ts`

### Component 2: Login Resolver Error Handling

**Purpose**: Wrap rate limiter, lock check, and post-credential rate-limit operations in try/catch with fail-open behavior for transient errors.

**Responsibilities**:
- Catch `checkRateLimit` errors and proceed (fail-open) logging a warning
- Catch `RateLimitService.isLocked` errors and proceed (fail-open) logging a warning
- Apply `retryTransient` to `UserService.findByEmail` call
- Catch `RateLimitService.recordAttempt` errors (lines 238, 250) — fail-open: do not block authentication on attempt-recording failure
- Catch `RateLimitService.resetAttempts` errors (line 271) — fail-open: do not block successful login on reset failure

**Interfaces**:
- **Input**: Same login resolver args (`{ email, password }`, `ctx`)
- **Output**: Same `LoginResponse` type
- **Dependencies**: `retryTransient`, `checkRateLimit`, `RateLimitService`, `UserService`

**Implementation Notes**:
- File: `backend/graphql/mutation/auth/auth.mutation.ts`
- Wrap `checkRateLimit` (line 208) in try/catch — on error, log warn "Rate limit check bypassed (cold start)" and proceed
- Wrap `RateLimitService.isLocked` (line 217) in try/catch — on error, log warn and proceed. **Note**: `isLocked` already uses `queryDb()` (Neon HTTP), so this is a secondary defense
- Wrap `UserService.findByEmail` (line 227) in `retryTransient()` (keep existing try/catch that emits `SERVICE_UNAVAILABLE`)
- Wrap `RateLimitService.recordAttempt` calls (lines 238, 250) in try/catch — on error, log warn "recordAttempt bypassed (cold start)" and proceed. **Note**: `recordAttempt` uses `db.execute()` (pooled DB), NOT `queryDb()` — this is a cold-start vulnerability
- Wrap `RateLimitService.resetAttempts` (line 271) in try/catch — on error, log warn "resetAttempts bypassed (cold start)" and proceed. **Note**: `resetAttempts` uses `db.execute()` (pooled DB), NOT `queryDb()` — this is a cold-start vulnerability
- No change to the credential verification or session creation flow

**Cold-Start Vulnerability Map**:
| Operation | Line | DB Path | Cold-Start Risk | Mitigation |
|-----------|------|---------|-----------------|------------|
| `checkRateLimit` | 208 | Cache → `queryDb()` (HTTP) | Medium — cache init one-time | try/catch fail-open |
| `isLocked` | 217 | `queryDb()` (HTTP) | Low — already HTTP | try/catch fail-open |
| `findByEmail` | 227 | `queryDb()` (HTTP) | Low — already HTTP | `retryTransient` |
| `recordAttempt` | 238, 250 | `db.execute()` (pooled) | **High** — pooled DB cold start | try/catch fail-open |
| `resetAttempts` | 271 | `db.execute()` (pooled) | **High** — pooled DB cold start | try/catch fail-open |
| `createAuthSession` | 275 | Pooled DB | Medium — after credential check, user waits | Existing behavior |

### Component 3: `UserRepository.findByEmail` Neon HTTP Routing — ALREADY IMPLEMENTED

> **Plan Review Finding**: `findByEmail` already uses `queryDb()` (line 159 of `user.repository.ts`). No code changes needed.

**Purpose**: Route the `findByEmail` query through the Neon HTTP driver when eligible.

**Current Implementation** (verified during plan review):
```typescript
// backend/db/repo/users/user.repository.ts line 158-162
export const findByEmail = async (email: string): Promise<UserSelectType | null> => {
  const q = queryDb();
  const result = await q.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
};
```

### Component 4: Frontend Auto-Retry

**Purpose**: Automatically retry login when `SERVICE_UNAVAILABLE` is returned.

**Current Error Flow** (verified during plan review):
```
Apollo mutation throws CombinedGraphQLError
  → AuthProvider.login() catches (line 119)
  → getGraphQLErrorMessage(error, t.signinFailed) extracts message STRING (line 121)
  → setError(messageString) — stores string in AuthContext (line 121)
  → returns false (line 122)
  → useLoginViewModel receives boolean + authError string
  → extensions.code is LOST — only the message text survives
```

**Problem**: The `AuthContext.login()` interface returns `Promise<boolean>` and stores `error: string | null`. The raw GraphQL error with `extensions.code` is discarded by `getGraphQLErrorMessage()` which only extracts the message text. The ViewModel cannot check `extensions.code === "SERVICE_UNAVAILABLE"`.

**Responsibilities**:
- Detect `SERVICE_UNAVAILABLE` error code from the login mutation
- Retry up to 2 times with 1s, 2s delays
- Show "Retrying..." indicator
- Disable submit button during retry

**Interfaces**:
- **Input**: Same `handleLoginSubmit(data: LoginFormData)`
- **Output**: Same `Promise<void>`
- **Dependencies**: `useAuth` hook, `labels` from i18n

**Implementation Approach** (chosen after investigating AuthProvider):

**Option A (Recommended): Use Apollo `useMutation` directly in `useLoginViewModel`**
- Import `loginMutationDocument` and `useMutation` from `@apollo/client/react` in `useLoginViewModel.ts`
- Call the mutation directly, bypassing `useAuth().login()` for the login form
- Access the raw `CombinedGraphQLError` via the mutation's `error` return value
- Check `error.extensions?.code === "SERVICE_UNAVAILABLE"` from the CombinedGraphQLErrors
- Still call `updateAuthToken()` and redirect on success (same as AuthProvider does)
- Pros: No changes to AuthProvider, full error access, ViewModel stays self-contained
- Cons: Duplicates the login mutation call (AuthProvider still has its own for checkAuth)

**Option B: Modify `AuthContext` to expose error code**
- Add `errorCode: string | null` to `AuthContextType`
- In AuthProvider.login() catch block, extract `extensions.code` alongside message
- ViewModel checks `errorCode === "SERVICE_UNAVAILABLE"`
- Pros: Reusable across other auth flows
- Cons: Changes a shared interface, more files touched

**Option C: Use Apollo `onError` callback or error policy**
- Configure `useMutation` with `errorPolicy: "all"` to get both data and errors
- Cons: Only works if we bypass `useAuth().login()`

**Decision**: Option A — use Apollo `useMutation` directly in `useLoginViewModel`. This is the simplest change that doesn't modify shared interfaces.

**Implementation Notes**:
- File: `frontend/views/auth/login/useLoginViewModel.ts`
- Add `useMutation(loginMutationDocument)` directly (similar to the existing `demoLoginMutation` pattern already in the file)
- Add a `retryCountRef` and a `isRetrying` state
- In `handleLoginSubmit`, call the mutation directly, access raw error
- Check `CombinedGraphQLErrors.is(error)` and extract `extensions.code` from `error.errors[0]`
- On `SERVICE_UNAVAILABLE` + retries remaining: set `isRetrying(true)`, `setTimeout` retry
- Use `setTimeout` for retry delays (1s, 2s)
- Show `labels.retrying` (new i18n key) during retry
- Disable form during retry via the `isRetrying` state returned from the hook
- On success: call `updateAuthToken(token)` and redirect (same as AuthProvider.login does)
- Keep `useAuth()` for `isAuthenticated` check and `authError` fallback display

### Component 5: Vercel Fluid Compute Configuration

**Purpose**: Enable pre-warming to reduce cold starts.

**Responsibilities**:
- Configure Fluid Compute in `next.config.ts` or `vercel.json`

**Implementation Notes**:
- Vercel Fluid Compute is enabled by default on newer Vercel plans — verify it's active
- If explicit config needed, add to `vercel.json`:
  ```json
  {
    "functions": {
      "app/**/route.ts": {
        "fluid": true
      }
    }
  }
  ```
- May already be active — this task is verification + optional config

### Component 6: Environment-Config Cold-Start Resilience

**Purpose**: Guarantee that `resolveEnvConfig()` reads from the correct source during DB cold starts and doesn't prematurely cache a fallback value as authoritative.

**Current Behavior** (verified during plan review):
```
resolveEnvConfig("CACHE_PROVIDER")
  → cache check (source: "env" → non-authoritative, falls through)
  → DB lookup via queryDb() (Neon HTTP)
  → if DB succeeds: cache as source: "db" (authoritative) ✅
  → if DB fails: catch → fall back to process.env → cache as source: "db" (WRONG — should be "env")
  → if DB misses: cache as source: "db" (authoritative, correct for a miss) ✅
```

**Bug**: Line 292 of `environment-config.service.ts` always sets `source: "db"` regardless of whether the DB lookup succeeded, failed, or missed. When the DB fails (cold start timeout), the fallback `process.env` value is cached with `source: "db"` (authoritative). This means:
1. The system won't retry the DB lookup for 5 minutes (TTL)
2. A DB override (set via Settings UI during the cold-start window) won't be picked up until the cache expires
3. The `source: "db"` tag is semantically wrong — the DB didn't confirm anything

**Responsibilities**:
- Fix the `source` tag: `source: "env"` when DB lookup failed (non-authoritative), `source: "db"` when DB lookup succeeded or missed (authoritative)
- Add a short TTL (30s) for transient DB failure cache entries so the DB is re-queried sooner
- Reuse `isTransientError` from `@/backend/lib/retry` to distinguish cold-start timeouts from real DB errors

**Implementation Notes**:
- File: `backend/services/system/environment-config.service.ts`
- Single-key path (`resolveEnvConfig`, line 247-294):
  - Track whether the DB lookup threw: `let dbError = false` before the try block
  - In the catch block (line 277): set `dbError = true`
  - At line 292: `cache.set(key, { value: resolved, expiresAt: now + (dbError && isTransient ? SHORT_TTL : ttlMs), source: dbError ? "env" : "db" })`
- Batch path (`recordResolvedKey`, line 367-383):
  - `lookupDbValueFor` (line 347-361) must return a third element indicating DB failure: `[key, dbValue, dbError]`
  - In `recordResolvedKey`: same TTL and source logic as single-key path
- Define `SHORT_CACHE_TTL_MS = 30_000` near `DEFAULT_CACHE_TTL_MS` (line 127)
- Import `isTransientError` from `@/backend/lib/retry` (created in Phase 1)

**Resolution Chain (after fix)**:
| DB State | Cache Source | Cache TTL | Next DB Retry | Value Returned |
|----------|-------------|-----------|---------------|-----------------|
| Succeeds (override found) | `"db"` | 5 min | After TTL | DB override value |
| Misses (no row) | `"db"` | 5 min | After TTL | `process.env` value |
| Fails (transient, cold start) | `"env"` | 30s | After 30s | `process.env` fallback |
| Fails (non-transient) | `"env"` | 5 min | After TTL | `process.env` fallback |

**Cold-Start Scenario for `CACHE_PROVIDER`**:
1. Module loads → `preWarmEnvConfigCache()` runs → if `process.env.CACHE_PROVIDER` is set, cache gets `source: "env"` entry
2. First `resolveEnvConfig("CACHE_PROVIDER")` call → cache hit but `source: "env"` → falls through to DB
3. DB is cold → `queryDb()` (Neon HTTP) might still fail (HTTP endpoint not warm yet) → catch block fires
4. `isTransientError(error)` → true → **30s TTL** + `source: "env"`
5. Returns `process.env.CACHE_PROVIDER` (or `undefined` if not set)
6. `getCacheProvider()` falls back to `getEnvironmentConfig().cacheProvider` if `undefined`
7. After 30s → cache expires → next `resolveEnvConfig` call re-queries DB → picks up DB override if one exists

No new data models. All changes use existing types:

```typescript
// Existing - reused from backend/db/http-client.ts
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

// Existing - reused from backend/db/drizzleDb.ts
function queryDb<T>(tx?: T): QueryDbHandle | T
```

## Security Considerations

### Authentication
- No changes to password hashing, JWT generation, or session creation
- The login resolver's credential verification flow is unchanged

### Authorization
- No changes to permission checks or authorization model

### Rate Limiting Safety Analysis

| Scenario | Cold Start | Warm | Behavior |
|----------|------------|------|----------|
| Cache + DB both cold | Fail-open for rate limit + recordAttempt, DB lock check also cold → proceed to credential check | N/A | User authenticates if credentials valid; brute-force not blocked during cold start window (~2-5s) |
| Cache cold, DB warm | Fail-open for cache rate limit, DB lock check works → locked if genuinely locked, recordAttempt works | N/A | DB lock check provides brute-force protection |
| Both warm | Rate limiter works normally | Rate limiter works normally | Full brute-force protection |
| Genuine brute-force during cold start | Fail-open for initial requests, but once DB is warm (~2-5s) lock check fires after 5 attempts | N/A | Attacker can make ~5 attempts before DB lock activates — acceptable trade-off |

**Key security property**: The DB-backed `RateLimitRepository.isLocked` lock check (`isLocked`) already uses `queryDb()` (Neon HTTP), so it has minimal cold-start latency. The `recordAttempt` and `resetAttempts` methods use `db.execute()` (pooled) — these are wrapped in try/catch with fail-open to prevent blocking login, but brute-force attempt counting is lost during the cold start window.

**Cache Cold-Start Mitigation (existing)**: The `resolveEnvConfig("CACHE_PROVIDER")` chain has a pre-warming mechanism (`preWarmEnvConfigCache`) and a 5-min TTL in-memory cache. This means the cache provider resolution is a one-time DB hit per process, not per-request. The `PostgresCacheAdapter` and `CacheDbRepository` also use `queryDb()` (Neon HTTP), so cache get/set/incr operations have minimal cold-start latency.

## Error Handling

### Error Categories
| Category | Error Code | User Message | Retry? |
|----------|-----------|--------------|--------|
| Rate limiter transient (cache) | (bypassed) | (no error shown) | Internal retry not needed |
| Lock check transient (DB HTTP) | (bypassed) | (no error shown) | Internal retry not needed |
| recordAttempt transient (pooled DB) | (bypassed) | (no error shown) | Do not block auth flow |
| resetAttempts transient (pooled DB) | (bypassed) | (no error shown) | Do not block successful login |
| DB query transient (after retries) | `SERVICE_UNAVAILABLE` | "Service temporarily unavailable" | Frontend auto-retry 2x |
| Invalid credentials | `INVALID_CREDENTIALS` | "Invalid email or password" | No retry |
| Account locked | `TOO_MANY_ATTEMPTS` | "Too many login attempts" | No retry |
| Account deactivated | `ACCOUNT_DEACTIVATED` | "Account deactivated" | No retry |

### Logging Strategy
- **Warn**: Rate limiter bypassed (cold start), lock check bypassed (cold start), retry attempts
- **Error**: DB query failed after all retries (re-logged before throwing `SERVICE_UNAVAILABLE`)
- **Debug**: Retry utility invocation details

## Testing Strategy

### Unit Testing
- **`retryTransient` utility**: Test with mock functions that throw transient vs non-transient errors, verify retry count, delays, and final behavior
- **Login resolver**: Test that transient rate limiter errors proceed to credential check, test that `SERVICE_UNAVAILABLE` is thrown after retries exhausted

### Integration Testing
- **`UserRepository.findByEmail` with Neon HTTP**: Verify the HTTP driver path returns the same result shape as the pooled driver
- **Login flow cold start simulation**: Mock slow DB connection and verify the retry utility + fail-open behavior

### End-to-End Testing
- **Login with cold DB**: Simulate cold start by killing DB connections and measuring login success rate
- **Frontend retry**: Verify that `SERVICE_UNAVAILABLE` triggers auto-retry and shows "Retrying..." indicator

## Deployment and Operations

### Deployment Strategy
- All changes are backward compatible — no migration needed
- Vercel Fluid Compute config (if needed) is additive

### Configuration Management
- No new environment variables needed — existing `DB_NEON_HTTP_ENABLED`, `DB_PROVIDER`, `DB_CONNECTION_MODE` control the HTTP driver eligibility
- Fluid Compute is configured via `vercel.json` (additive, non-breaking)

## Migration and Compatibility

### Backward Compatibility
- `UserRepository.findByEmail` signature unchanged — `tx` parameter remains optional
- `retryTransient` is a new utility — no existing code affected
- Login resolver changes are internal to the `resolve` function — public GraphQL schema unchanged
- Frontend `useLoginViewModel` return type adds `isRetrying` — additive, non-breaking

### Integration Impact
- No changes to external APIs or GraphQL schema
- No changes to database schema
- No changes to other consumers of `UserRepository.findByEmail`

## Design Review Checklist

### Architecture
- [x] High-level architecture is clearly described
- [x] Component responsibilities are well-defined
- [x] Interfaces between components are specified
- [x] Technology choices are justified

### Requirements Alignment
- [x] Design addresses all functional requirements (REQ 1-5)
- [x] Non-functional requirements are considered
- [x] Success criteria can be met with this design
- [x] Constraints and assumptions are addressed

### Security
- [x] Brute-force protection preserved when warm
- [x] Credential verification flow unchanged
- [x] Rate limiter fail-open only affects login (not global)

### Implementation Readiness
- [x] Design provides sufficient detail for implementation
- [x] All file paths and function names specified
- [x] Testing strategy is comprehensive

### UX/Navigation Completeness
- [x] No new routes (backend fix)
- [x] Frontend retry indicator specified
- [x] Mobile vs desktop handling noted

## Appendix D: Cold-Start Test Strategy

### Approach

Cold-start conditions are simulated using two complementary tiers:

- **Tier 1 (Unit/Mocked)**: Fast tests with `spyOn`/`mockRejectedValueOnce` — no dev server, no network. Tests the error-handling logic in isolation.
- **Tier 2 (Full GraphQL Integration)**: End-to-end tests under `test/simulate/` that start a real Next.js dev server with cold-start-inducing env vars (invalid `CACHE_PROVIDER`, dead `DATABASE_URL` port, `DISABLE_RATE_LIMITING: "false"`), send real `login` GraphQL mutations via Apollo Client (`testClient`), and verify the complete flow across all layers.

Tier 2 avoids cross-process `spyOn` (which doesn't work across process boundaries) by using **env-var-based cold-start simulation**: the server process itself encounters real failures when it tries to connect to a dead DB port or an invalid cache provider, exercising the same code paths that would fail during a real Vercel cold start.

### Test Categories

#### Tier 1: Unit/Mocked Tests

##### 1. Retry Utility Unit Tests (`backend/lib/test/retry.test.ts`)

Pure unit tests — no DB connection required.

```
describe("retryTransient", () => {
  test("retries ECONNRESET and succeeds on 3rd call")
  test("retries ETIMEDOUT and still throws after exhausting retries")
  test("does NOT retry non-transient errors (query syntax errors)")
  test("maxRetries: 0 → no retry on transient error")
  test("logs each retry at warn level with attempt number and delay")
})
```

**Mock strategy**: `spyOn` on the passed async function — `mockRejectedValueOnce(transientError).mockResolvedValueOnce(result)`. Verify call count and return value.

##### 2. Environment-Config Cold-Start Tests (`backend/services/system/test/environment-config-cold-start.test.ts`)

Unit tests with `spyOn(SystemSettingsRepository, "getByKey")` — no real DB query needed.

```
describe("environment-config cold-start resilience", () => {
  test("DB transient failure falls back to process.env value")
  test("DB failure caches as source:env (non-authoritative, short TTL)")
  test("DB success caches as source:db (authoritative, full TTL)")
  test("cache re-queries DB after transient failure (not short-circuited)")
  test("DB non-transient failure uses full TTL but source:env")
  test("DB override picked up after cold-start recovery")
  test("CACHE_PROVIDER resolution chain falls back through env → default")
})
```

**Mock strategy**: `spyOn(SystemSettingsRepository, "getByKey")` with `mockRejectedValueOnce(transientError)` then `mockResolvedValueOnce(dbOverride)`. Verify:
- Return value (env fallback vs DB override)
- Spy call count (short-circuit vs re-query)
- Cache source tag (`source: "env"` vs `source: "db"`) — verified via spy call count on second call

**Setup**: `invalidateEnvConfigCache()` in `beforeEach`, `saveEnv`/`restoreEnv` pattern from existing `environment-config.service.test.ts`.

##### 3. Login Resolver Cold-Start Tests (`backend/graphql/mutation/auth/test/auth-mutation-cold-start.test.ts`)

Unit tests with mocked service methods. These verify the resolver's try/catch fail-open behavior.

```
describe("login resolver cold-start resilience", () => {
  test("rate limiter transient error → fail-open (proceeds to credential check)")
  test("rate limiter success:false → still rejects (genuine lock)")
  test("isLocked transient error → fail-open (proceeds to credential check)")
  test("findByEmail transient then succeeds on retry")
  test("findByEmail transient all retries fail → SERVICE_UNAVAILABLE")
  test("recordAttempt transient error → fail-open (login proceeds)")
  test("resetAttempts transient error → does not block successful login")
})
```

**Mock strategy**: `spyOn` on imported services:
- `spyOn(RateLimitService, "isLocked").mockRejectedValueOnce(transientError)`
- `spyOn(UserService, "findByEmail").mockRejectedValueOnce(transientError).mockResolvedValueOnce(userRecord)`
- `spyOn(RateLimitService, "recordAttempt").mockRejectedValueOnce(transientError)`
- `spyOn(RateLimitService, "resetAttempts").mockRejectedValueOnce(transientError)`

**Transients simulated**: `Object.assign(new Error("connect ETIMEDOUT"), { code: "ETIMEDOUT" })` — matches the shape Node.js networking errors have.

**Test pattern**: Use try/catch helper (NOT `expect().rejects.toThrow()`) per `backend/db/test/AGENTS.md` rules.

#### Tier 2: Full GraphQL Integration Tests (`test/simulate/`)

##### Architecture

```
test/simulate/
├── helpers.ts                           # setupColdStartTestServer, makeTransientError, loginViaGraphQL
├── lifecycle.ts                         # setupColdStartTestLifecycle (starts server with cold-start env)
├── login-rate-limit-cold-start.test.ts   # Rate limiter + cache cold-start
├── login-env-config-cold-start.test.ts   # env-config DB failure fallback
└── login-full-flow-cold-start.test.ts   # Complete login flow, token validity, logout
```

##### Key Design Decisions

1. **Env-var-based cold-start simulation** (NOT cross-process `spyOn`):
   - `CACHE_PROVIDER: "invalid"` → cache service initialization fails → rate limiter `checkRateLimit` throws → tests fail-open
   - `DATABASE_URL: "postgresql://user:pass@localhost:1/dead"` → DB pool connection refuses → `db.execute()` in `recordAttempt`/`resetAttempts` throws → tests fail-open
   - `DB_PROVIDER: "neon"` + working `NEON_DATABASE_URL` → `queryDb()` routes to Neon HTTP (bypasses dead pool) → `findByEmail` succeeds
   - `DISABLE_RATE_LIMITING: "false"` → rate limiter is active (standard test server sets it to `"true"`)

2. **Real Apollo Client → Real GraphQL server**: Tests use the existing `testClient` from `frontend/common/graphql/test/testClient.ts` and `loginMutationDocument` from `frontend/common/graphql/sharedDocuments/auth/auth.documents.ts`. This covers the full stack: Apollo Client → HTTP → Next.js API route → Pothos GraphQL → resolver → service → repository → PostgreSQL.

3. **Per-test server isolation**: Each test that needs different env vars may require its own server instance. The `setupColdStartTestServer()` helper accepts an `env` override object. Tests that share the same env can share a server instance for speed.

##### 4. Rate Limiter Cold-Start (`test/simulate/login-rate-limit-cold-start.test.ts`)

```
describe("login rate-limiter cold-start @simulate", () => {
  setupColdStartTestLifecycle({ CACHE_PROVIDER: "invalid" })

  test("cache cold-start → login succeeds (rate limiter fails-open)")
  test("DB pool cold-start + Neon HTTP → login succeeds (HTTP bypasses pool)")
  test("DB pool cold-start + no Neon HTTP → SERVICE_UNAVAILABLE (NOT INVALID_CREDENTIALS)")
  test("rate limiter warm → genuine lock still enforced")
})
```

##### 5. Env-Config Cold-Start (`test/simulate/login-env-config-cold-start.test.ts`)

```
describe("login env-config cold-start @simulate", () => {
  setupColdStartTestLifecycle({ DATABASE_URL: deadPort })

  test("env-config DB failure → falls back to process.env value")
  test("env-config DB failure → short TTL → DB override picked up after recovery")
  test("Settings query during cold-start → returns env-fallback values (no crash)")
})
```

##### 6. Complete Login Flow (`test/simulate/login-full-flow-cold-start.test.ts`)

```
describe("login full-flow cold-start @simulate", () => {
  test("complete cold-start login → SUCCESS (Neon HTTP, dead pool)")
  test("complete cold-start login → SERVICE_UNAVAILABLE (dead DB, no HTTP fallback)")
  test("wrong credentials during cold-start → still INVALID_CREDENTIALS")
  test("login during cold-start → retry then succeed")
  test("token after cold-start login → valid (me query returns same user)")
  test("logout after cold-start login → success")
})
```

### Test Conventions

- Use `bun:test` `describe`/`test`/`expect`/`spyOn`
- No `runInRollback` needed for Tier 1 unit tests with mocked repos (no real DB writes)
- For the login resolver Tier 1 test, `runInRollback` IS needed if the test creates real user records for credential validation
- Use try/catch helper (NOT `expect().rejects.toThrow()`) per `backend/db/test/AGENTS.md` rules
- Tier 2 tests use `setupColdStartTestLifecycle()` (same pattern as `setupTestServerLifecycle()` from `frontend/common/graphql/test/lifecycle.ts`)
- Tier 2 tests use `testClient.mutate()` / `testClient.query()` (same Apollo Client as existing GraphQL integration tests)
- Import `transientError` construction as a shared helper:
  ```typescript
  function makeTransientError(message: string): Error {
    const err = new Error(message);
    return Object.assign(err, { code: "ETIMEDOUT" });
  }
  ```
- All tests must pass `bun quality-gate` and `scripts/health/sub-loop.ts --lifecycle codescene`
- Add `test:simulate` script to `package.json`: `"test:simulate": "bun test test/simulate/"`
