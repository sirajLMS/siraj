# Cron Service — Trackable Tasks

## Document Information

- **Feature Name**: Portable Cron Service with queue-backend agnostic dispatch and a full Admin Management UI
- **Version**: 1.0
- **Date**: 2026-07-31
- **Status**: Draft (plan-mode; pending user confirmation)
- **Target Directory**: `.ai/plans/cron`
- **Outcome Directory**: `.ai/plans/cron/outcome`
- **Related Documents**:
  - [Requirements (Specs)](./specs.md)
  - [Implementation Guide (Design)](./implementation.md)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**  
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/cron/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):**  
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.
3. **Global Health Check (Completion Gate):**  
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
4. **Post-Execution Outcome File Creation:**  
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/cron/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.
5. **Task Progress Tracking:**  
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `trackable-tasks.md` file upon successful completion.

## Task Status Legend

| Marker | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[-]` | In progress |
| `[x]` | Completed |

**Rules:**
- Mark a parent task `[-]` when any sub-task is in progress
- Mark a parent task `[x]` only when ALL sub-tasks are `[x]`
- Update this file as you work — single source of truth for execution progress
- Reference requirements as `REQ-N` from [specs.md](./specs.md)

---

## Phase 1: Foundation (Enums / Types / Schema)

- [x] 1. **Enums + types** (REQ-12)
- [x] 1.1 Create `backend/enum/cron/cron.enums.ts`
  - Add `CronQueueBackend`, `CronScheduleStatus`, `CronRunStatus`, `CronJobKind`, `CronTriggerSource`, `CronConcurrencyPolicy` per [specs.md REQ-12](./specs.md#req-12-enums--types)
  - Add `export *` to `backend/enum/cron/index.ts` and re-export `./cron` from `backend/enum/index.ts`
  - Add `CRON_MANAGE = "cron.manage"` to `backend/enum/permissions/permission.enum.ts` (existing camelCase pattern)
  - **Quality Loop**: `bun tsgo` + `bun biome:check` + lint queue for `backend/enum/cron/cron.enums.ts`, `backend/enum/permissions/permission.enum.ts`, and the two `index.ts` barrels
  - **Instruction Verification**: `backend/enum/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-12_
- [x] 1.2 Create `backend/types/cron/cron.types.ts`
  - `CronScheduleSelectType`, `CronScheduleInsertType`, `CronRunSelectType`, `CronRunInsertType` (from `$inferSelect`/`$inferInsert` after REQ-11 ships; for now define them as forward-references that resolve once the schema exists)
  - `CronScheduleReturnType`, `CronScheduleSubmitInput`, `CronScheduleUpdateInput`, `CronRunReturnType`, `CronRunListInput`, `CronTriggerNowInput`, `CronQueueStats`
  - Add barrel `backend/types/cron/index.ts` and re-export from `backend/types/index.ts`
  - **Quality Loop**: per-file on the three files
  - **Instruction Verification**: `backend/types/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-12_
- [x] 1.3 Register env config keys (REQ-4 AC1)
  - Add `CRON_QUEUE_BACKEND` (default `PG_BOSS`), `CRON_QUEUE_MAX_BATCH` (default 25), `CRON_QUEUE_WORKER_CONCURRENCY` (default 1) to `backend/lib/env-config-keys.ts` — `excludeFromDb: false`, category `cron`
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/index/AGENTS.md` if present (backend), `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-4 AC1_

- [x] 2. **DB schema** (REQ-11)
- [x] 2.1 Create `backend/db/schema/cron/cron.ts`
  - 3 tables: `cron_schedules`, `cron_runs`, `cron_heartbeats` per [implementation.md Component 7](./implementation.md#entity-1-cron_schedules) and REQ-11 AC1
  - Add indexes per REQ-11 AC5
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-11_
- [x] 2.2 Register enums in `backend/db/schema/enums.ts`
  - `cronQueueBackendEnum`, `cronScheduleStatusEnum`, `cronRunStatusEnum`, `cronJobKindEnum`, `cronTriggerSourceEnum`, `cronConcurrencyEnum` via `createPgEnumFromEnum`
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-11 AC2_
- [x] 2.3 Add barrels + push schema
  - Add `export * from "./cron";` to `backend/db/schema/index.ts`; barrel in `backend/db/schema/cron/index.ts`
  - Run `bun run db push` (NOT migrate)
  - Run `bun run generate:gqlSchema` to confirm schema is parseable
  - **Quality Loop**: full repo (db push is a state change — run `bun tsgo` after)
  - **Instruction Verification**: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`
  - _Requirements: REQ-11 AC3-4_
