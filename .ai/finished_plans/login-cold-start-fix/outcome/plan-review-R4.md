# Plan Review R4: Full Integration Cold-Start Tests

## Review Date
2026-08-19

## Reviewer
Copilot (plan-review skill)

## Trigger
User requested: "we wanna full integration tests that simulate cold start, covers everything and graphql as well, under root test/simulate/ dir, it will ensure everything is to be working covering graphql layer as well"

## Investigation

### Existing Test Infrastructure

1. **GraphQL integration tests** (`frontend/common/graphql/test/`) — 40+ test files. Use:
   - `testClient` (Apollo Client with custom fetch + cookie jar) from `testClient.ts`
   - `setupTestServerLifecycle()` from `lifecycle.ts` (starts Next.js dev/prod server)
   - `loginDemoUser()`, `authenticatedRequest()` from `helpers.ts`
   - `loginMutationDocument` from `sharedDocuments/auth/auth.documents.ts`
   - Server env: `DISABLE_RATE_LIMITING: "true"`, `IS_DEMO: "true"`, `TEST_SERVER: "1"`

2. **Test server** (`testServer.ts`) — Spawns Next.js dev/prod server with configurable env via `getDevTestServerEnv()`. Port allocation via `testPort.ts` (default port 3066).

3. **Integration tests** (`test/integration/db/`) — Two Neon HTTP smoke tests, skip when `NEON_TEST_DATABASE_URL` not set.

4. **No `test/simulate/` directory exists** — New root-level directory to create.

### Key Design Decision: Env-Var-Based Cold-Start Simulation

**Problem**: Cross-process `spyOn` doesn't work. The Next.js server runs in a separate child process — mocks in the test process don't affect the server process.

**Solution**: Use env-var-based cold-start simulation:
- `CACHE_PROVIDER: "invalid"` → cache init fails → rate limiter throws → resolver should fail-open
- `DATABASE_URL: "postgresql://user:pass@localhost:1/dead"` → DB pool refuses → `db.execute()` throws → resolver should fail-open
- `DISABLE_RATE_LIMITING: "false"` → rate limiter IS active
- `DB_PROVIDER: "neon"` + working URL → `queryDb()` routes to Neon HTTP → login succeeds despite dead pool

This exercises REAL code paths in the REAL server process — the server encounters genuine connection failures and must handle them correctly.

### Coverage Matrix

| Layer | Tier 1 (Unit) | Tier 2 (Integration) |
|-------|--------------|---------------------|
| Retry utility | ✅ `backend/lib/test/retry.test.ts` | ✅ (indirectly via retry in resolver) |
| env-config service | ✅ `environment-config-cold-start.test.ts` | ✅ `login-env-config-cold-start.test.ts` |
| Login resolver (mocked) | ✅ `auth-mutation-cold-start.test.ts` | — |
| Rate limiter | — | ✅ `login-rate-limit-cold-start.test.ts` |
| GraphQL layer (full stack) | — | ✅ `login-full-flow-cold-start.test.ts` |
| Apollo Client + error extensions | — | ✅ `login-full-flow-cold-start.test.ts` |
| Token validity (post-login me query) | — | ✅ `login-full-flow-cold-start.test.ts` |
| Logout lifecycle | — | ✅ `login-full-flow-cold-start.test.ts` |
| Settings query during cold-start | — | ✅ `login-env-config-cold-start.test.ts` |

## Changes Applied

### `tasks.md`
- Replaced Phase 5.5 with expanded two-tier structure:
  - **Tier 1**: Tasks 5.5.1–5.5.3 (unit/mocked tests)
  - **Tier 2**: Tasks 5.5.4–5.5.9 (full GraphQL integration tests under `test/simulate/`)
    - 5.5.4: Create `test/simulate/` directory, `helpers.ts`, `lifecycle.ts`
    - 5.5.5: Rate limiter cold-start (cache cold, DB pool cold, Neon HTTP fallback, genuine lock)
    - 5.5.6: Env-config cold-start (DB fallback, short TTL, settings query)
    - 5.5.7: Complete login flow (success, SERVICE_UNAVAILABLE, wrong creds, retry, token, logout)
    - 5.5.8: Add `test:simulate` script to `package.json`
    - 5.5.9: Run all tests and verify
- Total Phase 5.5 tasks: 9
- Total plan tasks: 27

### `specs.md`
- Expanded Cold-Start Test Coverage with 3 new bullets:
  - Full GraphQL integration test coverage (Apollo → GraphQL → resolver → service → repo → DB)
  - Env-var-based simulation requirement (not cross-process spyOn)
  - Tier 1/Tier 2 directory organization

### `design.md`
- Replaced Appendix D with expanded two-tier structure:
  - Added `test/simulate/` architecture diagram
  - Added Key Design Decisions section
  - Added Tier 2 test skeletons for all 3 integration test files
  - Added Coverage Matrix table
  - Updated test conventions

### File Plan

| New File | Category | Purpose |
|----------|----------|---------|
| `test/simulate/helpers.ts` | Infra | `setupColdStartTestServer()`, `makeTransientError()`, `loginViaGraphQL()` |
| `test/simulate/lifecycle.ts` | Infra | `setupColdStartTestLifecycle()` |
| `test/simulate/login-rate-limit-cold-start.test.ts` | Integration | Rate limiter + cache cold-start (4 tests) |
| `test/simulate/login-env-config-cold-start.test.ts` | Integration | Env-config DB failure fallback (3 tests) |
| `test/simulate/login-full-flow-cold-start.test.ts` | Integration | Complete login flow (6 tests) |

## Plan Health

### Consistency Check
- [x] `specs.md` cold-start test coverage aligns with `design.md` Appendix D
- [x] `tasks.md` Phase 5.5 Tier 2 tasks align 1:1 with `design.md` test skeletons
- [x] All test file paths follow conventions
- [x] `test:simulate` script planned for `package.json`
- [x] Rate limiting explicitly NOT disabled in Tier 2 tests

### AGENTS.md Compliance
- [x] Root `AGENTS.md` — No `console.*`, no markdown summaries
- [x] `backend/db/test/AGENTS.md` — Tier 1 uses try/catch helper pattern
- [x] `frontend/common/graphql/test/` patterns reused for Tier 2 (same `testClient`, same `lifecycle` pattern)
- [x] No new AGENTS.md needed for `test/simulate/` — root-level test dir like `test/integration/`

### Potential Risks
1. **Server startup per test**: Each test needing different env vars may need its own server instance. Mitigated by `setupColdStartTestServer(env)` helper.
2. **Dead DATABASE_URL**: Tests with dead port need `NEON_DATABASE_URL` for Neon HTTP fallback tests, or use local PostgreSQL for working path.
3. **Rate limiting in tests**: With `DISABLE_RATE_LIMITING: "false"`, tests sending multiple attempts may trigger rate limit. Tests need unique IPs or intentional triggering only in lock-enforcement test case.

## Outcome

Plan R4 passes all AGENTS.md rules. Full GraphQL integration test strategy is now documented with:
- 9 tasks in Phase 5.5 (3 Tier 1 unit + 6 Tier 2 integration)
- 3 new test files under `test/simulate/`
- Full coverage from Apollo Client → GraphQL → resolver → service → repository → PostgreSQL
- Env-var-based cold-start simulation (no cross-process mocking needed)
- `test:simulate` script in `package.json`