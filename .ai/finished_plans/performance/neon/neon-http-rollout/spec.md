# Specification: Neon HTTP Single-Fetch Client Rollout

**Target Directory:** `.ai/plans/neon-http-rollout`
**Outcome Directory:** `.ai/plans/neon-http-rollout/outcome`
**Parent Plan:** `.ai/plans/neon/` (Task 1.2 — Neon HTTP Single-Fetch Helper)
**Supersedes:** `.ai/plans/neon/neon_http/tasks_deepseek4pro.md`
**Methodology:** Spec-Driven Development
**Feature:** Rollout of `getNeonHttpDb()` / `getNeonHttpClient()` to the repository layer with env-gating guard

---

## 1. Introduction

Task 1.2 of the Neon performance plan implemented lightweight zero-pool HTTP single-fetch query helpers
in `backend/db/http-client.ts`. The helpers (`getNeonHttpClient()`, `getNeonHttpDb()`) are re-exported
from `backend/db/drizzleDb.ts:71` and integration-tested, but **no production code consumes them** —
every repository still routes bare reads through the stateful pooled/WebSocket `db` singleton, paying
~15-30 ms of connection overhead per single-read query on Vercel serverless.

### Feature Summary

Roll out the HTTP single-fetch client to the repository layer's non-transactional read paths via a provider-agnostic `queryDb(tx)` factory handle. The factory encapsulates runtime gating (`getActiveHttpProvider()`, `isNeonHttpEligible()`) and returns a cached HTTP database singleton (`getStatelessHttpDb()`) when eligible, or falls back to `tx` / `db`. This avoids hardcoding vendor-specific logic in repository files while supporting future stateless DB providers (e.g. Supabase, Turso).

### Business Value

- Faster cold-start and per-query latency (~15-30 ms saved) on Vercel serverless Lambdas.
- Connection-limit protection: HTTP single-fetch does not consume PostgreSQL `max_connections` pool slots.
- Architecture-conforming migration seam (repository layer, per `backend/AGENTS.md`).
- Provider flexibility: Decouples 52+ repository files from vendor specifics (Neon, Supabase, etc.).

### Scope

**In scope:**
- Add `isNeonHttpEligible()`, `getActiveHttpProvider()`, and `getStatelessHttpDb()` with singleton caching + internal guards inside `getNeonHttpDb()`/`getNeonHttpClient()`.
- Export `queryDb(tx?: DBTransaction)` from `backend/db/drizzleDb.ts` as the canonical repository query handle.
- Migrate the **non-tx read paths** of repository files under `backend/db/repo/**` to use
  `queryDb(tx)` (which resolves `tx ?? (getStatelessHttpDb() ?? db)`).
- Replace prepared-statement branches on the non-tx path with plain queries executed over `queryDb(tx)`
  (prepared statements are not supported on `drizzle-orm/neon-http`).
- Knowledge propagation: canonical docs + AGENTS.md/instruction updates.

**Out of scope (deferred to follow-up plans):**
- The session/auth validation path (`shared/session.repository.ts`, `validateSession` chain) — multi-roundtrip
  with conditional writes; deferred to a dedicated session-rewrite plan.
- Multi-query read pipelines (e.g., `billing.getAdminBillingSummary` 5 queries,
  `teacher-availability.validateBookingAvailability` 3 dependent queries).
- Always-`db.transaction()`-wrapped-when-`!tx` reads (e.g., scheduling `daily-schedule`,
  `reschedule-tracking`, `status-tracking`; `audit.getAuditStatistics`).
- Write methods (`create*`, `update*`, `delete*`, `upsert*`, stored-proc writes like
  `ratelimit.recordAttempt`).
- GraphQL resolver-level changes (resolvers delegate to services → repositories; the seam is the repo).
- Service-layer changes (per `backend/AGENTS.md`, services do not import `db` directly; the
  index.ts refactors as a remodel of the completed on completed api consume them, not the service code).
- The existing `neon_http` draft's 8-file service target list — superseded (services don't touch DB).

## 2. Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress
updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN system SHALL read ALL existing files in
   `.ai/plans/neon-http-rollout/outcome/` to absorb prior research, search results, and pitfalls.
2. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under
   `.ai/plans/neon-http-rollout/outcome/<task-id>-outcome.md` detailing research findings, docs/web
   search results, implementation details, and carry-over points.
3. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task
   checkbox `[ ]` -> `[x]` in `tasks.md`.