- [x] 2.4 Seed `CRON_MANAGE` permission
  - Locate the permission-group seed (likely `backend/db/seeds/permissions.seed.ts` — verify at impl time) and grant `CRON_MANAGE` to `super_admin` and `academy_admin` groups (matches the existing pattern)
  - **Quality Loop**: per-file on the seed
  - **Instruction Verification**: `backend/db/seeds/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-12 AC4, REQ-10 AC8_

- [x] 3. **Repository layer** (REQ-13)
- [x] 3.1 Create `backend/db/repo/cron/cron.repository.ts`
  - Implement all methods per REQ-13 AC1
  - `claimNextRun` is the critical atomic path: tx + advisory lock + recompute `nextRunAt` + insert `cron_runs` PENDING; returns `null` if another worker already claimed (REQ-13 AC4)
  - All non-transactional reads use `queryDb(tx)` per the Neon HTTP Client rule (REQ-13 AC3)
  - `listDueSchedules` honors `concurrencyPolicy = SKIP` (no in-flight run returned) (REQ-13 AC2)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/db/repo/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-13_
- [x] 3.2 Barrel + repository unit test
  - Add `export *` to `backend/db/repo/cron/index.ts` and re-export from `backend/db/repo/index.ts`
  - Create `backend/db/test/repo/cron.repository.test.ts` using `runInRollback` (NEVER `expect().rejects.toThrow()` inside rollback per AGENTS.md); in-house test entities only
  - Run via `bun run scripts/run-test/run-test.ts backend/db/test/repo/cron.repository.test.ts` (log capture mandatory)
  - **Quality Loop**: per-file + post-test global check
  - **Instruction Verification**: `backend/db/test/AGENTS.md` if present, `backend/db/repo/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-13_

---

## Phase 2: Core Service & Engine

- [x] 4. **Cron scheduler engine** (REQ-6)
- [x] 4.1 Add `cron-parser` dependency
  - `~/.bun/bin/bun add cron-parser` (v5+, latest)
  - **Quality Loop**: post-install `bun tsgo` (verify no peer dep issues)
  - _Requirements: REQ-6 AC3_
