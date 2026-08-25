/**
 * Custom-SQL Queue Adapter — implements `CronQueueAdapter` using raw Postgres
 * `SELECT … FOR UPDATE SKIP LOCKED` on a dedicated `cron_queue` table.
 *
 * No external queue library required — uses the project's existing `createPool()`.
 * The `cron_queue` table is auto-created on `init()` (CREATE TABLE IF NOT EXISTS).
 *
 * Race safety: `FOR UPDATE SKIP LOCKED` ensures multiple workers never claim the same job.
 */
import { randomUUID } from "node:crypto";

import { createPool } from "@/backend/db/factory";
import { logger } from "@/backend/lib/logger";
import { safeCronJobKind } from "@/backend/services/cron/cron.helpers";
import { pruneMaps } from "@/backend/services/cron/queue-adapters/bullmq-shared";
import type { CronJobPayload, CronQueueAdapter, CronQueueRow, CronQueueStats, QueryablePool } from "@/backend/types";

/**
 * Adapter-internal table DDL for the custom-SQL queue adapter.
 *
 * This `cron_queue` table is NOT managed by Drizzle migrations — it is an
 * adapter-internal table auto-created via `CREATE TABLE IF NOT EXISTS` on
 * `init()`. It exists solely to hold transient job-queue rows (pending,
 * in-flight, failed) that are consumed and deleted by this adapter. It is
 * not part of the application's Drizzle-managed domain schema in
 * `backend/db/schema/`, and intentionally does not participate in the
 * project's migration or seed workflow.
 */
const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS cron_queue (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    schedule_id TEXT NOT NULL,
    job_kind TEXT NOT NULL,
    payload JSONB,
    attempt INTEGER NOT NULL DEFAULT 0,
    timeout_seconds INTEGER NOT NULL DEFAULT 300,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_backoff_seconds INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'pending',
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_at TIMESTAMPTZ,
    error_message TEXT,
    error_stack TEXT
  );
  CREATE INDEX IF NOT EXISTS cron_queue_status_available_idx
    ON cron_queue (status, available_at)
    WHERE status = 'pending';
`;

/** Type guard: narrows `unknown` to `Record<string, unknown>`. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parse a raw DB row into a typed CronQueueRow. */
function parseCronQueueRow(row: Record<string, unknown>): CronQueueRow {
  return {
    id: String(row.id),
    run_id: String(row.run_id),
    schedule_id: String(row.schedule_id),
    job_kind: String(row.job_kind),
    payload: isRecord(row.payload) ? row.payload : null,
    attempt: Number(row.attempt ?? 0),
    timeout_seconds: Number(row.timeout_seconds ?? 300),
    max_retries: Number(row.max_retries ?? 3),
    retry_backoff_seconds: Number(row.retry_backoff_seconds ?? 60),
  };
}

function genId(): string {
  return `cq_${randomUUID()}`;
}

interface CustomSqlState {
  pool: QueryablePool | null;
  runIdToQueueId: Map<string, string>;
  queueIdToRunId: Map<string, string>;
}

async function ensureInit(state: CustomSqlState): Promise<QueryablePool> {
  if (state.pool) return state.pool;
  const rawPool = createPool();
  if (!rawPool) {
    throw new Error("Cannot initialize CustomSqlAdapter: database pool is null (e.g. SQLite dialect is active)");
  }
  const queryFn = rawPool.query as (
    sql: string,
    params?: unknown[]
  ) => Promise<{ rows?: unknown[]; rowCount?: number | null }>;
  const pool: QueryablePool = {
    query: async (text: string, values?: unknown[]) => {
      const result = await queryFn.call(rawPool, text, values);
      return {
        rows: Array.isArray(result?.rows) ? result.rows.filter(isRecord) : [],
        rowCount: typeof result?.rowCount === "number" ? result.rowCount : (result?.rows?.length ?? 0),
      };
    },
    end: async () => {
      await rawPool.end();
    },
  };
  state.pool = pool;
  await pool.query(CREATE_TABLE_SQL);
  logger.info("cron.customSql.initialized", {});
  return pool;
}

function trackRunId(state: CustomSqlState, runId: string, queueId: string): void {
  state.runIdToQueueId.set(runId, queueId);
  state.queueIdToRunId.set(queueId, runId);
}

function untrackQueueId(state: CustomSqlState, queueId: string): void {
  const runId = state.queueIdToRunId.get(queueId);
  if (runId) {
    state.runIdToQueueId.delete(runId);
    state.queueIdToRunId.delete(queueId);
  }
}

function pruneState(state: CustomSqlState): void {
  pruneMaps(state.runIdToQueueId, state.queueIdToRunId, (_runId, queueId) => queueId, "cron.customSql.mapPruned");
}

async function sendJob(state: CustomSqlState, job: CronJobPayload): Promise<string> {
  const p = await ensureInit(state);
  const id = genId();
  await p.query(
    `INSERT INTO cron_queue (id, run_id, schedule_id, job_kind, payload, attempt, timeout_seconds, max_retries, retry_backoff_seconds, status, available_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', now())`,
    [
      id,
      job.runId,
      job.scheduleId,
      job.jobKind,
      JSON.stringify(job.payload ?? null),
      job.attempt,
      job.timeoutSeconds,
      job.maxRetries ?? 3,
      job.retryBackoffSeconds ?? 60,
    ]
  );
  trackRunId(state, job.runId, id);
  pruneState(state);
  return id;
}

