# Cron Service — Pattern Reference

> Canonical reference for the Siraj cron service system. Covers the queue-adapter factory, idempotent dispatch, hybrid trigger model, cron expression engine, and the admin UI architecture.

## Architecture Overview

The cron service provides scheduled job execution with a pluggable queue backend. It follows the standard layered architecture:

```
Admin UI → GraphQL Mutation → CronService → CronRepository → PostgreSQL
                                    ↓
                            QueueAdapter → pg-boss / custom-sql / bullmq
                                    ↓
                            Worker Runtime → JobHandlerRegistry → Handler
```

## Hybrid Trigger Model

The system uses a **hybrid trigger model**:

1. **Vercel Cron Ticker** (`app/api/cron/ticker/route.ts`) — A Vercel-scheduled GET endpoint that fires every minute. It calls `CronService.dispatchDueSchedules()` to find all schedules whose `nextRunAt <= now()`, claims them idempotently, enqueues jobs to the queue adapter, then runs `runDrainLoop()` to process a batch within the 300s `maxDuration`.

2. **Manual Trigger** (`app/api/cron/execute/route.ts` + GraphQL `cronRunTrigger` mutation) — Admins can manually fire a schedule immediately. The manual trigger creates a run with `CronTriggerSource.VERCEL_EXPLICIT` and dispatches it to the queue.

Both paths go through `CronService.dispatchScheduleById()` which enforces the concurrency policy.

## Queue Adapter Factory

**Location**: `backend/services/cron/queue-adapter.factory.ts`

The factory resolves the active queue backend from environment configuration (`CRON_QUEUE_BACKEND`) with a 3-tier fallback:

1. `resolveEnvConfig("CRON_QUEUE_BACKEND")` — DB-overridable, 5min TTL cache
2. `process.env.CRON_QUEUE_BACKEND`
3. Default: `PG_BOSS`

Adapters are loaded **lazily** via `await import(...)` so optional dependencies (pg-boss, bullmq) are only loaded when their backend is active. Import paths are static strings for bundler analysis.

### Available Backends

| Backend | Adapter File | Status | Dependencies |
|---------|-------------|--------|--------------|
| `PG_BOSS` (default) | `pgboss.adapter.ts` | ✅ Full | `pg-boss` |
| `CUSTOM_SQL` | `custom-sql.adapter.ts` | ✅ Full | None (uses existing Postgres pool) |
| `BULLMQ_POSTGRES` | `bullmq-pg.adapter.ts` | 🔧 Scaffolded | `bullmq` (optional) |
| `BULLMQ_REDIS` | `bullmq-redis.adapter.ts` | 🔧 Scaffolded | `bullmq` + `ioredis` |

### Adapter Contract

All adapters implement `CronQueueAdapter` from `@/backend/types/cron/cron.types`:

```typescript
type CronQueueAdapter = {
  init(): Promise<void>;
  send(job: CronJobPayload): Promise<string>;
  fetch(opts: { count: number }): Promise<CronJobPayload[]>;
  complete(jobId: string): Promise<void>;
  fail(jobId: string, error: string, stack?: string): Promise<void>;
  retry(jobId: string, delaySeconds: number): Promise<void>;
  getQueueStats(): Promise<CronQueueStats>;
  shutdown(): Promise<void>;
};
```

### Custom-SQL Adapter

The `CUSTOM_SQL` backend uses raw Postgres `SELECT ... FOR UPDATE SKIP LOCKED` on a dedicated `cron_queue` table (auto-created on `init()`). No external queue library required. Race safety is guaranteed by `FOR UPDATE SKIP LOCKED` — multiple workers never claim the same job.

## Idempotent Dispatch Pattern

`CronService.dispatchDueSchedules()` uses an idempotent claim pattern to prevent duplicate job execution:

1. Query schedules with `status = 'ACTIVE' AND nextRunAt <= now()`
2. Atomically claim each schedule by updating `nextRunAt` to the next computed occurrence (via `cron-scheduler.engine.ts`)
3. Only the first claimant proceeds; concurrent tickers see the updated `nextRunAt` and skip
4. Create a `cron_runs` row with `status = 'PENDING'` and `triggerSource`
5. Send the job payload to the queue adapter

This pattern ensures that even if two ticker invocations overlap, each schedule is dispatched at most once per occurrence.

## Cron Expression Engine

**Location**: `backend/services/cron/cron-scheduler.engine.ts`

Uses `cron-parser` v5 (`CronExpressionParser.parse(expr, options)`) for expression validation and next-run computation.

Key APIs:
- `validateCronExpression(expr): boolean` — Check if a cron expression is valid
- `nextRunAt(expr, timezone?, from?): Date` — Compute the next run time
- `nextRuns(expr, count, timezone?): Date[]` — Get upcoming run times (for UI preview)

**Note**: `CronDate.toISOString()` returns `string | null` — always null-check the result.

## Concurrency Policy

When a schedule's trigger fires and a previous run is still in-flight, the `CronConcurrencyPolicy` enum determines behavior:

| Policy | Behavior |
|--------|----------|
| `ALLOW` | Queue a new run alongside the existing one |
| `REPLACE` | Cancel/fail the existing run and queue a new one |
| `SKIP` | Skip this trigger; wait for the next scheduled occurrence |

The service delegates concurrency policy enforcement to the repository layer's `CronRepository.claimNextRun()` method, which atomically handles in-flight run conflicts at the database level via `FOR UPDATE SKIP LOCKED` + advisory locks — do NOT add concurrency checks in the service.

## Worker Runtime

**Location**: `backend/services/cron/cron-worker.runtime.ts`

The `runDrainLoop()` function is the worker entry point:

1. `fetch(batch)` — Pull up to `batchSize` jobs from the queue adapter
2. Set runs to `RUNNING`, write heartbeats periodically
3. Invoke the handler via `JobHandlerRegistry.getHandler(jobKind)`
4. On success: `CronService.completeRun()` → status `COMPLETED`
5. On failure: `CronService.failRun()` → status `RETRYING` or `FAILED` (after maxRetries)
6. Catch all handler errors — no unhandled rejection escapes
7. Heartbeat interval: `Math.min(60_000, timeoutSeconds / 4)`
8. Deadline safety: stop with 30s margin to `maxDuration`

## Job Handler Registry

**Location**: `backend/services/cron/job-handler-registry.ts`

A singleton registry that maps `CronJobKind` to handler functions:

```typescript
registry.register(CronJobKind.NOOP, async (job) => { ... });
registry.getHandler(CronJobKind.NOOP); // → handler | undefined
```

The `NOOP` handler is auto-registered on first access. If no handler is found for a job kind, the worker marks the run as `FAILED` with `errorMessage = "No handler registered for jobKind=<X>"`.

**Idempotency Contract** (REQ-7): All handlers MUST be idempotent. The system may retry a job after a transient failure, so handlers must safely handle duplicate execution.

## GraphQL API

**Location**: `backend/graphql/pothos/cron/cron.pothos.ts`

### Queries
- `cronSchedules(input)` — Paginated list of schedules (filter by status, jobKind)
- `cronRuns(input)` — Paginated list of runs (filter by scheduleId, status, date range)
- `cronQueueStats` — Queue statistics (pending, in-flight, failed, by job kind)

### Mutations
- `cronScheduleCreate(input)` — Create a new schedule
- `cronScheduleUpdate(id, input)` — Update an existing schedule
- `cronSchedulePause(id)` — Pause a schedule (set status to `PAUSED`)
- `cronScheduleResume(id)` — Resume a paused schedule (set status to `ACTIVE`)
- `cronScheduleDelete(input)` — Delete a schedule (soft by default, hard if `hard: true`)
- `cronRunTrigger(input)` — Manually trigger a schedule to run immediately