- [x] 4.2 Create `backend/services/cron/cron-scheduler.engine.ts`
  - Pure functions: `validateCronExpression(expr): boolean`, `nextRunAt(expr, from, tz?): Date`, `nextRuns(expr, from, count, tz?): Date[]`
  - Use `CronExpressionParser.parse(expr, options)` per cron-parser v5 README (verified 2026-07-31): returns `CronExpression`; call `.next()` for the next firing; `.take(n)` for the next N — `CronDate` returned extends native Date semantics (call `.toString()` or use `new Date(cronDate.getTime())` to coerce)
  - Pass `tz?: string` (IANA, e.g. `"UTC"`) — cron-parser uses luxon internally for DST-aware iteration
  - Wrap `parseExpression` in try/catch → throw typed `InvalidCronExpression`
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-6_
- [x] 4.3 Create `backend/services/cron/test/cron-scheduler.engine.test.ts`
  - Pure unit tests — common expressions, invalid expressions throw, timezone handling, `nextRuns` is monotonic
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/AGENTS.md`, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-6_

- [x] 5. **Queue adapter contract + factory** (REQ-4, REQ-5)
- [x] 5.1 Create `backend/services/cron/queue-adapters/queue-adapter.types.ts`
  - `CronQueueAdapter` interface per [implementation.md Component 2](./implementation.md#component-2-queue-adapterfactory) and REQ-5 AC1-6
  - `CronQueueBackendUnknown` and `CronQueueBackendNotAvailable` typed errors
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-5_
- [x] 5.2 Create `backend/services/cron/queue-adapters/queue-adapter.factory.ts`
  - Resolution order: `resolveEnvConfig("CRON_QUEUE_BACKEND")` → `process.env.CRON_QUEUE_BACKEND` → `PG_BOSS` (REQ-4 AC1)
  - `await import(...)` lazily with STATIC import paths (REQ-4 AC5)
  - Memoize singleton adapter in module-scoped `let activeAdapter` (REQ-4 AC7)
  - Throw `CronQueueBackendUnknown` for unknown values; `CronQueueBackendNotAvailable` for missing library (REQ-4 AC3, AC6)
  - Server boot MUST NOT crash on missing optional deps (REQ-4 AC3, AC5)
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 5.1
  - _Requirements: REQ-4_
- [x] 5.3 Create `backend/services/cron/queue-adapters/noop-stub.adapter.ts`
  - Shared stub used by BullMQ-Postgres, BullMQ-Redis, custom-SQL adapters until task 15 fully implements them
  - Throws `CronQueueBackendNotAvailable` with a message naming the missing library
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 5.1
  - _Requirements: REQ-4 AC3_
- [x] 5.4 Create `backend/services/cron/test/queue-adapter.factory.test.ts`
  - Verify backend selection order (env / `resolveEnvConfig` mock → `process.env` → default)
  - Verify `CronQueueBackendUnknown` for unknown; `CronQueueBackendNotAvailable` for missing lib
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-4 AC6_

- [x] 6. **pg-boss adapter** (REQ-4, REQ-5)
- [x] 6.1 Add `pg-boss` dependency
  - `~/.bun/bin/bun add pg-boss` (v12.26+, latest)
  - **Quality Loop**: post-install `bun tsgo`
  - _Requirements: REQ-4 AC2_
- [x] 6.2 Create `backend/services/cron/queue-adapters/pgboss.adapter.ts`
  - Implement `CronQueueAdapter` interface against pg-boss v12.26 API (verified 2026-07-31 against the official docs at `timgit.github.io/pg-boss`)
  - **Connection**: pass a raw `pg.Pool` from the project's existing `createPool()` (`@/backend/db`'s `createPool` exported from `backend/db/factory.ts`) — NOT the Drizzle `db` instance, NOT the Neon HTTP `neon()` client. pg-boss requires persistent TCP connections for `LISTEN/NOTIFY` + `pg_advisory_xact_lock` session features (both broken by Neon HTTP mode AND by Neon PgBouncer `-pooler` hostname — verified against Neon connection-pooling docs)
  - **Detect Neon PgBouncer**: if `createPool()` returns `@neondatabase/serverless` `Pool` (the `neon-serverless` strategy — used when `DB_PROVIDER=neon` AND `DB_CONNECTION_MODE != pg`) AND the `DATABASE_URL` hostname contains `-pooler`, the adapter MUST pass `useListenNotify: false` to `new PgBoss(...)` (poller-only mode) AND log a warning recommending `DB_CONNECTION_MODE=pg` for cron-heavy deploys. With `DB_CONNECTION_MODE=pg`, `createPgPool()` returns a TCP `pg.Pool` and `useListenNotify: true` works — this is the **recommended** deployment mode
  - `await boss.start()` lazily on first `send`/`fetch` call (NOT at server boot — boot never crashes on missing DATABASE_URL). Note that `start()` creates the `pgboss` schema in the target database if missing
  - For each `cron_schedules.jobKind`, lazily `await boss.createQueue(name, { retryLimit, retryDelay, retryBackoff: true, expireInSeconds, heartbeatSeconds, deadLetter })` — defaults align with schedule-level options. **pg-boss default `retryLimit` is 2 (NOT 3)** — override per-queue with `maxRetries`
  - `send(job)` → `await boss.send(name, data, options)` — `data` carries `{ runId, scheduleId, payload }` from `CronService.dispatchDueSchedules`; returns the pg-boss job id
  - `boss.work(name, handler)` is the canonical API — pg-boss auto-manages queue state transitions (`created → active → completed/retry/failed`), auto-retries on `retryLimit`/`retryDelay`/`retryBackoff`, auto-fails on `expireInSeconds` timeout, and auto-heartbeats using `heartbeatSeconds` (no separate heartbeat API needed). The worker runtime registers workers via `boss.work` for the pg-boss path
  - `complete(jobId)` → `await boss.complete(name, [jobId])`
  - `fail(jobId, error)` → `await boss.fail(name, [jobId], { data: { message, stack } })`
  - `retry(jobId, delaySeconds)` — pg-boss has no direct "retry" call; rely on queue-level `retryLimit`/`retryDelay` for auto-retry. For an explicit delayed re-enqueue (used by the worker's explicit-retry path), `await boss.send(name, data, { startAfter: delaySeconds })`
  - `getQueueStats()` — iterate the known queue names (one per `CronJobKind`) and call `await boss.getQueueStats(name)` per the v12 API; map the returned `{ queuedCount, deferredCount, readyCount, activeCount, failedCount, totalCount }` shape to the `CronQueueStats` interface
  - `boss.on('error', ...)` → `logger.error("cron.queue.pgboss.error", { error })` (never `console.*` per AGENTS.md)
  - Graceful shutdown: `await boss.stop({ close: false })` — keeps the pool alive for `send`/`fetch` after workers stop (matches pg-boss ops docs)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-5_
- [x] 6.3 Create `backend/services/cron/test/pgboss.adapter.test.ts`
  - Mock pg-boss instance; verify each method maps correctly; verify lazy `start()` on first call
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 5.4
  - _Requirements: REQ-5_

- [x] 7. **CronService** (REQ-2, REQ-3, REQ-10)
- [x] 7.1 Create `backend/services/cron/cron.service.ts`
  - `CronService` namespace with all methods per [implementation.md Component 1](./implementation.md#component-1-cronservice-orchestration)
  - `dispatchDueSchedules({ now, source })` — lists due → claimNextRun → adapter.send (REQ-3 AC1, REQ-8 AC1-2)
  - `dispatchScheduleById(id, { source, payload })` — applies `concurrencyPolicy`:
    - `ALLOW` → always new run
    - `SKIP` → return existing in-flight run if any (REQ-3 AC8 partial)
    - `REPLACE` → mark existing `CANCELLED` then new (REQ-3 AC8)
  - `completeRun` / `failRun` (handles RETRYING vs FAILED per attempt / maxRetries → REQ-3 AC5-6)
  - `reconcileStuckRuns` → marks `TIMEOUT` (REQ-3 AC7)
  - Locale: `ctx.t` / `getServerTranslations` (never hardcoded strings)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-2, REQ-3, REQ-10_
- [x] 7.2 Create `backend/services/cron/test/cron.service.test.ts`
  - Mocked repo + mocked adapter
  - Cover: dispatch due happy path; manual trigger with all three concurrency policies; `reconcileStuckRuns` timeout detection; retry path (`attempt < maxRetries` → RETRYING); final failure path
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-2, REQ-3_
- [x] 7.3 Create `backend/services/cron/index.ts` barrel + register in any service index if present
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 7.1
  - _Requirements: REQ-2_

- [x] 8. **Job handler registry + NOOP** (REQ-7)
- [x] 8.1 Create `backend/services/cron/job-handlers/job-handler.registry.ts`
  - `JobHandlerRegistry` singleton — `register(kind, handler)`, `getHandler(kind) → handler | undefined`
  - Auto-register `CronJobKind.NOOP` → `noop.handler` on first access
  - Top-of-file comment block documenting **idempotency contract** (REQ-7 AC4)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-7_
- [x] 8.2 Create `backend/services/cron/job-handlers/noop.handler.ts`
  - `async (job) => { kind: "noop"; ok: true }` — resolves immediately
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 8.1
  - _Requirements: REQ-7 AC1_
- [x] 8.3 Create `backend/services/cron/test/job-handler.registry.test.ts`
  - Cover: register / lookup / missing handler returns undefined (worker then marks run FAILED with `errorMessage = "No handler registered for jobKind=<X>"` per REQ-7 AC2 — verify the worker-side behavior in the worker test, not here)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/AGENTS.md`, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-7_

