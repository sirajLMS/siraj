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
import { pruneMaps } from "@/backend/services/cron/queue-adapters/bullmq-shared";
import type { CronJobPayload, CronQueueAdapter, CronQueueRow, CronQueueStats } from "@/backend/types/cron/cron.types";
import { safeCronJobKind } from "@/backend/types/cron/cron.types";

/**
 * Adapter-internal interface for a pg-compatible connection pool.
 * Used to type the pool returned by `createPool()` without coupling to `pg` types directly.
 */
interface QueryablePool {
  query(text: string, values?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }>;
  end(): Promise<void>;
}

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

function genId(): string {
  return `cq_${randomUUID()}`;
}

export function createCustomSqlAdapter(): CronQueueAdapter {
  let pool: QueryablePool | null = null;
  const runIdToQueueId = new Map<string, string>();
  const queueIdToRunId = new Map<string, string>();

  async function ensureInit(): Promise<QueryablePool> {
    if (pool) return pool;
    pool = createPool();
    await pool.query(CREATE_TABLE_SQL);
    logger.info("cron.customSql.initialized", {});
    return pool;
  }

  return {
    async init() {
      await ensureInit();
    },

    async send(job) {
      const p = await ensureInit();
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
      runIdToQueueId.set(job.runId, id);
      queueIdToRunId.set(id, job.runId);
      pruneMaps(runIdToQueueId, queueIdToRunId, (_runId, queueId) => queueId, "cron.customSql.mapPruned");
      return id;
    },

    async fetch({ count }) {
      const p = await ensureInit();
      const result = await p.query<CronQueueRow>(
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
      const rows = result.rows ?? [];
      for (const r of rows) {
        runIdToQueueId.set(r.run_id, r.id);
        queueIdToRunId.set(r.id, r.run_id);
      }
      pruneMaps(runIdToQueueId, queueIdToRunId, (_runId, queueId) => queueId, "cron.customSql.mapPruned");
      const payloads: CronJobPayload[] = rows.map(r => {
        return {
          runId: r.run_id,
          scheduleId: r.schedule_id,
          jobKind: safeCronJobKind(r.job_kind),
          payload: r.payload ?? null,
          attempt: r.attempt,
          timeoutSeconds: r.timeout_seconds,
          queueJobId: r.id,
          maxRetries: r.max_retries,
          retryBackoffSeconds: r.retry_backoff_seconds,
        };
      });
      return payloads;
    },

    async complete(jobId) {
      const p = await ensureInit();
      await p.query(`DELETE FROM cron_queue WHERE id = $1`, [jobId]);
      const runId = queueIdToRunId.get(jobId);
      if (runId) {
        runIdToQueueId.delete(runId);
        queueIdToRunId.delete(jobId);
      }
    },

    async fail(jobId, _error, _stack) {
      const p = await ensureInit();
      await p.query(
        `UPDATE cron_queue SET status = 'failed', error_message = $2, error_stack = $3, locked_at = NULL WHERE id = $1`,
        [jobId, _error, _stack ?? null]
      );
      const runId = queueIdToRunId.get(jobId);
      if (runId) {
        runIdToQueueId.delete(runId);
        queueIdToRunId.delete(jobId);
      }
    },

    async retry(jobId, delaySeconds, newAttempt) {
      const p = await ensureInit();
      await p.query(
        `UPDATE cron_queue
         SET status = 'pending', available_at = now() + make_interval(0, 0, 0, 0, 0, 0, LEAST(GREATEST($1, 0), 86400)), locked_at = NULL, attempt = $3
         WHERE id = $2`,
        [delaySeconds, jobId, newAttempt ?? 0]
      );
    },

    async getQueueStats() {
      const p = await ensureInit();
      const result = await p.query<{ job_kind: string; status: string; count: string }>(
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
        const count = Number.parseInt(row.count, 10);
        if (!stats.byJobKind[row.job_kind]) {
          stats.byJobKind[row.job_kind] = { pending: 0, inFlight: 0, failed: 0 };
        }
        if (row.status === "pending") {
          stats.pending += count;
          stats.byJobKind[row.job_kind].pending += count;
        } else if (row.status === "in_flight") {
          stats.inFlight += count;
          stats.byJobKind[row.job_kind].inFlight += count;
        } else if (row.status === "failed") {
          stats.failed += count;
          stats.byJobKind[row.job_kind].failed += count;
        }
      }
      return stats;
    },

    async shutdown() {
      if (pool) {
        await pool.end();
        pool = null;
      }
      runIdToQueueId.clear();
      queueIdToRunId.clear();
    },
  };
}