async function fetchJobs(state: CustomSqlState, count: number): Promise<CronJobPayload[]> {
  const p = await ensureInit(state);
  const result = await p.query(
    `WITH claimed AS (
       SELECT id, run_id, schedule_id, job_kind, payload, attempt, timeout_seconds, max_retries, retry_backoff_seconds
       FROM cron_queue
       WHERE status = 'pending' AND available_at <= now()
       ORDER BY available_at
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     )
     UPDATE cron_queue
     SET status = 'in_flight', locked_at = now()
     FROM claimed
     WHERE cron_queue.id = claimed.id
     RETURNING claimed.id, claimed.run_id, claimed.schedule_id, claimed.job_kind, claimed.payload, claimed.attempt, claimed.timeout_seconds, claimed.max_retries, claimed.retry_backoff_seconds`,
    [count]
  );
  const rows = (result.rows ?? []).map(parseCronQueueRow);
  for (const r of rows) {
    trackRunId(state, r.run_id, r.id);
  }
  pruneState(state);
  return rows.map(r => ({
    runId: r.run_id,
    scheduleId: r.schedule_id,
    jobKind: safeCronJobKind(r.job_kind),
    payload: r.payload ?? null,
    attempt: r.attempt,
    timeoutSeconds: r.timeout_seconds,
    queueJobId: r.id,
    maxRetries: r.max_retries,
    retryBackoffSeconds: r.retry_backoff_seconds,
  }));
}

async function completeJob(state: CustomSqlState, jobId: string): Promise<void> {
  const p = await ensureInit(state);
  await p.query(`DELETE FROM cron_queue WHERE id = $1`, [jobId]);
  untrackQueueId(state, jobId);
}

async function failJob(state: CustomSqlState, jobId: string, error: string, stack?: string | null): Promise<void> {
  const p = await ensureInit(state);
  await p.query(
    `UPDATE cron_queue SET status = 'failed', error_message = $2, error_stack = $3, locked_at = NULL WHERE id = $1`,
    [jobId, error, stack ?? null]
  );
  untrackQueueId(state, jobId);
}

async function retryJob(
  state: CustomSqlState,
  jobId: string,
  delaySeconds: number,
  newAttempt?: number
): Promise<void> {
  const p = await ensureInit(state);
  await p.query(
    `UPDATE cron_queue
     SET status = 'pending', available_at = now() + make_interval(0, 0, 0, 0, 0, 0, LEAST(GREATEST($1, 0), 86400)), locked_at = NULL, attempt = $3
     WHERE id = $2`,
    [delaySeconds, jobId, newAttempt ?? 0]
  );
}

async function getStats(state: CustomSqlState): Promise<CronQueueStats> {
  const p = await ensureInit(state);
  const result = await p.query(
    `SELECT job_kind, status, COUNT(*)::TEXT as count
     FROM cron_queue
     GROUP BY job_kind, status`
  );
  const stats: CronQueueStats = {
    backend: "custom-sql",
    pending: 0,
    inFlight: 0,
    failed: 0,
    byJobKind: {},
  };
  for (const row of result.rows ?? []) {
    const jobKind = String(row.job_kind);
    const status = String(row.status);
    const count = Number.parseInt(String(row.count), 10);
    if (!stats.byJobKind[jobKind]) {
      stats.byJobKind[jobKind] = { pending: 0, inFlight: 0, failed: 0 };
    }
    if (status === "pending") {
      stats.pending += count;
      stats.byJobKind[jobKind].pending += count;
    } else if (status === "in_flight") {
      stats.inFlight += count;
      stats.byJobKind[jobKind].inFlight += count;
    } else if (status === "failed") {
      stats.failed += count;
      stats.byJobKind[jobKind].failed += count;
    }
  }
  return stats;
}

export function createCustomSqlAdapter(): CronQueueAdapter {
  const state: CustomSqlState = {
    pool: null,
    runIdToQueueId: new Map(),
    queueIdToRunId: new Map(),
  };

  return {
    async init() {
      await ensureInit(state);
    },

    async send(job) {
      return sendJob(state, job);
    },

    async fetch({ count }) {
      return fetchJobs(state, count);
    },

    async complete(jobId) {
      await completeJob(state, jobId);
    },

    async fail(jobId, _error, _stack) {
      await failJob(state, jobId, _error, _stack);
    },

    async retry(jobId, delaySeconds, newAttempt) {
      await retryJob(state, jobId, delaySeconds, newAttempt);
    },

    async getQueueStats() {
      return getStats(state);
    },

    async shutdown() {
      if (state.pool) {
        await state.pool.end();
        state.pool = null;
      }
      state.runIdToQueueId.clear();
      state.queueIdToRunId.clear();
    },
  };
}
