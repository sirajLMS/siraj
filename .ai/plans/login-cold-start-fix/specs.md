# Requirements: Login Cold Start Fix

## Document Information

- **Feature Name**: Login Cold Start Fix
- **Target Directory**: `.ai/plans/login-cold-start-fix`
- **Outcome Directory**: `.ai/plans/login-cold-start-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-19
- **Author**: Copilot

## Introduction

The Siraj LMS is deployed on Vercel Serverless with Neon PostgreSQL. During serverless cold starts, the login flow produces false "invalid credentials" or "too many login attempts" errors because the DB connection pool, Redis cache, and environment config service are still initializing. The user is told their email/password is wrong, but retrying after a few seconds succeeds. This degrades user trust and blocks legitimate authentication.

### Feature Summary

Make the login flow resilient to transient cold-start failures by treating infrastructure-not-ready errors differently from authentication failures, retrying transient errors, routing login reads through the fast Neon HTTP driver, and adding frontend retry logic for `SERVICE_UNAVAILABLE`.

### Business Value

- Eliminates false "invalid credentials" errors during cold starts
- Maintains brute-force protection without penalizing cold-start timing
- Improves login reliability on Vercel serverless + Neon infrastructure

### Scope

**Included:**
- Login resolver error handling for rate limiter and DB transient failures
- Retry-with-backoff utility for transient DB errors
- Neon HTTP driver routing for login read queries (`findByEmail`)
- Frontend auto-retry on `SERVICE_UNAVAILABLE` error code
- Vercel Fluid Compute configuration for pre-warming

**Excluded:**
- Changes to the rate limiter algorithm itself
- Changes to password hashing or JWT generation
- Changes to session management
- Changes to the database schema

## Requirements

### Requirement 0: Pre-Implementation Baseline & Execution Protocol

**User Story:** As an AI agent or developer, I want to establish an error baseline before implementation and track outcomes persistently, so that I can distinguish new issues from pre-existing ones and avoid repeating past research.

#### Acceptance Criteria

1. WHEN feature implementation begins THEN system SHALL record baseline error counts via `bun tsgo` and `bun biome:check` to distinguish new from pre-existing issues.
2. WHEN feature implementation begins THEN system SHALL create deferred-items ledger at `.ai/plans/login-cold-start-fix/deferred-items.md`.
3. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/plans/login-cold-start-fix/outcome/`.
4. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/plans/login-cold-start-fix/outcome/<task-id>-outcome.md`.
5. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
6. WHEN any file is modified THEN system SHALL execute `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on that specific file.
7. WHEN any subtask is marked complete THEN system SHALL complete semantic review checklist.

### Requirement 1: Rate Limiter Transient Error Tolerance (Login Resolver)

**User Story:** As a user attempting to log in during a cold start, I want the rate limiter to fail-open when the cache backend is initializing, so that I am not falsely told "too many login attempts" when the cache is simply cold-starting.

#### Acceptance Criteria

1. WHEN `checkRateLimit` throws or returns `success: false` due to cache service initialization failure THEN login resolver SHALL catch the error and proceed with credential validation instead of rejecting immediately.
2. WHEN `RateLimitService.isLocked` throws a transient DB error THEN login resolver SHALL catch the error, log a warning, and proceed with credential validation (fail-open for lock check during cold start).
3. IF rate limiter is fully operational AND the IP/email is genuinely locked THEN login resolver SHALL still reject with `TOO_MANY_ATTEMPTS` (brute-force protection preserved when infra is warm).
4. WHEN rate limiter transient error occurs THEN login resolver SHALL log the error at `warn` level with metadata indicating cold-start bypass.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: None (changes are localized to the login resolver)
- **Assumptions**: The rate limiter's `failOpen=false` design is correct for when the cache is *working* — we're only bypassing during *cold start* transient failures

### Requirement 2: Retry-with-Backoff Utility for Transient DB Errors

**User Story:** As a developer, I want a reusable retry utility that retries transient DB/infrastructure errors with exponential backoff, so that cold-start connection timeouts are transparently retried before surfacing as errors.

#### Acceptance Criteria

1. WHEN a DB query throws a connection timeout or transient error THEN the retry utility SHALL retry the operation up to 2 times with exponential backoff (initial 300ms, then 700ms).
2. WHEN the retry utility exhausts all retries THEN it SHALL re-throw the original error for the caller to handle.
3. WHEN a non-transient error occurs (e.g., invalid query, permission denied) THEN the retry utility SHALL NOT retry and shall re-throw immediately.
4. WHEN the retry utility is invoked THEN it SHALL accept a generic async function and return the same type as the function's return.
5. WHEN the retry utility retries THEN it SHALL log each retry attempt at `warn` level with attempt number and delay.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: Transient errors include connection timeouts, `ECONNRESET`, `ENOTFOUND`, and Neon WebSocket connection failures

