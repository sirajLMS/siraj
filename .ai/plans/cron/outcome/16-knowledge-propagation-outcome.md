# Outcome: Task 16 — Knowledge Propagation & Documentation

## Status: DONE

## What Was Done

### 1. Created canonical reference document
- **File**: `docs/services/cron-service.md`
- Covers: queue-adapter factory pattern, custom-sql race-safe claiming, idempotent dispatch, hybrid trigger model (Vercel ticker + manual), cron expression engine usage, concurrency policy, worker runtime, job handler registry, GraphQL API, API routes, admin UI architecture, environment configuration, database schema, testing guidelines.

### 2. Updated AGENTS.md files

- **Root** `AGENTS.md`: Added `docs/services/cron-service.md` to the "Important References" section.
- **Backend** `backend/AGENTS.md`: Added bullet to Service Layer section pointing to `docs/services/cron-service.md`.
- **Services** `backend/services/AGENTS.md`: Added full "Cron Service" section with rules covering pluggable queue backends, hybrid trigger model, idempotent dispatch, concurrency policy, worker runtime, and handler registry pattern.

### 3. Conventions Documented
- Queue adapter factory: lazy loading via `await import(...)` with static module paths, env config resolution with 3-tier fallback.
- Idempotent dispatch: atomic claim by advancing `nextRunAt` before enqueueing; handlers MUST be idempotent (REQ-7).
- Hybrid trigger: Vercel ticker (`/api/cron/ticker`) + manual trigger (`cronRunTrigger` mutation / `/api/cron/execute` route).
- Concurrency policy: `ALLOW`, `REPLACE`, `SKIP` enforced in `CronService.dispatchScheduleById()`.
- Worker runtime: `runDrainLoop()` with heartbeat, retry, maxRetries exhaustion, and deadline safety.
- Handler registry: `JobHandlerRegistry` maps `CronJobKind` → handler; `NOOP` auto-registered; unregistered kinds fail the run.
- Admin UI: standard mobile/desktop tier-isolated pattern with container/viewModel/types/desktop/mobile structure.
- Instruction file update: `.agents/instructions/backend.instructions.md` received a new "### Cron Service Conventions" section (Round 4) documenting the queue adapter factory pattern, lazy import exception, scope-auth on cron mutations, concurrency policy handling, run lifecycle methods, cron worker entry point, and typed errors.

### 4. Verification
- `bun run tsgo` — Zero cron errors (verified after Phase 5 adapter fixes).
- Pre-existing chatwoot and vitest.config.ts errors are NOT caused by cron changes.

## Notes
- `backend/AGENTS.md` update was a single bullet in the Service Layer section per plan, rather than a separate services index section.
- Root `AGENTS.md` update was added to the "Important References" list.
- `.agents/instructions/backend.instructions.md` was updated (Round 4) with a new "### Cron Service Conventions" section covering: queue adapter factory pattern, lazy import exception, scope-auth on cron mutations, concurrency policy handling, run lifecycle methods, cron worker entry point, and typed errors.