All mutations require `AppPermission.CRON_MANAGE` and `notImpersonating: true` auth scopes.

Note: `createdByUserId` and `updatedByUserId` are populated from `ctx.user.id` in the resolver — not from user input.

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/cron/ticker` | GET | `CRON_SECRET` bearer | Vercel cron ticker — dispatches due schedules and runs drain loop |
| `/api/cron/execute` | POST | `CRON_SECRET` bearer | Manual execution trigger |

Both routes use `verifyCronSecretAuth(request)` from `@/backend/lib/cron-auth` and set `maxDuration = 300`.

## Admin UI Architecture

The cron admin UI follows the standard mobile/desktop tier-isolation pattern:

### Structure
```
app/(dashboard)/cron/page.tsx                     — Server Component (auth guard)
frontend/common/views/dashboard/cron/
  CronPageContainer.tsx                            — View switcher (RequirePermission + ResponsiveViewSwitch)
  useCronViewModel.tsx                             — ViewModel (Apollo hooks, labels, handlers)
  types.ts                                         — View prop types (CronViewProps)
frontend/desktop/views/dashboard/cron/
  cronView.desktop.tsx                             — Desktop tier (DesktopAppDataGrid)
frontend/mobile/views/dashboard/cron/
  cronView.mobile.tsx                              — Mobile tier (MobileCardList)
```

### Key Patterns

1. **Container** wraps in `RequirePermission` + `createLazyView` + `ResponsiveViewSwitch`
2. **ViewModel** uses `useAppTranslation(Translation.Dashboard.Cron)` for labels, `useQuery`/`useMutation` from `@apollo/client/react` for data
3. **Desktop/Mobile views** receive `Readonly<CronViewProps>` — they never call `useAppTranslation` directly
4. **Page route** uses `getServerUserContext()` + `requirePermissionForPage([AppPermission.CRON_MANAGE])` + `generateMetadata()` with localized title

### i18n
- Labels: `shared/locale/types/dashboard/cron.ts` (CronLabels interface)
- Translations: `shared/locale/en/dashboard/cron/main.ts` and `shared/locale/ar/dashboard/cron/main.ts`
- Namespace: `shared/locale/namespaces/dashboard/cron/main.namespace.ts`
- Access: `useAppTranslation(Translation.Dashboard.Cron)` in client components, `getServerTranslations(locale).dashboardTranslations.cron` in server components

## Environment Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `CRON_QUEUE_BACKEND` | `PG_BOSS` | Active queue backend |
| `CRON_SECRET` | (required) | Bearer token for API route auth |
| `CRON_TICKER_SCHEDULE` | `* * * *` | Vercel cron schedule for ticker |
| `CRON_QUEUE_MAX_BATCH` | `25` | Maximum jobs fetched per drain cycle |
| `CRON_QUEUE_WORKER_CONCURRENCY` | `1` | Number of parallel drain workers (reserved for future use) |

## Database Schema

Four tables in `backend/db/schema/cron/cron.ts`:

1. **`cron_schedules`** — Schedule definitions (expression, job kind, status, concurrency policy, retry config)
2. **`cron_runs`** — Execution history (status, timestamps, durations, error info)
3. **`cron_heartbeats`** — Per-run heartbeat records for stuck-run reconciliation
4. **`cron_queue`** — Custom-SQL adapter queue table (auto-created at runtime, not a Drizzle-managed table)

Six PG enums: `cron_schedule_status`, `cron_run_status`, `cron_job_kind`, `cron_trigger_source`, `cron_concurrency_policy`, `cron_queue_backend`.

## Testing

- Repository tests: `backend/db/test/repo/cron/` — Run via `bun run test:db`
- Service tests: `backend/services/cron/test/` — Run via `bun run test:services`
- API route tests: `app/api/cron/*/route.test.ts` — Mirror `class-reminders/route.test.ts` patterns
- Always use `runInRollback` wrapper for database tests