4. WHEN any file is modified THEN system SHALL execute per-file verification (`bun tsgo` +
   `bun biome:check` + lint queue) on that specific file.
5. WHEN any subtask is completed THEN system SHALL execute `bun tsgo`, `bun biome:check`, and
   `bun run lint` globally, exiting with zero errors and zero warnings.

### Requirement 1: Env-Gating Runtime Guard

**Priority:** High  **Complexity:** Medium  **Dependencies:** None (prerequisite for R2/R3)

**User Story:** As a developer, I want the Neon HTTP helpers to refuse construction against a
non-Neon database, so that local dev against plain Postgres does not silently POST to
`https://localhost/sql` and fail with a confusing 404/TLS error.

#### Acceptance Criteria

1. WHEN `getNeonHttpDb()` or `getNeonHttpClient()` is invoked AND the runtime is NOT Neon-HTTP-eligible
   THEN system SHALL throw a clear `Error("Neon HTTP client is not eligible for the current environment: …")`
   describing which gate failed (provider / connection-mode / hostname / kill-switch).
2. IF `DB_PROVIDER` (case-insensitive) is `"neon"` AND `DB_CONNECTION_MODE` is not `"pg"` AND the
   `DATABASE_URL` hostname matches `/\.neon\.tech$/` THEN system SHALL consider the environment
   Neon-HTTP-eligible.
3. IF `DB_CONNECTION_MODE === "pg"` THEN system SHALL consider the environment NOT eligible, regardless
   of `DB_PROVIDER` (the operator's explicit pg-pooled override wins — mirrors `resolveConnectionStrategy`
   precedence at `connection-strategy.ts:22`).
4. IF `DB_PROVIDER` is anything other than `"neon"` (case-insensitive) THEN system SHALL consider the
   environment NOT eligible.
5. IF the `DATABASE_URL` hostname does not match `/\.neon\.tech$/` THEN system SHALL consider the
   environment NOT eligible (prevents the `https://localhost/sql` failure mode).
6. IF env var `DB_NEON_HTTP_ENABLED` is set to the string `"false"` THEN system SHALL consider the
   environment NOT eligible (kill-switch for fast rollback without redeploy).
7. WHEN `queryDb(tx?: DBTransaction)` is exported THEN system SHALL expose it from `backend/db/drizzleDb.ts`
   as the canonical repository query handle, encapsulating `isNeonHttpEligible()`, provider selection,
   singleton caching via `getStatelessHttpDb()`, and `tx` prioritization.
8. The guard and factory SHALL be pure, idempotent, and backed by singleton caching (reusing `getGlobalSingleton`).

#### Additional Details

- **Assumptions:** `DATABASE_URL` is always set when the app boots (`drizzleDb.ts:20-24` exits otherwise).
- **Case-sensitivity fix:** `connection-strategy.ts:27`'s `DB_PROVIDER` comparison is case-sensitive today;
  the guard SHOULD mirror that but lowercases for the eligibility check to harden it.

### Requirement 1.1: Early Provider Integration Smoke Test (`test/integration/db/query-db.integration.test.ts`)

**Priority:** High  **Complexity:** Low  **Dependencies:** R1

**User Story:** As a developer, I want an integration smoke test under `test/integration/db/` created immediately after `queryDb` foundation is built, so that we empirically verify that live HTTP query execution works before migrating any repository files.

#### Acceptance Criteria

1. WHEN `test/integration/db/query-db.integration.test.ts` is created THEN system SHALL place it under `test/integration/db/` per `test/integration/AGENTS.md`.
2. WHEN `process.env.NEON_TEST_DATABASE_URL` is missing or contains `"ep-example"` THEN system SHALL skip the suite via `describeLiveWhen(hasNeonTestUrl, ...)` (not fail).
3. WHEN `NEON_TEST_DATABASE_URL` is present AND valid THEN system SHALL execute a real HTTP single-fetch POST query against `NEON_TEST_DATABASE_URL` using `queryDb()` (or `getNeonHttpDb()`) and assert `{ test: 1 }`.
4. WHEN debug logging is needed THEN system SHALL log using `testLogger` from `@/shared/lib/logger/testlogger` (NEVER `console.log`).
5. WHEN `bun run test:integration` runs THEN the new integration test SHALL be included in the provider smoke runner.

### Requirement 2: Repository Pilot (`user.repository.ts`)