### Requirement 3: Neon HTTP Driver for Login Read Queries

**User Story:** As a user logging in, I want the `findByEmail` query to use the zero-pool Neon HTTP driver, so that the user lookup doesn't wait for a WebSocket pool connection to establish during cold start.

#### Acceptance Criteria

1. WHEN `UserRepository.findByEmail` is called in a serverless (Vercel) environment with Neon THEN it SHALL use the Neon HTTP database client (`getNeonHttpDb()`) via `queryDb()` instead of the pooled `db` instance.
2. WHEN `UserRepository.findByEmail` is called in a non-serverless environment THEN it SHALL continue using the pooled `db` instance (no behavior change).
3. WHEN the Neon HTTP driver returns a user record THEN the resolver SHALL process it identically to the pooled driver result (same `UserSelectType` shape).
4. IF the Neon HTTP driver is not eligible (non-Neon provider, `DB_NEON_HTTP_ENABLED=false`) THEN the repository SHALL fall back to the pooled `db` instance transparently.
5. WHEN `resolveEnvConfig()` encounters a transient DB lookup failure (cold start) THEN it SHALL cache the fallback `process.env` value with `source: "env"` (non-authoritative) and a short TTL (30 seconds), so the DB is re-queried sooner for any DB overrides.
6. WHEN `resolveEnvConfig()` DB lookup succeeds or misses (no row) THEN it SHALL cache the result with `source: "db"` (authoritative) and the standard 5-minute TTL.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Existing `queryDb()` and `getNeonHttpDb()` infrastructure in `backend/db/drizzleDb.ts` and `backend/db/http-client.ts`. `retryTransient` utility from Phase 1 (for `isTransientError` in Phase 3.5).
- **Assumptions**: The `UserRepository.findByEmail` method is a read-only query eligible for HTTP driver (no transactions needed). The `SystemSettingsRepository.getByKey` method already uses `queryDb()` (Neon HTTP).

### Requirement 4: Frontend Auto-Retry on SERVICE_UNAVAILABLE

**User Story:** As a user logging in during a cold start, I want the frontend to automatically retry when the server returns `SERVICE_UNAVAILABLE`, so that I don't have to manually click "Login" again after the cold start completes.

#### Acceptance Criteria

1. WHEN the login mutation returns a GraphQL error with `code: "SERVICE_UNAVAILABLE"` THEN the frontend SHALL automatically retry the login up to 2 times with 1s and 2s delays.
2. WHEN the frontend retries a login THEN it SHALL show a transient "Retrying..." indicator to the user.
3. IF all retries are exhausted AND the error persists THEN the frontend SHALL show the `SERVICE_UNAVAILABLE` error message to the user.
4. WHEN the login mutation returns any other error code THEN the frontend SHALL NOT retry and shall show the error immediately.
5. WHEN the frontend is retrying THEN it SHALL disable the submit button to prevent duplicate submissions.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: The `SERVICE_UNAVAILABLE` error code must already be emitted by the backend (it is — line 230 of `auth.mutation.ts`)
- **Assumptions**: The `useLoginViewModel` hook is the single entry point for login form submission

### Requirement 5: Vercel Fluid Compute Pre-Warming

**User Story:** As a platform administrator, I want to enable Vercel Fluid Compute pre-warming, so that serverless function cold starts are reduced or eliminated entirely.

#### Acceptance Criteria

1. WHEN the Next.js app is deployed to Vercel THEN the Vercel configuration SHALL enable Fluid Compute with pre-warming for the GraphQL API route.
2. IF Fluid Compute is not available in the environment THEN the app SHALL continue to function normally (graceful degradation).
3. WHEN Fluid Compute is enabled THEN the configuration SHALL NOT break local development or non-Vercel deployments.

#### Additional Details
- **Priority**: Low
- **Complexity**: Low
- **Dependencies**: Vercel plan supporting Fluid Compute
- **Assumptions**: Fluid Compute is available on the current Vercel plan

## Non-Functional Requirements

