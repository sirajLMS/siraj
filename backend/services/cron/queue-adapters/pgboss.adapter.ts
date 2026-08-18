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
 */

import { type Job, PgBoss, type SendOptions } from "pg-boss";
import { createPool } from "@/backend/db/factory";
import { DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { CronQueueBackendNotAvailable, safeCronJobKind } from "@/backend/services/cron/cron.helpers";
import { computeHeartbeatSeconds } from "@/backend/services/cron/cron-heartbeat.utils";
import { formatError } from "@/backend/services/cron/cron-utils";
import { pruneMaps } from "@/backend/services/cron/queue-adapters/bullmq-shared";
import type { CronJobPayload, CronQueueAdapter, CronQueueStats } from "@/backend/types";

const QUEUE_NAME_PREFIX = "cron_";

function getQueueName(jobKind: string): string {
  return `${QUEUE_NAME_PREFIX}${jobKind}`;
}

/**
 * Determine whether LISTEN/NOTIFY should be disabled for pg-boss.
 *
 * Resolution order:
 *  1. Explicit env flag `CRON_QUEUE_DISABLE_LISTEN_NOTIFY` — if set to a truthy
 *     value (`"1"`, `"true"`), LISTEN/NOTIFY is disabled immediately.
 *  2. Implicit detection via `DATABASE_URL` substring sniffing — if the URL contains
 *     `-pooler` (Neon pooler hostname) and `neon`, or `pgbouncer=true`, we assume
 *     PgBouncer transaction-mode pooling which breaks LISTEN/NOTIFY.
 *
 * The implicit sniffing may produce false positives if an unrelated URL substring
 * matches, which is why the explicit env flag is checked first. Deployments that
 * want to force-enable LISTEN/NOTIFY despite pooling (e.g. direct-mode over a proxy
 * with `-pooler` in the hostname) can set `CRON_QUEUE_DISABLE_LISTEN_NOTIFY=false`.
 */
function shouldDisableListenNotify(): boolean {
  // 1. Explicit env flag takes precedence
  const explicitFlag = process.env.CRON_QUEUE_DISABLE_LISTEN_NOTIFY;
  if (explicitFlag !== undefined) {
    const isDisabled = explicitFlag === "1" || explicitFlag.toLowerCase() === "true";
    if (isDisabled) {
      logger.warn("cron.pgboss.listenNotify.disabled", {
        reason: "CRON_QUEUE_DISABLE_LISTEN_NOTIFY env flag is set",
      });
      return true;
    }
    // Explicitly enabled — skip implicit sniffing
    return false;
  }

  // 2. Implicit detection via DATABASE_URL substring sniffing
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isPooler = dbUrl.includes("-pooler") || dbUrl.includes("pgbouncer=true");
  const isNeon = dbUrl.includes("neon");
  if (isPooler && isNeon) {
    logger.warn("cron.pgboss.listenNotify.disabled", {
      reason: "Neon -pooler hostname or PgBouncer detected; LISTEN/NOTIFY breaks under transaction-mode pooling",
    });
    return true;
  }
  return false;
}

/**
 * Closure-scoped mutable state shared across all adapter methods.
 * Created inside `createPgBossAdapter` so each call produces an independent instance.
 */
interface PgBossState {
  boss: PgBoss | null;
  started: boolean;
  knownQueues: Set<string>;
  jobIdToPayload: Map<string, CronJobPayload>;
  jobIdToQueue: Map<string, string>;
}

async function ensureStarted(state: PgBossState): Promise<PgBoss> {
  if (state.boss && state.started) return state.boss;

  const pool = createPool();
  const bossOptions: Record<string, unknown> = { db: pool };
  if (shouldDisableListenNotify()) {
    bossOptions.useListenNotify = false;
  }

  state.boss = new PgBoss(bossOptions);
  state.boss.on("error", (err: Error) => {
    logger.error("cron.queue.pgboss.error", { message: err.message, stack: err.stack });
  });

  try {
    await state.boss.start();
    state.started = true;
    logger.info("cron.pgboss.started", { useListenNotify: !bossOptions.useListenNotify });
  } catch (err) {
    logger.error("cron.pgboss.start.failed", {
      message: formatError(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    state.boss = null;
    state.started = false;
    throw new CronQueueBackendNotAvailable(`Failed to start pg-boss: ${formatError(err)}`);
  }
  return state.boss;
}

async function ensureQueue(
  state: PgBossState,
  b: PgBoss,
  jobKind: string,
  opts?: { maxRetries?: number; retryBackoffSeconds?: number; timeoutSeconds?: number }
): Promise<string> {
  const name = getQueueName(jobKind);
  if (state.knownQueues.has(name)) return name;

  const maxRetries = opts?.maxRetries ?? 3;
  const retryBackoffSeconds = opts?.retryBackoffSeconds ?? 60;
  const timeoutSeconds = opts?.timeoutSeconds ?? 300;

  await b.createQueue(name, {
    retryLimit: maxRetries,
    retryDelay: retryBackoffSeconds,
    retryBackoff: true,
    expireInSeconds: timeoutSeconds,
    heartbeatSeconds: computeHeartbeatSeconds(timeoutSeconds),
    deadLetter: `${name}__dlq`,
  });
  state.knownQueues.add(name);
  return name;
}

function pruneState(state: PgBossState): void {
  pruneMaps(state.jobIdToPayload, state.jobIdToQueue, (_payload, jid) => jid, "cron.pgboss.mapPruned");
}

/**
 * Adapter-internal shape of the `data` payload on a raw pg-boss fetched
 * job. Used as the generic type argument to `b.fetch<T>()` so the return
 * value is already typed.
 */
type FetchedJobData = {
  runId: string;
  scheduleId: string;
  jobKind: string;
  payload: Record<string, unknown> | null;
  attempt: number;
  timeoutSeconds: number;
  maxRetries?: number;
  retryBackoffSeconds?: number;
};

/** Adapter-internal: per-queue result of the fan-out `fetch` call. */
type FetchedBatch = { name: string; jobs: Job<FetchedJobData>[] | null };

async function fetchFromQueues(state: PgBossState, b: PgBoss, count: number): Promise<CronJobPayload[]> {
  const queues = state.knownQueues.size > 0 ? [...state.knownQueues] : [];
  if (queues.length === 0) return [];

  const batchPerQueue = Math.max(1, Math.ceil(count / queues.length));

  const batchResults: FetchedBatch[] = await Promise.all(
    queues.map(async name => {
      try {
        const raw = await b.fetch<FetchedJobData>(name, { batchSize: batchPerQueue });
        return { name, jobs: raw };
      } catch (err) {
        logger.warn("cron.pgboss.fetch.failed", { queue: name, error: formatError(err) });
        return { name, jobs: null };
      }
    })
  );

  const results: CronJobPayload[] = [];
  for (const { name, jobs } of batchResults) {
    if (jobs) {
      const jobArray = Array.isArray(jobs) ? jobs : [jobs];
      for (const j of jobArray) {
        const data: CronJobPayload = {
          runId: j.data.runId,
          scheduleId: j.data.scheduleId,
          jobKind: safeCronJobKind(j.data.jobKind),
          payload: j.data.payload,
          attempt: j.data.attempt,
          timeoutSeconds: j.data.timeoutSeconds,
          queueJobId: j.id,
          maxRetries: j.data.maxRetries,
          retryBackoffSeconds: j.data.retryBackoffSeconds,
        };
        state.jobIdToQueue.set(j.id, name);
        state.jobIdToPayload.set(j.id, data);
        results.push(data);
      }
    }
  }
  return results.slice(0, count);
}

function completeKnownQueue(state: PgBossState, b: PgBoss, jobId: string, queueName: string): void | Promise<void> {
  return (async () => {
    try {
      await b.complete(queueName, [jobId]);
    } catch (err) {
      logger.warn("cron.pgboss.complete.failed", { jobId, queueName, error: formatError(err) });
    }
    state.jobIdToPayload.delete(jobId);
    state.jobIdToQueue.delete(jobId);
    pruneState(state);
  })();
}

async function completeFallback(state: PgBossState, b: PgBoss, jobId: string): Promise<void> {
  await Promise.all(
    [...state.knownQueues].map(async q => {
      try {
        await b.complete(q, [jobId]);
      } catch (err) {
        logger.debug("cron.pgboss.complete.fallbackMiss", { jobId, queue: q, error: formatError(err) });
      }
    })
  );
  state.jobIdToPayload.delete(jobId);
  state.jobIdToQueue.delete(jobId);
  pruneState(state);
  logger.warn("cron.pgboss.complete.queueNotFound", { jobId, knownQueues: [...state.knownQueues] });
}

async function failKnownQueue(
  _state: PgBossState,
  b: PgBoss,
  jobId: string,
  queueName: string,
  failData: { message: string; stack: string | null }
): Promise<void> {
  try {
    await b.fail(queueName, [jobId], failData);
  } catch (err) {
    logger.warn("cron.pgboss.fail.failed", { jobId, queueName, error: formatError(err) });
  }
}

async function failFallback(
  state: PgBossState,
  b: PgBoss,
  jobId: string,
  failData: { message: string; stack: string | null }
): Promise<void> {
  await Promise.all(
    [...state.knownQueues].map(async q => {
      try {
        await b.fail(q, [jobId], failData);
      } catch (err) {
        logger.debug("cron.pgboss.fail.fallbackMiss", { jobId, queue: q, error: formatError(err) });
      }
    })
  );
  logger.warn("cron.pgboss.fail.queueNotFound", { jobId, knownQueues: [...state.knownQueues] });
}

async function retryKnownQueue(
  state: PgBossState,
  b: PgBoss,
  jobId: string,
  queueName: string,
  originalPayload: CronJobPayload,
  delaySeconds: number,
  newAttempt?: number
): Promise<void> {
  try {
    await b.complete(queueName, jobId);
    const nextAttempt = newAttempt ?? originalPayload.attempt + 1;
    const { queueJobId: _omit, ...sendData } = { ...originalPayload, attempt: nextAttempt };
    const newJobId = await b.send(queueName, sendData, { startAfter: delaySeconds } as SendOptions);
    if (newJobId) {
      state.jobIdToPayload.set(newJobId, { ...originalPayload, attempt: nextAttempt });
      state.jobIdToQueue.set(newJobId, queueName);
    } else {
      logger.warn("cron.pgboss.retry.sendReturnedNull", { jobId, queueName });
    }
  } catch (err) {
    logger.warn("cron.pgboss.retry.failed", { jobId, queueName, error: formatError(err) });
  }
}

async function collectQueueStats(state: PgBossState, b: PgBoss): Promise<CronQueueStats> {
  const stats: CronQueueStats = { backend: "pgboss", pending: 0, inFlight: 0, failed: 0, byJobKind: {} };
  const queueNames = [...state.knownQueues];

  await Promise.all(
    queueNames.map(async name => {
      try {
        await b.createQueue(name);
      } catch (err) {
        logger.warn("cron.pgboss.getQueueStats.ensureQueue.failed", { queue: name, error: formatError(err) });
      }
    })
  );

  const queueStatsResults = await Promise.all(
    queueNames.map(async name => {
      try {
        const qsArray = await b.getQueueStats(name);
        const qs = qsArray[0];
        if (!qs) return null;
        const jobKind = name.replace(QUEUE_NAME_PREFIX, "");
        const pending = qs.queuedCount + qs.deferredCount + qs.readyCount;
        const inFlight = qs.activeCount;
        const failed = qs.failedCount;
        return { jobKind, pending, inFlight, failed };
      } catch (err) {
        logger.warn("cron.pgboss.getQueueStats.failed", { queue: name, error: formatError(err) });
        return null;
      }
    })
  );

  for (const result of queueStatsResults) {
    if (!result) continue;
    const { jobKind, pending, inFlight, failed } = result;
    stats.pending += pending;
    stats.inFlight += inFlight;
    stats.failed += failed;
    stats.byJobKind[jobKind] = { pending, inFlight, failed };
  }
  return stats;
}

export function createPgBossAdapter(): CronQueueAdapter {
  const state: PgBossState = {
    boss: null,
    started: false,
    knownQueues: new Set(),
    jobIdToPayload: new Map(),
    jobIdToQueue: new Map(),
  };

  return {
    async init() {
      await ensureStarted(state);
    },

    async send(job: CronJobPayload) {
      const b = await ensureStarted(state);
      const name = await ensureQueue(state, b, job.jobKind, {
        maxRetries: job.maxRetries,
        retryBackoffSeconds: job.retryBackoffSeconds,
        timeoutSeconds: job.timeoutSeconds,
      });
      const { queueJobId: _omit, ...sendData } = { ...job };
      const jobId = await b.send(name, sendData);
      if (!jobId) throw new DomainError("CRON_QUEUE_SEND_FAILED", `pg-boss send returned null for queue ${name}`);
      state.jobIdToPayload.set(jobId, job);
      state.jobIdToQueue.set(jobId, name);
      pruneState(state);
      logger.debug("cron.pgboss.send", { jobId, queue: name, runId: job.runId });
      return jobId;
    },

    async fetch({ count }) {
      const b = await ensureStarted(state);
      return fetchFromQueues(state, b, count);
    },

    async complete(jobId) {
      const queueName = state.jobIdToQueue.get(jobId);
      const b = await ensureStarted(state);
      if (queueName !== undefined) {
        await completeKnownQueue(state, b, jobId, queueName);
        return;
      }
      // Fallback for cross-instance jobs: try each known queue.
      await completeFallback(state, b, jobId);
    },

    async fail(jobId, error, stack) {
      const b = await ensureStarted(state);
      const queueName = state.jobIdToQueue.get(jobId);
      const failData = { message: error, stack: stack ?? null };
      if (queueName) {
        await failKnownQueue(state, b, jobId, queueName, failData);
      } else {
        await failFallback(state, b, jobId, failData);
      }
      state.jobIdToPayload.delete(jobId);
      state.jobIdToQueue.delete(jobId);
      pruneState(state);
    },

    async retry(jobId, delaySeconds, newAttempt) {
      const b = await ensureStarted(state);
      const queueName = state.jobIdToQueue.get(jobId);
      const originalPayload = state.jobIdToPayload.get(jobId);

      if (queueName && originalPayload) {
        await retryKnownQueue(state, b, jobId, queueName, originalPayload, delaySeconds, newAttempt);
      } else if (queueName && originalPayload === undefined) {
        logger.warn("cron.pgboss.retry.payloadMissing", { jobId, queueName });
      } else {
        logger.warn("cron.pgboss.retry.queueNotFound", { jobId });
      }

      state.jobIdToPayload.delete(jobId);
      state.jobIdToQueue.delete(jobId);
      pruneState(state);
    },

    async getQueueStats() {
      const b = await ensureStarted(state);
      return collectQueueStats(state, b);
    },

    async shutdown() {
      if (!state.boss || !state.started) return;
      await state.boss.stop({ close: false });
      state.started = false;
      state.knownQueues.clear();
      state.jobIdToPayload.clear();
      state.jobIdToQueue.clear();
      logger.info("cron.pgboss.stopped");
    },
  };
}
