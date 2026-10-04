/**
 * pg-boss adapter mutation operations: complete, fail, retry, queue stats,
 * and shutdown. State + connection lifecycle live in
 * `pgboss.adapter.state.ts`.
 */
import type { PgBoss, SendOptions } from "pg-boss";
import { logger } from "@/backend/lib/logger";
import { formatError } from "@/backend/services/cron/cron-utils";
import {
  ensureStarted,
  type PgBossState,
  pruneState,
} from "@/backend/services/cron/queue-adapters/pgboss.adapter.state";
import type { CronJobPayload, CronQueueStats } from "@/backend/types";

const QUEUE_NAME_PREFIX = "cron_";

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

export async function completePgBossJob(state: PgBossState, jobId: string): Promise<void> {
  const queueName = state.jobIdToQueue.get(jobId);
  const b = await ensureStarted(state);
  if (queueName !== undefined) {
    await completeKnownQueue(state, b, jobId, queueName);
    return;
  }
  // Fallback for cross-instance jobs: try each known queue.
  await completeFallback(state, b, jobId);
}

export async function failPgBossJob(state: PgBossState, jobId: string, error: string, stack?: string): Promise<void> {
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
}

export async function retryPgBossJob(
  state: PgBossState,
  jobId: string,
  delaySeconds: number,
  newAttempt?: number
): Promise<void> {
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
}

export async function getPgBossQueueStats(state: PgBossState): Promise<CronQueueStats> {
  const b = await ensureStarted(state);
  return collectQueueStats(state, b);
}

export async function shutdownPgBossAdapter(state: PgBossState): Promise<void> {
  if (!state.boss || !state.started) return;
  await state.boss.stop({ close: false });
  state.started = false;
  state.knownQueues.clear();
  state.jobIdToPayload.clear();
  state.jobIdToQueue.clear();
  logger.info("cron.pgboss.stopped");
}
