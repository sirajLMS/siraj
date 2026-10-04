/**
 * pg-boss Queue Adapter — implements `CronQueueAdapter` against pg-boss v12.26+.
 *
 * Uses the project's existing `createPool()` to get a raw `pg.Pool` (NOT Drizzle db,
 * NOT Neon HTTP client). pg-boss manages its own schema (`pgboss.*` tables).
 *
 * Neon constraint: If the pool is a `@neondatabase/serverless` Pool with a `-pooler`
 * hostname, LISTEN/NOTIFY breaks under PgBouncer transaction-mode pooling.
 * The adapter sets `useListenNotify: false` (poller-only mode) and logs a warning.
 *
 * State is closure-scoped inside `createPgBossAdapter()` so that
 * `resetQueueAdapterFactory()` can produce a fresh, independent adapter instance.
 * Behavior lives in `pgboss.adapter.state.ts` / `pgboss.adapter.operations.ts`;
 * this module wires the state to the adapter contract.
 */
import {
  completePgBossJob,
  failPgBossJob,
  getPgBossQueueStats,
  retryPgBossJob,
  shutdownPgBossAdapter,
} from "@/backend/services/cron/queue-adapters/pgboss.adapter.operations";
import {
  createPgBossState,
  fetchPgBossJobs,
  initPgBossAdapter,
  sendPgBossJob,
} from "@/backend/services/cron/queue-adapters/pgboss.adapter.state";
import type { CronQueueAdapter } from "@/backend/types";

export function createPgBossAdapter(): CronQueueAdapter {
  const state = createPgBossState();

  return {
    init: () => initPgBossAdapter(state),
    send: job => sendPgBossJob(state, job),
    fetch: ({ count }) => fetchPgBossJobs(state, count),
    complete: jobId => completePgBossJob(state, jobId),
    fail: (jobId, error, stack) => failPgBossJob(state, jobId, error, stack),
    retry: (jobId, delaySeconds, newAttempt) => retryPgBossJob(state, jobId, delaySeconds, newAttempt),
    getQueueStats: () => getPgBossQueueStats(state),
    shutdown: () => shutdownPgBossAdapter(state),
  };
}