**Priority:** High  **Complexity:** Medium  **Dependencies:** R1

**User Story:** As a developer, I want the hottest single-read repository migrated first so the
migration pattern is proven before the broad rollout (this drives the `me` GraphQL query, the FX-display
helper, and SSR page titles — the highest-traffic single reads in the app).

#### Acceptance Criteria

1. WHEN `backend/db/repo/users/user.repository.ts` `findById(id)` runs AND `DB_PROVIDER=neon`/Neon host
   THEN system SHALL execute via `queryDb(tx)` (plain `queryDb(tx).select(...).from(users).where(eq(...))`,
   NOT a prepared statement).
2. WHEN `findSafeById(id, tx?)` runs WITHOUT a `tx` THEN system SHALL use `queryDb(tx)` (which resolves the HTTP singleton);
   WHEN it runs WITH a `tx` THEN system SHALL use the passed `tx` (NEVER an HTTP driver).
3. WHEN `findByEmail(email)`, `loadByIds(ids, locale)`, `findDisplayCurrenciesByIds(ids)`, or
   `existsByEmail(email, tx?)` (non-tx branch) runs on an eligible environment THEN system SHALL route via
   `queryDb(tx)`.
4. WHEN any of these methods runs on a non-eligible environment (local dev, `DB_PROVIDER=postgres`,
   `DB_CONNECTION_MODE=pg`) THEN system SHALL fall back to the existing `db` singleton (no behavior change).
5. WHEN module-level prepared statements (`findByIdPrepared`, `findByEmailPrepared`, `findSafeByIdPrepared`,
   `existsByEmailPrepared`) are currently used on the non-tx path THEN system SHALL replace that non-tx
   branch with a plain `queryDb(tx).select(...)` query (prepared statements are NOT supported on
   `drizzle-orm/neon-http`).
6. WHEN the migrated repository's callers (gqlContext, auth mutation/query, teacher-dashboard service,
   FX-display pothos, cached-page-title helpers) run THEN system SHALL produce identical results to the
   pre-migration behavior.

#### Additional Details

- **Priority:** High (hottest single reads in the app).
- **Assumptions:** The `tx`-branch behavior of all 6 methods is unchanged (only the bare-`db` branch swaps
  to a new client). Prepared-statement modules that are reused only inside `tx` paths stay untouched.

### Requirement 3: Repository Layer Rollout (Full Clean Batch)

**Priority:** High  **Complexity:** High  **Dependencies:** R2

**User Story:** As a system administrator, I want all repository read paths that are single-roundtrip and
outside transactions migrated to the HTTP single-fetch client, so Neon connection pool slots are
preserved and per-query latency drops across the app — not just for the `users` domain.

#### Acceptance Criteria

1. WHEN a repository file from the approved batch list (see `tasks.md` Phase 3 table) has a read method
   whose non-tx branch currently runs against `db` THEN system SHALL migrate that branch to
   `queryDb(tx)` (or `const q = queryDb(tx);`).
2. WHEN a method has a `tx` parameter AND a `tx` IS passed by the caller THEN system SHALL keep using `tx`
   (NEVER `httpDb`) — `queryDb(tx)` automatically prioritizes `tx` first.
3. WHEN a method is a multi-query pipeline (e.g., paginated data+count in `Promise.all`, sequential
   dependent sub-queries) THEN system SHALL leave that method unchanged (out of scope) but MAY migrate
   other single-read methods in the same file.
4. WHEN a method always wraps in `db.transaction()` when `!tx` THEN system SHALL leave that method
   unchanged (the always-tx wrapper cannot use `httpDb`).
5. WHEN a method's primary purpose is a write (INSERT/UPDATE/DELETE) or a stored-procedure that writes
   THEN system SHALL leave it unchanged.
6. WHEN a method's non-tx branch uses a module-level prepared statement THEN system SHALL replace that
   non-tx branch with a plain `queryDb(tx).select(...)` query (prepared statements unsupported on
   `neon-http`).
7. WHEN all batch repositories are migrated THEN system SHALL run `bun test:db`, `bun test:services`,
   `bun test:graphql` — all MUST exit zero failures.
8. The rollout tracker at `.ai/plans/neon-http-rollout/repo-rollout-tracker.json` SHALL track assigned
   files, active subagent IDs, completion status, and failures to prevent duplication.

### Requirement 4: Transaction Safety (Hard Constraint)

