# Cron Service & Cron Management UI — Requirements (Specs)

**Feature**: Portable Cron Service with queue-backend agnostic dispatch and a full Admin Management UI for the Siraj `siraj-cron` project.
**Version**: 1.0
**Date**: 2026-07-31
**Status**: Draft for plan-mode confirmation
**Target Directory**: `.ai/plans/cron`
**Outcome Directory**: `.ai/plans/cron/outcome`
**Related**: [implementation.md](./implementation.md) · [trackable-tasks.md](./trackable-tasks.md)

**Process**: [.agents/spec-process-guide](../../.agents/spec-process-guide/NAVIGATION.md) — Requirements → Design (`implementation.md`) → Tasks (`trackable-tasks.md`)

---

## Introduction

Siraj currently has two Vercel-registered cron jobs (`/api/cron/class-reminders`, `/api/fx/refresh`) at `0 6 * * *`, each disciplinaed by a `CRON_SECRET` header at the route level. There is **no DB-backed schedule registry, no run history, no queue, no management UI, and no portable runtime** — the scheduling lives entirely in `vercel.json` and dispatches once per day per route. When we want a job to run every 5 minutes, with retries, observability, and manual triggering from the admin panel, the current architecture cannot express that.

This feature introduces a **Cron Service** — schedule definitions persisted to Postgres, scheduled via a cron-expression engine, dispatched through a pluggable queue-backend adapter (pg-boss default; BullMQ-Postgres / BullMQ-Redis / custom-SQL selectable via env + `system_settings`), and audited as runs in the DB. The dispatch is triggered by **any** of three modes simultaneously (Vercel ticker cron, Vercel explicit per-schedule cron entries, or external schedulers /webhook pings) — the queue absorbs the difference. A new `Cron Management` admin route surfaces the schedule registry, run history, queue stats, and a manual trigger action.

This phase deliberately **does not migrate** the existing 2 crons or implement notification-specific `CronJobKind`s beyond the built-in `NOOP` handler. The pipeline is validated end-to-end using a noop handler, and migrations are deferred to a future plan.

### Feature Summary

Add a portable, queue-backend-agnostic Cron Service that owns schedule definitions, dispatches due jobs through a runtime-selected queue, executes registered handlers, audits every run, and surfaces a permission-gated admin UI for full CRUD on schedules + run inspection + manual triggering.

### Business Value