- [x] 9. **Worker runtime** (REQ-8)
- [x] 9.1 Create `backend/services/cron/worker/cron-worker.runtime.ts`
  - `runDrainLoop({ maxDurationMs, batchSize })` per [implementation.md Component 5](./implementation.md#component-5-cron-workerruntime)
  - Loop: `fetch(batch)` → set runs `RUNNING` → write heartbeats periodically → invoke handler via registry → `complete`/`fail` (`CronService.completeRun`/`failRun`)
  - Catch all handler errors — no unhandled rejection escapes (REQ-8 + REQ-7 AC3)
  - Heartbeat interval: `Math.min(60_000, timeoutSeconds / 4)` (REQ-3 AC3)
  - Deadline safety: stop with 30s margin to `maxDuration` (REQ-8 AC2)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-8_
- [x] 9.2 Create `backend/services/cron/test/cron-worker.runtime.test.ts`
  - Mocked adapter (controllable job batches) + mocked handler registry + mocked `CronService.completeRun/failRun/recordHeartbeat`
  - Cover: happy path; handler throws → failRun → RETRYING then FAILED after maxRetries; heartbeat writes on expected cadence; deadline stop leaves remaining jobs in queue
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-7, REQ-8_
- [x] 9.3 Scaffold `scripts/cron-worker.ts` (standalone worker entry)
  - Minimal entry that imports the same `runDrainLoop` and calls it in an infinite loop with `Bun.sleep` between drains
  - Mark this as v2-polish in the file header comment (this phase ships the scaffolder; full hardening is v2)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `scripts/run-test/AGENTS.md` if present, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-8 AC4_

---

## Phase 3: API Routes & GraphQL

- [x] 10. **API routes** (REQ-9)
- [x] 10.1 Create `app/api/cron/ticker/route.ts`
  - `export async function GET(request)` gated by `verifyCronSecretAuth` (REQ-9 AC1, AC3, AC4)
  - `export const maxDuration = 300;` (Next.js 16 — NO `export const dynamic` per the cache-components migration; mirror the existing `class-reminders/route.ts`)
  - Body: `verifyCronSecretAuth` → `CronService.dispatchDueSchedules({ now, source: CRON_TRIGGER_SOURCE.VERCEL_TICKER })` → `runDrainLoop(...)` → reconcile stuck runs before drain → return JSON shape per REQ-9 AC5
  - **Quality Loop**: per-file
  - **Instruction Verification**: `app/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - _Requirements: REQ-9 AC1, AC5_
- [x] 10.2 Create `app/api/cron/ticker/route.test.ts`
  - Auth failure (401, 405, 500); happy path with a `NOOP` schedule; idempotency under 2 concurrent invocations (mock `CronService.dispatchDueSchedules` and verify single claim)
  - Mirror `app/api/cron/class-reminders/route.test.ts` patterns
  - **Quality Loop**: per-file
  - **Instruction Verification**: `app/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-9 AC1_
- [x] 10.3 Create `app/api/cron/execute/route.ts`
  - Same auth + maxDuration shape; accepts `?scheduleId=<uuid>` (REQ-9 AC2)
  - Calls `CronService.dispatchScheduleById(id, { source: CRON_TRIGGER_SOURCE.VERCEL_EXPLICIT })`
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 10.1
  - _Requirements: REQ-9 AC2_
- [x] 10.4 Create `app/api/cron/execute/route.test.ts`
  - Cover: happy path, missing `scheduleId` → 400, bad uuid → 400, not found → 404
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 10.2
  - _Requirements: REQ-9 AC2_
- [x] 10.5 Update `vercel.json`
  - Add `{"path":"/api/cron/ticker","schedule":"*/1 * * * *"}` — keep existing 2 crons unchanged (REQ-9 AC6)
  - Document in the file comment that Hobby caps at 1/day and the ticker still works there
  - **Quality Loop**: lint queue on `vercel.json` (no tsgo on JSON)
  - **Instruction Verification**: `app/AGENTS.md`
  - _Requirements: REQ-9 AC6_

- [x] 11. **GraphQL (Pothos)** (REQ-10, REQ-12)
- [x] 11.1 Create `backend/graphql/pothos/cron/cron.pothos.ts`
  - All types + queries + mutations per [implementation.md API Design](./implementation.md#graphql-pothos)
  - Every resolver gated by `AppPermission.CRON_MANAGE` via scope-auth (REQ-10 AC8)
  - `cronRunTrigger` implements `concurrencyPolicy` (REQ-10 AC7)
  - `cronScheduleUpdate` recomputes `nextRunAt` if `cronExpression` or `timezone` changed (REQ-10 AC5)
  - `cronSchedulePause` / `Resume` transitions + `nextRunAt` recompute (REQ-10 AC6)
  - Locale messages from `ctx.t("cron")...` (REQ-10 AC4) — error cases map to localized messages; the messages are added in Phase 4 task 12 but the resolver uses the `*Labels` keys (verify the keys exist before resolver-implementation by checking Phase 4 ordering — task 12 ships i18n keys before this resolver calls them, OR resolver uses string-keyed lookups that the i18n system tolerates until keys land)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md` if present, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-10, REQ-12_
- [x] 11.2 Register cron Pothos in the top-level Pothos index + register the `CRON_MANAGE` enum value in `backend/graphql/pothos/shared/enum.pothos.ts` (so it shows up after codegen)
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 11.1
  - _Requirements: REQ-10 AC9_
- [x] 11.3 Run codegen
  - `bun run generate:gqlSchema && bun codegen`
  - Verify `AppPermission.CRON_MANAGE` appears in `frontend/common/graphql/generated/gql/graphql-types.ts` (REQ-10 AC9)
  - **Quality Loop**: full repo tsgo + biome:check
  - **Instruction Verification**: `backend/graphql/AGENTS.md`, `backend/AGENTS.md`
  - _Requirements: REQ-10 AC9_

---

## Phase 4: i18n & Frontend

- [x] 12. **i18n namespace** (REQ-14)
- [x] 12.1 Create `shared/locale/types/cron/index.ts`
  - All keys per [specs.md REQ-14 AC2](./specs.md#req-14-i18n-namespace), including `runsCount(count: number)` pluralizer
  - **Quality Loop**: per-file
  - **Instruction Verification**: `shared/AGENTS.md`
  - _Requirements: REQ-14_
- [x] 12.2 Create `shared/locale/en/cron/index.ts` + `shared/locale/ar/cron/index.ts`
  - Implement all keys; AR translation parity with EN (use proper Arabic — flag any uncertain term in the outcome file)
  - Pluralization: `(count: number) => string` per the i18n system rules
  - **Quality Loop**: per-file
  - **Instruction Verification**: `shared/AGENTS.md`
  - _Requirements: REQ-14_
- [x] 12.3 Register barrels
  - `export * from "./cron";` in `shared/locale/en/index.ts`, `shared/locale/ar/index.ts`, `shared/locale/types/index.ts`
  - **Quality Loop**: per-file
  - **Instruction Verification**: `shared/AGENTS.md`
  - _Requirements: REQ-14 AC3_

- [x] 13. **Frontend GraphQL documents** (REQ-15)
- [x] 13.1 Create `frontend/common/graphql/sharedDocuments/cron/cron.documents.ts`
  - All queries + mutations per [implementation.md GraphQL Pothos](./implementation.md#graphql-pothos)
  - Naming: `CronSchedulesQueryDocument`, `CronRunsQueryDocument`, `CronQueueStatsQueryDocument`, `CronScheduleCreateMutationDocument`, etc.
  - Each object type MUST select `id` for Apollo cache normalization (per AGENTS.md)
  - Import hooks from `@apollo/client/react` (NEVER `@apollo/client` bare)
  - **Quality Loop**: per-file
  - **Instruction Verification**: `frontend/common/graphql/sharedDocuments/AGENTS.md` if present, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - _Requirements: REQ-15_
- [x] 13.2 Add the barrel `frontend/common/graphql/sharedDocuments/cron/index.ts` and re-export from `frontend/common/graphql/sharedDocuments/index.ts`
- [x] 13.3 Regenerate types
  - `bun codegen` — verify generated `CronSchedule`, `CronRun`, etc. types appear in `frontend/common/graphql/generated/gql/`
  - **Quality Loop**: full repo tsgo + biome:check
  - **Instruction Verification**: `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md`
  - _Requirements: REQ-15_

- [x] 14. **Admin UI** (REQ-15)
- [x] 14.1 Add nav config entries
  - In `frontend/common/views/dashboard/config/navigationConfig.ts`:
    - Add `cron` item to `SIDEBAR_NAV_ITEMS` between `dst-migration` and `permissions` with `groupId: "grp_admin"`, `permission: PAGE_PERMISSIONS.cronManagement`, label/icon (iconKey: "schedule" — verify against existing icon catalog)
  - In `frontend/common/types/page-permissions.types.ts`:
    - Add `cronManagement: [AppPermission.CronManage] as PagePermissions`
  - Add `cron` to the `hiddenKeys` set in `applySupervisorNavOverrides` (REQ-15 + UX/Navigation per Audience)
  - NOTE: The generated `AppPermission.CronManage` enum appears after codegen (task 11.3) — verify the exact casing before adding
  - **Quality Loop**: per-file
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/common/types/` (no AGENTS.md), `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - _Requirements: REQ-15 AC8, AC9_
- [x] 14.2 Create `frontend/common/views/dashboard/admin/cron/` shared components
  - `CronManagementView.tsx` (switcher — calls `createLazyView` + `<ResponsiveViewSwitch>` per `frontend/common/views/AGENTS.md`)
  - `useCronManagementViewModel.ts` — flat handlers + `labelsBySection: { shell, columns, dialogs, actions, queueStats }` per Rule 7
  - `types/cronManagement.types.ts` — View-shaped types (Pick/compose from `@/shared/locale/types/cron`)
  - `constants.tsx` — icon + accent color maps for statuses / trigger sources / queue backends (mirrors `notificationPreferencesConstants.tsx`)
  - `components/SchedulesDataGrid.tsx`, `ScheduleCreateEditDialog.tsx`, `ScheduleRowActionsMenu.tsx`, `RunsDialog.tsx`, `RunsDataGrid.tsx`, `ManualTriggerConfirmDialog.tsx`, `QueueStatsCard.tsx`
  - All translation via `useAppTranslation("cron")` in the ViewModel; tier views receive `labels` via props and MUST NOT call `useAppTranslation`
  - **Quality Loop**: per-file
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/common/components/ui/AGENTS.md` if used, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - _Requirements: REQ-15 AC1-AC5_
- [x] 14.3 Create `frontend/desktop/views/dashboard/admin/cron/cronManagement.desktop.tsx`
  - Uses `AppDataGrid` / `DesktopAppDataGrid` with required `paginationOptions`
  - Grid layout: `QueueStatsCard` above the `SchedulesDataGrid`
  - **Quality Loop**: per-file
  - **Instruction Verification**: `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - _Requirements: REQ-15 AC6_
- [x] 14.4 Create `frontend/mobile/views/dashboard/admin/cron/cronManagement.mobile.tsx`
  - Uses `MobileCardList` + `MobileCardListItem` with server-side `paginationOptions` (no `AppDataGrid`)
  - Stack layout: `QueueStatsCard` above the card list
  - **Quality Loop**: per-file
  - **Instruction Verification**: `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - _Requirements: REQ-15 AC6_
- [x] 14.5 Create `app/(dashboard)/cron/page.tsx`
  - Server Component; `getServerUserContext()` → `requirePermissionForPage([AppPermission.CRON_MANAGE])` → render `<CronManagementView />`
  - Mirror `app/(dashboard)/settings/page.tsx` exactly (auth flow + `generateMetadata`)
  - Add `generateMetadata` returning a `cron.title` localized title
  - **Quality Loop**: per-file
  - **Instruction Verification**: `app/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - _Requirements: REQ-15 AC7, AC10_
- [x] 14.6 Component tests (Happy DOM)
  - `test/ui/components/cron/` — mock Apollo `NoopSimuatedClient`; cover: data grid renders rows, create dialog form submission, manual trigger confirms queue, run dialog opens with runs
  - Run via `bun run test:ui:components`
  - **Quality Loop**: per-file + post-test
  - **Instruction Verification**: `test/ui/AGENTS.md` if present, `.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-15_

---

## Phase 5: Optional Adapters & Polish

- [-] 15. **Optional queue adapters full implementation** (REQ-4 AC3-4)
- [x] 15.1 Add optional deps: `~/.bun/bin/bun add bullmq` (latest) + `ioredis` is already installed as a dep of the codebase — verify at impl time, do not add if present
- [ ] 15.2 Implement `backend/services/cron/queue-adapters/bullmq-postgres.adapter.ts`
  - Replace the `noop-stub.adapter` import with the real implementation using BullMQ's v6 `createPostgresBackend` API: `new Queue(name, opts, createPostgresBackend)`, `new Worker(name, processor, opts, createPostgresBackend)`, `new QueueEvents(name, opts, createPostgresBackend)`, `new FlowProducer(opts, createPostgresBackend)` — pass as the LAST constructor argument per `docs.bullmq.io/guide/postgresql` (verified)
  - For repeatable schedules, use `queue.upsertJobScheduler(id, { pattern: cronExpr, tz: 'UTC' })` — the legacy `repeat` option on `Queue.add` was REMOVED in v6 (deprecated in v5.16). Do NOT use the legacy `Queue.add`/`getRepeatableJobs` APIs
  - BullMQ uses `cron-parser` internally for the cron strategy — same lib that drives `cron-scheduler.engine.ts`, so expression handling is consistent
  - All `CronQueueAdapter` methods implemented; test via `backend/services/cron/test/bullmq-postgres.adapter.test.ts`
  - **Quality Loop**: per-file
  - **Instruction Verification**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-4 AC3_
- [ ] 15.3 Implement `backend/services/cron/queue-adapters/bullmq-redis.adapter.ts`
  - Real BullMQ-on-Redis (use existing `@upstash/redis` connection helper — verify the project's existing Redis client wrapper at impl time; `@upstash/redis` v1.38 is already a project dep per the agent's findings)
  - Same v6 API as 15.2 (the backend factory is the only difference — `createRedisBackend` is the default; omit the last constructor argument OR pass `IRedisClient` if using a custom Redis client)
  - All methods + test file
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 15.2
  - _Requirements: REQ-4 AC3_
- [x] 15.4 Implement `backend/services/cron/queue-adapters/custom-sql.adapter.ts`
  - Pure `SELECT … FOR UPDATE SKIP LOCKED` on the existing Postgres — use a dedicated `cron_queue` table (added via a single schema push in task 2 schema update OR via the repo's own `cron_queue` table in `backend/db/schema/cron/cron-queue.sql.ts` — DO NOT add a `bun db migrate` migration file)
  - Implement all methods; tests validate race safety with two simulated workers
  - **Quality Loop**: per-file
  - **Instruction Verification**: same as 15.2
  - _Requirements: REQ-4 AC4_
- [x] 15.5 Replace `noop-stub.adapter.ts` references in the factory with the real adapters (keep `noop-stub` deleted or repurpose as a throw-on-lib-missing wrapper for unknown-future adapters)

---

## Phase 6: Knowledge Propagation (MANDATORY Final Task)

- [x] 16. **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/cron/outcome/` to synthesize all learnings
  - Create canonical reference doc `docs/services/cron-service.md` consolidating: queue-adapter factory pattern, idempotent claim pattern, hybrid trigger model, cron expression engine usage, manual-trigger concurrency policy, mobile/desktop tier-isolated admin UI pattern
  - Update `backend/services/AGENTS.md` — add a "Cron Service" section with key rules + a reference: `See docs/services/cron-service.md for the complete pattern reference.`
  - Update `backend/AGENTS.md` — add cron service to the services index section
  - Update `.agents/instructions/backend.instructions.md` if new conventions warrant enforcement (factory pattern, scope-auth on cron mutations)
  - Update root `AGENTS.md` Important References section with `docs/services/cron-service.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (zero errors and zero warnings)
  - Write outcome file: `.ai/plans/cron/outcome/16-knowledge-propagation-outcome.md`
  - Update progress: Mark task 16 as `[x]` in this `trackable-tasks.md`
  - _Requirements: Knowledge propagation protocol_

---

## Verification Summary (Final)

After all 16 tasks are complete, the orchestrator MUST run a final quality gate:

```bash
bun quality-gate
```

Stages: `BASIC_CHECKS` (tsgo, biome, lint) → `CODESCENE` → `SONAR_SCAN` → `SONAR_RESULTS`.
Any failing stage is resolved per the project's quality-gate skill (parallel sub-agents per file, file-scoped lint-queue client calls).

Final manual smoke test (post-quality-gate):
1. Start dev server: `~/.bun/bin/bun run dev`
2. Log in as a `super_admin` user
3. Verify `/cron` renders the admin UI
4. Create a `NOOP` schedule with `*/1 * * * *` and timezone `UTC`
5. Manually trigger it; verify the `cron_runs` row created → `RUNNING` → `COMPLETED` with `durationMs`
6. Verify the queue stats card shows 0 pending / 0 in-flight / 0 failed
7. Switch language to Arabic; verify all strings localize

If any step fails, debug and re-run the per-file verification loop on the failing file.

---

## Test Coverage Backfill: Cross-Actor Journeys & 4-Tier Enforcement

> Closes the gap between this plan and the enforced test kinds added later to the spec process
> (.agents/skills/spec-implementation/SKILL.md → "Plan Intake" items 5-7 + "Test-Layer Coverage
> Gate"; docs/testing/workflow-journey-tests.md). Existing tasks are unchanged; these tasks are
> additive and execute before this plan is treated as test-complete.

- [ ] TB.1 Journey: admin configures schedule lifecycle → system ticker claims and dispatches → admin observes run history and queue stats
  - Create `test/workflows/cron/schedule-lifecycle-dispatch.journey.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`)
  - Assert: create → `ACTIVE` with computed `nextRunAt`; pause → ticker never claims it and `nextRunAt` stays stale; resume → `nextRunAt` recomputed + `ACTIVE`; dispatch produces a `PENDING` run with `triggerSource = VERCEL_TICKER`; run completion transitions visible via `cronRuns` query; queue stats reflect the drain; delete (soft → `DISABLED`) removes it from dispatch while history stays readable; non-`CRON_MANAGE` actors are denied at every query/mutation touchpoint
  - No notification/dues side effects exist in this domain — assert absence of cross-domain writes (no notification dispatch, no ledger) as part of the isolation contract
  - Verify: `bun run test/scripts/run-test.ts test/workflows/cron/schedule-lifecycle-dispatch.journey.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: REQ-2, REQ-3, REQ-9, REQ-10, REQ-15_
- [ ] TB.2 Journey: admin manual trigger → concurrency policy resolution → worker executes → admin observes run lifecycle
  - Create `test/workflows/cron/manual-trigger-concurrency.journey.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`)
  - Assert: `cronRunTrigger` with an in-flight run — `ALLOW` creates a second run; `SKIP` returns the existing in-flight run without creating a new one (admin gets the info response the UI toasts on); `REPLACE` marks the in-flight run `CANCELLED` with `errorMessage = "Replaced by manual trigger"` and creates a fresh run that the worker then drives to `COMPLETED`; cancelled runs remain visible in history and never re-execute; `triggerSource = MANUAL` on all produced runs; denial path for unauthorized actors
  - No notification dispatch involved — assert no cross-domain side effects
  - Verify: `bun run test/scripts/run-test.ts test/workflows/cron/manual-trigger-concurrency.journey.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: REQ-3 AC1-AC8, REQ-8, REQ-10 AC7, REQ-15 AC4_
- [ ] TB.3 Journey: system ticker dispatch → worker stalls (no heartbeat) → reconciliation marks TIMEOUT → next tick re-claims per concurrency policy → admin observes TIMEOUT/RETRYING in run history
  - Create `test/workflows/cron/stuck-run-reconciliation.journey.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; simulate the stuck run by seeding a `RUNNING` row with a stale heartbeat rather than a real stalled worker)
  - Assert: stuck run flips to `TIMEOUT` during `dispatchDueSchedules` reconciliation; the next tick re-claims the schedule (or holds it when policy forbids); retry-backoff schedule (`now + retryBackoffSeconds * 2^(attempt-1)`) honored on failure paths; a run exhausting `maxRetries` lands `FAILED` with `errorMessage`/`errorStack`; run history reflects every transition for the admin
  - No notification dispatch involved — assert no cross-domain side effects
  - Verify: `bun run test/scripts/run-test.ts test/workflows/cron/stuck-run-reconciliation.journey.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: REQ-3 AC3, AC5-AC7, REQ-8 AC5_
- [ ] TB.4 4-Tier verification for cron service/repository/route/pothos files
  - Confirm Tier 1 branch coverage + Tier 4 abuse/permission cases exist and green for: `backend/db/repo/cron/cron.repository.ts`, `backend/services/cron/cron.service.ts`, `backend/services/cron/cron-scheduler.engine.ts`, `backend/services/cron/queue-adapters/queue-adapter.factory.ts`, `backend/services/cron/queue-adapters/pgboss.adapter.ts`, `backend/services/cron/queue-adapters/custom-sql.adapter.ts`, `backend/services/cron/worker/cron-worker.runtime.ts`, `backend/services/cron/job-handlers/job-handler.registry.ts`, `backend/graphql/pothos/cron/cron.pothos.ts`, `app/api/cron/ticker/route.ts`, `app/api/cron/execute/route.ts`
  - Fill gaps via `.agents/skills/write-tests/SKILL.md` + `.agents/skills/test-expert/SKILL.md`; repo tests inside `runInRollback` with `tx` propagation; service tests mock all external channels (pg, redis, boss)
  - Verify with `bun run test/scripts/run-test.ts <each test file>`
  - _Requirements: REQ-2, REQ-3, REQ-4, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9, REQ-10, REQ-13_
- [ ] TB.5 Penetration verification
  - BOLA/IDOR across the roles in this plan (verify `CRON_MANAGE` gating cannot be bypassed for `cronSchedules`/`cronRuns` queries or any mutation by non-privileged roles; supervisor/teacher/student tokens reject all cron resolvers)
  - Permission denial on all cron mutations; `verifyCronSecretAuth` hard checks on `/api/cron/ticker` and `/api/cron/execute` (no bearer → 401, bad method → 405, missing secret in prod → 500, no fail-open); wildcard/LIKE injection on the `cronSchedules` `name` substring filter; payload injection via `cronRunTrigger` `payload` JSON reaching handlers unsanitized
  - Via `.agents/skills/pentester/SKILL.md`
  - _Requirements: REQ-9 AC3-AC4, REQ-10 AC8, REQ-15 AC7 (security NFRs)_