**Priority:** High  **Complexity:** Low  **Dependencies:** R1, R2, R3

#### Acceptance Criteria

1. WHEN a repository method runs inside `db.transaction(runner)` (i.e., `runInTransaction`/`withTransaction`)
   THEN system SHALL NOT route any query in that runner through `httpDb` — `drizzle-orm/neon-http`'s
   `.transaction()` throws at runtime (the method type-checks fine).
2. WHEN a repository method accepts `tx?: DBTransaction` AND the caller passes `tx` THEN `queryDb(tx)` SHALL
   return `tx`, even on an eligible environment.
3. WHEN a service layers a `db.transaction(async tx => repo.read(tx, ...))` THEN system SHALL preserve
   the `tx` passthrough end-to-end (no silent `httpDb` substitution that would break the transaction).

### Requirement 5: Prepared-Statement Compatibility

**Priority:** Medium  **Complexity:** Medium  **Dependencies:** R2, R3

#### Acceptance Criteria

1. WHEN a repository's non-tx branch currently uses a module-level prepared statement
   (`db.select(...).prepare("name")` + `.execute({...})`) THEN system SHALL replace that non-tx branch with
   a plain `httpDb.select(...)` query (no `.prepare()`, no `.execute()`).
2. WHEN the prepared statement is reused ONLY inside `tx` branches (where `tx` is always passed) THEN
   system SHALL leave it untouched.
3. The migrated plain query SHALL produce byte-identical results to the prepared-statement version (same
   `.where`, `.from`, `.limit`, `.orderBy`).

### Requirement 6: Quality & Knowledge Propagation

**Priority:** High  **Complexity:** Medium  **Dependencies:** R3

#### Acceptance Criteria

1. WHEN any file is modified during this plan THEN system SHALL execute per-file verification (`tsgo` +
   `biome` + lint queue) on that file before moving on.
2. WHEN any subtask is completed THEN system SHALL execute `bun tsgo`, `bun biome:check`, `bun run lint`
   globally (0 errors, 0 warnings).
3. WHEN all implementation tasks complete THEN system SHALL create the canonical reference doc
   `docs/drizzle/neon-http-client.md` (Why → Pattern → Rules → Anti-patterns → Rollout Summary → Related).
4. WHEN all implementation tasks complete THEN system SHALL update `backend/db/repo/AGENTS.md`,
   `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`, and `.agents/instructions/backend.instructions.md`
   with the HTTP-client rule, and add `docs/drizzle/neon-http-client.md` to root `AGENTS.md` Important
   References.

## 3. UX/Navigation Requirements (MANDATORY)

**This is a backend-only database-layer optimization.** No new routes, pages, sidebar items, tabs, or
permissions are introduced. The user-facing surface (Next.js App Router, GraphQL API) is unchanged.

### New Routes & Role-Based Access

| Route | Purpose | Permission | Roles with Access |
|-------|---------|-------------|-------------------|
| _(none)_ | Backend DB layer change — no new routes | N/A | N/A |

### Sidebar Navigation Placement

N/A — no navigation changes.

### Per-Audience Rendering

| Audience | Impact |
|----------|--------|
| All (Student / Parent / Teacher / Supervisor / Admin / Staff) | No UI change; faster query latency only |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| All | No change | No change |

### Permission Mapping

N/A — no new permission-gated surfaces.

## 4. Non-Functional Requirements

### Performance Requirements

- WHEN an eligible bare-read query runs on Vercel serverless THEN system SHALL execute it via
  `neon(url)` HTTP POST (zero WebSocket/pool overhead), reducing per-query latency by ~15-30 ms.
- WHEN the batch rollout completes THEN Neon PostgreSQL `max_connections` pool slots SHALL not be consumed
  by single-read queries (HTTP single-fetch does not occupy pool slots).

### Security Requirements

- WHEN `getNeonHttpDb()` is constructed THEN system SHALL reuse the same `DATABASE_URL` already validated
  by `backend/lib/env.ts` (`validateDatabaseUrlForVercel` enforces `sslmode=verify-full` on Vercel) — no
  new attack surface.
- WHEN the kill-switch `DB_NEON_HTTP_ENABLED=false` is set THEN system SHALL refuse HTTP construction.

### Reliability Requirements

- WHEN the environment is not Neon-HTTP-eligible THEN system SHALL throw a clear error from
  `getNeonHttpDb()` BEFORE issuing a query (fail fast, not on first request).