- Replaces "edit `vercel.json` + redeploy" with a DB-backed schedule registry admin-editable in seconds
- One pipeline supports Vercel Hobby (1/day) through Enterprise (per-minute), as well as non-Vercel runtimes via an external scheduler ping or a standalone worker script
- Single source of truth for run history, retries, and timeout reconciliation — visible in the existing admin surface, not buried in Vercel logs
- Foundation for migrating notification dispatch (and the WhatsApp plan's deferral patterns) onto a durable queue without re-architecting

### Scope

| In scope (this phase) | Out of scope (this/v2) |
|-----------------------|------------------------|
| `cron_schedules`, `cron_runs`, `cron_heartbeats` Drizzle tables | Migrating `/api/cron/class-reminders` and `/api/fx/refresh` onto the new service |
| `CronQueueAdapter` interface + factory selecting pg-boss / BullMQ-PG / BullMQ-Redis / custom-SQL at runtime via `CRON_QUEUE_BACKEND` | Notification-specific `CronJobKind` values beyond `NOOP` (driven by future plans) |
| pg-boss adapter fully implemented; BullMQ/Redis and custom-SQL adapters scaffoldered as `throw NotImplemented` | Replicating the WhatsApp webhook pattern (separate workstream in `.ai/plans/whatsapp/`) |
| `CronService` orchestration: create/update/pause/resume/delete, dispatch-due, dispatch-by-id, run history read, queue stats | Pair-rate-limiting surfaces from the WhatsApp plan (use Redis directly there) |
| `cron-scheduler.engine.ts` (cron-expression → `nextRunAt`) | Cross-region queue sharding / multi-master topology |
| `JobHandlerRegistry` keyed by `CronJobKind` + `NOOP` handler to validate the pipeline | Bull Board-style 3rd-party viewer (UI is the project's MUI + Apollo + Zustand stack only) |
| Worker runtime that drains the queue in-process inside the ticker route (and is structured to later run as a standalone `bun scripts/cron-worker.ts`) | Migration SQL files — repo uses `db push` exclusively per `AGENTS.md` |
| `/api/cron/ticker` and `/api/cron/execute` API routes (idempotent, `verifyCronSecretAuth`-gated) + `vercel.json` ticker entry | |
| Pothos GraphQL: queries for schedules/runs/stats, mutations for CRUD + pause/resume + manual trigger | |
| `CRON_MANAGE` permission; registered in `backend/enum/permissions/permission.enum.ts` and seeded | |
| Full Admin UI at `/cron` under `grp_admin`, with schedule list DataGrid, create/edit dialog, runs dialog, manual trigger confirmation, queue stats card — Desktop + mobile tier isolation | |
| i18n `cron` namespace (AR + EN) with all admin strings + validation errors + pluralization for runs | |

### Confirmed Decisions

**(API research — verified against the official docs on 2026-07-31)**

| Library | Verified API | Notes |
|---------|--------------|-------|
| `pg-boss` v12.26 | `new PgBoss(connString)`, `await boss.start()`, `await boss.createQueue(name, opts)`, `await boss.send(name, data, opts)`, `await boss.work(name, handler)` (canonical: pg-boss auto-manages `created/active/completed/retry/failed` states), `await boss.schedule(name, cron, data)`, `await boss.unschedule(name)`, `await boss.getQueue(name)`, `await boss.getQueueStats(name, opts)`, `await boss.complete/fail/retry/deleteJob(id)`, `await boss.stop({ close: false })`. Queue options include `retryLimit` (default 2), `retryDelay` (default 0s), `retryBackoff` (bool), `expireInSeconds` (default 900s), `heartbeatSeconds` (default disabled), `retentionSeconds`, `deadLetter`, `notify`. pg-boss uses Postgres `SKIP LOCKED` for fetch and `LISTEN/NOTIFY` for low-latency wake (optional via `useListenNotify` config). Default `retryLimit = 2`, NOT 3. | README + docs/api/jobs.md + docs/api/queues.md verified. |
| `@neondatabase/serverless` Pool | The project's `backend/db/factory.ts` already exposes `createPool()` returning either `pg.Pool` (TCP, for `DB_CONNECTION_MODE=pg`) or `@neondatabase/serverless` `Pool` over WebSockets (for Neon). Neon HTTP mode (`queryDb(tx)` over `@neondatabase/serverless` `neon()`) is **NOT compatible** with pg-boss (pg-boss needs persistent `LISTEN/NOTIFY` + `pg_advisory_xact_lock` session features). Neon PgBouncer `-pooler` hostname ALSO breaks LISTEN/NOTIFY — pg-boss must use the direct (`-pooler` removed) connection string OR run in polling-only mode (`useListenNotify: false`). | Neon connection-pooling docs verified. |
| `bullmq` v6 + `createPostgresBackend` | `new Queue(name, opts, createPostgresBackend)`, `new Worker(name, processor, opts, createPostgresBackend)`, `new QueueEvents(name, opts, createPostgresBackend)`, `new FlowProducer(opts, createPostgresBackend)`. Repeatable jobs use `queue.upsertJobScheduler(id, { pattern: '0 15 3 * * *' \| every: 1000, tz: 'UTC' })` — the legacy `repeat` options on `Queue.add` were REMOVED in v6 (deprecated in v5.16). Uses `cron-parser` internally for cron strategy. | bullmq v6 docs verified. |
| `cron-parser` v5 | `import { CronExpressionParser } from "cron-parser"`. `CronExpressionParser.parse(expr, { currentDate?, endDate?, startDate?, tz?, strict?, hashSeed? }): CronExpression`. Methods: `.next(): CronDate`, `.prev()`, `.take(n): CronDate[]`, `.hasNext()`, `.reset(date?)`, `.includesDate(date)`, `[Symbol.iterator]`. `CronDate` extends/native wraps Date. Throws on invalid expression — wrap in try/catch. Supports `L`, `#`, `H`, `@yearly`/`@monthly`/etc. — Vercel cron RESTRICTS to standard 5-field but our engine should accept the superset (Vercel rejects its own non-standard entries at deploy, not us). | cron-parser README verified. |

1. **Queue backend is runtime-selected** via a service factory. Resolution order: `system_settings.env::CRON_QUEUE_BACKEND` → `process.env.CRON_QUEUE_BACKEND` → default `PG_BOSS` (zero new infra; runs on existing Postgres). The selected adapter is `await import`-ed lazily so unused backends don't bloat the serverless bundle.
2. **Three trigger modes simultaneously** (hybrid): single ticker cron drains due jobs; explicit per-schedule Vercel crons can also fire on any cadence (redeploy-time pin); external scheduler ping works on Hobby+ and any platform. All are idempotent via atomic `claimNextRun`.
3. **Full Admin UI** — create/pause/resume/delete schedules, view run history per schedule + globally, manual trigger with concurrency-policy confirmation, queue stats card.
4. **API surface is GraphQL via Pothos** — matches the existing admin pattern; all resolvers permission-gated by `CRON_MANAGE`.
5. **`maxDuration = 300`** on both new API routes; the worker drains the queue in batches and safely leaves spillover for the next tick (the queue absorbs the delay; no job is lost).
6. **Phased backlog delivery**: pg-boss adapter fully implemented; BullMQ and custom-SQL adapters ship as `throw NotImplemented` stubs in this phase and get fully implemented in follow-up tasks (15) once pg-boss is production-validated. This satisfies the "support all options via factory" requirement earliest.
7. **`NOOP` handler only** in this phase. The pipeline is validated end-to-end without coupling to real notification domains. Domain-specific `CronJobKind` values come via future plans that the orchestrator registers as new handlers.
8. **Navigation**: `/cron` route as a sibling of `/settings` and `/permissions` under `grp_admin` in the sidebar. Mobile bottom nav stays flat (cron is admin-only).
9. **Audience**: `SUPER_ADMIN` and `ACADEMY_ADMIN` with `CRON_MANAGE` only. Portal users (teachers, parents, students, supervisors) never see the route.
10. **Idempotency**: schedule-name uniqueness across `ACTIVE` and `PAUSED` rows; concurrency policy (`ALLOW` / `SKIP` / `REPLACE`) decides what happens when a manual trigger fires while a run is in flight.
11. **Auth model**: API routes use `verifyCronSecretAuth` unchanged (existing `CRON_SECRET`). Future platforms (external schedulers) reuse the same bearer; if the secret can't be set on Hobby, the route returns 500 (no fail-open).

---

## Requirements

### REQ-1: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN the system SHALL require reading ALL existing files in `.ai/plans/cron/outcome/` before any file edit.
2. WHEN an executing agent completes any task THEN the system SHALL write a new outcome document under `.ai/plans/cron/outcome/<task-id>-outcome.md` detailing research findings, docs/web search results, implementation details, and carry-over points.
3. WHEN an executing agent completes any subtask THEN the system SHALL update the corresponding task checkbox `[ ]` → `[x]` in `trackable-tasks.md`.
4. WHEN any file is modified THEN the executing agent SHALL execute per-file verification (`bun tsgo` + `bun biome:check` + lint-queue client for target file).
5. WHEN any task is marked complete THEN the system SHALL have run `bun tsgo`, `bun biome:check`, and `bun run lint` globally with zero errors and zero warnings.

**Priority**: High | **Complexity**: Low | **Dependencies**: None

---

### REQ-2: Cron Schedules Persistence

**User Story:** As an administrator, I want schedule definitions persisted to the database (rather than living only in `vercel.json`), so that I can create, edit, pause, and delete schedules without redeploying.

#### Acceptance Criteria

1. WHEN an admin creates a schedule THEN the system SHALL persist it in `cron_schedules` with `name` (unique), `cronExpression`, `jobKind`, `payload` (jsonb), `timezone` (validated via `is_valid_timezone()`, default `UTC`), `status` (`ACTIVE` by default), `nextRunAt`, `concurrencyPolicy` (`ALLOW` / `SKIP` / `REPLACE`), `maxRetries` (default 3), `retryBackoffSeconds` (default 60), `timeoutSeconds` (default 300), `createdByUserId`, `updatedByUserId`, timestamps.
2. WHEN the system computes the next run for a schedule THEN the `cron-scheduler.engine.ts` SHALL compute `nextRunAt` from `cronExpression` + `timezone` and the engine SHALL validate cron expressions using `cron-parser` (v5+) — never raw regex.
3. IF a schedule is `PAUSED` or `DISABLED` THEN the dispatch loop SHALL never claim it; its `nextRunAt` SHALL remain stale (no recomputation while paused).
4. WHEN a schedule is resumed from `PAUSED` THEN `CronService.resumeSchedule` SHALL recompute `nextRunAt` from `now` and persist it before setting status to `ACTIVE`.
5. WHEN a schedule is deleted THEN the system SHALL soft-delete (`status = DISABLED`) by default and only hard-delete when explicitly requested (hard delete cascade-nulls `cron_runs.scheduleId` for historical preservation).
6. IF two schedules with the same `name` exist THEN the database SHALL reject the insert via the unique `name_idx` (zero collision tolerance).

**Priority**: High | **Complexity**: Medium | **Dependencies**: REQ-11 (DB schema)

---

### REQ-3: Cron Run Audit Lifecycle

**User Story:** As an administrator, I want a complete audit trail of every cron run, so that I can investigate failures, retries, and timing anomalies.

#### Acceptance Criteria

1. WHEN a schedule becomes due THEN the system SHALL atomically create a `cron_runs` row with `status = PENDING`, `attempt = 1`, `triggerSource` (`VERCEL_TICKER` / `VERCEL_EXPLICIT` / `EXTERNAL` / `MANUAL` / `WORKER_RETRY`), `startedAt = now`, and atomically update the matching `cron_schedules.nextRunAt` to the engine-computed next value — both inside a single transaction guarded by an advisory lock so simultaneous ticker invocations can't double-claim.
2. WHEN a worker begins processing a claimed run THEN the system SHALL set `status = RUNNING` and stamp `workerId`.
3. WHILE a run is in flight THEN the worker SHALL periodically write `cron_heartbeats` rows (every `timeoutSeconds / 4`, capped at 60s) so a stuck run can be detected and `TIMEOUT`-reconciled by the next ticker pass — OR delegate this to the active queue backend which supports its own heartbeat primitive (pg-boss `heartbeatSeconds` option per its docs/api/queues.md).
4. WHEN a run completes successfully THEN the system SHALL set `status = COMPLETED`, `completedAt = now`, `durationMs`.
5. WHEN a run fails AND `attempt < maxRetries` THEN the system SHALL set `status = RETRYING`, schedule the next attempt at `now + retryBackoffSeconds * 2^(attempt-1)` (exponential backoff), and increment `attempt`.
6. WHEN a run fails AND `attempt >= maxRetries` THEN the system SHALL set `status = FAILED`, `errorMessage`, `errorStack`.
7. WHEN a run exceeds `timeoutSeconds` without a fresh heartbeat THEN a reconciliation pass (in `dispatchDueSchedules`) SHALL mark it `TIMEOUT` and (per `concurrencyPolicy`) allow the next tick to re-claim.
8. IF a run is `CANCELLED` by a concurrency-policy `REPLACE` THEN it SHALL remain visible in run history with `errorMessage = "Replaced by manual trigger"` and never re-execute.
9. WHEN the active queue backend is pg-boss THEN the worker runtime SHALL use the canonical `boss.work(name, handler)` API (pg-boss auto-manages the queue-level `created/active/completed/retry/failed` lifecycle, including its own `expireInSeconds` job timeout and `heartbeatSeconds` liveness check). The `cron_runs` table is a **parallel audit ledger** — the worker writes `RUNNING`/`COMPLETED`/`RETRYING`/`FAILED` to `cron_runs` for admin-UI visibility, independently of pg-boss's internal state. The `cron_heartbeats` table is used only by adapters that lack their own heartbeat primitive (e.g. `CUSTOM_SQL`); pg-boss owns its own heartbeats via the queue's `heartbeatSeconds` option (verified: pg-boss docs/api/queues.md).

**Priority**: High | **Complexity**: High | **Dependencies**: REQ-2, REQ-11

---

### REQ-4: Queue-Backend Agnostic Dispatch

**User Story:** As an infrastructure operator, I want the queue backend to be switchable without code changes, so the same Cron Service runs on Vercel + Neon Postgres, on a self-hosted box + Redis, or with BullMQ-Postgres, just by setting an environment variable or DB override.

#### Acceptance Criteria

1. WHEN the Cron Service boots THEN `queue-adapter.factory.ts` SHALL resolve the active backend in this order: `system_settings.env::CRON_QUEUE_BACKEND` (cached 5min via existing `resolveEnvConfig`) → `process.env.CRON_QUEUE_BACKEND` → default `PG_BOSS`.
2. WHEN the active backend is `PG_BOSS` THEN the factory SHALL `await import("pg-boss")` lazily and return the pg-boss adapter instance. The adapter SHALL receive a raw `pg.Pool` from the project's existing `createPool()` factory (`backend/db/factory.ts`) — NOT the Drizzle `db` instance, NOT the Neon HTTP `neon()` client (pg-boss requires persistent TCP connections for its `LISTEN/NOTIFY` listener and `pg_advisorial_xact_lock` session features, both broken by Neon HTTP mode AND Neon PgBouncer `-pooler` hostname — verified against Neon connection-pooling docs).
3. WHEN pg-boss is initialized THEN the adapter SHALL call `await boss.start()` once on first use (lazy — not at server boot, so a missing DATABASE_URL doesn't crash boot). The adapter SHALL set `useListenNotify: false` when the resolved pool uses Neon's pooled `-pooler` hostname (detected via the URL hostname) — falling back to poller-only mode to avoid the LISTEN/NOTIFY breakage. (Alternatively, document that the deployer MUST use the direct `DATABASE_URL` for cron; the adapter logs a warning when forced into poller mode.)
4. WHEN the active backend is `BULLMQ_POSTGRES` or `BULLMQ_REDIS` THEN the factory SHALL `await import(...)` the matching adapter; if the required library is not installed it SHALL throw `CronQueueBackendNotAvailable` at first use (not at boot — server boot must never crash on library absence).
5. WHEN the active backend is `CUSTOM_SQL` THEN the factory SHALL return an adapter that uses `SELECT ... FOR UPDATE SKIP LOCKED` on the existing Postgres connection (no external library) and `pg_advisory_xact_lock` for the `claimNextRun` atomicity (matching the existing pattern in `backend/db/repo/notifications/notification.repository.ts`).
6. WHEN a non-selected backend library is missing THEN the server SHALL still boot and other code paths SHALL still work (only the actively-selected backend is required).
7. IF `CRON_QUEUE_BACKEND` is set to an unknown value THEN the factory SHALL throw `CronQueueBackendUnknown` (fail-loud, never silently fall back).
8. WHEN the factory selects a backend THEN it SHALL memoize the adapter in a module-scoped singleton for the process lifetime (re-selection on env config cache invalidation is a v2 concern — the cache TTL on `resolveEnvConfig` is informational here).

**Priority**: High | **Complexity**: Medium | **Dependencies**: REQ-11, REQ-12

---

### REQ-5: Queue Adapter Contract

**User Story:** As a future implementer of a new queue backend, I want a single TypeScript interface that all backends implement, so that adding a backend doesn't touch `CronService` code.

#### Acceptance Criteria

1. WHEN the system references any queue backend THEN it SHALL use the `CronQueueAdapter` interface exposing: `send(job)`, `fetch({ count })`, `complete(jobId)`, `fail(jobId, error)`, `retry(jobId, delaySeconds)`, `getQueueStats()`.
2. WHEN `send` is invoked THEN the adapter SHALL enqueue the job with at-least-once delivery semantics and return an opaque `queueJobId`.
3. WHEN `fetch` is invoked THEN the adapter SHALL claim up to `count` jobs atomically and invisibly to other workers (the underlying primitive is `SKIP LOCKED` or Redis `BZPOPMIN`, per backend).
4. WHEN `complete` is invoked THEN the adapter SHALL mark the job as done in the queue (not in `cron_runs` — `cron_runs` lifecycle is `CronService`'s concern).
5. WHEN `getQueueStats` is invoked THEN the adapter SHALL return `CronQueueStats` with `pending`, `inFlight`, `failed`, partitioned by `jobKind` if the backend supports it (else the global counts).
6. WHEN the adapter's underlying connection is lost THEN the adapter SHALL throw (the ticker catches and logs; no silent dropping).

**Priority**: High | **Complexity**: Medium | **Dependencies**: REQ-4

---

### REQ-6: Cron Scheduler Engine

**User Story:** As a developer, I want a pure cron-expression engine that computes `nextRunAt` deterministically, so that I can unit-test scheduling logic without spinning up workers.

#### Acceptance Criteria

1. WHEN `cron-scheduler.engine.nextRunAt(cronExpression, from, timezone)` is invoked THEN the engine SHALL return the next firing time as a `Date` in UTC.
2. IF `cronExpression` is invalid THEN `nextRunAt` SHALL throw `InvalidCronExpression` and `CronService.createSchedule` SHALL surface it as a typed GraphQL error with the localized `invalidCronExpression` message.
3. WHEN the engine parses an expression THEN it SHALL use `cron-parser` (v5+) and respect the optional `timezone` (validated via `is_valid_timezone()`).
4. WHEN Vercel's documented cron restrictions apply (no `MON`/`JAN` named tokens, no combining day-of-month + day-of-week) THEN the engine SHALL warn in dev logs but SHALL NOT block — same restrictions are enforced by Vercel at deploy time and the engine should still compute correctly for the queue-native (non-Vercel) backends.

**Priority**: High | **Complexity**: Low | **Dependencies**: none

---

### REQ-7: Job Handler Registry

**User Story:** As a domain service author, I want a registry that maps `CronJobKind` to a handler, so that adding a new scheduled domain is a single registration call.

#### Acceptance Criteria

1. WHEN the registry boots THEN it SHALL register the built-in `CronJobKind.NOOP` handler — a no-op that resolves immediately and is used to validate the pipeline end-to-end.
2. WHEN a worker dequeues a job with `jobKind` THEN the registry SHALL dispatch to the matching handler; if no handler is registered for `jobKind`, the run SHALL be marked `FAILED` with `errorMessage = "No handler registered for jobKind=<X>"`.
3. WHEN a handler throws THEN the run SHALL be marked `FAILED` (then RETRYING per REQ-3) — the worker catches all errors; no unhandled rejection escapes the worker loop.
4. IF the worker process terminates mid-job THEN on next boot the queue returns the in-flight jobs to `pending` (at-least-once), and the worker re-runs them; downstream handlers MUST be idempotent — the registry SHALL document this in a `// Idempotency: handlers must be idempotent…` comment block.

**Priority**: Medium | **Complexity**: Low | **Dependencies**: REQ-5

---

### REQ-8: Worker Runtime

**User Story:** As an infra operator, I want a single worker runtime that runs in-serverless (Vercel) and also as a standalone Bun script, so that I can deploy the same code on Vercel or self-hosted without forking.

#### Acceptance Criteria

1. WHEN `/api/cron/ticker` is invoked THEN the route SHALL: (a) gate with `verifyCronSecretAuth`; (b) call `CronService.dispatchDueSchedules({ now, source })`; (c) start the worker drain loop; (d) return JSON with the number of schedules dispatched + runs processed; (e) honor `maxDuration = 300`.
2. WHILE the worker drain loop is running THEN it SHALL `fetch` batches of `CRON_QUEUE_MAX_BATCH` jobs (default 25), dispatch each to its handler, and continue until the queue is empty OR `maxDuration` approaches (stop with a 30s safety margin).
3. WHEN a job completes or fails THEN the worker SHALL call the matching adapter method AND update `cron_runs` via `CronService.completeRun` / `failRun`.
4. WHEN deployed to Vercel THEN the worker runs in-process inside the ticker invocation (Fluid Compute reuses the instance). When deployed outside Vercel THEN the same worker runtime is invoked by `bun run scripts/cron-worker.ts` (this phase scaffolds the script; full standalone worker polish is a v2 concern).
5. WHEN a heartbeat timeout is detected by the ticker's reconciliation step THEN the stuck run SHALL be marked `TIMEOUT` and the worker SHALL skip it (the new ticker will re-claim if `concurrencyPolicy` permits).

**Priority**: High | **Complexity**: High | **Dependencies**: REQ-3, REQ-5, REQ-7

---

### REQ-9: API Routes

**User Story:** As a Vercel/external scheduler, I want HTTP endpoints to trigger the cron dispatch, so that I can use whichever scheduler model the deployment supports.

#### Acceptance Criteria

1. WHEN a request hits `GET /api/cron/ticker` with a valid `CRON_SECRET` bearer THEN the route SHALL dispatch due schedules and run the worker drain (idempotent — multiple invocations within the same minute are safe via `claimNextRun`'s atomic guard).
2. WHEN a request hits `GET /api/cron/execute?scheduleId=<uuid>` with a valid `CRON_SECRET` bearer THEN the route SHALL dispatch exactly that schedule by id with `triggerSource = VERCEL_EXPLICIT` (idempotent).
3. IF either ticker or execute receives a non-GET method THEN `verifyCronSecretAuth` SHALL return `405 Method not allowed`.
4. WHEN the route runs in production without `CRON_SECRET` THEN the route SHALL return `500 Server misconfigured` (the existing `cron-auth.ts` semantics, unchanged).
5. WHEN the response is sent THEN the JSON body SHALL include `dispatchedCount`, `processedCount`, `failedCount`, `nextTickInMs` (estimated until the next scheduled tick).
6. WHEN `vercel.json` is updated THEN it SHALL add `{"path":"/api/cron/ticker","schedule":"*/1 * * * *"}` and keep the existing 2 crons (this phase does NOT migrate them) — Hobby's 1/day limit still works (the ticker fires once/day; jobs due in the gaps fire on the next tick).

**Priority**: High | **Complexity**: Medium | **Dependencies**: REQ-8

---

### REQ-10: GraphQL API (Pothos)

**User Story:** As the Admin UI developer, I want typed GraphQL queries/mutations for the cron management surface, so that I can build the UI with Apollo Client like every other admin page.

#### Acceptance Criteria

1. WHEN a `CRON_MANAGE`-permitted user queries `cronSchedules(input: CronScheduleListInput!)` THEN the system SHALL return a paginated list filtered by optional `status`, `jobKind`, `name` substring.
2. WHEN querying `cronRuns(input: CronRunListInput!)` THEN the system SHALL return a paginated list filtered by optional `scheduleId`, `status`, `from`, `to`.
3. WHEN querying `cronQueueStats` THEN the system SHALL return `CronQueueStats` from the active adapter's `getQueueStats()`.
4. WHEN mutating `cronScheduleCreate` THEN the system SHALL validate the cron expression via the engine (REQ-6) and the timezone via `is_valid_timezone()`; both invalid inputs return typed errors with localized messages.
5. WHEN mutating `cronScheduleUpdate` THEN the system SHALL recompute `nextRunAt` if `cronExpression` or `timezone` changed.
6. WHEN mutating `cronSchedulePause` / `cronScheduleResume` THEN the system SHALL transition the status and (on resume) recompute `nextRunAt`.
7. WHEN mutating `cronRunTrigger(id: ID!, input: { payload?: JSON })` THEN the system SHALL dispatch the schedule with `triggerSource = MANUAL` and apply the `concurrencyPolicy` (`ALLOW` → always create new run; `SKIP` → return existing in-flight run if any; `REPLACE` → mark existing in-flight run `CANCELLED` then create new).
8. IF any resolver is invoked by a user without `CRON_MANAGE` THEN the resolver SHALL reject with `permissionDenied` via the existing Pothos scope-auth pattern (matches the `permissions.pothos.ts` shape).
9. WHEN Pothos registration is complete THEN the executor SHALL run `bun run generate:gqlSchema && bun codegen` and the generated `AppPermission.CRON_MANAGE` SHALL appear in `frontend/common/graphql/generated/gql/graphql-types.ts`.

**Priority**: High | **Complexity**: Medium | **Dependencies**: REQ-10 (per-resolver permission), REQ-2, REQ-3

---

### REQ-11: Database Schema

**User Story:** As a backend developer, I want a domain-grouped Drizzle schema for cron, so that schedules, runs, and heartbeats live in their own subdirectory mirroring `backend/db/schema/cron/`.

#### Acceptance Criteria

1. WHEN the schema is created THEN the system SHALL add `backend/db/schema/cron/cron.ts` with three tables: `cron_schedules`, `cron_runs`, `cron_heartbeats` (column lists per the design doc).
2. WHEN the enums are registered THEN `backend/db/schema/enums.ts` SHALL add `cronQueueBackendEnum`, `cronScheduleStatusEnum`, `cronRunStatusEnum`, `cronJobKindEnum`, `cronTriggerSourceEnum`, `cronConcurrencyEnum` via `createPgEnumFromEnum`.
3. WHEN the schema file is written THEN the system SHALL register the barrel at `backend/db/schema/cron/index.ts` and re-export from the top-level `backend/db/schema/index.ts`.
4. WHEN the schema is finalized THEN the developer SHALL run `bun run db push` (NOT migrate — push is the schema-sync path per `AGENTS.md`).
5. WHEN indexes are added THEN the schema SHALL include: `cron_schedules(status, nextRunAt)`, `cron_schedules(name)` unique, `cron_schedules(jobKind)`, `cron_runs(scheduleId, status, startedAt)`, `cron_runs(status, startedAt)`, `cron_runs(workerId, status)`, `cron_heartbeats(runId, lastBeatAt)`.

**Priority**: High | **Complexity**: Medium | **Dependencies**: REQ-12 (enums)

---

### REQ-12: Enums & Types

**User Story:** As a backend developer, I want the cron enums and types defined once in `backend/enum/cron/` and `backend/types/cron/`, so that all layers share the canonical definitions.

#### Acceptance Criteria

1. WHEN enums are added THEN `backend/enum/cron/cron.enums.ts` SHALL define `CronQueueBackend` (`PG_BOSS | BULLMQ_POSTGRES | BULLMQ_REDIS | CUSTOM_SQL`), `CronScheduleStatus` (`ACTIVE | PAUSED | DISABLED`), `CronRunStatus` (`PENDING | RUNNING | COMPLETED | FAILED | TIMEOUT | CANCELLED | RETRYING`), `CronJobKind` (starts with `NOOP`), `CronTriggerSource` (`VERCEL_TICKER | VERCEL_EXPLICIT | EXTERNAL | MANUAL | WORKER_RETRY`), `CronConcurrencyPolicy` (`ALLOW | SKIP | REPLACE`).
2. WHEN types are added THEN `backend/types/cron/cron.types.ts` SHALL define `CronScheduleSelectType`, `CronScheduleInsertType`, `CronRunSelectType`, `CronRunInsertType`, `CronScheduleReturnType`, `CronScheduleSubmitInput`, `CronScheduleUpdateInput`, `CronRunReturnType`, `CronRunListInput`, `CronTriggerNowInput`, `CronQueueStats` (from `$inferSelect`/`$inferInsert` + service input/output types per `backend/types/AGENTS.md`).
3. WHEN barrels are updated THEN `backend/enum/cron/index.ts` SHALL `export *` and the top-level `backend/enum/index.ts` SHALL re-export `./cron`; the same applies for `backend/types/cron/index.ts` + top-level barrel.
4. WHEN the `CRON_MANAGE` permission is added THEN `backend/enum/permissions/permission.enum.ts` SHALL add `CRON_MANAGE = "cron.manage"` following the existing camelCase pattern.

**Priority**: High | **Complexity**: Low | **Dependencies**: none

---

### REQ-13: Repository Layer

**User Story:** As a service-layer author, I want a `cron.repository.ts` exposing all DB access, so that `CronService` doesn't touch the DB directly per the repo layer rule.

#### Acceptance Criteria

1. WHEN `cron.repository.ts` is created THEN it SHALL expose: `createSchedule`, `updateSchedule`, `getScheduleById`, `getScheduleByName`, `listSchedules({ status?, jobKind?, pagination })`, `listDueSchedules({ now, limit, tx? })`, `claimNextRun({ scheduleId, now, triggerSource, tx? })` (atomic, advisory-locked), `updateRunStatus`, `appendRunError`, `recordHeartbeat`, `reconcileStuckRuns({ now, batch })`, `listRunsBySchedule`, `listRuns({ scheduleId?, status?, from?, to?, pagination })`, `deleteScheduleById({ hard? })`.
2. WHEN `listDueSchedules` runs THEN it SHALL return schedules where `status = ACTIVE` AND `nextRunAt <= now` AND (no in-flight RUN for that scheduleId with status in (`PENDING`, `RUNNING`, `RETRYING`) when `concurrencyPolicy = SKIP`).
3. WHEN non-transactional read methods exist THEN they SHALL use `queryDb(tx)` from `@/backend/db` per the Neon HTTP Client rule in `backend/AGENTS.md`.
4. WHEN `claimNextRun` runs THEN it SHALL: (a) in tx + advisory lock; (b) recompute `nextRunAt` via the engine at the row level (or return `null` if another worker already claimed); (c) insert a `cron_runs` row PENDING; (d) return the new runId + updated `nextRunAt`. Returns `null` if the claim is lost.
5. WHEN tests are written THEN they SHALL use `runInRollback` and never `expect().rejects.toThrow()` inside the rollback (per the DB testing rules in `AGENTS.md`).

**Priority**: High | **Complexity**: High | **Dependencies**: REQ-11, REQ-6

---

### REQ-14: i18n Namespace

**User Story:** As an admin UI user (Arabic or English), I want every cron admin string localized, so that the page matches the rest of the dashboard.

#### Acceptance Criteria

1. WHEN the `cron` i18n namespace is defined THEN `shared/locale/types/cron/index.ts` SHALL define the type schema with all keys below — including pluralization for runs — and `shared/locale/{en,ar}/cron/index.ts` SHALL implement the same keys.
2. WHEN strings are emitted THEN the type schema SHALL include: schedule labels (`statusActive/Paused/Disabled`, `triggerSource...`, `concurrencyAllow/Skip/Replace`, `jobKindNoop`), run status (`statusPending/Running/Completed/Failed/Timeout/Cancelled/Retrying`, plural `runsCount(count)`), validation errors (`invalidCronExpression`, `invalidTimezone`, `scheduleNameTaken`, `scheduleNotFound`, `runNotFound`, `permissionDenied`, `manualTriggerConflict`, `queueBackendUnknown`), queue backend labels (`pgBoss`, `bullmqPostgres`, `bullmqRedis`, `customSql`), admin UI chrome (`pageTitle`, `pageSubtitle`, `emptyMessage`, `createDialog.*`, `editDialog.*`, `runsDialog.*`, `manualTriggerConfirm.*`, `queueStatsCard.*`).
3. WHEN barrels are updated THEN `shared/locale/{en,ar}/index.ts` SHALL re-export `./cron` and `shared/locale/types/index.ts` SHALL re-export `./cron`.
4. WHEN Server Components / Resolvers / Client Components use these strings THEN they SHALL use the existing compile-time APIs: `getTranslations(locale).cron...`, `ctx.t("cron")...`, `useAppTranslation("cron")...`. No hardcoded admin strings.

**Priority**: Medium | **Complexity**: Low | **Dependencies**: none

---

### REQ-15: Admin UI

**User Story:** As an admin with the `CRON_MANAGE` permission, I want a dedicated `/cron` dashboard page to list, create, edit, pause, resume, delete, manually trigger, and inspect runs of cron schedules, so that I can operate the cron service without SSH or redeploy.

#### Acceptance Criteria

1. WHEN a user with `CRON_MANAGE` navigates to `/cron` THEN the page SHALL render `CronManagementView` listing schedules in an `AppDataGrid`/`MobileCardList` (per tier) with columns: `name`, `cronExpression`, `jobKind`, `status`, `nextRunAt`, `lastRunAt`, `concurrencyPolicy`, row actions menu.
2. WHEN the user clicks "Create" THEN a `ScheduleCreateEditDialog` SHALL open with fields: `name`, `description`, `cronExpression` (with live `nextRunAt` preview from the engine), `jobKind` (only `NOOP` in this phase), `payload` (JSON editor), `timezone` (select), `concurrencyPolicy` (radio), `maxRetries`, `retryBackoffSeconds`, `timeoutSeconds`.
3. WHEN the user clicks a schedule row THEN `RunsDialog` SHALL open showing the schedule's runs in a `RunsDataGrid` with columns: `triggerSource`, `status`, `attempt`, `startedAt`, `durationMs`, `errorMessage`.
4. WHEN the user clicks "Manual Trigger" on a schedule THEN a `ManualTriggerConfirmDialog` SHALL confirm and (per `concurrencyPolicy`) call `cronRunTrigger` mutation; if `SKIP` and a run is in flight, an info toast SHALL be shown.
5. WHEN the page renders THEN a `QueueStatsCard` SHALL display the active queue backend label + pending / in-flight / failed counts from `cronQueueStats` query, refreshing every 30s.
6. WHEN accessed on mobile THEN the route SHALL render via `cronManagement.mobile.tsx` (mobile tier isolation enforced); desktop uses `cronManagement.desktop.tsx`.
7. WHEN a user without `CRON_MANAGE` accesses `/cron` THEN `requirePermissionForPage` SHALL redirect them away (matches the `permissions` page pattern).
8. WHEN the route is registered THEN `frontend/common/views/dashboard/config/navigationConfig.ts` SHALL add a `cron` nav item under `grp_admin` with `permission: [AppPermission.CRON_MANAGE]`.
9. WHEN `frontend/common/types/page-permissions.types.ts` is updated THEN it SHALL add a `cronManagement` permission entry mapping to `[AppPermission.CRON_MANAGE]`.
10. WHEN `app/(dashboard)/cron/page.tsx` is created THEN it SHALL be a Server Component, `getServerUserContext()` + `requirePermissionForPage([CRON_MANAGE])`, render `<CronManagementView />` (analogous to `app/(dashboard)/settings/page.tsx`).

**Priority**: High | **Complexity**: High | **Dependencies**: REQ-10, REQ-14

---

## UX/Navigation Requirements (MANDATORY)

### New Routes & Role-Based Access

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| `/cron` | Cron schedule + runs management (list + dialog flows in-place) | `CRON_MANAGE` | `SUPER_ADMIN`, `ACADEMY_ADMIN` |

Note: this phase ships a single, dialog-driven page (`CronManagementView`) at `/cron`. No `/cron/new` or `/cron/[id]` subroutes — create/edit and run inspection are in-page dialogs (matches the `paymentCatalogs` page pattern). A future v2 may split run-detail into `/cron/[id]/runs/[runId]`.

### Sidebar Navigation Placement

The `cron` item is a child of **Admin (`grp_admin`)** alongside `permissions`, `settings`, and `dst-migration`. Existing group `grp_admin` already exists in `SIDEBAR_NAV_GROUPS` with `separator: true`; add the new child item to `SIDEBAR_NAV_ITEMS` between `dst-migration` and `permissions`. No new group, no new label on the sidebar group header.

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| Student | N/A — hidden |
| Parent | N/A — hidden |
| Teacher | N/A — hidden |
| Supervisor | N/A — hidden (supervisor portal nav hides the admin `grp_admin` items already per `applySupervisorNavOverrides` — no extra work needed) |
| Admin/Staff | Full CRUD + run history + manual trigger + queue stats |

Existing supervisor portal nav already hides `permissions` / `settings` / `dst-migration` (per `applySupervisorNavOverrides` keys in `navigationConfig.ts`); the new `cron` key SHALL be added to the same `hiddenKeys` set so non-admin supervisors never see the item.

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Sidebar entry | `cron` item under `grp_admin` (main section) | Not in `BOTTOM_NAV_ITEMS` — admin-only surfaces dismiss from bottom-nav |
| Schedule list | `AppDataGrid` (server-side pagination via `paginationOptions`) | `MobileCardList` + `MobileCardListItem` (server-side pagination) via `cronManagement.mobile.tsx` |
| Create/edit | `ScheduleCreateEditDialog` (full MUI `Dialog`) | Same component, responsive MUI Dialog (no separate dialog component per the existing pattern — Dialog auto-fits) |
| Run history | `RunsDialog` containing `RunsDataGrid` | `RunsDialog` containing `MobileCardList` of runs (same dialog shell; the inner list tier-switches) |
| Queue stats | `QueueStatsCard` in a `Grid` next to the data grid | `QueueStatsCard` stacked above the card list |

### Permission Mapping

| Component/Route | Required Permission | Source |
|-----------------|---------------------|--------|
| `/cron` page | `CRON_MANAGE` | `requirePermissionForPage([AppPermission.CRON_MANAGE])` |
| `CronManagementView` (client) | `CRON_MANAGE` | Apollo resolvers enforce server-side; client defense-in-depth via `<RequirePermission permission={[AppPermission.CRON_MANAGE]}>` wrapper |
| `cronScheduleCreate/Update/Delete/Pause/Resume` mutations | `CRON_MANAGE` | Pothos scope-auth (`requirePermissionForPage` analogue) |
| `cronRunTrigger` mutation | `CRON_MANAGE` | Same |

---

## Non-Functional Requirements

### Performance

- WHEN a single ticker tick fires THEN `CronService.dispatchDueSchedules` SHALL process up to `CRON_QUEUE_MAX_BATCH` (default 25) schedules in one tick and leave the rest for the next tick within `maxDuration = 300s`.
- WHEN `cronSchedules` / `cronRuns` GraphQL queries paginate THEN the system SHALL return 25 rows per page by default and respect cursor pagination.

### Security

- WHEN an unauthenticated or non-`CRON_MANAGE` request hits the GraphQL mutations THEN Pothos scope-auth SHALL reject with `permissionDenied` (matches existing `permissions.pothos.ts`).
- WHEN any API route is invoked without `CRON_SECRET` THEN `verifyCronSecretAuth` SHALL return `401 Unauthorized` (or `500` if env missing in production). No fail-open.
- WHEN a `cron_runs.errorStack` is exposed THEN GraphQL redaction SHALL strip stack traces from non-`CRON_MANAGE` viewers (this phase ships only `CRON_MANAGE`-gated resolvers; the redaction concern is documented for v2).
- WHEN the queue backend is set to a missing library THEN boot SHALL succeed (only the active adapter is loaded) — no startup crash from missing optional deps.

### Usability

- WHEN an admin opens the create dialog THEN a live preview of `nextRunAt` SHALL render next to the `cronExpression` field as the admin types.
- WHEN an admin triggers a run manually THEN a toast SHALL confirm the trigger with the run id.

### Reliability

- WHEN the worker dies mid-job THEN at-least-once delivery SHALL re-queue the job on next ticker (handlers MUST be idempotent per the `JobHandlerRegistry` documentation comment).
- WHEN a stuck run exceeds `timeoutSeconds` without heartbeat THEN the ticker's `reconcileStuckRuns` SHALL mark it `TIMEOUT` and (per `concurrencyPolicy`) the next tick schedules a new run.

---

## Constraints and Assumptions

### Technical Constraints

- Runtime is **Bun** (~/.bun/bin/bun) — pg-boss has been confirmed to run on modern Bun (fixed in [issue #472](https://github.com/timgit/pg-boss/issues/472) — resolved by upgrading Bun).
- Next.js 16 App Router with `cacheComponents` enabled — `export const dynamic = "force-dynamic"` is removed (per the existing cron routes pattern; only `maxDuration` is exported on these routes).
- Vercel Hobby caps at 1 cron/day; Pro/Enterprise allow per-minute with perf-minute precision. The service is designed around the *most restrictive* (Hobby) — the ticker still works there, draining whatever is due.
- Drizzle Push (not migrate) is the only schema-sync path per repo policy.

### Business Constraints

- BullMQ / Redis libraries are optional deps for this phase; ships as `throw NotImplemented` adapters in stub form to keep `bun install` light; fully implemented in follow-up task 15 once pg-boss is validated in production.

### Assumptions

- Existing `@upstash/redis` dependency remains available (used heavily by WhatsApp plan); the BullMQ-Redis adapter can piggy-back on it once implemented.
- `pg-boss` (v12.26) is compatible with the existing Postgres (Drizzle target — verified in research).
- The `CRON_MANAGE` permission will be granted to the existing `super_admin` and `academy_admin` permission groups via the existing seed flow (handled in the implementation phase; not a schema migration).

---

## Success Criteria

### Definition of Done

- [ ] All 15 requirements' acceptance criteria are met
- [ ] DB schema pushed via `bun run db push`
- [ ] Pothos schema regenerated via `bun run generate:gqlSchema && bun codegen`
- [ ] API routes return correct responses on a local `bun dev` server with a `CRON_SECRET` set
- [ ] Admin UI at `/cron` renders for a `CRON_MANAGE`-permitted user and shows a created `NOOP` schedule
- [ ] Manual trigger creates a `cron_runs` row that completes (`status = COMPLETED`)
- [ ] AR + EN strings present and used (no hardcoded admin strings)
- [ ] `bun quality-gate` passes with zero errors and zero warnings

### Acceptance Metrics

- Ticker dispatch latency < 50ms per schedule in the claim path (measured in unit tests)
- Admin UI first paint < 1s with the default 25-row page
- All new files pass `tsgo` + `biome:check` + lint-queue with zero errors

---

## Glossary

| Term | Definition |
|------|------------|
| Cron Schedule | A persisted definition in `cron_schedules` — cron expression + job kind + timezone + concurrency policy |
| Cron Run | A single execution attempt of a schedule — a row in `cron_runs` |
| Cron Heartbeat | Periodic `cron_heartbeats` row a worker writes while a run is in flight, used for timeout reconciliation |
| Ticker | The `/api/cron/ticker` route that drains due schedules — the recommended Vercel cron target |
| Queue Adapter | A `CronQueueAdapter`-implementing class wrapping pg-boss / BullMQ / custom SQL |
| Job Handler | A function registered in `JobHandlerRegistry` keyed by `CronJobKind` that processes a dequeued job |
| Concurrency Policy | `ALLOW` (always new), `SKIP` (return existing), `REPLACE` (cancel + new) — decides what a manual trigger does when a run is in flight |
| Trigger Source | The provenance of a run — `VERCEL_TICKER` / `VERCEL_EXPLICIT` / `EXTERNAL` / `MANUAL` / `WORKER_RETRY` |