### Cold-Start Test Coverage
- WHEN the retry utility is tested THEN unit tests SHALL cover: transient error retried and succeeds, transient error retried and still fails, non-transient error not retried, and `maxRetries: 0` edge case.
- WHEN `resolveEnvConfig` is tested for cold-start THEN tests SHALL verify: DB transient failure returns `process.env` fallback, DB failure caches as `source: "env"` (non-authoritative) with short TTL, DB success caches as `source: "db"` (authoritative) with full TTL, DB override is picked up after cold-start recovery, and cache re-queries DB after transient failure (not short-circuited).
- WHEN the login resolver is tested for cold-start THEN tests SHALL verify: rate limiter transient error fails-open (proceeds to credential check), rate limiter `success: false` still rejects (does not fail-open on genuine lock), `isLocked` transient error fails-open, `findByEmail` transient error retries then throws `SERVICE_UNAVAILABLE`, `recordAttempt` transient error fails-open, and `resetAttempts` transient error does not block successful login.
- WHEN full GraphQL integration cold-start tests are run THEN they SHALL start a real Next.js server, send real `login` GraphQL mutations via Apollo Client, and verify the complete flow: Apollo Client → GraphQL resolver → Service → Repository → PostgreSQL. Tests SHALL cover: cold-start login success via Neon HTTP, `SERVICE_UNAVAILABLE` error (not `INVALID_CREDENTIALS`) when DB pool is unreachable, genuine credential failure still returns `INVALID_CREDENTIALS` (cold-start handling does not mask real auth failures), token validity after cold-start login, and logout after cold-start login.
- WHEN cold-start integration tests use env-based simulation THEN tests SHALL simulate cold-start by configuring invalid `CACHE_PROVIDER` (cache cold-start), dead `DATABASE_URL` port (DB pool cold-start), and `DISABLE_RATE_LIMITING: "false"` (rate limiter active). Tests SHALL NOT require cross-process `spyOn` (which doesn't work across process boundaries).
- WHEN cold-start tests are organized THEN Tier 1 unit/mocked tests SHALL live in `backend/*/test/` directories, and Tier 2 full integration tests SHALL live under `test/simulate/` with a `test:simulate` script in `package.json`.

### Performance Requirements
- WHEN a login request hits a warm serverless instance THEN the login flow SHALL complete within the same latency as before (no regression).
- WHEN a login request hits a cold serverless instance THEN the Neon HTTP driver path SHALL add no more than 30ms overhead vs the warm pooled path.

### Security Requirements
- WHEN rate limiter fails-open during cold start THEN brute-force protection SHALL still be enforced via the DB-backed `RateLimitRepository` lock check (which runs after the cache check).
- IF a genuine brute-force attack coincides with a cold start THEN the DB-backed lock check SHALL still reject the request after the first failed attempt.

### Reliability Requirements
- WHEN any transient infrastructure error occurs during login THEN the system SHALL NOT surface "invalid credentials" to the user.
- WHEN all retries are exhausted THEN the system SHALL surface `SERVICE_UNAVAILABLE` (not `INVALID_CREDENTIALS`).

## Constraints and Assumptions

### Technical Constraints
- Must not change the `authRateLimiter` `failOpen=false` design (correct for warm cache)
- Must use existing `queryDb()` / `getNeonHttpDb()` infrastructure
- Must preserve the existing i18n translation system for error messages

### Assumptions
- Transient errors are distinguishable from permanent errors (connection timeouts, ECONNRESET vs query syntax errors)
- The Neon HTTP driver is already configured and eligible in the Vercel deployment
- The `SERVICE_UNAVAILABLE` error code is already handled by the frontend's error display

## Success Criteria

### Definition of Done
- [ ] All acceptance criteria are met
- [ ] Cold start login no longer produces false "invalid credentials" errors
- [ ] Brute-force protection is preserved when infrastructure is warm
- [ ] No regression in warm-path login latency

### Acceptance Metrics
- False "invalid credentials" errors during cold start reduced to 0%
- Warm-path login latency unchanged (within ±50ms)
- Brute-force rate limiting still blocks after 5 failed attempts when cache is warm

## Glossary

| Term | Definition |
|------|------------|
| Cold Start | First invocation of a serverless function after idle period, requiring DB/cache connection initialization |
| Neon HTTP Driver | Zero-pool HTTP fetch-based DB client (`drizzle-orm/neon-http`) with ~15-30ms cold start vs WebSocket pool's ~200-500ms |
| Fail-Open | When an infrastructure dependency fails, the system allows the request through (vs fail-closed which rejects) |
| Transient Error | An error caused by temporary infrastructure unavailability (timeout, connection refused) that succeeds on retry |
| Fluid Compute | Vercel's serverless optimization with automatic pre-warming and bytecode caching |