- WHEN an eligible query errors (Neon HTTP endpoint 5xx) THEN the existing service error-handling path
  applies — no new retry logic in this plan.

## 5. Constraints and Assumptions

### Technical Constraints

- `@neondatabase/serverless` `neon(url)` HTTPS-POSTs to `https://<host>/sql` by default — a Neon-only
  endpoint (verified in `node_modules/@neondatabase/serverless/CONFIG.md:267-275` and `README.md:104`).
  Plain Postgres does not serve it → mandatory env gating (R1).
- `drizzle-orm/neon-http`'s `transaction()` throws at runtime even though it type-checks (`node_modules/
  drizzle-orm/neon-http/session.js:56-57`) — mandated by R4.
- The two Drizzle driver types (`NeonHttpDatabase`, `NeonDatabase`) are unrelated (neither extends the
  other) — `getNeonHttpDb()` returns `NeonHttpDatabase<typeof relations>`; consumers branching tx vs
  bare use the `tx ? tx : (eligible ? httpDb : db)` ternary rather than a shared base type.

### Business Constraints

- No new dependencies (the helpers already exist; this plan only adds a guard and consumers).

### Assumptions

- `DATABASE_URL` is always set at boot (`drizzleDb.ts:20-24` exit-guards).
- The repository layer's `tx ?? db` fallback convention is uniform across the codebase (verified by
  repo-layer exploration).

## 6. Success Criteria

### Definition of Done

- [ ] All acceptance criteria R0–R6 met.
- [ ] `isNeonHttpEligible()` guard in place and unit-tested for all eligibility matrix cases.
- [ ] Pilot repo (`user.repository.ts`) migrated and `me` GraphQL query test green.
- [ ] All ~52 batch repo files migrated; their non-tx read methods route via `httpDb` on eligible
  environments and via `db` on non-eligible environments.
- [ ] `bun test:db`, `bun test:services`, `bun test:graphql` all green.
- [ ] `bun tsgo`, `bun biome:check`, `bun run lint` all 0 errors / 0 warnings globally.
- [ ] `docs/drizzle/neon-http-client.md` created; AGENTS.md files + instructions + root AGENTS.md updated.

### Acceptance Metrics

- Zero test regressions in `bun test:db`, `bun test:services`, `bun test:graphql`.
- Zero new TypeScript / Biome / ESLint errors or warnings.
- HTTP-client construction time on an eligible environment: < 5 ms (singleton, lazy).

## 7. Glossary

| Term | Definition |
|------|------------|
| Neon HTTP single-fetch | Zero-pool HTTPS POST query execution via `@neondatabase/serverless` `neon(url)`; no WebSocket/TCP pool. |
| `getNeonHttpDb()` | Drizzle ORM client over `neon(url)` (`drizzle-orm/neon-http`), re-exported from `drizzleDb.ts:71`. |
| `getNeonHttpClient()` | Raw `neon(url)` query function (no Drizzle wrapper). |
| `isNeonHttpEligible()` | New pure runtime guard (created by R1/Task 1.1) returning `true` when the env is safe for HTTP single-fetch. |
| Non-tx read path | A repository read method's branch when `tx` is absent — currently `const queryDb = tx ?? db;`. |
| Always-tx-wrapped read | A read method whose `!tx` branch wraps the runner in `db.transaction(runner)` (e.g. scheduling tracking) — NOT eligible (cannot use `httpDb`). |
| Multi-query pipeline | A read method that issues 2+ dependent or `Promise.all`'d queries (e.g. paginated data+count) — NOT eligible (single roundtrip only). |

---

## Requirements Review Checklist

### Completeness
- [x] All user stories have clear roles, features, and benefits.
- [x] Each requirement has specific acceptance criteria using EARS format.
- [x] Non-functional requirements addressed (performance, security, reliability).
- [x] Success criteria defined and measurable.
- [x] **Navigation/sidebar/tabs defined for all user types** — N/A (backend-only; documented as such).
- [x] **Permissions mapped to all new routes/pages** — N/A (no new routes).

### EARS Format Validation
- [x] WHEN statements describe specific events or triggers.
- [x] IF statements describe clear conditions or states.
- [x] All statements use SHALL for system responses.

### Traceability
- [x] Requirements are numbered R0–R6 and linked to tasks in `tasks.md`.
- [x] Dependencies between requirements are documented (R1 → R2 → R3 → R4/R5 → R6).
